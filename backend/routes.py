from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import json
import datetime
import io
import requests
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from extensions import db
from models import SystemState, Inventory, ProductionBook, Journal, OpenClawLog
from auth import require_api_key

routes_bp = Blueprint('routes', __name__)

# ==========================================
# STATE SYNC ENDPOINTS (For React App - Protected by JWT)
# ==========================================
@routes_bp.route('/api/state', methods=['GET'])
@jwt_required()
def get_state():
    state_record = SystemState.query.first()
    if state_record:
        return jsonify(json.loads(state_record.state_json))
    return jsonify(None)

@routes_bp.route('/api/state', methods=['POST'])
@jwt_required()
def save_state():
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    state_record = SystemState.query.first()
    if not state_record:
        state_record = SystemState(state_json=json.dumps(data))
        db.session.add(state_record)
    else:
        state_record.state_json = json.dumps(data)

    Inventory.query.delete()
    ProductionBook.query.delete()
    Journal.query.delete()

    for item in data.get('inventory', []):
        db.session.add(Inventory(
            id=item.get('id'),
            item_name=item.get('productName'),
            quantity=item.get('quantity'),
            minimum_threshold=1000.0
        ))
    for prod in data.get('productionBook', []):
        db.session.add(ProductionBook(
            id=prod.get('id'),
            date=prod.get('date'),
            total_input_weight=prod.get('totalInputWeight'),
            total_output_weight=prod.get('totalOutputWeight'),
            yield_percentage=prod.get('yieldPercentage')
        ))
    for jrn in data.get('journal', []):
        db.session.add(Journal(
            id=jrn.get('id'),
            date=jrn.get('date'),
            description=jrn.get('description')
        ))

    db.session.commit()
    return jsonify({'success': True})

# ==========================================
# WEBHOOK & ORCHESTRATION ENDPOINTS (For OpenClaw - Protected by API KEY)
# ==========================================
@routes_bp.route('/api/webhooks/weighbridge', methods=['POST'])
@require_api_key
def weighbridge_webhook():
    data = request.json
    openclaw_url = os.environ.get('OPENCLAW_WEBHOOK_URL')
    
    # Log the webhook event
    log = OpenClawLog(action="Weighbridge Webhook Received", details=json.dumps(data))
    db.session.add(log)
    db.session.commit()

    if not openclaw_url:
        return jsonify({'success': False, 'error': 'Webhook URL not configured'}), 500
    try:
        requests.post(openclaw_url, json=data, timeout=5)
    except requests.exceptions.RequestException as e:
        return jsonify({'success': True, 'openclaw_forwarding_error': str(e)}), 200
    return jsonify({'success': True, 'message': 'Payload forwarded'})

@routes_bp.route('/api/reports/end-of-day', methods=['GET'])
@require_api_key
def get_end_of_day_report():
    today = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    productions = ProductionBook.query.filter_by(date=today).all()
    journals = Journal.query.filter_by(date=today).all()
    return jsonify({
        'success': True,
        'date': today,
        'production_records': [p.to_dict() for p in productions],
        'journal_entries': [j.to_dict() for j in journals]
    })

@routes_bp.route('/api/inventory/alerts', methods=['GET'])
@require_api_key
def check_inventory_alerts():
    alerts = Inventory.query.filter(Inventory.quantity < Inventory.minimum_threshold).all()
    return jsonify({
        'success': True,
        'alerts': [item.to_dict() for item in alerts]
    })

import os
import datetime
import requests
import json
from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL', 
    'sqlite:///' + os.path.abspath(os.path.join(os.path.dirname(__file__), 'database.sqlite'))
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ==========================================
# 1. DATABASE SETUP
# ==========================================

# To support the full React BusinessState while remaining simple,
# we use a master SystemState table to hold the raw JSON tree,
# and we extract Inventory, ProductionBook, and Journal into relational tables for OpenClaw.

class SystemState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    state_json = db.Column(db.Text, nullable=False) # Stores the full BusinessState JSON

class Inventory(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, default=0.0)
    minimum_threshold = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id,
            'item_name': self.item_name,
            'quantity': self.quantity,
            'minimum_threshold': self.minimum_threshold
        }

class ProductionBook(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    date = db.Column(db.String(50))
    total_input_weight = db.Column(db.Float, default=0.0)
    total_output_weight = db.Column(db.Float, default=0.0)
    yield_percentage = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'total_input_weight': self.total_input_weight,
            'total_output_weight': self.total_output_weight,
            'yield_percentage': self.yield_percentage
        }

class Journal(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    date = db.Column(db.String(50))
    description = db.Column(db.String(255))
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'description': self.description
        }

# ==========================================
# STATE SYNC ENDPOINTS (For React App)
# ==========================================

@app.route('/api/state', methods=['GET'])
def get_state():
    state_record = SystemState.query.first()
    if state_record:
        return jsonify(json.loads(state_record.state_json))
    else:
        return jsonify(None) # Tell React to use INITIAL_STATE

@app.route('/api/state', methods=['POST'])
def save_state():
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # 1. Save full JSON blob
    state_record = SystemState.query.first()
    if not state_record:
        state_record = SystemState(state_json=json.dumps(data))
        db.session.add(state_record)
    else:
        state_record.state_json = json.dumps(data)

    # 2. Sync Relational Tables for OpenClaw
    # Clear old data
    Inventory.query.delete()
    ProductionBook.query.delete()
    Journal.query.delete()

    # Re-populate
    for item in data.get('inventory', []):
        inv = Inventory(
            id=item.get('id'),
            item_name=item.get('productName'),
            quantity=item.get('quantity'),
            minimum_threshold=1000.0 # Mock threshold for alerts
        )
        db.session.add(inv)

    for prod in data.get('productionBook', []):
        pb = ProductionBook(
            id=prod.get('id'),
            date=prod.get('date'),
            total_input_weight=prod.get('totalInputWeight'),
            total_output_weight=prod.get('totalOutputWeight'),
            yield_percentage=prod.get('yieldPercentage')
        )
        db.session.add(pb)

    for jrn in data.get('journal', []):
        j = Journal(
            id=jrn.get('id'),
            date=jrn.get('date'),
            description=jrn.get('description')
        )
        db.session.add(j)

    db.session.commit()
    return jsonify({'success': True})

# ==========================================
# WEBHOOK & ORCHESTRATION ENDPOINTS (For OpenClaw)
# ==========================================

@app.route('/api/webhooks/weighbridge', methods=['POST'])
def weighbridge_webhook():
    data = request.json
    openclaw_url = os.environ.get('OPENCLAW_WEBHOOK_URL')
    if not openclaw_url:
        return jsonify({'success': False, 'error': 'Webhook URL not configured'}), 500
    try:
        requests.post(openclaw_url, json=data, timeout=5)
    except requests.exceptions.RequestException as e:
        return jsonify({'success': True, 'openclaw_forwarding_error': str(e)}), 200
    return jsonify({'success': True, 'message': 'Payload forwarded'})

@app.route('/api/reports/end-of-day', methods=['GET'])
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

@app.route('/api/orchestration/surat-jalan', methods=['POST'])
def generate_surat_jalan():
    data = request.json
    order_id = data.get('order_id')
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.drawString(100, 750, f"SURAT JALAN: {order_id}")
    p.showPage()
    p.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f'sj_{order_id}.pdf', mimetype='application/pdf')

@app.route('/api/inventory/alerts', methods=['GET'])
def check_inventory_alerts():
    alerts = Inventory.query.filter(Inventory.quantity < Inventory.minimum_threshold).all()
    return jsonify({
        'success': True,
        'alerts': [item.to_dict() for item in alerts]
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)

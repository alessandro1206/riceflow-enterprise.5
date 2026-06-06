from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
import os
import json
import datetime
import io
import requests
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

try:
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    with open(env_path, 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k] = v
except FileNotFoundError:
    pass

from extensions import db
from models import User, SystemState, Inventory, ProductionBook, Journal, AILog, Purchase, Sale, Expense, InventoryLog
from auth import require_api_key
import pandas as pd

routes_bp = Blueprint('routes', __name__)

# ==========================================
# ROLE-BASED ACCESS DECORATOR
# ==========================================
def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            identity = get_jwt_identity()
            user_role = identity.get('role', '') if isinstance(identity, dict) else ''
            if user_role not in allowed_roles:
                return jsonify({'error': 'Forbidden: insufficient role'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

# ==========================================
# STATE SYNC ENDPOINTS (For React App - Protected by JWT)
# ==========================================
@routes_bp.route('/api/migrate', methods=['GET'])
def migrate_db():
    try:
        from sqlalchemy import text
        db.session.execute(text("ALTER TABLE sale ADD COLUMN payment_status VARCHAR(50) DEFAULT 'DP'"))
        db.session.execute(text("ALTER TABLE sale ADD COLUMN check_number VARCHAR(50)"))
        db.session.execute(text("ALTER TABLE sale ADD COLUMN due_date DATETIME"))
        db.session.execute(text("ALTER TABLE sale ADD COLUMN paid_at DATETIME"))
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

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
# WEIGHBRIDGE AI AUTOMATION (Gemini Powered)
# ==========================================
@routes_bp.route('/api/webhooks/weighbridge', methods=['POST'])
@require_api_key
def weighbridge_webhook():
    data = request.json
    api_key = os.environ.get('GEMINI_API_KEY')
    
    if not api_key:
        log = AILog(action="Weighbridge Error", details="Gemini API Key missing.")
        db.session.add(log)
        db.session.commit()
        return jsonify({'success': False, 'error': 'API Key not configured'}), 500

    # Ask Gemini to parse the webhook
    prompt = f"""You are the RiceFlow Automated Parsing AI. 
A truck has just weighed in. Payload: {json.dumps(data)}

Determine if this is a Purchase of Gabah from a Supplier, or a Sale of Beras to a Customer.
Return a pure JSON object (no markdown, no backticks) with:
{{
  "transaction_type": "Purchase" or "Sale",
  "party_name": "Name of supplier or customer",
  "item_name": "Gabah" or "Beras Premium",
  "net_weight_kg": 1234,
  "estimated_price_per_kg": 7000
}}
"""

    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        response = requests.post(gemini_url, json=payload, headers={'Content-Type': 'application/json'}, timeout=15)
        if response.status_code == 200:
            ai_text = response.json()['candidates'][0]['content']['parts'][0]['text']
            cleaned = ai_text.strip().removeprefix('```json').removesuffix('```').strip()
            parsed = json.loads(cleaned)
            
            # Save to Database
            if parsed.get('transaction_type') == 'Purchase':
                total = parsed.get('net_weight_kg', 0) * parsed.get('estimated_price_per_kg', 0)
                record = Purchase(
                    supplier_name=parsed.get('party_name', 'Unknown'),
                    item_name=parsed.get('item_name', 'Gabah'),
                    qty_kg=parsed.get('net_weight_kg', 0),
                    price_per_kg=parsed.get('estimated_price_per_kg', 0),
                    total_amount=total,
                    payment_status='DP'
                )
                db.session.add(record)
                db.session.commit()
                log = AILog(action="Automated Purchase Saved", details=f"Supplier: {record.supplier_name}, Qty: {record.qty_kg}kg, Total: Rp{total}")
                
            elif parsed.get('transaction_type') == 'Sale':
                total = parsed.get('net_weight_kg', 0) * parsed.get('estimated_price_per_kg', 0)
                record = Sale(
                    customer_name=parsed.get('party_name', 'Unknown'),
                    brand_name=parsed.get('item_name', 'Beras Premium'),
                    total_kg=parsed.get('net_weight_kg', 0),
                    price_per_kg=parsed.get('estimated_price_per_kg', 0),
                    total_amount=total,
                    payment_status='DP'
                )
                db.session.add(record)
                db.session.commit()
                log = AILog(action="Automated Sale Saved", details=f"Customer: {record.customer_name}, Qty: {record.total_kg}kg, Total: Rp{total}")
            
            db.session.add(log)
            db.session.commit()
            return jsonify({'success': True, 'action_taken': log.action, 'details': log.details})
            
        else:
            log = AILog(action="Gemini API Error", details=str(response.text))
            db.session.add(log)
            db.session.commit()
            return jsonify({'success': False, 'error': 'Gemini Failed'}), 500

    except Exception as e:
        log = AILog(action="System Error", details=str(e))
        db.session.add(log)
        db.session.commit()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==========================================
# PHASE 2: CORE FINANCIAL ERP ROUTES
# ==========================================
@routes_bp.route('/api/finance/purchases', methods=['GET', 'POST'])
@jwt_required()
def handle_purchases():
    if request.method == 'POST':
        data = request.json
        purchase = Purchase(
            supplier_name=data.get('supplier_name'),
            item_name=data.get('item_name'),
            qty_kg=data.get('qty_kg', 0),
            price_per_kg=data.get('price_per_kg', 0),
            dpp=data.get('dpp', 0),
            ppn=data.get('ppn', 0),
            total_amount=data.get('total_amount', 0),
            payment_status=data.get('payment_status', 'DP'),
            check_number=data.get('check_number', ''),
            due_date=datetime.datetime.strptime(data.get('due_date'), '%Y-%m-%d') if data.get('due_date') else None
        )
        db.session.add(purchase)
        db.session.commit()
        return jsonify({'success': True, 'purchase': purchase.to_dict()})
    else:
        purchases = Purchase.query.order_by(Purchase.date.desc()).all()
        return jsonify([p.to_dict() for p in purchases])

@routes_bp.route('/api/finance/sales', methods=['GET', 'POST'])
@jwt_required()
def handle_sales():
    if request.method == 'POST':
        data = request.json
        sale = Sale(
            customer_name=data.get('customer_name'),
            brand_name=data.get('brand_name'),
            qty_zak=data.get('qty_zak', 0),
            kg_per_zak=data.get('kg_per_zak', 0),
            total_kg=data.get('total_kg', 0),
            price_per_kg=data.get('price_per_kg', 0),
            dpp=data.get('dpp', 0),
            ppn=data.get('ppn', 0),
            total_amount=data.get('total_amount', 0),
            payment_status=data.get('payment_status', 'DP'),
            check_number=data.get('check_number', ''),
            due_date=datetime.datetime.strptime(data.get('due_date'), '%Y-%m-%d') if data.get('due_date') else None
        )
        db.session.add(sale)
        db.session.commit()
        return jsonify({'success': True, 'sale': sale.to_dict()})
    else:
        sales = Sale.query.order_by(Sale.date.desc()).all()
        return jsonify([s.to_dict() for s in sales])

@routes_bp.route('/api/finance/expenses', methods=['GET', 'POST'])
@jwt_required()
def handle_expenses():
    if request.method == 'POST':
        data = request.json
        expense = Expense(
            category=data.get('category'),
            description=data.get('description'),
            payment_type=data.get('payment_type'),
            amount=data.get('amount', 0)
        )
        db.session.add(expense)
        db.session.commit()
        return jsonify({'success': True, 'expense': expense.to_dict()})
    else:
        expenses = Expense.query.order_by(Expense.date.desc()).all()
        return jsonify([e.to_dict() for e in expenses])

@routes_bp.route('/api/finance/export/laba-rugi', methods=['GET'])
def export_laba_rugi():
    # Gather data
    sales = Sale.query.all()
    purchases = Purchase.query.all()
    expenses = Expense.query.all()

    # Calculate fields for SAK/CoreTax
    total_pendapatan = sum([s.total_amount for s in sales])

    pembelian_beras = sum([p.total_amount for p in purchases if p.item_name and 'beras' in p.item_name.lower()])
    pembelian_kemasan = sum([p.total_amount for p in purchases if p.item_name and ('kemasan' in p.item_name.lower() or 'zak' in p.item_name.lower())])
    ongkos_kuli = sum([e.amount for e in expenses if e.category and 'kuli' in e.category.lower()])
    ongkos_truk = sum([e.amount for e in expenses if e.category and 'truk' in e.category.lower()])
    biaya_utilitas = sum([e.amount for e in expenses if e.category and ('pln' in e.category.lower() or 'pdam' in e.category.lower())])

    total_hpp = pembelian_beras + pembelian_kemasan + ongkos_kuli + ongkos_truk + biaya_utilitas
    laba_bruto = total_pendapatan - total_hpp

    biaya_operasional = sum([e.amount for e in expenses if e.category and 'kuli' not in e.category.lower() and 'truk' not in e.category.lower() and 'pln' not in e.category.lower() and 'pdam' not in e.category.lower()])
    laba_bersih = laba_bruto - biaya_operasional

    data = {
        'Kategori': [
            'PENDAPATAN',
            'Peredaran Bruto Usaha',
            '',
            'HARGA POKOK PENJUALAN (HPP)',
            'Pembelian Beras',
            'Pembelian Kemasan',
            'Ongkos Kuli',
            'Ongkos Truk',
            'Biaya Utilitas (PLN/PDAM)',
            'Total HPP',
            '',
            'LABA BRUTO USAHA',
            '',
            'BIAYA & ADMINISTRASI',
            'Biaya Operasional Lainnya',
            '',
            'LABA BERSIH SEBELUM PAJAK'
        ],
        'Jumlah (Rp)': [
            '',
            total_pendapatan,
            '',
            '',
            pembelian_beras,
            pembelian_kemasan,
            ongkos_kuli,
            ongkos_truk,
            biaya_utilitas,
            total_hpp,
            '',
            laba_bruto,
            '',
            '',
            biaya_operasional,
            '',
            laba_bersih
        ]
    }

    df = pd.DataFrame(data)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Laba Rugi CoreTax')
    
    output.seek(0)
    
    return send_file(
        output,
        download_name='Laporan_Laba_Rugi_CoreTax.xlsx',
        as_attachment=True,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

# ==========================================
# PHASE 3: PAYMENT MANAGEMENT & REORDER
# ==========================================
@routes_bp.route('/api/finance/purchases/<int:id>/pay', methods=['POST'])
@jwt_required()
def mark_purchase_paid(id):
    purchase = Purchase.query.get_or_404(id)
    purchase.payment_status = 'Lunas'
    purchase.paid_at = datetime.datetime.utcnow()
    db.session.commit()
    # Log to AI Log
    log = AILog(action="Payment Marked as Lunas", details=f"Supplier: {purchase.supplier_name} | Amount: {purchase.total_amount} | Check: {purchase.check_number}")
    db.session.add(log)
    db.session.commit()
    return jsonify({'success': True, 'purchase': purchase.to_dict()})

@routes_bp.route('/api/finance/purchases/<int:id>/due-date', methods=['POST'])
@jwt_required()
def set_due_date(id):
    purchase = Purchase.query.get_or_404(id)
    data = request.json
    due_date_str = data.get('due_date')
    if due_date_str:
        purchase.due_date = datetime.datetime.fromisoformat(due_date_str)
        db.session.commit()
    return jsonify({'success': True, 'purchase': purchase.to_dict()})

@routes_bp.route('/api/finance/payments/pending', methods=['GET'])
@jwt_required()
def get_pending_payments():
    pending = Purchase.query.filter(Purchase.payment_status == 'DP').order_by(Purchase.due_date.asc()).all()
    now = datetime.datetime.utcnow()
    result = []
    for p in pending:
        d = p.to_dict()
        if p.due_date:
            delta = (p.due_date - now).days
            d['days_until_due'] = delta
            d['is_overdue'] = delta < 0
            d['is_urgent'] = 0 <= delta <= 1
        else:
            d['days_until_due'] = None
            d['is_overdue'] = False
            d['is_urgent'] = False
        result.append(d)
    return jsonify(result)

@routes_bp.route('/api/finance/reorder-suggestions', methods=['GET'])
@jwt_required()
def get_reorder_suggestions():
    # Get inventory items below minimum threshold
    low_stock = Inventory.query.filter(Inventory.quantity < Inventory.minimum_threshold).all()
    suggestions = []
    for item in low_stock:
        # Find most recent supplier for this item type
        recent_purchase = Purchase.query.filter(
            Purchase.item_name.ilike(f'%{item.item_name}%')
        ).order_by(Purchase.date.desc()).first()
        suggestions.append({
            'item_id': item.id,
            'item_name': item.item_name,
            'current_qty': item.quantity,
            'minimum_threshold': item.minimum_threshold,
            'shortage': item.minimum_threshold - item.quantity,
            'last_supplier': recent_purchase.supplier_name if recent_purchase else 'Tidak diketahui',
            'last_price_per_kg': recent_purchase.price_per_kg if recent_purchase else 0,
        })
    return jsonify(suggestions)

# ==========================================
# PHASE 4: AI ASSISTANT (Gemini Integration)
# ==========================================
@routes_bp.route('/api/ai/ask', methods=['POST'])
@jwt_required()
def ask_ai():
    data = request.json
    user_query = data.get('query')
    if not user_query:
        return jsonify({'error': 'No query provided'}), 400

    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return jsonify({'error': 'Gemini API Key not configured on server'}), 500

    # Gather Context
    inventory = Inventory.query.all()
    sales = Sale.query.all()
    purchases = Purchase.query.all()
    pending = Purchase.query.filter(Purchase.payment_status == 'DP').all()

    context = "System Data for RiceFlow ERP:\n"
    context += f"Inventory Items: {len(inventory)}\n"
    for item in inventory:
        context += f"- {item.item_name}: {item.quantity} kg (Min: {item.minimum_threshold})\n"
    
    total_sales = sum(s.total_amount for s in sales if s.total_amount)
    total_purchases = sum(p.total_amount for p in purchases if p.total_amount)
    total_unpaid = sum(p.total_amount for p in pending if p.total_amount)
    
    context += f"\nFinancials:\n- Total Sales: Rp {total_sales:,.0f}\n- Total Purchases: Rp {total_purchases:,.0f}\n- Total Unpaid Debt (Tagihan): Rp {total_unpaid:,.0f}\n"

    prompt = f"You are the RiceFlow ERP AI Assistant. Be concise, helpful, and use markdown formatting. Use the following live data to answer the user's question:\n\n{context}\n\nUser Question: {user_query}"

    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    try:
        response = requests.post(gemini_url, json=payload, headers={'Content-Type': 'application/json'}, timeout=15)
        resp_data = response.json()
        if response.status_code == 200:
            ai_text = resp_data['candidates'][0]['content']['parts'][0]['text']
            db.session.add(AILog(action="Ask RiceFlow AI", details=f"Q: {user_query} | A: {ai_text[:50]}..."))
            db.session.commit()
            return jsonify({'success': True, 'answer': ai_text})
        else:
            return jsonify({'error': f"Gemini API Error: {resp_data}"}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==========================================
# USER MANAGEMENT (Admin Only)
# ==========================================
@routes_bp.route('/api/auth/users', methods=['GET'])
@role_required('admin')
def list_users():
    users = User.query.all()
    return jsonify([
        {'id': u.id, 'username': u.username, 'role': u.role}
        for u in users
    ])

@routes_bp.route('/api/auth/users/<int:id>/role', methods=['PUT'])
@role_required('admin')
def update_user_role(id):
    user = User.query.get_or_404(id)
    data = request.json
    new_role = data.get('role')
    valid_roles = ('admin', 'manager', 'operator', 'kasir')
    if new_role not in valid_roles:
        return jsonify({'error': f'Invalid role. Must be one of: {valid_roles}'}), 400
    user.role = new_role
    db.session.commit()
    return jsonify({'success': True, 'id': user.id, 'username': user.username, 'role': user.role})


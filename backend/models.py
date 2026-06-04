import datetime
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

# ==========================================
# AUTHENTICATION & SECURITY
# ==========================================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='Operator') # Admin, Finance, Operator

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class OpenClawLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    action = db.Column(db.String(100))
    details = db.Column(db.Text)

# ==========================================
# CORE STATE (From Option B Migration)
# ==========================================
class SystemState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    state_json = db.Column(db.Text, nullable=False)

class Inventory(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, default=0.0)
    minimum_threshold = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {'id': self.id, 'item_name': self.item_name, 'quantity': self.quantity, 'minimum_threshold': self.minimum_threshold}

class ProductionBook(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    date = db.Column(db.String(50))
    total_input_weight = db.Column(db.Float, default=0.0)
    total_output_weight = db.Column(db.Float, default=0.0)
    yield_percentage = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {'id': self.id, 'date': self.date, 'total_input_weight': self.total_input_weight, 'total_output_weight': self.total_output_weight, 'yield_percentage': self.yield_percentage}

class Journal(db.Model):
    id = db.Column(db.String(100), primary_key=True)
    date = db.Column(db.String(50))
    description = db.Column(db.String(255))
    
    def to_dict(self):
        return {'id': self.id, 'date': self.date, 'description': self.description}

# ==========================================
# PHASE 1: CRM & SRM
# ==========================================
class Supplier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact_info = db.Column(db.String(100))
    rating = db.Column(db.Float, default=5.0)

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    customer_code = db.Column(db.String(50))
    contact_info = db.Column(db.String(100))

# ==========================================
# PHASE 1: SALES BOOK
# ==========================================
class DirectSale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    customer_name = db.Column(db.String(100))
    total_value = db.Column(db.Float, default=0.0)
    items_json = db.Column(db.Text)

class WholesaleOrder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'))
    total_value = db.Column(db.Float, default=0.0)
    is_credit = db.Column(db.Boolean, default=False)
    due_date = db.Column(db.DateTime)
    status = db.Column(db.String(50), default='PENDING')

# ==========================================
# PHASE 1: EXPENSE TRACKER
# ==========================================
class FactoryExpense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    category = db.Column(db.String(50)) # Wages, Electricity, Maintenance
    description = db.Column(db.String(255))

# ==========================================
# PHASE 2: CORE FINANCIAL ERP
# ==========================================
class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    supplier_name = db.Column(db.String(100))
    item_name = db.Column(db.String(100))
    qty_kg = db.Column(db.Float, default=0.0)
    price_per_kg = db.Column(db.Float, default=0.0)
    dpp = db.Column(db.Float, default=0.0)
    ppn = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, default=0.0)
    payment_status = db.Column(db.String(50), default='DP') # DP/Lunas
    check_number = db.Column(db.String(50))

    def to_dict(self):
        return {
            'id': self.id, 'date': self.date.isoformat() if self.date else None, 'supplier_name': self.supplier_name,
            'item_name': self.item_name, 'qty_kg': self.qty_kg, 'price_per_kg': self.price_per_kg,
            'dpp': self.dpp, 'ppn': self.ppn, 'total_amount': self.total_amount,
            'payment_status': self.payment_status, 'check_number': self.check_number
        }

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    customer_name = db.Column(db.String(100))
    brand_name = db.Column(db.String(100))
    qty_zak = db.Column(db.Integer, default=0)
    kg_per_zak = db.Column(db.Float, default=0.0)
    total_kg = db.Column(db.Float, default=0.0)
    price_per_kg = db.Column(db.Float, default=0.0)
    dpp = db.Column(db.Float, default=0.0)
    ppn = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id, 'date': self.date.isoformat() if self.date else None, 'customer_name': self.customer_name,
            'brand_name': self.brand_name, 'qty_zak': self.qty_zak, 'kg_per_zak': self.kg_per_zak,
            'total_kg': self.total_kg, 'price_per_kg': self.price_per_kg, 'dpp': self.dpp,
            'ppn': self.ppn, 'total_amount': self.total_amount
        }

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    category = db.Column(db.String(100))
    description = db.Column(db.String(255))
    payment_type = db.Column(db.String(50)) # Cek/Tunai
    amount = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id, 'date': self.date.isoformat() if self.date else None, 'category': self.category,
            'description': self.description, 'payment_type': self.payment_type, 'amount': self.amount
        }

class InventoryLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    raw_grain = db.Column(db.Float, default=0.0)
    shrinkage = db.Column(db.Float, default=0.0)
    beras_kepala = db.Column(db.Float, default=0.0)
    menir = db.Column(db.Float, default=0.0)
    packaging_sacks_usage = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id, 'date': self.date.isoformat() if self.date else None, 'raw_grain': self.raw_grain,
            'shrinkage': self.shrinkage, 'beras_kepala': self.beras_kepala,
            'menir': self.menir, 'packaging_sacks_usage': self.packaging_sacks_usage
        }

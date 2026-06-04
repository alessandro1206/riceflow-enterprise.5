from app import app
from extensions import db
from models import Purchase, Sale, Expense, InventoryLog

with app.app_context():
    db.create_all()
    print("Core Financial ERP tables created successfully!")

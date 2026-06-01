import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

from extensions import db
from models import User
from auth import auth_bp
from routes import routes_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL', 
    'sqlite:///' + os.path.abspath(os.path.join(os.path.dirname(__file__), 'database.sqlite'))
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret-default-key-change-in-production')

db.init_app(app)
jwt = JWTManager(app)

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(routes_bp)

def initialize_database():
    with app.app_context():
        db.create_all()
        # Create Super Admin if none exists
        if not User.query.filter_by(username='admin').first():
            print("Creating default Super Admin user...")
            admin_user = User(username='admin', role='Admin')
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
            print("Super Admin created. Username: admin | Password: admin123")

if __name__ == '__main__':
    initialize_database()
    app.run(host='0.0.0.0', port=5000, debug=True)

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User
from extensions import db
from functools import wraps
import os

auth_bp = Blueprint('auth', __name__)

# Phase 2: OpenClaw API Key Decorator
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-KEY')
        expected_key = os.environ.get('OPENCLAW_API_KEY', 'default-dev-key')
        if api_key != expected_key:
            return jsonify({"error": "Unauthorized API Key"}), 401
        return f(*args, **kwargs)
    return decorated_function

# Phase 2: Login Route
@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        # Create JWT Token
        access_token = create_access_token(identity={'username': user.username, 'role': user.role})
        return jsonify(access_token=access_token), 200

    return jsonify({"error": "Invalid username or password"}), 401

@auth_bp.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    current_user = get_jwt_identity()
    return jsonify(current_user), 200

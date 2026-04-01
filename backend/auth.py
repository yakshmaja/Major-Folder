"""
JWT Authentication module for FireSight.
Supports registration and login with JSON-file-based user storage.
"""
import os
import json
import hashlib
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv('JWT_SECRET', 'firesight_super_secret_key_change_in_production')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')

USERS_FILE = os.path.join(os.path.dirname(__file__), 'users.json')

security = HTTPBearer()


def _hash_password(password: str) -> str:
    """Hash a password with SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


def _load_users() -> dict:
    """Load users from JSON file."""
    if not os.path.exists(USERS_FILE):
        # Seed with default admin user
        default_users = {
            'admin': {
                'password': _hash_password('firesight2024'),
                'name': 'Admin',
                'created_at': datetime.utcnow().isoformat()
            }
        }
        _save_users(default_users)
        return default_users

    with open(USERS_FILE, 'r') as f:
        return json.load(f)


def _save_users(users: dict):
    """Save users to JSON file."""
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)


def register_user(username: str, password: str, name: str = '') -> dict:
    """Register a new user."""
    users = _load_users()

    if username.lower() in {k.lower() for k in users}:
        return {'success': False, 'message': 'Username already exists'}

    if len(username) < 3:
        return {'success': False, 'message': 'Username must be at least 3 characters'}

    if len(password) < 6:
        return {'success': False, 'message': 'Password must be at least 6 characters'}

    users[username] = {
        'password': _hash_password(password),
        'name': name or username,
        'created_at': datetime.utcnow().isoformat()
    }
    _save_users(users)

    return {'success': True, 'message': 'Account created successfully'}


def authenticate_user(username: str, password: str) -> bool:
    """Validate username and password."""
    users = _load_users()
    user = users.get(username)
    if not user:
        return False
    return user['password'] == _hash_password(password)


def create_access_token(username: str, expires_delta: timedelta = None) -> str:
    """Create a JWT access token."""
    if expires_delta is None:
        expires_delta = timedelta(hours=24)

    expire = datetime.utcnow() + expires_delta
    to_encode = {
        'sub': username,
        'exp': expire
    }
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """Verify JWT token and return username."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username = payload.get('sub')
        if username is None:
            raise HTTPException(status_code=401, detail='Invalid token')
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail='Invalid or expired token')

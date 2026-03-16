import os
from datetime import datetime, timedelta
from typing import Optional, Any, Union
from jose import jwt
import bcrypt

# Configuration
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "7b0a32491a921d8b6c4e5f7a0b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if the provided password matches the stored hash"""
    try:
        if not hashed_password or not plain_password:
            return False
        # bcrypt requires bytes
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"Error verifying password: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Hash a password for storing"""
    # bcrypt requires bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    # Return as string for database
    return hashed_bytes.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a new JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None


import os
import uuid
import sys
from sqlalchemy.orm import Session

# Add the current directory to sys.path so we can import from backend
sys.path.append(os.getcwd())

from backend.database import SessionLocal, engine
from backend.models import User, Base
from backend.auth import get_password_hash

def seed_admin():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    email = "gabriel.mertea@elcen.ro"
    password = "qwerty12345"
    full_name = "Gabriel Mertea"
    
    print(f"Checking for user: {email}")
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        print(f"User {email} already exists. Updating password and tier.")
        user.hashed_password = get_password_hash(password)
        user.subscription_tier = "tycoon"
        user.builds_remaining = 999
        user.is_active = True
        user.is_verified = True
    else:
        print(f"Creating new admin user: {email}")
        user = User(
            id=uuid.uuid4(),
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            subscription_tier="tycoon",
            builds_remaining=999,
            is_active=True,
            is_verified=True
        )
        db.add(user)
    
    try:
        db.commit()
        print(f"Successfully seeded admin user: {email}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()

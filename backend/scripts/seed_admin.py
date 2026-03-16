
import os
import uuid
import sys

# Add the project root to sys.path
# This script is in backend/scripts/seed_admin.py
# So project root is two levels up
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

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

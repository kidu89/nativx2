# NativX INFINITY - Database Configuration
# SQLAlchemy setup with PostgreSQL

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from sqlalchemy.engine import URL

# Construct Database URL safely to handle special characters in password
if os.environ.get("POSTGRES_USER") and os.environ.get("POSTGRES_PASSWORD"):
    DATABASE_URL = URL.create(
        "postgresql",
        username=os.environ.get("POSTGRES_USER"),
        password=os.environ.get("POSTGRES_PASSWORD"),
        host=os.environ.get("POSTGRES_HOST", "db"),
        port=int(os.environ.get("POSTGRES_PORT", 5432)),
        database=os.environ.get("POSTGRES_DB", "NativX")
    )
else:
    DATABASE_URL = os.environ.get(
        "DATABASE_URL",
        "postgresql://NativX:NativX_secret_2024@localhost:5432/NativX"
    )

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
    echo=os.environ.get("DEBUG", "false").lower() == "true"
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for models
Base = declarative_base()


def get_db():
    """
    Dependency that provides a database session.
    Properly closes the session after the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables.
    Should be called on application startup.
    """
    from backend.models import User, Project
    Base.metadata.create_all(bind=engine)

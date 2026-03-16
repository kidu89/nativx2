# NativX - Database Models
# User and Project models for the SaaS Factory

import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, String, Text, DateTime, Enum, Boolean, 
    Integer, ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.database import Base


class BuildStatus(str, PyEnum):
    """Build status enumeration"""
    PENDING = "pending"
    QUEUED = "queued"
    BUILDING = "building"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Platform(str, PyEnum):
    """Target platform enumeration"""
    ANDROID = "android"
    IOS = "ios"
    BOTH = "both"


class User(Base):
    """User model for authentication and project ownership"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    
    # Subscription info
    subscription_tier = Column(String(50), default="free")
    builds_remaining = Column(Integer, default=5)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email}>"


class Project(Base):
    """Project model for app build configurations"""
    __tablename__ = "projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Nullable for anonymous builds
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # App info
    app_name = Column(String(100), nullable=False)
    package_name = Column(String(255), nullable=False)  # e.g., com.company.appname
    app_url = Column(String(500), nullable=False)  # WebView URL
    
    # Branding
    app_icon_path = Column(String(500), nullable=True)
    splash_screen_path = Column(String(500), nullable=True)
    primary_color = Column(String(7), default="#6366F1")  # Hex color
    secondary_color = Column(String(7), default="#8B5CF6")
    
    # Build configuration
    platform = Column(Enum(Platform), default=Platform.ANDROID)
    version_name = Column(String(20), default="1.0.0")
    version_code = Column(Integer, default=1)
    min_sdk = Column(Integer, default=24)  # Android 7.0
    target_sdk = Column(Integer, default=34)  # Android 14
    
    # Build status
    build_status = Column(Enum(BuildStatus), default=BuildStatus.PENDING)
    celery_task_id = Column(String(255), nullable=True)
    build_error = Column(Text, nullable=True)
    
    # Output paths
    android_apk_path = Column(String(500), nullable=True)
    android_aab_path = Column(String(500), nullable=True)
    ios_ipa_path = Column(String(500), nullable=True)
    
    # Build metadata
    build_logs = Column(Text, nullable=True)
    build_started_at = Column(DateTime, nullable=True)
    build_completed_at = Column(DateTime, nullable=True)
    build_duration_seconds = Column(Integer, nullable=True)
    
    # Advanced Native Features
    onesignal_app_id = Column(String(255), nullable=True)
    admob_app_id = Column(String(255), nullable=True)
    admob_ad_unit_id = Column(String(255), nullable=True)
    google_play_ids = Column(String(500), nullable=True)  # Comma separated
    native_paywall = Column(Boolean, default=False)
    # UX Enhancements
    pull_to_refresh = Column(Boolean, default=True)
    custom_offline_page = Column(Boolean, default=True)
    enable_haptics = Column(Boolean, default=False)
    enable_native_share = Column(Boolean, default=False)
    enable_biometrics = Column(Boolean, default=False)
    enable_fade_transitions = Column(Boolean, default=True)
    enable_qr_scanner = Column(Boolean, default=False)
    
    # Extra settings as JSON
    extra_settings = Column(JSON, default=dict)
    
    # Tier-based delivery - determines if source code ZIP is included
    # True for 'founder', 'tycoon', 'agency' tiers; False for 'prototype'
    include_source_code = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="projects")
    
    def __repr__(self):
        return f"<Project {self.app_name} ({self.package_name})>"
    
    @property
    def is_building(self) -> bool:
        """Check if project is currently being built"""
        return self.build_status in [BuildStatus.QUEUED, BuildStatus.BUILDING, BuildStatus.PROCESSING]
    
    @property
    def is_complete(self) -> bool:
        """Check if build is complete (success or failed)"""
        return self.build_status in [BuildStatus.SUCCESS, BuildStatus.FAILED]

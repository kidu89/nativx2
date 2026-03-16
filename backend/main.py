# NativX - FastAPI Backend
# Main application with API endpoints

import os
import uuid
import shutil
import time
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path
from collections import defaultdict
import requests

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Request, Security, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, EmailStr, HttpUrl
from sqlalchemy.orm import Session

from backend.database import get_db, engine, Base
from backend.models import Project, User, BuildStatus, Platform
from backend.worker import build_app_task
from backend.auth import (
    verify_password, get_password_hash, create_access_token, 
    decode_access_token, SECRET_KEY
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
# Disable docs in production for security
IS_PRODUCTION = os.environ.get("APP_ENV", "development") == "production"

app = FastAPI(
    title="NativX",
    description="The Ultimate SaaS App Factory - Build Android & iOS apps from any URL",
    version="1.0.0",
    docs_url=None if IS_PRODUCTION else "/api/docs",
    redoc_url=None if IS_PRODUCTION else "/api/redoc",
    openapi_url=None if IS_PRODUCTION else "/api/openapi.json"
)

# CORS configuration - Restricted to specific origins
ALLOWED_ORIGINS = [
    "https://nativx.app",
    "https://www.nativx.app",
    "http://localhost:3000",      # Local Next.js dev
    "http://localhost:8086",      # Local nginx/docker
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8086",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Ensure directories exist
DOWNLOADS_DIR = Path("/app/downloads")
BUILDS_DIR = Path("/app/builds")
UPLOADS_DIR = Path("/app/uploads")

for directory in [DOWNLOADS_DIR, BUILDS_DIR, UPLOADS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# NOTE: Static file mounts removed for security
# Downloads are now served through authenticated endpoints only
# app.mount("/downloads", StaticFiles(directory=str(DOWNLOADS_DIR)), name="downloads")
# app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


# ============================================
# RATE LIMITING MIDDLEWARE
# ============================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware"""
    
    def __init__(self, app, requests_per_minute: int = 60, build_requests_per_hour: int = 10):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.build_requests_per_hour = build_requests_per_hour
        self.request_counts: Dict[str, list] = defaultdict(list)
        self.build_counts: Dict[str, list] = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean old entries (older than 1 hour)
        self.request_counts[client_ip] = [
            t for t in self.request_counts[client_ip] if current_time - t < 60
        ]
        self.build_counts[client_ip] = [
            t for t in self.build_counts[client_ip] if current_time - t < 3600
        ]
        
        # Check general rate limit
        if len(self.request_counts[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={"error": "Too many requests. Please slow down."}
            )
        
        # Check build-specific rate limit
        if request.url.path.startswith("/api/build") and request.method == "POST":
            if len(self.build_counts[client_ip]) >= self.build_requests_per_hour:
                return JSONResponse(
                    status_code=429,
                    content={"error": "Build limit reached. Maximum 10 builds per hour."}
                )
            self.build_counts[client_ip].append(current_time)
        
        self.request_counts[client_ip].append(current_time)
        return await call_next(request)

# Apply rate limiting (60 requests/min, 10 builds/hour)
app.add_middleware(RateLimitMiddleware, requests_per_minute=60, build_requests_per_hour=10)


# ============================================
# AUTHENTICATION
# ============================================

security = HTTPBearer()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    """Verify local JWT token"""
    token = credentials.credentials
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identity",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return {"id": str(user.id), "email": user.email, "tier": user.subscription_tier}


# ============================================
# PYDANTIC MODELS
# ============================================

class BuildRequest(BaseModel):
    """Request model for app build"""
    app_name: str
    package_name: str
    app_url: str
    platform: str = "android"
    primary_color: str = "#6366F1"
    secondary_color: str = "#8B5CF6"
    version_name: str = "1.0.0"
    version_code: int = 1
    # Tier determines if source code is included: 'prototype' = binary only, 'founder'/'tycoon'/'agency' = includes source
    tier: str = "prototype"
    
    class Config:
        json_schema_extra = {
            "example": {
                "app_name": "My Awesome App",
                "package_name": "com.example.myapp",
                "app_url": "https://example.com",
                "platform": "android",
                "primary_color": "#6366F1",
                "secondary_color": "#8B5CF6",
                "version_name": "1.0.0",
                "version_code": 1,
                "tier": "founder",
                "onesignal_app_id": "optional-id",
                "admob_app_id": "optional-id",
                "admob_ad_unit_id": "optional-id",
                "google_play_ids": "sub_1,sub_2",
                "native_paywall": False,
                "pull_to_refresh": True,
                "google_play_ids": "sub_1,sub_2",
                "native_paywall": False,
                "pull_to_refresh": True,
                "custom_offline_page": True,
                "enable_haptics": False,
                "enable_native_share": False,
                "enable_biometrics": False,
                "enable_fade_transitions": True,
                "enable_qr_scanner": False
            }
        }


class BuildResponse(BaseModel):
    """Response model for build status"""
    project_id: str
    task_id: str
    status: str
    message: str


class ProjectStatus(BaseModel):
    """Project status response"""
    project_id: str
    app_name: str
    status: str
    platform: str
    android_apk_url: Optional[str] = None
    android_aab_url: Optional[str] = None
    ios_ipa_url: Optional[str] = None
    error: Optional[str] = None
    build_duration: Optional[int] = None
    created_at: str
    updated_at: str


class LoginRequest(BaseModel):
    """Request model for login"""
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    """Request model for signup"""
    email: EmailStr
    password: str
    full_name: Optional[str] = None

# ============================================
# API ENDPOINTS
# ============================================

@app.post("/api/auth/signup")
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name,
        subscription_tier="free",
        is_active=True,
        is_verified=True  # Bypass email verification for local/intranet use
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create token
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(new_user.id),
            "email": new_user.email,
            "full_name": new_user.full_name
        }
    }

@app.post("/api/auth/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user"""
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name
        }
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "NativX INFINITY",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/build", response_model=BuildResponse)
async def create_build(
    request: BuildRequest,
    db: Session = Depends(get_db),
    user: Dict = Depends(get_current_user)
):
    """
    Create a new app build.
    Queues the build task and returns immediately.
    """
    try:
        # Create project record
        # Determine if source code should be included based on tier
        include_source = request.tier in ['founder', 'tycoon', 'agency']
        
        project = Project(
            app_name=request.app_name,
            package_name=request.package_name,
            app_url=request.app_url,
            platform=Platform(request.platform) if request.platform in ["android", "ios", "both"] else Platform.ANDROID,
            primary_color=request.primary_color,
            secondary_color=request.secondary_color,
            version_name=request.version_name,
            version_code=request.version_code,
            build_status=BuildStatus.QUEUED,
            include_source_code=include_source,
            onesignal_app_id=getattr(request, 'onesignal_app_id', None),
            admob_app_id=getattr(request, 'admob_app_id', None),
            admob_ad_unit_id=getattr(request, 'admob_ad_unit_id', None),
            google_play_ids=getattr(request, 'google_play_ids', None),
            native_paywall=getattr(request, 'native_paywall', False),
            pull_to_refresh=getattr(request, 'pull_to_refresh', True),
            custom_offline_page=getattr(request, 'custom_offline_page', True),
            enable_haptics=getattr(request, 'enable_haptics', False),
            enable_native_share=getattr(request, 'enable_native_share', False),
            enable_biometrics=getattr(request, 'enable_biometrics', False),
            enable_fade_transitions=getattr(request, 'enable_fade_transitions', True),
            enable_qr_scanner=getattr(request, 'enable_qr_scanner', False)
            # owner_id will be set when auth is implemented
        )
        
        db.add(project)
        db.commit()
        db.refresh(project)
        
        # Queue Celery task
        task = build_app_task.delay(str(project.id))
        
        # Update project with task ID
        project.celery_task_id = task.id
        db.commit()
        
        return BuildResponse(
            project_id=str(project.id),
            task_id=task.id,
            status="queued",
            message=f"Build queued for {request.app_name}. Check status at /api/build/{project.id}"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/build/with-icon")
async def create_build_with_icon(
    app_name: str = Form(...),
    package_name: str = Form(...),
    app_url: str = Form(...),
    platform: str = Form("android"),
    primary_color: str = Form("#6366F1"),
    secondary_color: str = Form("#8B5CF6"),
    version_name: str = Form("1.0.0"),
    version_code: int = Form(1),
    tier: str = Form("prototype"),  # 'prototype' = binary only, 'founder'/'tycoon'/'agency' = includes source
    onesignal_app_id: Optional[str] = Form(None),
    admob_app_id: Optional[str] = Form(None),
    admob_ad_unit_id: Optional[str] = Form(None),
    google_play_ids: Optional[str] = Form(None),
    native_paywall: bool = Form(False),
    pull_to_refresh: bool = Form(True),
    custom_offline_page: bool = Form(True),
    enable_haptics: bool = Form(False),
    enable_native_share: bool = Form(False),
    enable_biometrics: bool = Form(False),
    enable_fade_transitions: bool = Form(True),
    enable_qr_scanner: bool = Form(False),
    app_icon: UploadFile = File(None),
    splash_screen: UploadFile = File(None),
    db: Session = Depends(get_db),
    user: Dict = Depends(get_current_user)
):
    """
    Create a new app build with custom icon and splash screen.
    """
    try:
        # Generate unique project ID
        project_id = uuid.uuid4()
        project_dir = UPLOADS_DIR / str(project_id)
        project_dir.mkdir(parents=True, exist_ok=True)
        
        # Save icon if provided
        icon_path = None
        if app_icon and app_icon.filename:
            icon_path = project_dir / f"icon{Path(app_icon.filename).suffix}"
            with open(icon_path, "wb") as f:
                shutil.copyfileobj(app_icon.file, f)
        
        # Save splash screen if provided
        splash_path = None
        if splash_screen and splash_screen.filename:
            splash_path = project_dir / f"splash{Path(splash_screen.filename).suffix}"
            with open(splash_path, "wb") as f:
                shutil.copyfileobj(splash_screen.file, f)
        
        # Determine if source code should be included based on tier
        include_source = tier in ['founder', 'tycoon', 'agency']
        
        # Create project record
        project = Project(
            id=project_id,
            app_name=app_name,
            package_name=package_name,
            app_url=app_url,
            platform=Platform(platform) if platform in ["android", "ios", "both"] else Platform.ANDROID,
            primary_color=primary_color,
            secondary_color=secondary_color,
            version_name=version_name,
            version_code=version_code,
            app_icon_path=str(icon_path) if icon_path else None,
            splash_screen_path=str(splash_path) if splash_path else None,
            build_status=BuildStatus.QUEUED,
            include_source_code=include_source,
            onesignal_app_id=onesignal_app_id if onesignal_app_id and onesignal_app_id != 'null' else None,
            admob_app_id=admob_app_id if admob_app_id and admob_app_id != 'null' else None,
            admob_ad_unit_id=admob_ad_unit_id if admob_ad_unit_id and admob_ad_unit_id != 'null' else None,
            google_play_ids=google_play_ids if google_play_ids and google_play_ids != 'null' else None,
            native_paywall=native_paywall if str(native_paywall).lower() == 'true' else False,
            pull_to_refresh=pull_to_refresh if str(pull_to_refresh).lower() == 'true' else False,
            custom_offline_page=custom_offline_page if str(custom_offline_page).lower() == 'true' else False,
            enable_haptics=enable_haptics if str(enable_haptics).lower() == 'true' else False,
            enable_native_share=enable_native_share if str(enable_native_share).lower() == 'true' else False,
            enable_biometrics=enable_biometrics if str(enable_biometrics).lower() == 'true' else False,
            enable_fade_transitions=enable_fade_transitions if str(enable_fade_transitions).lower() == 'true' else False,
            enable_qr_scanner=enable_qr_scanner if str(enable_qr_scanner).lower() == 'true' else False
            # owner_id will be set when auth is implemented
        )
        
        db.add(project)
        db.commit()
        db.refresh(project)
        
        # Queue Celery task
        task = build_app_task.delay(str(project.id))
        
        # Update project with task ID
        project.celery_task_id = task.id
        db.commit()
        
        return BuildResponse(
            project_id=str(project.id),
            task_id=task.id,
            status="queued",
            message=f"Build queued for {app_name}. Check status at /api/build/{project.id}"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/build/{project_id}", response_model=ProjectStatus)
async def get_build_status(
    project_id: str,
    db: Session = Depends(get_db),
    user: Dict = Depends(get_current_user)
):
    """Get the status of a build"""
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Build download URLs using secure API endpoint
        base_url = "/api/download"
        android_apk_url = f"{base_url}/{project_id}/app-release.apk" if project.android_apk_path else None
        android_aab_url = f"{base_url}/{project_id}/app-release.aab" if project.android_aab_path else None
        ios_ipa_url = f"{base_url}/{project_id}/app.ipa" if project.ios_ipa_path else None
        
        return ProjectStatus(
            project_id=str(project.id),
            app_name=project.app_name,
            status=project.build_status.value,
            platform=project.platform.value,
            android_apk_url=android_apk_url,
            android_aab_url=android_aab_url,
            ios_ipa_url=ios_ipa_url,
            error=project.build_error,
            build_duration=project.build_duration_seconds,
            created_at=project.created_at.isoformat(),
            updated_at=project.updated_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/build/{project_id}/logs")
async def get_build_logs(
    project_id: str,
    db: Session = Depends(get_db),
    user: Dict = Depends(get_current_user)
):
    """Get build logs for a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {
        "project_id": str(project.id),
        "logs": project.build_logs or "No logs available yet.",
        "status": project.build_status.value
    }


@app.delete("/api/build/{project_id}")
async def cancel_build(
    project_id: str,
    db: Session = Depends(get_db),
    user: Dict = Depends(get_current_user)
):
    """Cancel a build in progress"""
    from backend.worker import celery_app
    
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.build_status not in [BuildStatus.QUEUED, BuildStatus.BUILDING, BuildStatus.PROCESSING]:
        raise HTTPException(status_code=400, detail="Build is not in progress")
    
    # Revoke Celery task
    if project.celery_task_id:
        celery_app.control.revoke(project.celery_task_id, terminate=True)
    
    project.build_status = BuildStatus.CANCELLED
    project.build_error = "Build cancelled by user"
    db.commit()
    
    return {"message": "Build cancelled successfully", "project_id": str(project.id)}


@app.get("/api/download/{project_id}/{filename}")
async def download_file(
    project_id: str,
    filename: str,
    db: Session = Depends(get_db),
    user: Dict = Depends(get_current_user)
):
    """Download a build artifact"""
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    file_path = DOWNLOADS_DIR / project_id / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream"
    )


# ============================================
# STARTUP & SHUTDOWN EVENTS
# ============================================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    print("🚀 NativX INFINITY Starting...")
    print("📱 Android builds: ENABLED")
    print("🍎 iOS builds: ENABLED (via GitHub Actions)")
    print("✅ Ready to build apps!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 NativX INFINITY shutting down...")

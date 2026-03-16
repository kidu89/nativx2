# NativX - Celery Worker
# The Director - Orchestrates Android and iOS builds

import os
import shutil
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from celery import Celery
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models import Project, BuildStatus, Platform

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Celery configuration
REDIS_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "NativX",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["backend.worker"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=1200,  # 20 minutes hard limit
    task_soft_time_limit=1200,  # 20 minutes soft limit
    worker_prefetch_multiplier=1,
    worker_concurrency=2,
)

# Paths
BUILDS_DIR = Path("/app/builds")
DOWNLOADS_DIR = Path("/app/downloads")


def get_db() -> Session:
    """Get database session"""
    return SessionLocal()


def update_project_status(
    project_id: str,
    status: BuildStatus,
    error: Optional[str] = None,
    logs: Optional[str] = None,
    apk_path: Optional[str] = None,
    aab_path: Optional[str] = None,
    ipa_path: Optional[str] = None,
    duration: Optional[int] = None
):
    """Update project status in database"""
    db = get_db()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.build_status = status
            if error:
                project.build_error = error
            if logs:
                project.build_logs = (project.build_logs or "") + "\n" + logs
            if apk_path:
                project.android_apk_path = apk_path
            if aab_path:
                project.android_aab_path = aab_path
            if ipa_path:
                project.ios_ipa_path = ipa_path
            if duration:
                project.build_duration_seconds = duration
            if status == BuildStatus.BUILDING:
                project.build_started_at = datetime.utcnow()
            if status in [BuildStatus.SUCCESS, BuildStatus.FAILED]:
                project.build_completed_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


def append_log(project_id: str, message: str):
    """Append log message to project"""
    logger.info(f"[{project_id}] {message}")
    db = get_db()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            log_entry = f"[{timestamp}] {message}"
            project.build_logs = (project.build_logs or "") + "\n" + log_entry
            db.commit()
    finally:
        db.close()


@celery_app.task(
    bind=True,
    name="build_app",
    time_limit=1200,
    soft_time_limit=1200,
    max_retries=1,
    acks_late=True
)
def build_app_task(self, project_id: str):
    """
    Main build task - orchestrates Android and iOS builds.
    
    Android: Runs local Gradle release build
    iOS: Pushes to GitHub -> Waits for Action -> Downloads artifact -> Deletes branch
    """
    build_dir = None
    start_time = datetime.utcnow()
    
    try:
        # Get project from database
        db = get_db()
        project = db.query(Project).filter(Project.id == project_id).first()
        
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        append_log(project_id, f"🚀 Starting build for {project.app_name}")
        update_project_status(project_id, BuildStatus.BUILDING)
        
        # Create build directory
        build_dir = BUILDS_DIR / project_id
        build_dir.mkdir(parents=True, exist_ok=True)
        
        # Create downloads directory
        download_dir = DOWNLOADS_DIR / project_id
        download_dir.mkdir(parents=True, exist_ok=True)
        
        db.close()
        
        # Build based on platform
        if project.platform in [Platform.ANDROID, Platform.BOTH]:
            append_log(project_id, "📱 Starting Android build...")
            build_android(project_id, project, build_dir, download_dir)
        
        if project.platform in [Platform.IOS, Platform.BOTH]:
            append_log(project_id, "🍎 Starting iOS build...")
            build_ios(project_id, project, build_dir, download_dir)
        
        # Calculate duration
        duration = int((datetime.utcnow() - start_time).total_seconds())
        
        append_log(project_id, f"✅ Build completed successfully in {duration}s!")
        update_project_status(project_id, BuildStatus.SUCCESS, duration=duration)
        
        return {
            "status": "success",
            "project_id": project_id,
            "duration": duration
        }
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Build failed for {project_id}: {error_msg}")
        append_log(project_id, f"❌ Build failed: {error_msg}")
        update_project_status(project_id, BuildStatus.FAILED, error=error_msg)
        
        return {
            "status": "failed",
            "project_id": project_id,
            "error": error_msg
        }
        
    finally:
        # Cleanup build directory
        if build_dir and build_dir.exists():
            try:
                shutil.rmtree(build_dir)
                logger.info(f"Cleaned up build directory: {build_dir}")
            except Exception as e:
                logger.warning(f"Failed to cleanup build directory: {e}")


def build_android(project_id: str, project: Project, build_dir: Path, download_dir: Path):
    """
    Build Android APK using local Gradle.
    Uses the pre-generated keystore at /app/release.jks
    """
    from services.android_engine import AndroidEngine
    
    engine = AndroidEngine(project_id, project, build_dir, download_dir)
    engine.build()


def build_ios(project_id: str, project: Project, build_dir: Path, download_dir: Path):
    """
    Build iOS IPA using GitHub Actions (headless cloud build).
    
    1. Push code to GitHub branch
    2. Wait for GitHub Action to complete
    3. Download artifact (IPA)
    4. Delete the branch
    """
    from services.ios_engine import IOSEngine
    
    engine = IOSEngine(project_id, project, build_dir, download_dir)
    engine.build()


# ============================================
# CLEANUP TASKS
# ============================================

@celery_app.task(name="cleanup_old_builds")
def cleanup_old_builds():
    """
    Periodic task to clean up old build artifacts.
    Runs daily and removes builds older than 24 hours.
    """
    import time
    
    cleanup_hours = int(os.environ.get("CLEANUP_AFTER_HOURS", 24))
    cutoff_time = time.time() - (cleanup_hours * 3600)
    
    logger.info(f"Running cleanup for builds older than {cleanup_hours} hours")
    
    cleaned = 0
    for directory in [BUILDS_DIR, DOWNLOADS_DIR]:
        if directory.exists():
            for item in directory.iterdir():
                if item.is_dir():
                    try:
                        if item.stat().st_mtime < cutoff_time:
                            shutil.rmtree(item)
                            cleaned += 1
                            logger.info(f"Cleaned up: {item}")
                    except Exception as e:
                        logger.warning(f"Failed to clean {item}: {e}")
    
    logger.info(f"Cleanup complete. Removed {cleaned} old builds.")
    return {"cleaned": cleaned}


# Configure periodic tasks
celery_app.conf.beat_schedule = {
    "cleanup-old-builds": {
        "task": "cleanup_old_builds",
        "schedule": 3600.0,  # Every hour
    },
}

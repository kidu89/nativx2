import sys
from pathlib import Path

# Add current dir to python path
sys.path.append(str(Path(__file__).parent))

from services.android_engine import AndroidEngine
from backend.models import Project
import os

def build_test_apk():
    # Construct a mock project that loads the local test page and enables the required hardware features
    project = Project(
        app_name='QR Scanner DEMO',
        app_url='file:///android_asset/test_scanner.html',
        package_name='com.nativx.scannerdemo',
        version_name='1.0',
        version_code=1,
        enable_qr_scanner=True,
        enable_haptics=True,
        enable_fade_transitions=True,
        enable_biometrics=True,
        enable_native_share=True,
        onesignal_app_id="test-id",
        admob_app_id="test-id",
        google_play_ids="test-id",
        pull_to_refresh=False,
        custom_offline_page=False,
        primary_color='#10b981',
        secondary_color='#059669'
    )
    
    # Target directory
    build_dir = Path('qr_test_build')
    download_dir = Path('qr_test_downloads')
    
    # Initialize Engine
    engine = AndroidEngine("qr_demo_test", project, build_dir, download_dir)
    
    print("Starting specialized test build...")
    engine.build()
    print("Build finished. APK should be at qr_test_build/android/app/build/outputs/apk/release/app-release.apk or similar.")

if __name__ == "__main__":
    build_test_apk()

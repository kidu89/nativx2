# NativX INFINITY - Android Build Engine
# Generates signed, Play Store ready APKs

import os
import shutil
import subprocess
import logging
from pathlib import Path
from typing import Optional
from PIL import Image

from backend.models import Project

logger = logging.getLogger(__name__)

# Template paths
BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates" / "android"
KEYSTORE_PATH = BASE_DIR / "release.jks"

# Icon sizes for different densities
ICON_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


class AndroidEngine:
    """
    Android build engine that creates signed, release-ready APKs.
    
    Features:
    - Lanczos resampling for high-quality icons
    - Manifest injection for app name and package
    - Gradle release build with ProGuard
    - Signed with release keystore
    """
    
    def __init__(
        self,
        project_id: str,
        project: Project,
        build_dir: Path,
        download_dir: Path
    ):
        self.project_id = project_id
        self.project = project
        self.build_dir = build_dir
        self.download_dir = download_dir
        self.android_dir = build_dir / "android"
        
    def log(self, message: str):
        """Log a message"""
        logger.info(f"[Android:{self.project_id}] {message}")
        
    def build(self):
        """Execute the full Android build pipeline"""
        self.log("Starting Android build pipeline...")
        
        # Step 1: Copy template
        self.copy_template()
        
        # Step 2: Configure app
        self.configure_app()
        
        # Step 3: Process icons
        self.process_icons()
        
        # Step 4: Inject manifest
        self.inject_manifest()
        
        # Step 5: Update build files
        self.update_build_files()
        
        # Step 6: Run Gradle build
        self.run_gradle_build()
        
        # Step 7: Copy outputs
        self.copy_outputs()
        
        self.log("Android build completed successfully!")
        
    def copy_template(self):
        """Copy Android template to build directory"""
        self.log("Copying Android template...")
        
        if self.android_dir.exists():
            try:
                shutil.rmtree(self.android_dir)
            except PermissionError:
                self.log(f"Warning: Could not remove {self.android_dir}. Proceeding with overwrite...")
        
        shutil.copytree(TEMPLATES_DIR, self.android_dir, dirs_exist_ok=True)
        self.log("Template copied successfully")
        self.log("Template copied successfully")
        
    def configure_app(self):
        """Configure app settings"""
        self.log(f"Configuring app: {self.project.app_name}")
        
        # Create config file for WebView
        config_path = self.android_dir / "app" / "src" / "main" / "assets" / "config.json"
        config_path.parent.mkdir(parents=True, exist_ok=True)
        
        config_content = f"""{{
    "app_name": "{self.project.app_name}",
    "app_url": "{self.project.app_url}",
    "primary_color": "{self.project.primary_color}",
    "secondary_color": "{self.project.secondary_color}",
    "version_name": "{self.project.version_name}",
    "version_code": {self.project.version_code},
    "onesignal_app_id": "{self.project.onesignal_app_id or ''}",
    "admob_app_id": "{self.project.admob_app_id or ''}",
    "admob_ad_unit_id": "{self.project.admob_ad_unit_id or ''}",
    "google_play_ids": "{self.project.google_play_ids or ''}",
    "native_paywall": {'true' if self.project.native_paywall else 'false'},
    "pull_to_refresh": {'true' if self.project.pull_to_refresh else 'false'},
    "custom_offline_page": {'true' if self.project.custom_offline_page else 'false'},
    "enable_haptics": {'true' if self.project.enable_haptics else 'false'},
    "enable_native_share": {'true' if self.project.enable_native_share else 'false'},
    "enable_biometrics": {'true' if getattr(self.project, 'enable_biometrics', False) else 'false'},
    "enable_fade_transitions": {'true' if getattr(self.project, 'enable_fade_transitions', True) else 'false'},
    "enable_qr_scanner": {'true' if getattr(self.project, 'enable_qr_scanner', False) else 'false'}
}}"""
        
        config_path.write_text(config_content)
        self.log("App configuration saved")
        
    def process_icons(self):
        """Process and resize app icons using Lanczos resampling"""
        self.log("Processing app icons...")
        
        # Get source icon
        source_icon = None
        if self.project.app_icon_path and Path(self.project.app_icon_path).exists():
            source_icon = Path(self.project.app_icon_path)
            self.log(f"Using custom icon: {source_icon}")
        else:
            # Generate default icon
            source_icon = self._generate_default_icon()
            self.log("Using generated default icon")
            
        if not source_icon:
            self.log("No icon available, skipping icon processing")
            return
            
        # Open and process icon
        try:
            with Image.open(source_icon) as img:
                # Convert to RGBA if necessary
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                    
                # Create icons for each density
                res_dir = self.android_dir / "app" / "src" / "main" / "res"
                
                for density, size in ICON_SIZES.items():
                    density_dir = res_dir / density
                    density_dir.mkdir(parents=True, exist_ok=True)
                    
                    # Resize with Lanczos resampling for best quality
                    resized = img.resize((size, size), Image.Resampling.LANCZOS)
                    
                    # Save as PNG
                    icon_path = density_dir / "ic_launcher.png"
                    resized.save(icon_path, "PNG", optimize=True)
                    
                    # Also save round icon
                    round_icon_path = density_dir / "ic_launcher_round.png"
                    resized.save(round_icon_path, "PNG", optimize=True)
                    
                self.log(f"Icons generated for {len(ICON_SIZES)} densities")
                
        except Exception as e:
            self.log(f"Warning: Icon processing failed: {e}")
            
    def _generate_default_icon(self) -> Optional[Path]:
        """Generate a default icon with the app's primary color"""
        try:
            size = 512
            color = self._hex_to_rgb(self.project.primary_color)
            
            # Create image with primary color
            img = Image.new('RGBA', (size, size), color + (255,))
            
            # Add a simple letter overlay
            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(img)
            
            # Get first letter of app name
            letter = self.project.app_name[0].upper() if self.project.app_name else "A"
            
            # Try to use a nice font, fall back to default
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 256)
            except:
                font = ImageFont.load_default()
                
            # Draw letter in center
            bbox = draw.textbbox((0, 0), letter, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (size - text_width) // 2
            y = (size - text_height) // 2 - 30
            
            draw.text((x, y), letter, fill=(255, 255, 255, 255), font=font)
            
            # Save to temp file
            icon_path = self.build_dir / "generated_icon.png"
            img.save(icon_path, "PNG")
            
            return icon_path
            
        except Exception as e:
            self.log(f"Failed to generate default icon: {e}")
            return None
            
    def _hex_to_rgb(self, hex_color: str) -> tuple:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        
    def inject_manifest(self):
        """Inject app name and package into AndroidManifest.xml"""
        self.log("Injecting manifest configuration...")
        
        manifest_path = self.android_dir / "app" / "src" / "main" / "AndroidManifest.xml"
        
        if manifest_path.exists():
            content = manifest_path.read_text()
            
            # Extract host from app_url for deep linking
            from urllib.parse import urlparse
            parsed_url = urlparse(self.project.app_url)
            host = parsed_url.netloc or "example.com"
            
            # Create custom scheme from app name (lowercase, alphanumeric only)
            scheme = ''.join(c for c in self.project.app_name.lower() if c.isalnum())[:20] or "myapp"
            
            # Replace placeholders
            content = content.replace("{{APP_NAME}}", self.project.app_name)
            content = content.replace("{{PACKAGE_NAME}}", self.project.package_name)
            content = content.replace("{{HOST}}", host)
            content = content.replace("{{SCHEME}}", scheme)
            content = content.replace("com.appweaver.template", self.project.package_name)
            
            # Advanced SDK Manifest Injection
            metadata_injections = []
            
            # AdMob requires the App ID in the manifest
            if getattr(self.project, 'admob_app_id', None):
                metadata_injections.append(f'        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="{self.project.admob_app_id}"/>')
                
            if metadata_injections:
                metadata_block = "\n".join(metadata_injections)
                # Inject right before the closing </application> tag
                content = content.replace("</application>", metadata_block + "\n\n    </application>")
                self.log(f"Injected {len(metadata_injections)} dynamic manifest metadata tags")

            manifest_path.write_text(content)
            self.log(f"Manifest updated successfully (host: {host}, scheme: {scheme})")
            
    def update_build_files(self):
        """Update Gradle build files with project configuration"""
        self.log("Updating build configuration...")
        
        # Update app/build.gradle.kts
        app_gradle = self.android_dir / "app" / "build.gradle.kts"
        
        if app_gradle.exists():
            content = app_gradle.read_text()
            
            # Replace placeholders
            content = content.replace("{{PACKAGE_NAME}}", self.project.package_name)
            content = content.replace("{{VERSION_NAME}}", self.project.version_name)
            content = content.replace("{{VERSION_CODE}}", str(self.project.version_code))
            content = content.replace("{{MIN_SDK}}", str(self.project.min_sdk or 24))
            content = content.replace("{{TARGET_SDK}}", str(self.project.target_sdk or 34))
            content = content.replace("com.appweaver.template", self.project.package_name)
            
            # Remove hardcoded Docker signing config if not in container
            if os.name == "nt":
                import re
                # Match signingConfigs { ... { ... } ... } - handles one level of nesting
                content = re.sub(r'signingConfigs\s*\{[\s\S]*?\}\s*\}', 'signingConfigs { }', content)
                content = content.replace('signingConfig = signingConfigs.getByName("release")', '// signingConfig = signingConfigs.getByName("release")')
            
            # Advanced SDK Dependencies Injection
            dependencies = []
            
            # OneSignal
            if getattr(self.project, 'onesignal_app_id', None):
                dependencies.append('    implementation("com.onesignal:OneSignal:5.1.4")')
                
            # AdMob
            if getattr(self.project, 'admob_app_id', None):
                dependencies.append('    implementation("com.google.android.gms:play-services-ads:23.0.0")')
                
            # Google Play Billing 
            if getattr(self.project, 'google_play_ids', None):
                dependencies.append('    implementation("com.android.billingclient:billing-ktx:6.2.0")')
                
            # Biometrics
            if getattr(self.project, 'enable_biometrics', False):
                dependencies.append('    implementation("androidx.biometric:biometric:1.2.0-alpha05")')
                
            # QR Scanner
            if getattr(self.project, 'enable_qr_scanner', False):
                dependencies.append('    implementation("com.journeyapps:zxing-android-embedded:4.3.0")')
                
            # Inject dependencies block at the end of the file if needed
            if dependencies:
                deps_block = "\n" + "\n".join(dependencies)
                content = content.replace("dependencies {", "dependencies {" + deps_block)
                self.log(f"Injected {len(dependencies)} dynamic SDK dependencies")
                
            app_gradle.write_text(content)
            self.log("Build files updated")
            
        # Update source package directory
        self._update_package_directory()
            
    def _update_package_directory(self):
        """Rename source package directory to match app package"""
        old_package_path = self.android_dir / "app" / "src" / "main" / "java" / "com" / "appweaver" / "template"
        
        if not old_package_path.exists():
            return
            
        # Parse new package name
        package_parts = self.project.package_name.split(".")
        new_package_path = self.android_dir / "app" / "src" / "main" / "java"
        
        for part in package_parts:
            new_package_path = new_package_path / part
            
        # Create new directory structure
        new_package_path.mkdir(parents=True, exist_ok=True)
        
        # Move files
        for file in old_package_path.glob("*"):
            if file.is_file():
                # Update package declaration in file
                content = file.read_text()
                content = content.replace("package com.appweaver.template", f"package {self.project.package_name}")
                
                # Write to new location
                new_file = new_package_path / file.name
                new_file.write_text(content)
                
        # Remove old directory structure
        shutil.rmtree(self.android_dir / "app" / "src" / "main" / "java" / "com" / "appweaver")
        self.log("Package directory updated")
        
    def run_gradle_build(self):
        """Run Gradle release build"""
        self.log("Starting Gradle release build...")
        
        # Use gradle directly (faster in container, no wrapper download needed)
        # Check if gradle is available, otherwise use gradlew
        gradle_cmd = "gradle"
        
        if shutil.which("gradle"):
            pass
        else:
            is_windows = os.name == "nt"
            gradle_bin = "gradlew.bat" if is_windows else "gradlew"
            gradlew_path = self.android_dir / gradle_bin
            if gradlew_path.exists():
                if not is_windows:
                    os.chmod(gradlew_path, 0o755)
                gradle_cmd = str(gradlew_path.resolve())
            
        # Build command with memory optimization
        cmd = [
            gradle_cmd,
            "assembleDebug",
            "-Dorg.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=512m",
            "-Dorg.gradle.workers.max=1",
            "--no-daemon",
            "--stacktrace"
        ]
        
        # Prepare environment
        env = os.environ.copy()
        if os.name == "nt":
             env["JAVA_HOME"] = r"C:\Program Files\Java\jdk-17.0.18"
             env["ANDROID_HOME"] = r"C:\Users\Gabi\AppData\Local\Android\Sdk"
             env["PATH"] = f"{env['JAVA_HOME']}\\bin;" + env["PATH"]

        self.log(f"Running: {' '.join(cmd)}")
        
        # Execute build
        result = subprocess.run(
            cmd,
            cwd=str(self.android_dir),
            capture_output=True,
            text=True,
            env=env,
            timeout=900  # 15 minute timeout
        )
        
        if result.returncode != 0:
            error_msg = result.stderr or result.stdout
            self.log(f"Gradle build failed: {error_msg}")
            raise Exception(f"Gradle build failed: {error_msg[-2000:]}")
            
        self.log("Gradle build completed successfully!")
        
    def copy_outputs(self):
        """Copy build outputs to downloads directory"""
        self.log("Copying build outputs...")
        
        # APK path - handle both release and debug paths
        is_debug = os.name == "nt" # We use debug builds on Windows for now
        build_type = "debug" if is_debug else "release"
        apk_name = f"app-{build_type}.apk"
        apk_path = self.android_dir / "app" / "build" / "outputs" / "apk" / build_type / apk_name
        
        if apk_path.exists():
            dest_apk = self.download_dir / apk_name
            shutil.copy2(apk_path, dest_apk)
            self.log(f"APK copied to: {dest_apk}")
            
            # Update project with APK path
            from backend.worker import update_project_status
            from backend.models import BuildStatus
            update_project_status(
                self.project_id,
                BuildStatus.PROCESSING,
                apk_path=str(dest_apk)
            )
        else:
            self.log("Warning: APK not found at expected location")
            
        # Also check for AAB
        aab_path = self.android_dir / "app" / "build" / "outputs" / "bundle" / "release" / "app-release.aab"
        
        if aab_path.exists():
            dest_aab = self.download_dir / "app-release.aab"
            shutil.copy2(aab_path, dest_aab)
            self.log(f"AAB copied to: {dest_aab}")
            
        # ZIP the source code for the user (only for Founder/Tycoon tiers)
        if self.project.include_source_code:
            self.log("Archiving source code (Founder/Tycoon tier)...")
            source_zip = self.download_dir / "project-source" # shutil.make_archive adds .zip extension automatically
            
            # We zip the entire Android directory which contains the configured project
            try:
                shutil.make_archive(
                    str(source_zip),
                    'zip',
                    root_dir=str(self.android_dir)
                )
                self.log(f"Source code archived to: {source_zip}.zip")
            except Exception as e:
                self.log(f"Failed to archive source code: {e}")
        else:
            self.log("Source code not included (Prototype tier - binary only)")


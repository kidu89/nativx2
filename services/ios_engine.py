# NativX INFINITY - iOS Build Engine
# Headless cloud builds via GitHub Actions

import os
import time
import zipfile
import logging
import requests
from pathlib import Path
from typing import Optional
from datetime import datetime

from github import Github, GithubException

from backend.models import Project

logger = logging.getLogger(__name__)

# Template paths
TEMPLATES_DIR = Path("/app/templates/ios")


class IOSEngine:
    """
    iOS build engine using GitHub Actions for headless cloud builds.
    
    Flow:
    1. Create a new branch with iOS source code
    2. Push to GitHub and trigger workflow
    3. Wait for workflow completion
    4. Download IPA artifact
    5. Delete the branch (cleanup)
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
        self.ios_dir = build_dir / "ios"
        
        # GitHub configuration
        self.github_token = os.environ.get("GITHUB_TOKEN")
        self.github_repo = os.environ.get("GITHUB_REPO")
        self.github_username = os.environ.get("GITHUB_USERNAME")
        
        # Branch name for this build
        self.branch_name = f"build-{project_id[:8]}-{int(time.time())}"
        
        # Timeouts
        self.workflow_timeout = 1000  # ~16 minutes
        self.poll_interval = 30  # seconds
        
    def log(self, message: str):
        """Log a message"""
        logger.info(f"[iOS:{self.project_id}] {message}")
        
    def build(self):
        """Execute the full iOS build pipeline"""
        self.log("Starting iOS build pipeline...")
        
        # Check credentials for dry run mode
        dry_run = False
        if not all([self.github_token, self.github_repo]):
            self.log("⚠️ GitHub credentials missing. Running in DRY RUN mode (Code Gen Only).")
            dry_run = True
            
        try:
            # Step 1: Prepare iOS source
            self.prepare_source()
            
            if dry_run:
                self.log("✅ [DRY RUN] iOS source code generated successfully in " + str(self.ios_dir))
                self.log("✅ [DRY RUN] Skipping GitHub Push & Action trigger.")
                
                # Mock artifact for download logic
                mock_ipa = self.download_dir / "mock_app.ipa"
                mock_ipa.write_text("Mock IPA content")
                
                # Update status
                from backend.worker import update_project_status
                from backend.models import BuildStatus
                update_project_status(
                    self.project_id,
                    BuildStatus.SUCCESS,
                    ipa_path=str(mock_ipa),
                    logs="Dry run completed successfully. Code generated locally."
                )
                return

            # Step 2: Push to GitHub
            self.push_to_github()
            
            # Step 3: Wait for workflow
            self.wait_for_workflow()
            
            # Step 4: Download artifact
            self.download_artifact()
            
        finally:
            if not dry_run:
                # Step 5: Cleanup - delete branch
                self.cleanup_branch()
            
        self.log("iOS build completed successfully!")
        
    def prepare_source(self):
        """Prepare iOS source code with project configuration"""
        self.log("Preparing iOS source code...")
        
        # Create iOS directory
        if self.ios_dir.exists():
            import shutil
            shutil.rmtree(self.ios_dir)
            
        self.ios_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy template files
        import shutil
        if TEMPLATES_DIR.exists():
            shutil.copytree(TEMPLATES_DIR, self.ios_dir, dirs_exist_ok=True)
            
        # Create/update ContentView.swift with app URL
        content_view_path = self.ios_dir / "NativX" / "ContentView.swift"
        content_view_path.parent.mkdir(parents=True, exist_ok=True)
        
        content_view = self._generate_content_view()
        content_view_path.write_text(content_view)
        
        # Create Info.plist
        self._create_info_plist()
        
        # Create project configuration
        self._create_project_config()
        
        # Update GitHub workflow with app name
        self._update_workflow()
        
        # Archive Source Code for User Download (only for Founder/Tycoon tiers)
        if self.project.include_source_code:
            try:
                self.log("Archiving iOS source code (Founder/Tycoon tier)...")
                source_zip = self.download_dir / "project-source"
                shutil.make_archive(
                    str(source_zip),
                    'zip',
                    root_dir=str(self.ios_dir)
                )
                self.log(f"iOS source code archived to: {source_zip}.zip")
            except Exception as e:
                self.log(f"Failed to archive iOS source: {e}")
        else:
            self.log("Source code not included (Prototype tier - binary only)")

        self.log("iOS source prepared successfully")
        
    def _generate_content_view(self) -> str:
        """Generate ContentView.swift with WebView"""
        return f'''//
// ContentView.swift
// {self.project.app_name}
//
// Generated by NativX INFINITY
//

import SwiftUI
import WebKit

struct ContentView: View {{
    @State private var isLoading = true
    @State private var loadError: String? = nil
    
    private let appURL = "{self.project.app_url}"
    
    var body: some View {{
        ZStack {{
            WebView(
                urlString: appURL,
                isLoading: $isLoading,
                loadError: $loadError
            )
            .edgesIgnoringSafeArea(.all)
            
            if isLoading {{
                LoadingView()
            }}
            
            if let error = loadError {{
                ErrorView(message: error) {{
                    loadError = nil
                    isLoading = true
                }}
            }}
        }}
    }}
}}

struct WebView: UIViewRepresentable {{
    let urlString: String
    @Binding var isLoading: Bool
    @Binding var loadError: String?
    
    func makeCoordinator() -> Coordinator {{
        Coordinator(self)
    }}
    
    func makeUIView(context: Context) -> WKWebView {{
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.scrollView.bounces = true
        webView.allowsBackForwardNavigationGestures = true
        
        // Load URL
        if let url = URL(string: urlString) {{
            let request = URLRequest(url: url, cachePolicy: .returnCacheDataElseLoad)
            webView.load(request)
        }}
        
        return webView
    }}
    
    func updateUIView(_ uiView: WKWebView, context: Context) {{
    }}
    
    class Coordinator: NSObject, WKNavigationDelegate {{
        var parent: WebView
        
        init(_ parent: WebView) {{
            self.parent = parent
        }}
        
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {{
            parent.isLoading = true
        }}
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {{
            parent.isLoading = false
            parent.loadError = nil
        }}
        
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {{
            parent.isLoading = false
            parent.loadError = error.localizedDescription
        }}
        
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {{
            parent.isLoading = false
            parent.loadError = error.localizedDescription
        }}
    }}
}}

struct LoadingView: View {{
    var body: some View {{
        VStack(spacing: 20) {{
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading...")
                .font(.headline)
                .foregroundColor(.gray)
        }}
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.white.opacity(0.9))
    }}
}}

struct ErrorView: View {{
    let message: String
    let onRetry: () -> Void
    
    var body: some View {{
        VStack(spacing: 20) {{
            Image(systemName: "wifi.slash")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("Connection Error")
                .font(.title2)
                .fontWeight(.bold)
            
            Text(message)
                .font(.body)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button(action: onRetry) {{
                Text("Try Again")
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 40)
                    .padding(.vertical, 12)
                    .background(Color.blue)
                    .cornerRadius(10)
            }}
        }}
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.white)
    }}
}}

#Preview {{
    ContentView()
}}
'''
        
    def _create_info_plist(self):
        """Create Info.plist with app configuration"""
        info_plist = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>{self.project.app_name}</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>{self.project.package_name}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>{self.project.app_name}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>{self.project.version_name}</string>
    <key>CFBundleVersion</key>
    <string>{self.project.version_code}</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>'''
        
        plist_path = self.ios_dir / "NativX" / "Info.plist"
        plist_path.parent.mkdir(parents=True, exist_ok=True)
        plist_path.write_text(info_plist)
        
    def _create_project_config(self):
        """Create project configuration JSON"""
        config = f'''{{
    "app_name": "{self.project.app_name}",
    "bundle_id": "{self.project.package_name}",
    "app_url": "{self.project.app_url}",
    "version": "{self.project.version_name}",
    "build_number": "{self.project.version_code}"
}}'''
        
        config_path = self.ios_dir / "build_config.json"
        config_path.write_text(config)
        
    def _update_workflow(self):
        """Update GitHub workflow with project details"""
        workflow_dir = self.ios_dir / ".github" / "workflows"
        workflow_dir.mkdir(parents=True, exist_ok=True)
        
        workflow_path = workflow_dir / "build_headless.yml"
        
        if workflow_path.exists():
            content = workflow_path.read_text()
            content = content.replace("{{APP_NAME}}", self.project.app_name)
            content = content.replace("{{BUNDLE_ID}}", self.project.package_name)
            workflow_path.write_text(content)
            
    def push_to_github(self):
        """Push iOS source to GitHub and trigger workflow"""
        self.log(f"Pushing to GitHub branch: {self.branch_name}")
        
        try:
            g = Github(self.github_token)
            
            # Try to get repo, create if not exists
            try:
                repo = g.get_repo(self.github_repo)
            except GithubException:
                # If repo not found, try to create it
                self.log(f"Repository {self.github_repo} not found. Attempting to create it...")
                try:
                    user = g.get_user()
                    # Extract repo name from "owner/repo"
                    repo_name = self.github_repo.split("/")[-1]
                    repo = user.create_repo(repo_name, private=True, auto_init=True)
                    self.log(f"Created private repository: {self.github_repo}")
                    # Brief wait for Github propagation
                    time.sleep(3)
                except Exception as creation_error:
                    # If creation fails, re-raise original error or creation error
                    self.log(f"Failed to create repository: {creation_error}")
                    raise Exception(f"Repository {self.github_repo} not found and could not be created. Please create it manually.")

            # Get default branch
            default_branch = repo.default_branch
            default_ref = repo.get_git_ref(f"heads/{default_branch}")
            
            # Create new branch
            repo.create_git_ref(
                ref=f"refs/heads/{self.branch_name}",
                sha=default_ref.object.sha
            )
            
            self.log(f"Created branch: {self.branch_name}")
            
            # Upload files
            self._upload_files_to_github(repo)
            
            self.log("Files pushed to GitHub")
            
        except GithubException as e:
            raise Exception(f"GitHub API error: {e}")
            
    def _upload_files_to_github(self, repo):
        """Upload iOS files to GitHub repository"""
        for file_path in self.ios_dir.rglob("*"):
            if file_path.is_file():
                relative_path = file_path.relative_to(self.ios_dir)
                content = file_path.read_bytes()
                
                try:
                    # Try to get existing file
                    try:
                        existing = repo.get_contents(str(relative_path), ref=self.branch_name)
                        repo.update_file(
                            str(relative_path),
                            f"Update {relative_path}",
                            content,
                            existing.sha,
                            branch=self.branch_name
                        )
                    except:
                        # File doesn't exist, create it
                        repo.create_file(
                            str(relative_path),
                            f"Add {relative_path}",
                            content,
                            branch=self.branch_name
                        )
                except Exception as e:
                    self.log(f"Warning: Failed to upload {relative_path}: {e}")
                    
    def wait_for_workflow(self):
        """Wait for GitHub Actions workflow to complete"""
        self.log("Waiting for GitHub Actions workflow...")
        
        g = Github(self.github_token)
        repo = g.get_repo(self.github_repo)
        
        start_time = time.time()
        workflow_run = None
        
        # Wait for workflow to start
        while time.time() - start_time < 120:  # 2 min to start
            runs = repo.get_workflow_runs(branch=self.branch_name)
            for run in runs:
                if run.status != "completed":
                    workflow_run = run
                    break
            if workflow_run:
                break
            time.sleep(10)
            
        if not workflow_run:
            self.log("Workflow not started, checking for completed runs...")
            runs = list(repo.get_workflow_runs(branch=self.branch_name))
            if runs:
                workflow_run = runs[0]
            else:
                raise Exception("GitHub Actions workflow did not start")
                
        self.log(f"Workflow started: {workflow_run.id}")
        
        # Wait for completion
        while time.time() - start_time < self.workflow_timeout:
            workflow_run = repo.get_workflow_run(workflow_run.id)
            
            if workflow_run.status == "completed":
                if workflow_run.conclusion == "success":
                    self.log("Workflow completed successfully!")
                    return
                else:
                    raise Exception(f"Workflow failed with conclusion: {workflow_run.conclusion}")
                    
            self.log(f"Workflow status: {workflow_run.status}")
            time.sleep(self.poll_interval)
            
        raise Exception("Workflow timed out")
        
    def download_artifact(self):
        """Download IPA artifact from completed workflow"""
        self.log("Downloading IPA artifact...")
        
        g = Github(self.github_token)
        repo = g.get_repo(self.github_repo)
        
        # Get workflow runs for our branch
        runs = list(repo.get_workflow_runs(branch=self.branch_name))
        
        if not runs:
            raise Exception("No workflow runs found")
            
        latest_run = runs[0]
        
        # Get artifacts
        artifacts = latest_run.get_artifacts()
        
        for artifact in artifacts:
            if artifact.name.endswith(".ipa") or "ipa" in artifact.name.lower():
                # Download artifact using API
                download_url = artifact.archive_download_url
                
                headers = {"Authorization": f"token {self.github_token}"}
                response = requests.get(download_url, headers=headers, stream=True)
                
                if response.status_code == 200:
                    # Save zip file
                    zip_path = self.download_dir / "artifact.zip"
                    with open(zip_path, "wb") as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                            
                    # Extract IPA
                    with zipfile.ZipFile(zip_path, "r") as zip_ref:
                        zip_ref.extractall(self.download_dir)
                        
                    # Find and rename IPA
                    for ipa_file in self.download_dir.glob("*.ipa"):
                        dest_ipa = self.download_dir / "app.ipa"
                        ipa_file.rename(dest_ipa)
                        
                        # Update project
                        from backend.worker import update_project_status
                        from backend.models import BuildStatus
                        update_project_status(
                            self.project_id,
                            BuildStatus.PROCESSING,
                            ipa_path=str(dest_ipa)
                        )
                        
                        self.log(f"IPA downloaded: {dest_ipa}")
                        return
                        
        self.log("Warning: No IPA artifact found")
        
    def cleanup_branch(self):
        """Delete the build branch from GitHub"""
        self.log(f"Cleaning up branch: {self.branch_name}")
        
        try:
            g = Github(self.github_token)
            repo = g.get_repo(self.github_repo)
            
            ref = repo.get_git_ref(f"heads/{self.branch_name}")
            ref.delete()
            
            self.log("Branch deleted successfully")
            
        except GithubException as e:
            self.log(f"Warning: Failed to delete branch: {e}")
        except Exception as e:
            self.log(f"Warning: Cleanup error: {e}")

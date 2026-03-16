/**
 * AppWeaver INFINITY - Smart WebView Activity
 * 
 * Features:
 * - Full-featured WebView with JavaScript support
 * - Pull-to-refresh functionality
 * - Offline mode with graceful fallback
 * - File upload support (camera & gallery)
 * - Download manager integration
 * - Back navigation handling
 * - Splash screen with Material 3
 */

package com.appweaver.template

import android.Manifest
import android.animation.ObjectAnimator
import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.MediaStore
import android.view.KeyEvent
import android.view.View
import android.webkit.*
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

// Biometrics Support
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import android.os.Handler
import android.os.Looper

import com.google.android.play.core.review.ReviewManagerFactory
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

// ZXing Barcode Scanner
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import com.journeyapps.barcodescanner.ScanIntentResult

// Dynamic SDK imports (will compile if dependencies are injected by engine)
import com.onesignal.OneSignal
import com.google.android.gms.ads.MobileAds

class MainActivity : AppCompatActivity() {

    companion object {
        private const val PREFS_NAME = "NativX_Prefs"
        private const val KEY_FIRST_LAUNCH = "first_launch_time"
        private const val KEY_LAUNCH_COUNT = "launch_count"
        private const val KEY_RATING_SHOWN = "rating_shown"
        private const val DAYS_BEFORE_RATING = 3
        private const val LAUNCHES_BEFORE_RATING = 5
    }

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var cameraImageUri: Uri? = null
    
    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>
    private lateinit var cameraLauncher: ActivityResultLauncher<Uri>
    private lateinit var permissionLauncher: ActivityResultLauncher<Array<String>>
    
    // QR Scanner Callback tracking and Launcher
    private var qrScannerCallbackName: String? = null
    private val qrScannerLauncher = registerForActivityResult(ScanContract()) { result: ScanIntentResult ->
        if (result.contents != null) {
            val content = result.contents.replace("\"", "\\\"").replace("'", "\\'")
            qrScannerCallbackName?.let { callbackName ->
                webView.evaluateJavascript("$callbackName(true, \"$content\")", null)
            }
        } else {
            qrScannerCallbackName?.let { callbackName ->
                webView.evaluateJavascript("$callbackName(false, null)", null)
            }
        }
        qrScannerCallbackName = null
    }
    
    private var appConfig: AppConfig? = null
    private var keepSplashScreen = true
    
    data class AppConfig(
        val appName: String,
        val appUrl: String,
        val primaryColor: String,
        val secondaryColor: String,
        val versionName: String,
        val versionCode: Int,
        val onesignalAppId: String?,
        val admobAppId: String?,
        val admobAdUnitId: String?,
        val nativePaywall: Boolean,
        val pullToRefresh: Boolean,
        val customOfflinePage: Boolean,
        val enableHaptics: Boolean,
        val enableNativeShare: Boolean,
        val enableBiometrics: Boolean,
        val enableFadeTransitions: Boolean,
        val enableQrScanner: Boolean
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install splash screen
        val splashScreen = installSplashScreen()
        splashScreen.setKeepOnScreenCondition { keepSplashScreen }
        
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Load configuration
        loadConfig()
        
        // Initialize views
        initViews()
        
        // Setup WebView
        setupWebView()
        
        // Initialize Native SDKs (OneSignal, AdMob) based on config
        initNativeSDKs()
        
        // Setup activity result launchers
        setupLaunchers()
        
        // Setup back press handling
        setupBackPressHandler()
        
        // Load the app URL or handle deep link/share intent
        when {
            handleDeepLink(intent) -> { /* Deep link handled */ }
            handleShareIntent(intent) -> { /* Share intent handled */ }
            else -> loadApp()
        }
        
        // Check if we should prompt for app rating
        checkAndPromptForRating()
    }
    
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { 
            handleDeepLink(it) || handleShareIntent(it)
        }
    }
    
    /**
     * Handle shared content from other apps (e.g., "Share to" from browser)
     * Returns true if share intent was handled
     */
    private fun handleShareIntent(intent: Intent): Boolean {
        if (intent.action == Intent.ACTION_SEND && intent.type?.startsWith("text/") == true) {
            val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return false
            
            // Check if it's a URL
            val url = if (sharedText.startsWith("http://") || sharedText.startsWith("https://")) {
                sharedText
            } else {
                // Append as search query or path
                "${appConfig?.appUrl}?shared=${java.net.URLEncoder.encode(sharedText, "UTF-8")}"
            }
            
            webView.post {
                webView.loadUrl(url)
            }
            return true
        }
        return false
    }
    
    /**
     * Check if we should prompt for app rating and show the dialog
     */
    private fun checkAndPromptForRating() {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        
        // Already shown rating? Skip
        if (prefs.getBoolean(KEY_RATING_SHOWN, false)) return
        
        // Track launches
        val launchCount = prefs.getInt(KEY_LAUNCH_COUNT, 0) + 1
        prefs.edit().putInt(KEY_LAUNCH_COUNT, launchCount).apply()
        
        // Track first launch time
        val firstLaunch = prefs.getLong(KEY_FIRST_LAUNCH, 0L)
        if (firstLaunch == 0L) {
            prefs.edit().putLong(KEY_FIRST_LAUNCH, System.currentTimeMillis()).apply()
            return
        }
        
        // Check conditions: 3 days AND 5 launches
        val daysSinceFirst = (System.currentTimeMillis() - firstLaunch) / (1000 * 60 * 60 * 24)
        if (daysSinceFirst >= DAYS_BEFORE_RATING && launchCount >= LAUNCHES_BEFORE_RATING) {
            showRatingPrompt(prefs)
        }
    }
    
    private fun showRatingPrompt(prefs: android.content.SharedPreferences) {
        try {
            val reviewManager = ReviewManagerFactory.create(this)
            val requestFlow = reviewManager.requestReviewFlow()
            requestFlow.addOnCompleteListener { request ->
                if (request.isSuccessful) {
                    val reviewInfo = request.result
                    val flow = reviewManager.launchReviewFlow(this, reviewInfo)
                    flow.addOnCompleteListener {
                        // Mark as shown regardless of completion
                        prefs.edit().putBoolean(KEY_RATING_SHOWN, true).apply()
                    }
                }
            }
        } catch (e: Exception) {
            // Play Core not available, skip rating
        }
    }
    
    /**
     * Handle deep links from both HTTP/HTTPS and custom scheme
     * Returns true if a deep link was handled
     */
    private fun handleDeepLink(intent: Intent): Boolean {
        val action = intent.action
        val data = intent.data
        
        if (action == Intent.ACTION_VIEW && data != null) {
            val url = when (data.scheme) {
                "http", "https" -> data.toString()
                else -> {
                    // Custom scheme: myapp://path -> https://domain.com/path
                    val basePath = data.path ?: ""
                    val query = data.query?.let { "?$it" } ?: ""
                    "${appConfig?.appUrl}$basePath$query"
                }
            }
            
            // Wait for WebView to be ready, then load
            webView.post {
                webView.loadUrl(url)
            }
            return true
        }
        return false
    }
    
    private fun loadConfig() {
        try {
            val configJson = assets.open("config.json").bufferedReader().use { it.readText() }
            val json = JSONObject(configJson)
            appConfig = AppConfig(
                appName = json.optString("app_name", "AppWeaver App"),
                appUrl = json.optString("app_url", "https://example.com"),
                primaryColor = json.optString("primary_color", "#6366F1"),
                secondaryColor = json.optString("secondary_color", "#8B5CF6"),
                versionName = json.optString("version_name", "1.0.0"),
                versionCode = json.optInt("version_code", 1),
                onesignalAppId = json.optString("onesignal_app_id", ""),
                admobAppId = json.optString("admob_app_id", ""),
                admobAdUnitId = json.optString("admob_ad_unit_id", ""),
                nativePaywall = json.optBoolean("native_paywall", false),
                pullToRefresh = json.optBoolean("pull_to_refresh", true),
                customOfflinePage = json.optBoolean("custom_offline_page", true),
                enableHaptics = json.optBoolean("enable_haptics", false),
                enableNativeShare = json.optBoolean("enable_native_share", false),
                enableBiometrics = json.optBoolean("enable_biometrics", false),
                enableFadeTransitions = json.optBoolean("enable_fade_transitions", true),
                enableQrScanner = json.optBoolean("enable_qr_scanner", false)
            )
        } catch (e: Exception) {
            // Use defaults
            appConfig = AppConfig(
                appName = "AppWeaver App",
                appUrl = "https://example.com",
                primaryColor = "#6366F1",
                secondaryColor = "#8B5CF6",
                versionName = "1.0.0",
                versionCode = 1,
                onesignalAppId = "",
                admobAppId = "",
                admobAdUnitId = "",
                nativePaywall = false,
                pullToRefresh = true,
                customOfflinePage = true,
                enableHaptics = false,
                enableNativeShare = false,
                enableBiometrics = false,
                enableFadeTransitions = true,
                enableQrScanner = false
            )
        }
    }
    
    private fun initViews() {
        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        progressBar = findViewById(R.id.progressBar)
        
        // Swipe refresh setup
        swipeRefresh.isEnabled = appConfig?.pullToRefresh ?: true
        if (appConfig?.pullToRefresh == true) {
            swipeRefresh.setOnRefreshListener {
                webView.reload()
            }
            swipeRefresh.setColorSchemeColors(
                android.graphics.Color.parseColor(appConfig?.primaryColor ?: "#6366F1")
            )
        }
    }
    
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.apply {
            settings.apply {
                // Enable JavaScript
                javaScriptEnabled = true
                javaScriptCanOpenWindowsAutomatically = true
                
                // DOM Storage
                domStorageEnabled = true
                databaseEnabled = true
                
                // Smart Cache - use cache when offline
                cacheMode = if (isNetworkAvailable()) {
                    WebSettings.LOAD_DEFAULT
                } else {
                    WebSettings.LOAD_CACHE_ELSE_NETWORK
                }
                
                // Media
                mediaPlaybackRequiresUserGesture = false
                
                // Zoom
                setSupportZoom(true)
                builtInZoomControls = true
                displayZoomControls = false
                
                // Viewport
                useWideViewPort = true
                loadWithOverviewMode = true
                
                // File access
                allowFileAccess = true
                allowContentAccess = true
                
                // Mixed content
                mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                
                // Fonts
                textZoom = 100
                
                // User agent
                userAgentString = "$userAgentString AppWeaver/1.0"
            }
            
            // Add Javascript Interface Bridge
            addJavascriptInterface(WebAppInterface(this@MainActivity), "AndroidNativX")
            
            // Enable hardware acceleration
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            
            // WebView client
            webViewClient = AppWebViewClient()
            
            // Chrome client for file uploads and progress
            webChromeClient = AppWebChromeClient()
            
            // Download listener
            setDownloadListener { url, userAgent, contentDisposition, mimeType, contentLength ->
                downloadFile(url, contentDisposition, mimeType)
            }
        }
    }
    
    private fun initNativeSDKs() {
        val config = appConfig ?: return
        
        try {
            // 1. Initialize OneSignal
            if (!config.onesignalAppId.isNullOrEmpty()) {
                OneSignal.initWithContext(this, config.onesignalAppId)
                OneSignal.requestPermission(true, com.onesignal.Continue.none())
            }
            
            // 2. Initialize AdMob
            if (!config.admobAppId.isNullOrEmpty()) {
                MobileAds.initialize(this) {}
            }
            
            // Note: Google Play Billing usually requires custom merchant logic depending
            // on the exact structure of the products (subscriptions vs managed).
            // NativX Infinity Engine exposes NativePaywall interface via Javascript bridge.
            
        } catch (e: Exception) {
            e.printStackTrace()
            // SDKs might not be compiled if user didn't request them, creating NoClassDefFoundError.
            // This is expected and safe to catch since we inject dependencies conditionally.
        }
    }
    
    private fun setupLaunchers() {
        // File chooser launcher
        fileChooserLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            val uris = mutableListOf<Uri>()
            
            if (result.resultCode == RESULT_OK) {
                result.data?.let { intent ->
                    // Multiple files
                    intent.clipData?.let { clipData ->
                        for (i in 0 until clipData.itemCount) {
                            clipData.getItemAt(i).uri?.let { uris.add(it) }
                        }
                    }
                    // Single file
                    intent.data?.let { uris.add(it) }
                }
                
                // Camera capture
                if (uris.isEmpty() && cameraImageUri != null) {
                    uris.add(cameraImageUri!!)
                }
            }
            
            fileUploadCallback?.onReceiveValue(uris.toTypedArray())
            fileUploadCallback = null
        }
        
        // Camera launcher
        cameraLauncher = registerForActivityResult(
            ActivityResultContracts.TakePicture()
        ) { success ->
            val uris = if (success && cameraImageUri != null) {
                arrayOf(cameraImageUri!!)
            } else {
                emptyArray()
            }
            fileUploadCallback?.onReceiveValue(uris)
            fileUploadCallback = null
        }
        
        // Permission launcher
        permissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { permissions ->
            // Handle permissions result if needed
        }
    }
    
    private fun setupBackPressHandler() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }
    
    private fun loadApp() {
        if (isNetworkAvailable()) {
            webView.loadUrl(appConfig?.appUrl ?: "https://example.com")
        } else {
            loadOfflinePage()
        }
    }
    
    private fun loadOfflinePage() {
        webView.loadUrl("file:///android_asset/offline.html")
    }
    
    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
    
    private fun downloadFile(url: String, contentDisposition: String, mimeType: String) {
        try {
            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setMimeType(mimeType)
                addRequestHeader("User-Agent", webView.settings.userAgentString)
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                
                val fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                setTitle(fileName)
            }
            
            val downloadManager = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
            downloadManager.enqueue(request)
            
            Toast.makeText(this, "Download started", Toast.LENGTH_SHORT).show()
            
        } catch (e: Exception) {
            Toast.makeText(this, "Download failed: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
    
    private fun createImageFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val imageFileName = "JPEG_${timeStamp}_"
        val storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        return File.createTempFile(imageFileName, ".jpg", storageDir)
    }
    
    // WebView Client
    inner class AppWebViewClient : WebViewClient() {
        
        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
            super.onPageStarted(view, url, favicon)
            progressBar.visibility = View.VISIBLE
            
            // Seamless Page Transition: Hide WebView on start
            if (appConfig?.enableFadeTransitions == true) {
                view?.alpha = 0f
            }
        }
        
        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            progressBar.visibility = View.GONE
            swipeRefresh.isRefreshing = false
            keepSplashScreen = false
            
            // Seamless Page Transition: Fade in gracefully
            if (appConfig?.enableFadeTransitions == true && view != null) {
                ObjectAnimator.ofFloat(view, "alpha", 0f, 1f).apply {
                    duration = 300 // 300ms smooth native fade
                    start()
                }
            }
            
            // Inject NativX JS Helper
            view?.evaluateJavascript("""
                window.NativX = {
                    vibrate: function(type) { if(window.AndroidNativX) AndroidNativX.vibrate(type); },
                    share: function(url, title, text) { if(window.AndroidNativX) AndroidNativX.share(url, title, text); },
                    authenticate: function(title, subtitle, callback) { if(window.AndroidNativX) AndroidNativX.authenticate(title, subtitle, callback); }
                };
            """.trimIndent(), null)
        }
        
        override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?
        ) {
            super.onReceivedError(view, request, error)
            if (request?.isForMainFrame == true) {
                if (appConfig?.customOfflinePage == true) {
                    loadOfflinePage()
                } else {
                    // Default browser behavior
                }
            }
        }
        
        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            val url = request?.url?.toString() ?: return false
            
            // Handle external links
            return when {
                url.startsWith("tel:") || 
                url.startsWith("mailto:") || 
                url.startsWith("sms:") ||
                url.startsWith("whatsapp:") ||
                url.startsWith("intent:") -> {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    } catch (e: ActivityNotFoundException) {
                        Toast.makeText(this@MainActivity, "No app found to handle this action", Toast.LENGTH_SHORT).show()
                    }
                    true
                }
                else -> false
            }
        }
    }
    
    // Chrome Client
    inner class AppWebChromeClient : WebChromeClient() {
        
        override fun onProgressChanged(view: WebView?, newProgress: Int) {
            super.onProgressChanged(view, newProgress)
            progressBar.progress = newProgress
        }
        
        override fun onShowFileChooser(
            webView: WebView?,
            filePathCallback: ValueCallback<Array<Uri>>?,
            fileChooserParams: FileChooserParams?
        ): Boolean {
            fileUploadCallback?.onReceiveValue(null)
            fileUploadCallback = filePathCallback
            
            val acceptTypes = fileChooserParams?.acceptTypes ?: arrayOf("*/*")
            val isImageCapture = acceptTypes.any { it.startsWith("image/") }
            
            try {
                val chooserIntent = Intent(Intent.ACTION_CHOOSER)
                
                // Gallery intent
                val galleryIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = if (acceptTypes.isNotEmpty()) acceptTypes[0] else "*/*"
                    putExtra(Intent.EXTRA_ALLOW_MULTIPLE, fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE)
                }
                
                val intentList = mutableListOf<Intent>(galleryIntent)
                
                // Add camera intent for image capture
                if (isImageCapture && hasCameraPermission()) {
                    val imageFile = createImageFile()
                    cameraImageUri = FileProvider.getUriForFile(
                        this@MainActivity,
                        "${packageName}.fileprovider",
                        imageFile
                    )
                    
                    val cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                        putExtra(MediaStore.EXTRA_OUTPUT, cameraImageUri)
                    }
                    intentList.add(cameraIntent)
                }
                
                chooserIntent.putExtra(Intent.EXTRA_INTENT, galleryIntent)
                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentList.toTypedArray())
                
                fileChooserLauncher.launch(chooserIntent)
                
            } catch (e: Exception) {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = null
                return false
            }
            
            return true
        }
        
        override fun onGeolocationPermissionsShowPrompt(
            origin: String?,
            callback: GeolocationPermissions.Callback?
        ) {
            callback?.invoke(origin, true, false)
        }
        
        override fun onPermissionRequest(request: PermissionRequest?) {
            request?.grant(request.resources)
        }
    }
    
    private fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this, Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    // NativX JavaScript Bridge Interface
    inner class WebAppInterface(private val mContext: Context) {
        
        @JavascriptInterface
        fun vibrate(type: String) {
            if (appConfig?.enableHaptics != true) return
            
            try {
                val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vibratorManager = mContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                    vibratorManager.defaultVibrator
                } else {
                    @Suppress("DEPRECATION")
                    mContext.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                }

                if (!vibrator.hasVibrator()) return

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val effect = when (type.lowercase()) {
                        "light" -> VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK)
                        "medium" -> VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK)
                        "heavy" -> VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK)
                        "success" -> VibrationEffect.createPredefined(VibrationEffect.EFFECT_DOUBLE_CLICK)
                        else -> VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK)
                    }
                    vibrator.vibrate(effect)
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(50)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        
        @JavascriptInterface
        fun share(url: String, title: String?, text: String?) {
            if (appConfig?.enableNativeShare != true) return
            
            try {
                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    this.type = "text/plain"
                    putExtra(Intent.EXTRA_SUBJECT, title ?: "")
                    val shareText = if (!text.isNullOrEmpty()) "$text\n$url" else url
                    putExtra(Intent.EXTRA_TEXT, shareText)
                }
                
                mContext.startActivity(Intent.createChooser(shareIntent, "Share via..."))
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        
        @JavascriptInterface
        fun authenticate(title: String, subtitle: String?, callbackName: String) {
            if (appConfig?.enableBiometrics != true) return
            
            // Re-route to main thread because biometric prompt must launch from main thread
            Handler(Looper.getMainLooper()).post {
                val biometricManager = BiometricManager.from(this@MainActivity)
                val canAuthenticate = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL)
                
                if (canAuthenticate != BiometricManager.BIOMETRIC_SUCCESS) {
                    webView.evaluateJavascript("$callbackName(false)", null)
                    return@post
                }
                
                val executor = ContextCompat.getMainExecutor(this@MainActivity)
                val biometricPrompt = BiometricPrompt(this@MainActivity, executor,
                    object : BiometricPrompt.AuthenticationCallback() {
                        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                            super.onAuthenticationError(errorCode, errString)
                            webView.evaluateJavascript("$callbackName(false)", null)
                        }

                        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                            super.onAuthenticationSucceeded(result)
                            webView.evaluateJavascript("$callbackName(true)", null)
                        }

                        override fun onAuthenticationFailed() {
                            super.onAuthenticationFailed()
                            // Left empty on purpose; the prompt itself provides feedback on failure.
                        }
                    })

                val promptInfo = BiometricPrompt.PromptInfo.Builder()
                    .setTitle(title)
                    .setSubtitle(subtitle ?: "Verify your identity to proceed")
                    // If we support DEVICE_CREDENTIAL, we cannot set negative button text.
                    .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL)
                    .build()

                biometricPrompt.authenticate(promptInfo)
            }
        }
        
        @JavascriptInterface
        fun scanQrCode(callbackName: String) {
            if (appConfig?.enableQrScanner != true) {
                // Return immediately if disabled
                return
            }
            qrScannerCallbackName = callbackName
            
            val options = ScanOptions()
            options.setDesiredBarcodeFormats(ScanOptions.ALL_CODE_TYPES)
            options.setPrompt("Scan a QR code or Barcode")
            options.setCameraId(0)  // Use a specific camera of the device
            options.setBeepEnabled(true)
            options.setBarcodeImageEnabled(false)
            options.setOrientationLocked(false)
            
            qrScannerLauncher.launch(options)
        }
    }
    
    override fun onResume() {
        super.onResume()
        webView.onResume()
    }
    
    override fun onPause() {
        webView.onPause()
        super.onPause()
    }
    
    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}

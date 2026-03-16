'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Upload, Check, AlertCircle, Loader2, Apple, Smartphone, Bell, ShoppingBag, FileText, Share2, Vibrate, ScanFace, Sparkles, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';

// --- VISUAL ASSETS ---
const Aurora = ({ color, position }: { color: string, position: string }) => (
    <div className={`absolute ${position} w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none mix-blend-screen animate-pulse`} style={{ backgroundColor: color }} />
);

export default function BuildPage() {
    const [projectUrl, setProjectUrl] = useState('');
    const [appName, setAppName] = useState('');
    const [platform, setPlatform] = useState<'ios' | 'android' | 'both'>('ios');
    const [status, setStatus] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [isBuilding, setIsBuilding] = useState(false);
    const [downloadUrls, setDownloadUrls] = useState<{ apk?: string; source?: string } | null>(null);

    // Advanced feature states
    const [onesignalId, setOnesignalId] = useState('');
    const [admobAppId, setAdmobAppId] = useState('');
    const [admobAdUnitId, setAdmobAdUnitId] = useState('');
    const [googlePlayIds, setGooglePlayIds] = useState('');
    const [nativePaywall, setNativePaywall] = useState(false);
    
    // JS Bridge & UX Enhancements
    const [enableHaptics, setEnableHaptics] = useState(false);
    const [enableNativeShare, setEnableNativeShare] = useState(false);
    const [enableBiometrics, setEnableBiometrics] = useState(false);
    const [enableFadeTransitions, setEnableFadeTransitions] = useState(true);
    const [enableQrScanner, setEnableQrScanner] = useState(false);

    // Simulated Log Stream
    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-8));
    };

    const { user, profile, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    const startBuild = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        setIsBuilding(true);
        setStatus('initializing');
        setLogs([]);
        addLog(`Initializing NativX Engine for ${platform.toUpperCase()}...`);
        addLog(`Target: ${appName} (${projectUrl})`);

        try {
            // Construct FormData for the request
            const formData = new FormData();
            formData.append('app_name', appName);
            formData.append('package_name', `com.nativx.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
            formData.append('app_url', projectUrl);
            formData.append('platform', platform);
            formData.append('primary_color', '#6366F1');
            formData.append('secondary_color', '#8B5CF6');
            formData.append('tier', profile?.tier || 'free'); 
            
            // Append advanced options if they exist
            if(onesignalId) formData.append('onesignal_app_id', onesignalId);
            if(admobAppId) formData.append('admob_app_id', admobAppId);
            if(admobAdUnitId) formData.append('admob_ad_unit_id', admobAdUnitId);
            if(googlePlayIds) formData.append('google_play_ids', googlePlayIds);
            formData.append('native_paywall', nativePaywall.toString());
            
            // UX Enhancements 
            formData.append('enable_haptics', enableHaptics.toString());
            formData.append('enable_native_share', enableNativeShare.toString());
            formData.append('enable_biometrics', enableBiometrics.toString());
            formData.append('enable_fade_transitions', enableFadeTransitions.toString());
            formData.append('enable_qr_scanner', enableQrScanner.toString());

            // Get the file input element to check for icon
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput && fileInput.files && fileInput.files[0]) {
                formData.append('app_icon', fileInput.files[0]);
                addLog('Icon file attached.');
            }

            // Call the Backend API via apiClient
            const data = await apiClient.request('/api/build/with-icon', {
                method: 'POST',
                body: formData,
            });

            const projectId = data.project_id;
            addLog(`Build initialized. ID: ${projectId}`);
            setStatus('building');

            // Start Polling via recursive function or interval
            const pollStatus = async () => {
                try {
                    const statusData = await apiClient.request(`/api/build/${projectId}`);

                    if (statusData.status === 'queued') {
                        addLog('Build queued in worker pool...');
                        setTimeout(pollStatus, 2000);
                    } else if (statusData.status === 'building') {
                        // Fetch real logs from server
                        try {
                            const logsData = await apiClient.request(`/api/build/${projectId}/logs`);
                            const logLines = (logsData.logs || '').split('\n').filter((l: string) => l.trim());
                            const lastLog = logLines[logLines.length - 1] || 'Compiling...';
                            addLog(lastLog.substring(0, 80)); // Truncate long lines
                        } catch {
                            addLog('Engine is compiling artifacts...');
                        }
                        setTimeout(pollStatus, 3000);
                    } else if (statusData.status === 'success') {
                        setStatus('success');
                        addLog('Build Successful via NativX Cloud.');
                        setIsBuilding(false);
                        // Save download URLs
                        setDownloadUrls({
                            apk: statusData.android_apk_url,
                            source: statusData.android_apk_url?.replace('app-release.apk', 'project-source.zip')
                        });
                    } else if (statusData.status === 'failed') {
                        setStatus('error');
                        addLog(`Build Failed: ${statusData.error || 'Unknown error'}`);
                        setIsBuilding(false);
                    } else {
                        setTimeout(pollStatus, 2000);
                    }
                } catch (e) {
                    addLog(`Polling Error: ${(e as Error).message}`);
                    setIsBuilding(false);
                }
            };

            // Kick off polling
            setTimeout(pollStatus, 1000);

        } catch (err: any) {
            addLog(`Error: ${err.message}`);
            setStatus('error');
            setIsBuilding(false);
        }
    };

    const canDownloadSource = profile?.tier === 'founder' || profile?.tier === 'tycoon';

    // Authenticated download function
    const handleDownload = async (url: string, filename: string) => {
        try {
            const token = apiClient.getToken();
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error('Download error:', err);
            addLog(`Download failed: ${(err as Error).message}`);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-sans selection:bg-violet-500/30">
            {/* Background Atmosphere */}
            <Aurora color="#4c1d95" position="top-[-100px] left-[-100px]" />
            <Aurora color="#2563eb" position="bottom-[-100px] right-[-100px]" />

            {/* Header */}
            <header className="w-full p-6 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-md z-20">
                <Link href="/" className="text-xl font-bold tracking-tight">NativX <span className="text-violet-500">Console</span></Link>
                <div className="flex items-center gap-6 text-xs font-mono">
                    {user && (
                        <div className="hidden md:block text-zinc-500">
                            {user.email}
                        </div>
                    )}
                    <Link href="/#pricing">
                        <button className="px-3 py-1 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-full hover:bg-violet-600/30 transition-colors flex items-center gap-2">
                            <span>+ BUY CREDITS</span>
                        </button>
                    </Link>
                    {profile && (
                        <div className="px-3 py-1 bg-white/10 rounded-full text-white border border-white/10">
                            CREDITS: <span className="text-violet-400 font-bold">{profile.credits}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-12 relative z-10 flex flex-col md:flex-row gap-12">

                {/* Left Column: The Ignite Form */}
                <div className="flex-1 max-w-xl flex flex-col justify-center">
                    <div className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Deploy.</h1>
                        <p className="text-zinc-500 text-lg">Configure your native release in one step.</p>
                    </div>

                    <form onSubmit={startBuild} className="space-y-6">

                        {/* 1. App URL */}
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider ml-1">Web App URL</label>
                            <input
                                type="url"
                                placeholder="https://your-project.com"
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all font-mono"
                                value={projectUrl}
                                onChange={(e) => setProjectUrl(e.target.value)}
                                required
                            />
                        </div>

                        {/* 2. App Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider ml-1">App Name</label>
                            <input
                                type="text"
                                placeholder="My Awesome SaaS"
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                                value={appName}
                                onChange={(e) => setAppName(e.target.value)}
                                required
                            />
                        </div>

                        {/* 3. Platform & Icon Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Platform Select */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider ml-1">Platform</label>
                                <div className="flex bg-zinc-900/50 border border-white/10 rounded-xl p-1">
                                    <button
                                        type="button"
                                        onClick={() => setPlatform('ios')}
                                        className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${platform === 'ios' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        <Apple className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPlatform('android')}
                                        className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all ${platform === 'android' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        <Smartphone className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Icon Upload (Visual) */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider ml-1">Icon</label>
                                <div className="w-full h-[54px] bg-zinc-900/50 border border-white/10 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/5 hover:border-violet-500/50 transition-all group relative overflow-hidden">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                    <div className="flex items-center gap-2 text-zinc-500 group-hover:text-violet-400">
                                        <Upload className="w-4 h-4" />
                                        <span className="text-xs">Upload PNG</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- Advanced Options --- */}
                        <div className="space-y-4 pt-2">
                            {/* Push Notifications Card */}
                            <div className="p-4 rounded-xl border border-white/5 bg-zinc-950 flex flex-col gap-3 group hover:border-violet-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-violet-400" />
                                    <h4 className="font-bold text-white text-sm">Push Notifications</h4>
                                    <span className="text-[10px] font-bold bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">OneSignal</span>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 
                                    value={onesignalId}
                                    onChange={(e) => setOnesignalId(e.target.value)}
                                    className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-violet-500/50 focus:bg-zinc-900/50 transition-all font-mono"
                                />
                                <p className="text-[10px] text-zinc-500 font-bold">Optional. Get your App ID free at <a href="https://onesignal.com" target="_blank" className="text-violet-400 hover:underline">onesignal.com</a></p>
                            </div>

                            {/* Rewarded Video Ads Card */}
                            <div className="p-4 rounded-xl border border-white/5 bg-zinc-950 flex flex-col gap-3 group hover:border-amber-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-amber-400" />
                                    <h4 className="font-bold text-white text-sm">Rewarded Video Ads</h4>
                                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">AdMob</span>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="AdMob App ID (ca-app-pub-xxxxx~xxxxx)" 
                                    value={admobAppId}
                                    onChange={(e) => setAdmobAppId(e.target.value)}
                                    className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-amber-500/50 focus:bg-zinc-900/50 transition-all font-mono"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Rewarded Ad Unit ID (ca-app-pub-xxxxx/xxxxx)" 
                                    value={admobAdUnitId}
                                    onChange={(e) => setAdmobAdUnitId(e.target.value)}
                                    className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-amber-500/50 focus:bg-zinc-900/50 transition-all font-mono"
                                />
                                <p className="text-[10px] text-zinc-500 font-bold">Optional. Get your IDs from <a href="https://admob.google.com" target="_blank" className="text-amber-500 hover:underline">admob.google.com</a></p>
                            </div>

                            {/* In-App Purchases Card */}
                            <div className="p-4 rounded-xl border border-white/5 bg-zinc-950 flex flex-col gap-3 group hover:border-emerald-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <ShoppingBag className="w-5 h-5 text-emerald-400" />
                                    <h4 className="font-bold text-white text-sm">In-App Purchases</h4>
                                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Google Play</span>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="product_id_1, product_id_2, subscription_monthly" 
                                    value={googlePlayIds}
                                    onChange={(e) => setGooglePlayIds(e.target.value)}
                                    className="w-full bg-black border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-emerald-500/50 focus:bg-zinc-900/50 transition-all font-mono"
                                />
                                <p className="text-[10px] text-zinc-500 font-bold">Optional. Comma-separated product IDs from Google Play Console.</p>
                            </div>

                            {/* Native Paywall Screen Card */}
                            <div className="p-4 rounded-xl border border-white/5 bg-zinc-950 flex items-center justify-between gap-3 group hover:border-pink-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-pink-400" />
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Native Paywall Screen</h4>
                                        <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Show upgrade screen via JavaScript</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setNativePaywall(!nativePaywall)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${nativePaywall ? 'bg-pink-500' : 'bg-zinc-800 border border-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${nativePaywall ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Enable UI Haptics Card */}
                            <div className="p-4 rounded-xl border border-white/5 bg-zinc-950 flex items-center justify-between gap-3 group hover:border-blue-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <Vibrate className="w-5 h-5 text-blue-400" />
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Haptic Feedback</h4>
                                        <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Vibrate phone via JS bridging</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setEnableHaptics(!enableHaptics)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${enableHaptics ? 'bg-blue-500' : 'bg-zinc-800 border border-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${enableHaptics ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Native Share Sheet Card */}
                            <div className="p-4 rounded-xl border border-white/5 bg-zinc-950 flex items-center justify-between gap-3 group hover:border-cyan-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <Share2 className="w-5 h-5 text-cyan-400" />
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Native Share Sheet</h4>
                                        <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Open OS share drawer via JS</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setEnableNativeShare(!enableNativeShare)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${enableNativeShare ? 'bg-cyan-500' : 'bg-zinc-800 border border-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${enableNativeShare ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Biometric Face/Touch ID Card */}
                            <div className="p-4 rounded-xl border border-white/5 bg-zinc-950 flex items-center justify-between gap-3 group hover:border-violet-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <ScanFace className="w-5 h-5 text-violet-400" />
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Biometric Face/Touch ID</h4>
                                        <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Prompt OS scanner via JS Bridge</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setEnableBiometrics(!enableBiometrics)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${enableBiometrics ? 'bg-violet-500' : 'bg-zinc-800 border border-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${enableBiometrics ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Seamless Native Transitions Card */}
                            <div className="p-4 rounded-xl border border-white/5 bg-zinc-950 flex items-center justify-between gap-3 group hover:border-indigo-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Native Fade Transitions</h4>
                                        <p className="text-[10px] text-zinc-500 font-bold mt-0.5">Eliminates WebView white-flash</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setEnableFadeTransitions(!enableFadeTransitions)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${enableFadeTransitions ? 'bg-indigo-500' : 'bg-zinc-800 border border-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${enableFadeTransitions ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Native QR Code Scanner Card */}
                            <div className="p-4 rounded-xl border border-white/5 bg-zinc-950 flex items-center justify-between gap-3 group hover:border-rose-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <QrCode className="w-5 h-5 text-rose-400" />
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Native QR Scanner</h4>
                                        <p className="text-[10px] text-zinc-500 font-bold mt-0.5">High performance native scanning</p>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setEnableQrScanner(!enableQrScanner)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${enableQrScanner ? 'bg-rose-500' : 'bg-zinc-800 border border-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${enableQrScanner ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isBuilding}
                                className="w-full bg-white text-black py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isBuilding ? <Loader2 className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5" />}
                                <span>INITIALIZE BUILD</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Column: Console Output & Status */}
                <div className="flex-1 w-full flex flex-col gap-6 justify-center">
                    {/* Phone Preview / Success State */}
                    <div className="flex-1 min-h-[400px] bg-black border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                            </div>
                            <div className="font-mono text-xs text-zinc-600">Trace Logs</div>
                        </div>

                        <div className="flex-1 font-mono text-sm space-y-3 overflow-y-auto">
                            {logs.length === 0 && !isBuilding && (
                                <div className="h-full flex flex-col items-center justify-center">
                                    {projectUrl ? (
                                        /* Live Preview Mode */
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            {/* Mobile Frame */}
                                            <div className="relative w-[280px] h-[560px] bg-zinc-900 rounded-[40px] p-2 shadow-2xl border-4 border-zinc-800">
                                                {/* Notch */}
                                                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
                                                {/* Screen */}
                                                <div className="w-full h-full rounded-[32px] overflow-hidden bg-white relative">
                                                    <iframe
                                                        src={projectUrl}
                                                        className="w-full h-full border-0"
                                                        sandbox="allow-scripts allow-same-origin allow-forms"
                                                        title="App Preview"
                                                    />
                                                    {/* Overlay for iframe protection */}
                                                    <div className="absolute inset-0 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                                <span className="text-xs text-zinc-600 font-mono bg-zinc-900/80 px-3 py-1 rounded-full">📱 Live Preview</span>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Default Placeholder */
                                        <div className="flex flex-col items-center justify-center text-zinc-800 gap-4">
                                            <div className="w-16 h-16 rounded-full border-2 border-zinc-800 border-dashed animate-[spin_10s_linear_infinite]" />
                                            <p>Enter a URL to preview...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {logs.map((log, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-zinc-400 flex gap-3"
                                >
                                    <span className="text-violet-500/50">➜</span>
                                    <span>{log}</span>
                                </motion.div>
                            ))}

                            {status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-8 space-y-4"
                                >
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-4">
                                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                            <Check className="w-5 h-5 text-green-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold">Build Successful</h4>
                                            <p className="text-green-400 text-xs">Artifacts ready for deployment</p>
                                        </div>
                                    </div>

                                    {/* APK Download Section */}
                                    {downloadUrls?.apk && (
                                        <div className="p-4 rounded-xl border bg-violet-900/20 border-violet-500/30 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-violet-500/20 rounded-lg">
                                                    <Smartphone className="w-5 h-5 text-violet-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">Android APK</h4>
                                                    <p className="text-[10px] text-zinc-500">Ready to install on device</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => downloadUrls.apk && handleDownload(downloadUrls.apk, 'app-release.apk')}
                                                className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-500 transition-colors"
                                            >
                                                DOWNLOAD APK
                                            </button>
                                        </div>
                                    )}

                                    {/* Source Code Download Section */}
                                    <div className={`p-4 rounded-xl border flex items-center justify-between ${canDownloadSource ? 'bg-zinc-900 border-white/10' : 'bg-red-900/10 border-red-500/20 opacity-75'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/5 rounded-lg">
                                                <Upload className="w-5 h-5 text-zinc-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">Source Code</h4>
                                                <p className="text-[10px] text-zinc-500">Full React Native Project (ZIP)</p>
                                            </div>
                                        </div>
                                        {canDownloadSource ? (
                                            <button
                                                onClick={() => downloadUrls?.source && handleDownload(downloadUrls.source, 'project-source.zip')}
                                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${downloadUrls?.source ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'}`}
                                            >
                                                DOWNLOAD
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-red-400" />
                                                <span className="text-xs font-mono text-red-400">LOCKED (TIER 1)</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

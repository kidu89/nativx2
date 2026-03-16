'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Smartphone, Check, WifiOff, Fingerprint, Globe, Github, Lock } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

// --- VISUAL ASSETS (CSS AURORAS) ---
const Aurora = ({ color, position }: { color: string, position: string }) => (
    <div className={`absolute ${position} w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 pointer-events-none mix-blend-screen animate-pulse`} style={{ backgroundColor: color }} />
);

// --- COMPONENTS ---

// 1. HERO: THE INSTANT ALCHEMY
const Hero = () => {
    const [status, setStatus] = useState<'browser' | 'phone'>('browser');

    // AUTO-ANIMATION LOOP
    React.useEffect(() => {
        const interval = setInterval(() => {
            setStatus(prev => prev === 'browser' ? 'phone' : 'browser');
        }, 4000); // Toggle every 4 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="min-h-screen w-full flex flex-col items-center pt-32 relative overflow-hidden z-20 pb-32">
            {/* Background Atmosphere */}
            <Aurora color="#4c1d95" position="top-[-100px] left-[-100px]" />
            <Aurora color="#2563eb" position="bottom-[-100px] right-[-100px]" />

            <div className={`flex flex-col items-center gap-6 mb-12 transition-all duration-1000`}>
                <div className="text-center space-y-4 max-w-2xl px-4">
                    <h1 className="text-5xl md:text-7xl font-bold text-white text-center tracking-tighter shadow-black drop-shadow-2xl">
                        Your Website.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">Now Native.</span>
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed">
                        The automated factory that physically transforms your web codebase into a signed, binary App Store release.
                    </p>
                </div>

                {/* STATUS INDICATOR */}
                <div className="flex items-center gap-4 mt-8 font-mono text-[10px] tracking-[0.2em] uppercase">
                    <span className={`transition-colors duration-500 ${status === 'browser' ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-zinc-700'}`}>
                        Your Website
                    </span>
                    <div className="w-16 h-px bg-zinc-800 relative overflow-hidden">
                        <motion.div
                            animate={{ x: status === 'browser' ? '-100%' : '100%' }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500 to-transparent w-full h-full opacity-50"
                        />
                    </div>
                    <span className={`transition-colors duration-500 ${status === 'phone' ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-zinc-700'}`}>
                        Your Native App
                    </span>
                </div>
            </div>

            <LayoutGroup>
                <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    className={`relative bg-zinc-900 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden
                        ${status === 'browser'
                            ? 'w-[90%] max-w-4xl h-[500px] rounded-xl'
                            : 'w-[340px] h-[680px] rounded-[48px] border-[8px] border-[#1a1a1a]'
                        }
                    `}
                >
                    {/* BROWSER CONTENT */}
                    <AnimatePresence mode='wait'>
                        {status === 'browser' && (
                            <motion.div
                                key="browser-content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full flex flex-col"
                            >
                                {/* Browser Bar */}
                                <div className="h-12 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                    </div>
                                    <div className="ml-4 flex-1 h-8 bg-black/20 rounded flex items-center px-4 text-zinc-500 text-sm font-mono">
                                        https://your-awesome-saas.com
                                    </div>
                                </div>

                                {/* Placeholder Content */}
                                <div className="flex-1 flex flex-col items-center justify-center gap-8 p-12">
                                    <div className="w-full h-48 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center text-zinc-700 text-sm font-mono">
                                        Hero Banner Image
                                    </div>
                                    <div className="w-full space-y-4">
                                        <div className="h-4 w-3/4 bg-white/5 rounded" />
                                        <div className="h-4 w-1/2 bg-white/5 rounded" />
                                        <div className="h-4 w-full bg-white/5 rounded" />
                                    </div>
                                    <div className="w-full grid grid-cols-3 gap-4 mt-8">
                                        <div className="aspect-square bg-white/5 rounded border border-white/5" />
                                        <div className="aspect-square bg-white/5 rounded border border-white/5" />
                                        <div className="aspect-square bg-white/5 rounded border border-white/5" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* PHONE CONTENT */}
                    <AnimatePresence mode='wait'>
                        {status === 'phone' && (
                            <motion.div
                                key="phone-content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="w-full h-full bg-black flex flex-col relative"
                            >
                                {/* Dynamic Island */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black z-30 rounded-full" />

                                {/* Status Bar */}
                                <div className="h-12 w-full flex items-end justify-between px-6 pb-2 text-white text-[10px] font-medium">
                                    <span>12:00</span>
                                    <div className="flex gap-1">
                                        <WifiOff className="w-3 h-3" />
                                        <div className="w-4 h-2 bg-white rounded-[2px]" />
                                    </div>
                                </div>

                                {/* App UI */}
                                <div className="flex-1 bg-zinc-900 rounded-t-3xl p-6 relative overflow-hidden border-t border-white/10">
                                    <div className="w-full h-40 bg-zinc-800/50 rounded-xl mb-6 flex items-center justify-center text-zinc-600 text-[10px] font-mono border border-white/5">
                                        Hero Banner Image
                                    </div>

                                    <div className="space-y-3 mb-8">
                                        <div className="h-3 w-1/2 bg-zinc-800 rounded-full" />
                                        <div className="h-3 w-3/4 bg-zinc-800 rounded-full" />
                                        <div className="h-3 w-full bg-zinc-800 rounded-full" />
                                    </div>

                                    <div className="w-full h-32 bg-zinc-800/30 rounded-xl border border-white/5 p-4">
                                        <div className="w-8 h-8 rounded bg-zinc-700 mb-3" />
                                        <div className="h-2 w-24 bg-zinc-700 rounded-full mb-2" />
                                        <div className="h-2 w-16 bg-zinc-700 rounded-full" />
                                    </div>

                                    {/* Fake Tab Bar */}
                                    <div className="absolute bottom-0 left-0 w-full h-16 bg-black/80 backdrop-blur-md border-t border-white/10 flex justify-around items-center px-4">
                                        <div className="p-2 rounded-full bg-blue-500/20 text-blue-400"><Globe className="w-5 h-5" /></div>
                                        <div className="p-2 text-zinc-600"><Sparkles className="w-5 h-5" /></div>
                                        <div className="p-2 text-zinc-600"><Fingerprint className="w-5 h-5" /></div>
                                        <div className="p-2 text-zinc-600"><Lock className="w-5 h-5" /></div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </LayoutGroup>
        </section>
    );
};

// 2. HOW IT WORKS SECTION
const FeatureCard = ({ number, icon: Icon, title, description }: any) => (
    <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl relative overflow-hidden group hover:bg-zinc-900 transition-colors">
        <div className="absolute top-8 right-8 text-zinc-800 font-mono text-xs opacity-50">{number}</div>
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-500">
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
    </div>
);

const HowItWorks = () => (
    <section id="how-it-works" className="py-32 px-6 border-t border-white/5 bg-black z-20 relative">
        <div className="max-w-7xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                How the machine works.
            </h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-16">
                <p className="text-zinc-500 text-lg max-w-md">
                    We do not &quot;embed&quot; your site. We generate a native compiled shell that runs a dedicated WKWebView instance with bridge access to Camera, Bluetooth, and Gyroscope hardware.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            <FeatureCard
                number="01"
                icon={Globe}
                title="Manifest Analysis"
                description="Our engine parses your PWA manifest.json to extract assets, colors, and routing logic. No manual configuration needed."
            />
            <FeatureCard
                number="02"
                icon={Zap}
                title="Native Injection"
                description="We generate real Swift (iOS) and Kotlin (Android) codebases wrapping your URL throughout a Native JavaScript Bridge."
            />
            <FeatureCard
                number="03"
                icon={Lock}
                title="Cloud Signing"
                description="The binaries are compiled on secure M2 Pro Runners, signed with your certificates, and uploaded directly to TestFlight."
            />
        </div>
    </section>
);

// 3. CORE TECHNOLOGY
const CoreTechnology = () => (
    <section id="core-technology" className="py-32 px-6 border-t border-white/5 bg-black z-20 relative">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6">
                {/* LARGE CARD */}
                <div className="w-full md:w-1/2 bg-zinc-900/30 border border-white/5 p-8 md:p-12 rounded-3xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-transparent pointer-events-none" />
                    <div className="text-blue-400 text-xs font-mono mb-6 uppercase tracking-widest">Core Technology</div>
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Hardened Runtime</h3>
                    <p className="text-zinc-400 leading-relaxed mb-12 max-w-md">
                        Your app runs on a stripped-down, performance-optimized browser kernel. 60fps scrolling, native gestures, and zero layout shift.
                    </p>
                    <div className="flex gap-4">
                        <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-mono text-zinc-300">Rust-backed CLI</div>
                        <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-mono text-zinc-300">Parallel Builds</div>
                    </div>
                </div>

                {/* STATS CARDS */}
                <div className="w-full md:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black border border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center hover:border-zinc-700 transition-colors">
                        <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-white">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div className="text-4xl font-bold text-white mb-2">100%</div>
                        <div className="text-zinc-500 text-xs uppercase tracking-wider">Native APIs Supported</div>
                    </div>
                    <div className="bg-black border border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center hover:border-zinc-700 transition-colors">
                        <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-yellow-400">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div className="text-4xl font-bold text-white mb-2">5m</div>
                        <div className="text-zinc-500 text-xs uppercase tracking-wider">Average Build Time</div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

// 2. THE OFFER: CHARACTER SELECT (Retained)
const MenuItem = ({ title, price, features, recommended, type, onClick }: { title: string, price: string, features: string[], recommended?: boolean, type: string, onClick?: () => void }) => (
    <motion.div
        whileHover={{ y: -10 }}
        className={`relative p-8 rounded-3xl border ${recommended ? 'border-violet-500 bg-violet-900/10' : 'border-white/10 bg-zinc-900/50'} flex flex-col h-full`}
    >
        {recommended && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-violet-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                Most Popular
            </div>
        )}
        <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{price}</span>
            </div>
        </div>
        <ul className="space-y-4 mb-8 flex-1">
            {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-400 text-sm">
                    <Check className={`w-4 h-4 ${recommended ? 'text-violet-400' : 'text-zinc-600'}`} />
                    {f}
                </li>
            ))}
        </ul>
        <button
            onClick={onClick}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${recommended ? 'bg-white text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-white hover:bg-white/10'}`}
        >
            {type === 'prototype' ? 'Start Building' : 'Buy Credits'} <ArrowRight className="w-4 h-4" />
        </button>
    </motion.div>
);

const Menu = () => {
    const { error: toastError } = useToast();
    const { user } = useAuth();
    const router = useRouter();

    const handleCheckout = async (tier: string) => {
        // Require Login for purchases
        if (!user && tier !== 'hobbyist') {
            router.push('/signup');
            return;
        }
        // If user clicks "Hobbyist", just go to signup
        if (tier === 'hobbyist') {
            window.location.href = '/signup';
            return;
        }

        try {
            // Call our API to create a checkout session
            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tier,
                    email: user?.email,
                    userId: user?.id
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toastError('Error starting checkout: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            toastError('Failed to connect to payment provider.');
        }
    };

    return (
        <section id="pricing" className="min-h-screen bg-black relative z-20 flex flex-col justify-center border-t border-white/5">
            {/* Background Glow */}
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-violet-900/10 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="mb-20 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
                        Invest in <span className="text-violet-500">Velocity</span>.
                    </h2>
                    <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
                        Stop burning hours on manual builds. Choose the engine power that fits your scale.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <MenuItem
                        title="PROTOTYPE"
                        price="$29"
                        type="prototype"
                        features={['1 Build Credit', 'Binary Only (APK/IPA)', 'Android & iOS Support']}
                        onClick={() => handleCheckout('prototype')}
                    />
                    <MenuItem
                        title="FOUNDER"
                        price="$69"
                        type="founder"
                        recommended
                        features={['3 Build Credits', 'Full Source Code (ZIP)', 'Priority Email Support', 'Advanced Debugging', 'TestFlight Ready']}
                        onClick={() => handleCheckout('founder')}
                    />
                    <MenuItem
                        title="AGENCY"
                        price="$199"
                        type="tycoon"
                        features={['10 Build Credits', 'Full Source Code (ZIP)', 'Priority Email Support', 'Commercial License']}
                        onClick={() => handleCheckout('tycoon')}
                    />
                </div>
            </div>
        </section>
    );
};

// --- MAIN PAGE ---
export default function LandingPage() {
    return (
        <main className="bg-black text-white selection:bg-violet-500 selection:text-white overflow-x-hidden relative">
            <Navbar />
            <Hero />
            <HowItWorks />
            <CoreTechnology />
            <Menu />
            <Footer />

            <div className="fixed bottom-8 right-8 z-50">
                <StickyButton />
            </div>
        </main>
    );
}

function StickyButton() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <button className="bg-zinc-800 text-zinc-500 px-6 py-2 rounded-full font-bold tracking-tight cursor-wait flex items-center gap-2 shadow-lg">
                <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
                <span>Connecting...</span>
            </button>
        );
    }

    if (user) {
        return (
            <Link href="/build">
                <button className="bg-violet-600 text-white px-6 py-2 rounded-full font-bold tracking-tight hover:scale-105 transition-transform shadow-[0_0_20px_rgba(124,58,237,0.4)] flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-white" /> Go to Console
                </button>
            </Link>
        );
    }

    return (
        <Link href="/signup">
            <button className="bg-white text-black px-6 py-2 rounded-full font-bold tracking-tight hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Deploy
            </button>
        </Link>
    );
}

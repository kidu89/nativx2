'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';
import { Smartphone, Globe, Lock, Battery, Wifi, Signal } from 'lucide-react';
import { SpotlightCard } from '@/components/SpotlightCard';

export const ProductDemo = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    // Transform dimensions: Desktop (1200px) -> Mobile (390px)
    const width = useTransform(smoothProgress, [0.2, 0.8], ["100%", "390px"]);
    const height = useTransform(smoothProgress, [0.2, 0.8], ["600px", "844px"]);
    const borderRadius = useTransform(smoothProgress, [0.2, 0.8], [12, 48]);
    const uiOpacity = useTransform(smoothProgress, [0.2, 0.3], [1, 0]); // Fade out desktop UI
    const mobileUiOpacity = useTransform(smoothProgress, [0.7, 0.8], [0, 1]); // Fade in mobile UI

    // Header transformation
    const addressBarWidth = useTransform(smoothProgress, [0.2, 0.8], ["100%", "30%"]);
    const addressBarY = useTransform(smoothProgress, [0.2, 0.8], [0, 10]);

    return (
        <div ref={containerRef} className="h-[300vh] relative z-20">
            <div className="sticky top-[10vh] border-t border-b border-white/5 py-24 bg-black/50 backdrop-blur-sm overflow-hidden flex items-center justify-center min-h-screen">

                {/* The Transforming Device */}
                <motion.div
                    style={{ width, height, borderRadius }}
                    className="relative bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden will-change-transform"
                >
                    {/* BROWSER CHROME (Simulated Safari) */}
                    <div className="absolute top-0 left-0 right-0 h-14 bg-white/5 border-b border-white/5 flex items-center px-4 gap-4 z-20">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                        <motion.div
                            style={{ width: addressBarWidth, y: addressBarY }}
                            className="bg-black/50 h-8 rounded-lg flex items-center justify-center gap-2 px-4 mx-auto"
                        >
                            <Lock className="w-3 h-3 text-neutral-500" />
                            <span className="text-xs font-mono text-neutral-500">appweaver.infinity.io</span>
                        </motion.div>
                        {/* Mobile Status Bar - hidden initially, visible at end */}
                        <motion.div style={{ opacity: mobileUiOpacity }} className="absolute top-0 left-0 right-0 h-full flex justify-between px-6 items-center">
                            <span className="text-xs font-bold text-white">9:41</span>
                            <div className="flex gap-1.5 items-center">
                                <Signal className="w-3 h-3 text-white" />
                                <Wifi className="w-3 h-3 text-white" />
                                <Battery className="w-4 h-4 text-white" />
                            </div>
                        </motion.div>
                    </div>

                    {/* CONTENT CONTAINER */}
                    <div className="p-4 mt-14 h-full relative">
                        {/* DESKTOP CONTENT VIEW */}
                        <motion.div style={{ opacity: uiOpacity }} className="absolute inset-0 pt-16 px-8">
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-3 h-64 bg-white/5 rounded-xl border border-white/5 animate-pulse" />
                                <div className="col-span-9 space-y-4">
                                    <div className="h-32 bg-indigo-500/10 rounded-xl border border-indigo-500/20" />
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                                        <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                                        <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* MOBILE CONTENT VIEW */}
                        <motion.div style={{ opacity: mobileUiOpacity }} className="absolute inset-0 pt-20 px-4 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]" />
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 mb-8">Welcome Back</h3>

                            <div className="w-full space-y-4">
                                <div className="h-16 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10" />
                                    <div className="flex-1 h-2 bg-white/10 rounded-full" />
                                </div>
                                <div className="h-16 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10" />
                                    <div className="flex-1 h-2 bg-white/10 rounded-full" />
                                </div>
                                <div className="h-16 bg-white/5 rounded-xl border border-white/10 flex items-center px-4 gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10" />
                                    <div className="flex-1 h-2 bg-white/10 rounded-full" />
                                </div>
                            </div>

                            {/* Native Tab Bar */}
                            <div className="absolute bottom-6 left-6 right-6 h-16 bg-neutral-900/90 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-around px-2">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white/80 rounded-[2px]" />
                                </div>
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-white/30 rounded-full" />
                                </div>
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-white/30 rounded-[2px]" />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* REFLECTION GLOSS */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />
                </motion.div>

                {/* EXPLANATORY TEXT (Fades in/out) */}
                <div className="absolute top-1/2 -translate-y-1/2 left-8 md:left-24 text-left pointer-events-none mix-blend-difference">
                    <motion.div style={{ opacity: useTransform(smoothProgress, [0.1, 0.3], [1, 0]) }}>
                        <span className="text-neon-blue font-mono text-sm tracking-wider">INPUT SOURCE</span>
                        <h2 className="text-5xl font-black text-white mt-2">Your Existing<br />Web Stack.</h2>
                    </motion.div>
                </div>

                <div className="absolute top-1/2 -translate-y-1/2 right-8 md:right-24 text-right pointer-events-none mix-blend-difference">
                    <motion.div style={{ opacity: useTransform(smoothProgress, [0.7, 0.9], [0, 1]) }}>
                        <span className="text-green-400 font-mono text-sm tracking-wider">COMPILED OUTPUT</span>
                        <h2 className="text-5xl font-black text-white mt-2">Native iOS<br />& Android.</h2>
                    </motion.div>
                </div>

            </div>
        </div>
    );
};

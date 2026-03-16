'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export const Metamorphosis = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    // TRANSFORMATION PHYSICS
    const width = useTransform(smoothProgress, [0.1, 0.8], ["100%", "390px"]);
    const height = useTransform(smoothProgress, [0.1, 0.8], ["600px", "844px"]);
    const borderRadius = useTransform(smoothProgress, [0.1, 0.8], [12, 56]);
    const borderThickness = useTransform(smoothProgress, [0.1, 0.8], [1, 8]); // Thicker border for phone chassis

    // Internal Elements
    const headerOpacity = useTransform(smoothProgress, [0.1, 0.2], [1, 0]);
    const notchOpacity = useTransform(smoothProgress, [0.7, 0.8], [0, 1]);
    const appShadow = useTransform(smoothProgress, [0.1, 0.8],
        ["0px 4px 20px rgba(0,0,0,0.05)", "0px 30px 60px -10px rgba(0,0,0,0.2)"]
    );

    return (
        <div ref={containerRef} className="h-[250vh] relative z-20 bg-gradient-to-b from-white to-zinc-50">
            <div className="sticky top-[10vh] border-b border-zinc-100/0 overflow-hidden flex items-center justify-center min-h-screen">

                {/* THE DEVICE */}
                <motion.div
                    style={{
                        width,
                        height,
                        borderRadius,
                        borderWidth: borderThickness,
                        boxShadow: appShadow
                    }}
                    className="relative bg-white border-zinc-200 overflow-hidden will-change-transform"
                >
                    {/* BROWSER Header (Light Mode - Safari Style) */}
                    <motion.div
                        style={{ opacity: headerOpacity }}
                        className="absolute top-0 left-0 right-0 h-14 bg-zinc-50 border-b border-zinc-200 flex items-center px-4 gap-4 z-20"
                    >
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 bg-white border border-zinc-200 h-8 rounded-md flex items-center justify-center shadow-sm">
                            <span className="text-[10px] text-zinc-400 font-medium">appweaver.io</span>
                        </div>
                    </motion.div>

                    {/* PHONE NOTCH (Dynamic Island - Pure Black) */}
                    <motion.div
                        style={{ opacity: notchOpacity }}
                        className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-30"
                    />

                    {/* SCREEN CONTENT - ABSTRACT UI */}
                    <div className="w-full h-full pt-16 px-6 bg-white relative">
                        {/* Skeleton UI */}
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 mb-8 shadow-lg shadow-blue-200" />

                        <div className="space-y-4">
                            <div className="h-4 w-3/4 bg-zinc-100 rounded-full" />
                            <div className="h-4 w-1/2 bg-zinc-100 rounded-full" />
                        </div>

                        <div className="mt-12 grid grid-cols-2 gap-4">
                            <div className="aspect-square rounded-2xl bg-zinc-50 border border-zinc-100" />
                            <div className="aspect-square rounded-2xl bg-zinc-50 border border-zinc-100" />
                            <div className="aspect-square rounded-2xl bg-zinc-50 border border-zinc-100" />
                            <div className="aspect-square rounded-2xl bg-zinc-50 border border-zinc-100" />
                        </div>

                        {/* Scanline Effect (Subtle) */}
                        <motion.div
                            animate={{ top: ["0%", "100%"] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-[20px] bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none"
                        />
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

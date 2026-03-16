'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Reusing auroras for consistency
const Aurora = ({ color, position }: { color: string, position: string }) => (
    <div className={`absolute ${position} w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 pointer-events-none mix-blend-screen animate-pulse`} style={{ backgroundColor: color }} />
);

export default function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
    return (
        <main className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden text-white selection:bg-violet-500 selection:text-white">
            {/* Atmosphere */}
            <Aurora color="#4c1d95" position="top-[-100px] left-[-100px]" />
            <Aurora color="#2563eb" position="bottom-[-100px] right-[-100px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-8 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
            >
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6 hover:scale-105 transition-transform">
                        <div className="relative w-16 h-16 mx-auto">
                            {/* Using standard img tag to avoid potential Next.js Image Optimization issues in dev container */}
                            <img
                                src="/logo.png"
                                alt="NativX Logo"
                                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                            />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
                    <p className="text-zinc-500 text-sm">{subtitle}</p>
                </div>

                {children}

            </motion.div>
        </main>
    );
}

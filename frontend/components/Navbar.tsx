'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { LogIn, Zap, User } from 'lucide-react';

export default function Navbar() {
    const { user, isLoading } = useAuth();

    return (
        <nav className="absolute top-0 left-0 w-full z-50 p-6 md:p-8 flex justify-between items-center pointer-events-none">
            {/* Logo area - minimal text or icon */}
            <div className="pointer-events-auto">
                <Link href="/" className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <span className="font-mono text-xs">NX</span>
                    </div>
                    NativX
                </Link>
            </div>

            <div className="pointer-events-auto flex items-center gap-4">
                {isLoading ? (
                    <div className="h-9 w-24 bg-white/5 rounded-full animate-pulse border border-white/5" />
                ) : user ? (
                    <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-full p-1 pl-4 shadow-xl">
                        <span className="text-xs font-mono text-zinc-400 hidden sm:block max-w-[150px] truncate">
                            {user.email}
                        </span>
                        <Link href="/build">
                            <button className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-violet-900/20 flex items-center gap-2">
                                <Zap className="w-3 h-3 fill-white" />
                                CONSOLE
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 bg-black/50 backdrop-blur-md border border-white/10 rounded-full p-1 pr-6 pl-1">
                        <Link href="/signup">
                            <button className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition-transform">
                                Get Started
                            </button>
                        </Link>
                        <Link href="/login" className="text-zinc-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-2">
                            Log In
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}

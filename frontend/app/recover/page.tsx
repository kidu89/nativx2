'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout';

export default function RecoverPage() {
    return (
        <AuthLayout
            title="Recover Access"
            subtitle="We'll send you a secure link to reset your password."
        >
            <form className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
                        <input
                            type="email"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-zinc-700 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                            placeholder="creator@nativx.io"
                        />
                    </div>
                </div>

                <button className="w-full bg-white text-black py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    Send Link <ArrowRight className="w-4 h-4" />
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-zinc-600">
                Remember your password?{' '}
                <Link href="/login" className="text-white hover:text-violet-400 font-medium transition-colors">
                    Back to Login
                </Link>
            </div>
        </AuthLayout>
    );
}

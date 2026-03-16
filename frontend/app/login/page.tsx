'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, Mail, Loader2, LogIn } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout';
import { apiClient } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';

export default function LoginPage() {
    const [loading, setLoading] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const router = useRouter();
    const { error: toastError } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await apiClient.login(email, password);
            router.push('/build');
            window.location.reload(); // Force full reload to update auth state
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Resume your deployment."
        >
            <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                    <label htmlFor="loginEmail" className="text-xs font-mono text-zinc-400 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors" aria-hidden="true" />
                        <input
                            id="loginEmail"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all font-mono"
                            placeholder="creator@nativx.io"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="loginPassword" className="text-xs font-mono text-zinc-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors" aria-hidden="true" />
                        <input
                            id="loginPassword"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-1">
                    <Link href="/recover" className="text-xs text-zinc-500 hover:text-white transition-colors">
                        Forgot Password?
                    </Link>
                </div>

                <button disabled={loading} className="w-full bg-white text-black py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    <span>Log In</span>
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-zinc-600">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-white hover:text-violet-400 font-medium transition-colors">
                    Sign Up
                </Link>
            </div>
        </AuthLayout>
    );
}

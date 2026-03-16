'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, Mail, User, Check } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ui/ToastProvider';

export default function SignupPage() {
    const { signInWithEmail } = useAuth();
    const { toast, error: toastError, success } = useToast();
    const [loading, setLoading] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Note: For simplicity, we are using the Magic Link / OTP flow for now
        // or standard email/password if configured.
        // Here we'll just simulate/call the AuthProvider logic.

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            success('Check your email for the confirmation link!');
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Initialize Access"
            subtitle="Begin your journey with NativX."
        >
            <form className="space-y-4" onSubmit={handleSignup}>
                <div className="space-y-2">
                    <label htmlFor="fullName" className="text-xs font-mono text-zinc-400 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors" aria-hidden="true" />
                        <input
                            id="fullName"
                            type="text"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                            placeholder="John Doe"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-mono text-zinc-400 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors" aria-hidden="true" />
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                            placeholder="creator@nativx.io"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="text-xs font-mono text-zinc-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors" aria-hidden="true" />
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-12 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                            placeholder="At least 8 characters"
                            required
                        />
                    </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            id="terms"
                            required
                            className="w-5 h-5 bg-black/50 border border-white/10 rounded focus:ring-1 focus:ring-violet-500 focus:border-violet-500 text-violet-600 rounded-sm cursor-pointer appearance-none checked:bg-violet-600 checked:border-transparent transition-all"
                        />
                        <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 check-icon transition-opacity" />
                        <style jsx>{`
                            input:checked + .check-icon { opacity: 1; }
                        `}</style>
                    </div>
                    <label htmlFor="terms" className="text-sm text-zinc-500 leading-tight">
                        I agree to the <Link href="/terms" className="text-zinc-300 hover:text-white underline">Terms of Service</Link> and <Link href="/privacy" className="text-zinc-300 hover:text-white underline">Privacy Policy</Link>.
                    </label>
                </div>

                <button disabled={loading} className="w-full bg-white text-black py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50">
                    {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight className="w-4 h-4" />
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-zinc-600">
                Already have an account?{' '}
                <Link href="/login" className="text-white hover:text-violet-400 font-medium transition-colors">
                    Log In
                </Link>
            </div>
        </AuthLayout>
    );
}

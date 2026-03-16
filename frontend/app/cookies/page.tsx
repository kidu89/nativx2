import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CookiesPage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-violet-500 selection:text-white">
            <div className="max-w-4xl mx-auto px-6 py-20">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-12 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <h1 className="text-4xl md:text-5xl font-bold mb-8">Cookie Policy</h1>

                <div className="prose prose-invert prose-violet max-w-none text-zinc-400">
                    <p className="text-lg leading-relaxed mb-8">
                        Effective Date: January 1, 2024
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-4">1. What Are Cookies</h2>
                    <p className="mb-6">
                        Cookies are small text files that are placed on your computer or mobile device by websites that you visit. They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-4">2. How We Use Cookies</h2>
                    <p className="mb-6">
                        We use cookies for the following purposes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li><strong>Essential Cookies:</strong> These are strictly necessary for the website to function properly (e.g., authentication, security).</li>
                        <li><strong>Performance Cookies:</strong> These allow us to count visits and traffic sources so we can measure and improve the performance of our site.</li>
                        <li><strong>Functional Cookies:</strong> These enable the website to provide enhanced functionality and personalization.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-4">3. Managing Cookies</h2>
                    <p className="mb-6">
                        Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit www.aboutcookies.org or www.allaboutcookies.org.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-12 mb-4">4. Updates to This Policy</h2>
                    <p className="mb-6">
                        We may update this Cookie Policy from time to time. We encourage you to review this policy periodically to stay informed about our use of cookies.
                    </p>
                </div>
            </div>
        </main>
    );
}

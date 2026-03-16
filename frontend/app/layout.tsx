import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'NativX - The Alchemy of Code',
    description: 'Transform your website into a native iOS & Android app instantly. No code required. Compiled binary, cloud engine, auto-signing.',
    keywords: ['nativx', 'website to app', 'webview to native', 'ios app builder', 'no code app builder'],
    authors: [{ name: 'NativX Team' }],
    metadataBase: new URL('https://nativx.io'),
    openGraph: {
        title: 'NativX - The Alchemy of Code',
        description: 'Stop building from scratch. We compile your existing web app into a high-performance native binary.',
        type: 'website',
        locale: 'en_US',
        siteName: 'NativX',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'NativX - Your Website, Now Native.',
        description: 'The fastest way to launch your SaaS on mobile.',
        creator: '@nativx',
    },
    robots: {
        index: true,
        follow: true,
    }
};

import { AuthProvider } from '@/components/AuthProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </AuthProvider>
            </body>
        </html>
    );
}

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LicensesPage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-violet-500 selection:text-white">
            <div className="max-w-4xl mx-auto px-6 py-20">
                <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-12 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <h1 className="text-4xl md:text-5xl font-bold mb-8">Open Source Licenses</h1>

                <div className="prose prose-invert prose-violet max-w-none text-zinc-400">
                    <p className="text-lg leading-relaxed mb-8">
                        NativX is built on the shoulders of giants. We gratefully acknowledge the following open source software libraries and tools used in our platform:
                    </p>

                    <div className="grid gap-8 mt-12">
                        <div className="border border-white/10 rounded-2xl p-6 bg-zinc-900/30">
                            <h3 className="text-xl font-bold text-white mb-2">Next.js</h3>
                            <p className="text-sm text-zinc-500 mb-4">Copyright (c) 2024 Vercel, Inc.</p>
                            <p className="text-xs font-mono bg-black/50 p-4 rounded-lg overflow-x-auto">
                                Licensed under the MIT License. Permission is hereby granted, free of charge, to any person obtaining a copy of this software...
                            </p>
                        </div>

                        <div className="border border-white/10 rounded-2xl p-6 bg-zinc-900/30">
                            <h3 className="text-xl font-bold text-white mb-2">Supabase</h3>
                            <p className="text-sm text-zinc-500 mb-4">Copyright (c) 2024 Supabase, Inc.</p>
                            <p className="text-xs font-mono bg-black/50 p-4 rounded-lg overflow-x-auto">
                                Licensed under the Apache License, Version 2.0. You may not use this file except in compliance with the License...
                            </p>
                        </div>

                        <div className="border border-white/10 rounded-2xl p-6 bg-zinc-900/30">
                            <h3 className="text-xl font-bold text-white mb-2">Lucide React</h3>
                            <p className="text-sm text-zinc-500 mb-4">Copyright (c) 2024 Lucide Contributors</p>
                            <p className="text-xs font-mono bg-black/50 p-4 rounded-lg overflow-x-auto">
                                Licensed under the ISC License. Permission to use, copy, modify, and/or distribute this software for any purpose...
                            </p>
                        </div>

                        <div className="border border-white/10 rounded-2xl p-6 bg-zinc-900/30">
                            <h3 className="text-xl font-bold text-white mb-2">Framer Motion</h3>
                            <p className="text-sm text-zinc-500 mb-4">Copyright (c) 2018 Framer B.V.</p>
                            <p className="text-xs font-mono bg-black/50 p-4 rounded-lg overflow-x-auto">
                                Licensed under the MIT License. Permission is hereby granted, free of charge, to any person obtaining a copy...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

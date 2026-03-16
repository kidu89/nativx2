'use client';

import React from 'react';
import { Layers, Zap, Smartphone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureItem = ({ icon: Icon, title, description, step }: { icon: any, title: string, description: string, step: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col items-start p-8 rounded-3xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-colors"
    >
        <span className="text-xs font-bold text-blue-600 mb-4 tracking-wider uppercase">{step}</span>
        <div className="p-3 rounded-xl bg-white border border-zinc-100 shadow-sm mb-6">
            <Icon className="w-6 h-6 text-zinc-900" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 mb-3">{title}</h3>
        <p className="text-zinc-500 leading-relaxed text-sm">
            {description}
        </p>
    </motion.div>
);

export const Features = () => {
    return (
        <section className="py-24 bg-white relative z-10">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-16 md:text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
                        How it works
                    </h2>
                    <p className="text-zinc-500 text-lg">
                        We don&apos;t just wrap your site. We wrap your site in a high-performance native harness that feels like a real app.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureItem
                        step="Step 01"
                        icon={Layers}
                        title="Connect Source"
                        description="Enter your website URL. Our engine analyzes your manifest, assets, and service workers automatically."
                    />
                    <FeatureItem
                        step="Step 02"
                        icon={Zap}
                        title="Cloud Compile"
                        description="Our isolated build servers generate a clean Android Studio and Xcode project, then compile it to binary."
                    />
                    <FeatureItem
                        step="Step 03"
                        icon={Smartphone}
                        title="Native Publish"
                        description="Download the signed .APK and .IPA files, ready for direct upload to Google Play and Apple App Store."
                    />
                </div>

                {/* CTA BOX */}
                <div className="mt-24 rounded-[3rem] bg-zinc-900 p-12 md:p-24 text-center text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">Ready to compile?</h2>
                        <a href="/build" className="inline-flex items-center gap-2 bg-white text-zinc-900 px-8 py-4 rounded-full font-semibold hover:bg-zinc-100 transition-colors">
                            Launch Console <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_70%)]" />
                </div>
            </div>
        </section>
    );
};

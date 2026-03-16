'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const SpecCard = ({ title, value, label, delay }: { title: string, value: string, label: string, delay: number }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <motion.div
            ref={divRef}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay * 0.1 }}
            viewport={{ once: true }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative h-48 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden flex flex-col justify-between p-6 group"
        >
            {/* Spotlight Gradient */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`,
                }}
            />
            {/* Border Reveal */}
            <div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    opacity,
                    background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.1), transparent 40%)`,
                }}
            />

            <div className="relative z-10">
                <span className="text-[10px] font-mono text-white/30 tracking-widest uppercase">{label}</span>
                <h3 className="text-white/60 text-sm mt-1 font-mono">{title}</h3>
            </div>

            <div className="relative z-10">
                <p className="text-2xl font-mono text-white tracking-tighter">{value}</p>
            </div>
        </motion.div>
    );
};

export const SpecsGrid = () => {
    const specs = [
        { label: "LATENCY", title: "Input Lag", value: "< 16ms" },
        { label: "COMPILER", title: "Build Engine", value: "GRADLE 8.5" },
        { label: "OUTPUT", title: "Binary Format", value: ".APK / .IPA" },
        { label: "RUNTIME", title: "Memory Overhead", value: "0MB (Native)" },
        { label: "CDN", title: "Edge Deployment", value: "GLOBAL" },
        { label: "SECURITY", title: "Signing Keys", value: "HSM VAULT" },
    ];

    return (
        <div className="w-full max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-32">
            {specs.map((spec, i) => (
                <SpecCard key={i} {...spec} delay={i} />
            ))}
        </div>
    );
};

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowDown } from 'lucide-react';

export const Hero = () => {
    return (
        <section className="min-h-screen flex flex-col items-center justify-center relative px-4 pt-20">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen" />
            </div>

            <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-neon-blue animate-pulse"></span>
                        <span className="text-xs font-mono text-neutral-400 tracking-wider">GENIUS_MODE_ACTIVE</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[1.1]">
                        Your Website.{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-purple-500">
                            Now Native.
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl font-light">
                        The fully automated factory that physically transforms your existing web codebase into a signed, binary App Store release.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
                >
                    <Link href="/build" className="group relative px-8 py-4 bg-white text-black font-bold rounded-lg overflow-hidden transition-all hover:scale-105">
                        <span className="relative z-10 flex items-center gap-2">
                            OPEN CONSOLE <ChevronRight className="w-4 h-4" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>

                    <button className="px-8 py-4 text-white hover:text-white/80 transition-colors font-mono text-sm underline decoration-white/30 underline-offset-4">
                        READ_MANIFESTO
                    </button>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2"
            >
                <div className="flex flex-col items-center gap-2 text-neutral-500">
                    <span className="text-[10px] font-mono tracking-[0.2em]">INITIALIZE_TRANSFORMATION</span>
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                </div>
            </motion.div>
        </section>
    );
};

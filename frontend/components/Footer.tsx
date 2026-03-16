import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="w-full bg-black border-t border-white/5 pt-16 pb-8 z-20 relative">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400 mb-6 block">
                            NativX
                        </Link>
                        <p className="text-zinc-500 max-w-sm">
                            The automated factory that turns websites into native apps.
                            Shipped independently. Hosted globally.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Product</h4>
                        <ul className="space-y-4 text-zinc-500 text-sm">
                            <li><Link href="/build" className="hover:text-violet-400 transition-colors">Build Console</Link></li>
                            <li><Link href="/#pricing" className="hover:text-violet-400 transition-colors">Pricing</Link></li>
                            <li><Link href="/#how-it-works" className="hover:text-violet-400 transition-colors">How it Works</Link></li>
                            <li><Link href="/#core-technology" className="hover:text-violet-400 transition-colors">Technology</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Legal</h4>
                        <ul className="space-y-4 text-zinc-500 text-sm">
                            <li><Link href="/terms" className="hover:text-violet-400 transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-violet-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/cookies" className="hover:text-violet-400 transition-colors">Cookie Policy</Link></li>
                            <li><Link href="/licenses" className="hover:text-violet-400 transition-colors">Licenses</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-zinc-600 text-sm">
                        © {new Date().getFullYear()} NativX Inc. All rights reserved.
                    </div>
                    <div className="flex items-center gap-2 text-zinc-700 text-xs font-mono">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        SYSTEMS OPERATIONAL
                    </div>
                </div>
            </div>
        </footer>
    );
}

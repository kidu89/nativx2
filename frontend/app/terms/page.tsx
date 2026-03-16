import React from 'react';
import Footer from '@/components/Footer';

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-violet-500 selection:text-white">
            <div className="max-w-4xl mx-auto px-6 py-32">
                <h1 className="text-4xl md:text-5xl font-bold mb-8">Terms of Service</h1>
                <div className="prose prose-invert prose-violet max-w-none text-zinc-400">
                    <p className="text-xl text-zinc-300 mb-12">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>

                    <h3>1. Acceptance of Terms</h3>
                    <p>
                        By accessing and using NativX (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service.
                    </p>

                    <h3>2. Description of Service</h3>
                    <p>
                        NativX provides automated build tools to convert web applications into native iOS and Android binaries. We do not guarantee approval by the Apple App Store or Google Play Store.
                    </p>

                    <h3>3. Deliverables by Tier</h3>
                    <p>
                        The following deliverables are provided based on your subscription tier:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li>
                            <strong>Prototype Tier:</strong> Compiled binary files only (APK for Android, IPA for iOS). Source code is not included.
                        </li>
                        <li>
                            <strong>Founder Tier:</strong> Compiled binary files (APK/IPA) plus complete source code project files (ZIP archive) that can be opened in Android Studio or Xcode.
                        </li>
                        <li>
                            <strong>Tycoon/Agency Tier:</strong> Same as Founder Tier, with priority support.
                        </li>
                    </ul>

                    <h3>4. iOS App Store Submission</h3>
                    <p>
                        iOS builds are compiled with ad-hoc signing for testing purposes. To submit to the Apple App Store, you must:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-6">
                        <li>Have an active Apple Developer Program membership ($99/year, paid to Apple)</li>
                        <li>Re-sign the application with your own distribution certificate, OR</li>
                        <li>Use the provided source code (Founder/Tycoon tiers) to build and sign directly from Xcode</li>
                    </ul>
                    <p>
                        NativX is not affiliated with Apple Inc. and cannot guarantee App Store approval.
                    </p>

                    <h3>5. Android Play Store Submission</h3>
                    <p>
                        Android builds are signed with a release keystore and are ready for Play Store submission. You may need a Google Play Developer account ($25 one-time fee, paid to Google). NativX cannot guarantee Play Store approval.
                    </p>

                    <h3>6. User Accounts</h3>
                    <p>
                        You are responsible for maintaining the security of your account credentials. NativX cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
                    </p>

                    <h3>7. Intellectual Property</h3>
                    <p>
                        You retain all rights to the code and content you submit to the Service. By submitting code, you grant NativX a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such code solely for the purpose of providing the Service.
                    </p>

                    <h3>8. Payment and Refunds</h3>
                    <p>
                        Services are billed in advance on a subscription basis. Refunds are processed at our sole discretion within 30 days of purchase. Only one refund per customer is allowed.
                    </p>

                    <h3>9. Limitation of Liability</h3>
                    <p>
                        In no event shall NativX be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                    </p>

                    <h3>10. Termination</h3>
                    <p>
                        We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>

                    <h3>11. Changes</h3>
                    <p>
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect.
                    </p>
                </div>
            </div>
            <Footer />
        </main>
    );
}

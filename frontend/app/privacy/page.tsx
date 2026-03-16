import React from 'react';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-violet-500 selection:text-white">
            <div className="max-w-4xl mx-auto px-6 py-32">
                <h1 className="text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
                <div className="prose prose-invert prose-violet max-w-none text-zinc-400">
                    <p className="text-xl text-zinc-300 mb-12">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>

                    <h3>1. Information We Collect</h3>
                    <p>
                        We collect information you provide directly to us, such as when you create or modify your account, request customer support, or communicate with us. This information may include your name, email address, and GitHub repository details.
                    </p>

                    <h3>2. Use of Information</h3>
                    <p>
                        We use the information we collect to operate, maintain, and provide the features of NativX, to analyze how the Service is used, diagnose service or technical problems, maintain security, and personalize content.
                    </p>

                    <h3>3. Data Retention</h3>
                    <p>
                        We store your build artifacts and logs for a limited period to provide debugging support. Source code pulled from your repositories is used transiently for the build process and is not permanently stored on our runners.
                    </p>

                    <h3>4. Sharing of Information</h3>
                    <p>
                        We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users.
                    </p>

                    <h3>5. Security</h3>
                    <p>
                        We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems.
                    </p>

                    <h3>6. Third-Party Services</h3>
                    <p>
                        We may use third-party services such as Stripe for payment processing and GitHub for authentication. These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                    </p>

                    <h3>7. Contact Us</h3>
                    <p>
                        If there are any questions regarding this privacy policy, you may contact us at support@nativx.io.
                    </p>
                </div>
            </div>
            <Footer />
        </main>
    );
}

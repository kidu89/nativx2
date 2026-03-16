
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    // apiVersion: '2023-10-16', // Commented out to avoid type mismatch with installed SDK
    typescript: true,
});

// Price IDs - Read from Environment Variables (Best Practice)
// Fallback to test IDs if env vars are missing
const PRICES = {
    prototype: process.env.STRIPE_PRICE_ID_PROTOTYPE || 'price_1SpYUGK8VPNq7vDSrwREaM4A',
    founder: process.env.STRIPE_PRICE_ID_FOUNDER || 'price_1SpYUvK8VPNq7vDSZbrZmemb',
    tycoon: process.env.STRIPE_PRICE_ID_AGENCY || 'price_1SpYVZK8VPNq7vDSjQuazGX2', // Agency/Tycoon shared
    agency: process.env.STRIPE_PRICE_ID_AGENCY || 'price_1SpYVZK8VPNq7vDSjQuazGX2',
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { tier, email, userId } = body;

        if (!tier || !PRICES[tier as keyof typeof PRICES]) {
            return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
        }

        const priceId = PRICES[tier as keyof typeof PRICES];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment', // One-time payment for credit packs
            success_url: `${req.headers.get('origin')}/build?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/#pricing`,
            customer_email: email, // Pre-fill email if user is logged in
            client_reference_id: userId, // CRITICAL: Link payment to Supabase User ID
            metadata: {
                tier: tier,
                userId: userId // redundant but helpful for debugging
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (err: any) {
        console.error('Stripe Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

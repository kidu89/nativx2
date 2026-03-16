
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Admin client to bypass RLS for credit updates
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
            console.error('Stripe credentials missing');
            return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
        }

        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_email || session.customer_details?.email;
        const userId = session.client_reference_id || session.metadata?.userId;
        const tier = session.metadata?.tier; // 'prototype', 'founder', 'tycoon'

        console.log(`💰 Payment success: ${customerEmail} (ID: ${userId}) bought ${tier}`);

        if (!tier) {
            return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        // Determine credits based on tier
        let creditsToAdd = 0;
        if (tier === 'prototype') creditsToAdd = 1;
        if (tier === 'founder') creditsToAdd = 3;
        if (tier === 'tycoon') creditsToAdd = 10;
        if (tier === 'agency') creditsToAdd = 10; // Handle alias

        // Update User Profile via Supabase Admin
        try {
            let profileId = userId;

            // If we don't have a userId, try to FIND the user by email (Fallback)
            // This handles cases where client_reference_id might have been missed (e.g. legacy checkouts)
            if (!profileId && customerEmail) {
                console.log(`⚠️ User ID missing, attempting lookup by email: ${customerEmail}`);
                // IMPORTANT: This assumes 'profiles' table has 'email' column or we look up in auth schema?
                // Since we can't access auth.users easily via API, we rely on profiles having email.
                const { data: profile, error: fetchError } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('email', customerEmail)
                    .single();

                if (profile) profileId = profile.id;
            }

            if (!profileId) {
                console.error('CRITICAL: User not identified. Credits NOT delivered.');
                return NextResponse.json({ error: 'User not identified' }, { status: 404 });
            }

            // Get current profile data
            const { data: currentProfile, error: fetchKpError } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();

            if (fetchKpError || !currentProfile) {
                // Detailed logging for debugging
                console.error('Supabase Query Error:', JSON.stringify(fetchKpError, null, 2));
                console.error('Profile Result:', currentProfile);
                console.error('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
                console.error('Service Key Set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
                return NextResponse.json({ error: 'Profile not found', details: fetchKpError }, { status: 404 });
            }

            // Update Credits & Tier
            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    credits: (currentProfile.credits || 0) + creditsToAdd,
                    // Upgrade tier if applicable (don't downgrade)
                    tier: (tier === 'founder' || tier === 'tycoon' || tier === 'agency') && currentProfile.tier === 'free' ? tier : currentProfile.tier
                })
                .eq('id', profileId);

            if (updateError) {
                console.error('Failed to update credits:', updateError);
                return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
            }

            console.log(`✅ Credits DELIVERED to user ${profileId}: +${creditsToAdd}`);

        } catch (err: any) {
            console.error('Error processing webhook logic:', err);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}

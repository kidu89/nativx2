
import { createClient } from '@supabase/supabase-js';

// These environment variables will be populated by the user
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SubscriptionTier = 'free' | 'prototype' | 'founder' | 'tycoon';

export interface UserProfile {
    id: string;
    email: string;
    tier: SubscriptionTier;
    credits: number; // Remaining build credits
    builds_count: number; // Total lifetime builds
    created_at: string;
}

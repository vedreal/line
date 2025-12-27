-- Tonline Airdrop Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS (Row Level Security)
-- This ensures users can only access their own data

-- Create Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    points INTEGER DEFAULT 0,
    ton_balance DECIMAL DEFAULT 0,
    last_check_in TIMESTAMP WITH TIME ZONE,
    referred_by BIGINT REFERENCES public.users(telegram_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Referrals table for tracking
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id BIGINT REFERENCES public.users(telegram_id) NOT NULL,
    referee_id BIGINT REFERENCES public.users(telegram_id) UNIQUE NOT NULL,
    reward_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Configure Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Note: In a TWA, you'll often use a service role for backend updates, 
-- but these policies allow for secure direct client-side reads if needed.

-- Policy: Allow users to read their own data
CREATE POLICY "Users can view own data" 
ON public.users FOR SELECT 
USING (auth.uid()::text = telegram_id::text);

-- Policy: Allow Service Role to do everything (internal use)
-- This is default in Supabase, but good to keep in mind for API routes.

-- 4. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);

-- 5. Functions & Triggers (Optional but recommended)
-- Example: Function to add points safely
CREATE OR REPLACE FUNCTION add_points(user_tid BIGINT, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.users
    SET points = points + amount
    WHERE telegram_id = user_tid;
END;
$$ LANGUAGE plpgsql;

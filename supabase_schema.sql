-- Tonline Airdrop Database Schema (FINAL FIX)
-- Jalankan kode ini di Supabase Dashboard -> SQL Editor

-- 1. Hapus tabel lama jika ada (Hanya jika Anda ingin reset total, 
--    jika tidak, cukup jalankan bagian penambahan kolom)
-- DROP TABLE IF EXISTS public.referrals;
-- DROP TABLE IF EXISTS public.users;

-- 2. Buat ulang tabel Users dengan skema yang benar
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    points INTEGER DEFAULT 100,
    ton_balance DECIMAL(18, 9) DEFAULT 0,
    is_eligible BOOLEAN DEFAULT TRUE,
    last_check_in TIMESTAMP WITH TIME ZONE,
    email TEXT, -- Pastikan kolom ini ada
    referred_by BIGINT REFERENCES public.users(telegram_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Buat ulang tabel Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
    id SERIAL PRIMARY KEY,
    referrer_id BIGINT REFERENCES public.users(telegram_id) NOT NULL,
    referee_id BIGINT REFERENCES public.users(telegram_id) UNIQUE NOT NULL,
    reward_points INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 5. Buat Policy untuk Akses Publik (PENTING untuk Telegram Mini App)
-- Kebijakan ini memungkinkan aplikasi membaca/menulis data tanpa otentikasi Supabase Auth yang rumit
DROP POLICY IF EXISTS "Public Access" ON public.users;
CREATE POLICY "Public Access" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Referrals" ON public.referrals;
CREATE POLICY "Public Access Referrals" ON public.referrals FOR ALL USING (true) WITH CHECK (true);

-- 6. Indeks untuk performa
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON public.users(telegram_id);

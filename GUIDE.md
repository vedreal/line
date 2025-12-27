# Tonline Airdrop - Setup & Architecture Guide

## 1. Pendahuluan
Tonline Airdrop adalah Telegram Mini App (TWA) yang dibangun dengan Next.js untuk mengelola kampanye airdrop di blockchain TON. Aplikasi ini dioptimalkan untuk berjalan di dalam ekosistem Telegram.

## 2. Arsitektur Proyek

### Frontend (Next.js 16)
- **App Router**: Menggunakan struktur folder `app/` untuk routing yang efisien.
- **Client-Side Initialization**: Inisialisasi SDK Telegram dilakukan di `app/layout.tsx` agar tersedia di seluruh halaman.
- **Styling**: Tailwind CSS untuk desain mobile-first yang responsif.

### Integrasi Database (Supabase)
- **Client**: Terletak di `lib/supabase.ts`.
- **Keamanan**: Menggunakan variabel lingkungan (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) yang disimpan di Replit Secrets.

### Monetisasi (Adsgram)
- **SDK**: Dimuat secara dinamis melalui `lib/adsgram.ts`.
- **Fungsi**: `showAd()` menyediakan cara mudah untuk menampilkan iklan berhadiah dan menjalankan callback setelah iklan selesai.

### Telegram SDK
- **@twa-dev/sdk**: Digunakan untuk berinteraksi dengan fitur native Telegram seperti user data, haptic feedback, dan tombol utama.
- **Script Tag**: `https://telegram.org/js/telegram-web-app.js` dimuat di header untuk kompatibilitas penuh.

## 3. Langkah-Langkah Setup

### A. Environment Variables
Pastikan Anda telah mengatur variabel berikut di **Secrets (Tools > Secrets)**:
1. `NEXT_PUBLIC_SUPABASE_URL`: URL proyek Supabase Anda.
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key dari dashboard Supabase.

### B. Konfigurasi Adsgram
Buka `lib/adsgram.ts` dan ganti `YOUR_ZONE_ID` dengan ID blok iklan yang Anda dapatkan dari dashboard Adsgram.

### C. Pengembangan Lokal
Untuk menjalankan aplikasi dalam mode pengembangan:
```bash
npm run dev -- -p 5000
```
Aplikasi akan berjalan di port 5000 agar bisa diakses oleh proxy Replit.

## 4. Struktur Folder Utama
- `/app`: Halaman dan layout aplikasi.
- `/lib`: Utilitas untuk database, iklan, dan fungsi bantuan lainnya.
- `/types`: Definisi tipe TypeScript untuk SDK pihak ketiga.
- `/public`: Aset statis seperti gambar dan ikon.

## 5. Tips Pengembangan Telegram Mini App
- Gunakan `window.Telegram.WebApp` untuk mengakses data user Telegram.
- Selalu panggil `WebApp.ready()` saat aplikasi dimuat (sudah diatur di `layout.tsx`).
- Pastikan tampilan dioptimalkan untuk ukuran layar HP (Max-width: 448px atau `max-w-md`).

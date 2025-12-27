"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { showAd } from "@/lib/adsgram";
import { CheckCircle2, XCircle, Clock, Calendar, Users, Wallet, Trophy, User as UserIcon, AlertCircle, ArrowRight, Gift, LayoutDashboard, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// Direct initialization
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface UserData {
  telegram_id: number;
  username: string;
  first_name: string;
  points: number;
  ton_balance: number;
  is_eligible: boolean;
  last_check_in: string | null;
  email: string | null;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"home" | "referral" | "profile">("home");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nextCheckIn, setNextCheckIn] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const AIRDROP_END_DATE = new Date("2025-03-10T00:00:00Z");

  const log = (msg: string) => {
    console.log(`[App] ${msg}`);
    setDebugLog(prev => [...prev.slice(-4), msg]);
  };

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return;

      const webApp = (window as any).Telegram?.WebApp;
      if (webApp) {
        webApp.ready();
        webApp.expand();
        webApp.headerColor = '#000000';
        webApp.backgroundColor = '#000000';
      }

      const attemptFetch = async () => {
        const currentWebApp = (window as any).Telegram?.WebApp;
        const tgUser = currentWebApp?.initDataUnsafe?.user;
        const tgId = tgUser?.id;
        
        if (!tgId) return false;

        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', tgId)
            .maybeSingle();

          if (error) {
            log(`DB Error: ${error.message}`);
            return false;
          }

          if (!data) {
            log("User missing. Registering...");
            const newUser: any = {
              telegram_id: tgId,
              username: tgUser.username || '',
              first_name: tgUser.first_name || '',
              points: 100,
              ton_balance: 0,
              is_eligible: true,
              last_check_in: null
            };

            const { data: created, error: createError } = await supabase
              .from('users')
              .insert([newUser])
              .select()
              .maybeSingle();

            if (createError) {
              const { data: retry } = await supabase
                .from('users')
                .insert([{ telegram_id: tgId, first_name: tgUser.first_name || 'User' }])
                .select()
                .maybeSingle();
              setUser(retry);
            } else {
              setUser(created);
            }
          } else {
            setUser(data);
          }
          return true;
        } catch (err: any) {
          return false;
        }
      };

      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const success = await attemptFetch();
        if (success || attempts >= 40) {
          clearInterval(interval);
          setLoading(false);
        }
      }, 250);
    };
    
    init();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const now = new Date();
    const diff = AIRDROP_END_DATE.getTime() - now.getTime();
    if (diff <= 0) { setTimeLeft("Selesai"); return; }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    setTimeLeft(`${days}h ${hours}j ${minutes}m ${seconds}d`);
  }, [currentTime]);

  useEffect(() => {
    if (!user?.last_check_in) { setNextCheckIn(null); return; }
    const lastCheck = new Date(user.last_check_in);
    const now = new Date();
    const lastCheckDay = new Date(lastCheck).setUTCHours(0,0,0,0);
    const currentDay = new Date(now).setUTCHours(0,0,0,0);
    if (currentDay > lastCheckDay) setNextCheckIn(null);
    else {
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      setNextCheckIn(tomorrow);
    }
  }, [user?.last_check_in, currentTime]);

  const handleCheckIn = async () => {
    if (!user) return;
    showAd(async () => {
      const { data, error } = await supabase
        .from('users')
        .update({ points: user.points + 10, last_check_in: new Date().toISOString() })
        .eq('telegram_id', user.telegram_id)
        .select().single();
      if (!error && data) {
        setUser(data);
        const webApp = (window as any).Telegram?.WebApp;
        if (webApp) webApp.HapticFeedback.notificationOccurred('success');
      }
    }, (err) => alert("Iklan gagal dimuat."));
  };

  const handleEmailSubmit = async () => {
    if (!user || !emailInput) return;
    const allowed = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yandex.com'];
    const domain = emailInput.split('@')[1];
    if (!emailInput.includes('@') || !allowed.includes(domain)) {
      setEmailError("Hanya Gmail, Hotmail, Outlook, Yahoo, Yandex."); return;
    }
    const { data, error } = await supabase
      .from('users')
      .update({ email: emailInput })
      .eq('telegram_id', user.telegram_id)
      .select().single();
    if (!error && data) { setUser(data); setEmailError(""); }
    else setEmailError("Gagal menyimpan email.");
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0088CC] mb-4"></div>
      <p className="text-zinc-500 font-medium animate-pulse">Memuat Tonline...</p>
    </div>
  );

  if (!user) {
    const tgId = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-black">
        <XCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Akses Ditolak</h1>
        <p className="text-zinc-400 mb-6">Buka aplikasi ini melalui Telegram Mini App.</p>
        <div className="text-[10px] text-zinc-600 font-mono">ID: {tgId || "Tidak Terdeteksi"}</div>
        <Button className="mt-8" onClick={() => window.location.reload()}>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4 bg-black min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black tracking-tighter text-[#0088CC] leading-none">TONLINE</h1>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Airdrop Campaign</span>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-zinc-800 shadow-xl">
          <Wallet size={18} className="text-[#0088CC]" />
          <span className="text-lg font-black tracking-tight">{(user.ton_balance || 0).toFixed(3)}<span className="text-[10px] text-zinc-500 ml-1">TON</span></span>
        </div>
      </header>

      <main className="space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-[#0088CC]/30 bg-[#0088CC]/5 backdrop-blur-sm py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                  <CheckCircle2 size={24} className="text-green-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-green-500 leading-tight">Terverifikasi</h2>
                  <p className="text-zinc-400 text-sm">Halo, <span className="text-white font-bold">{user.first_name || user.username || 'User'}</span></p>
                </div>
              </div>
              <div className="bg-black/40 rounded-xl px-3 py-1 border border-white/5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Status</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-5">
                  <div className="text-zinc-500 text-[10px] font-black uppercase mb-1 tracking-widest">Poin Saya</div>
                  <div className="text-3xl font-black text-white">{user.points.toLocaleString()}</div>
                  <div className="mt-4 flex items-center text-[#0088CC] gap-1 text-[10px] font-bold">
                    <History size={12} />
                    LIHAT RIWAYAT
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 border-yellow-500/20">
                  <div className="text-zinc-500 text-[10px] font-black uppercase mb-1 tracking-widest">Waktu Tersisa</div>
                  <div className="text-xl font-black text-yellow-500 font-mono mt-1">{timeLeft}</div>
                  <div className="mt-4 flex items-center text-yellow-500 gap-1 text-[10px] font-bold">
                    <Clock size={12} />
                    AIRDROP LIVE
                  </div>
                </Card>
              </div>

              <Card className="relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Calendar size={80} className="text-[#0088CC]" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-black text-xl flex items-center gap-2">Daily Check-in</h3>
                      <p className="text-zinc-500 text-sm">Klaim 10 poin setiap 24 jam</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#0088CC]/10 flex items-center justify-center border border-[#0088CC]/20">
                      <Gift size={20} className="text-[#0088CC]" />
                    </div>
                  </div>
                  
                  {nextCheckIn ? (
                    <div className="text-center py-6 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Tersedia Dalam</p>
                      <p className="text-2xl font-black font-mono tracking-tighter">{formatDistanceToNow(nextCheckIn)}</p>
                    </div>
                  ) : (
                    <Button onClick={handleCheckIn} className="shadow-[0_0_20px_rgba(0,136,204,0.3)]">
                      Check-in Sekarang (+10 Pts)
                      <ArrowRight size={18} />
                    </Button>
                  )}
                </div>
              </Card>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Misi Tambahan</h4>
                <Card className="flex items-center justify-between py-4 opacity-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Follow Twitter (Soon)</p>
                      <p className="text-[10px] text-zinc-500">+50 Poin</p>
                    </div>
                  </div>
                  <div className="bg-zinc-800 text-zinc-500 text-[10px] font-bold px-3 py-1 rounded-lg">LOCK</div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "referral" && (
            <motion.div key="referral" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <Card className="text-center py-10 bg-gradient-to-b from-zinc-900 to-black">
                <div className="w-20 h-20 rounded-[2.5rem] bg-[#0088CC]/10 flex items-center justify-center border border-[#0088CC]/20 mx-auto mb-6 shadow-2xl">
                  <Users size={40} className="text-[#0088CC]" />
                </div>
                <h2 className="text-2xl font-black mb-2">Program Referral</h2>
                <p className="text-zinc-500 text-sm max-w-[200px] mx-auto mb-8">
                  Dapatkan <span className="text-white font-bold">50 poin</span> untuk setiap teman yang bergabung.
                </p>
                
                <div className="bg-zinc-950/80 p-4 rounded-2xl border border-white/5 mb-6 text-left">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 block">Link Undangan Anda</label>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-xs text-zinc-300 truncate font-mono bg-black/50 p-2 rounded-lg border border-white/5 w-full">t.me/tonline_bot?start={user.telegram_id}</code>
                    <button className="bg-[#0088CC]/10 text-[#0088CC] p-2 rounded-xl border border-[#0088CC]/20 active:scale-95 transition-transform" onClick={() => {
                      navigator.clipboard.writeText(`https://t.me/tonline_bot?start=${user.telegram_id}`);
                      alert("Link disalin!");
                    }}>
                      <LayoutDashboard size={18} />
                    </button>
                  </div>
                </div>

                <Button onClick={() => {
                  const url = `https://t.me/share/url?url=https://t.me/tonline_bot?start=${user.telegram_id}&text=Join Tonline Airdrop! Dapatkan 100 poin gratis saat mendaftar.`;
                  const webApp = (window as any).Telegram?.WebApp;
                  if (webApp) webApp.openTelegramLink(url);
                  else window.open(url, '_blank');
                }}>
                  Bagikan Sekarang
                  <ArrowRight size={18} />
                </Button>
              </Card>

              <Card className="py-6">
                <h3 className="font-black mb-4 px-2">Teman Anda (0)</h3>
                <div className="text-center py-8 border-2 border-dashed border-zinc-800 rounded-2xl">
                  <p className="text-zinc-600 text-sm font-bold italic">Belum ada teman yang bergabung</p>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <Card className="bg-gradient-to-br from-[#0088CC] to-[#006699] p-0 overflow-hidden shadow-2xl">
                <div className="p-8 text-center bg-black/20 backdrop-blur-sm">
                  <div className="text-[#0088CC] bg-white w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <Trophy size={32} />
                  </div>
                  <div className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Total Saldo Poin</div>
                  <div className="text-6xl font-black text-white tracking-tighter">{user.points.toLocaleString()}</div>
                </div>
                <div className="flex border-t border-white/10">
                  <div className="flex-1 p-4 text-center border-r border-white/10">
                    <div className="text-white/40 text-[9px] font-black uppercase mb-1">Peringkat</div>
                    <div className="text-white font-bold">#1,240</div>
                  </div>
                  <div className="flex-1 p-4 text-center">
                    <div className="text-white/40 text-[9px] font-black uppercase mb-1">Edisi</div>
                    <div className="text-white font-bold">ALPHA</div>
                  </div>
                </div>
              </Card>

              <Card className="py-6">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="font-black text-lg">Pengaturan Email</h3>
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                    <UserIcon size={16} className="text-[#0088CC]" />
                  </div>
                </div>
                
                {user.email ? (
                  <div className="p-5 bg-green-500/5 border border-green-500/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-green-500/60 uppercase tracking-widest mb-1">Email Terdaftar</p>
                      <p className="text-white font-bold font-mono">{user.email}</p>
                    </div>
                    <CheckCircle2 size={24} className="text-green-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <input 
                        type="email" 
                        placeholder="Masukkan alamat email..." 
                        value={emailInput} 
                        onChange={(e) => setEmailInput(e.target.value)} 
                        className="w-full bg-zinc-950 border-2 border-zinc-900 rounded-2xl p-4 text-white focus:border-[#0088CC] outline-none transition-all placeholder:text-zinc-700 font-medium" 
                      />
                    </div>
                    {emailError && (
                      <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-red-500 text-xs font-bold flex items-center gap-1 px-1">
                        <AlertCircle size={12} />
                        {emailError}
                      </motion.p>
                    )}
                    <Button onClick={handleEmailSubmit} variant="secondary">Simpan Perubahan</Button>
                  </div>
                )}
              </Card>
              
              <div className="text-center pt-4">
                <p className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">Tonline Airdrop v1.0.4</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-6 left-4 right-4 bg-zinc-900/90 backdrop-blur-xl border border-white/5 rounded-[2rem] px-8 py-4 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavButton active={activeTab === "home"} onClick={() => setActiveTab("home")} icon={<LayoutDashboard size={26} />} label="Home" />
          <div className="w-[1px] h-8 bg-white/5" />
          <NavButton active={activeTab === "referral"} onClick={() => setActiveTab("referral")} icon={<Users size={26} />} label="Ref" />
          <div className="w-[1px] h-8 bg-white/5" />
          <NavButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={<UserIcon size={26} />} label="Me" />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${active ? "text-[#0088CC] scale-110" : "text-zinc-600 hover:text-zinc-400"}`}>
      {active && (
        <motion.div layoutId="nav-glow" className="absolute -inset-4 bg-[#0088CC]/10 blur-xl rounded-full" />
      )}
      {icon}
      <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? "opacity-100" : "opacity-0"}`}>{label}</span>
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card-3d p-5 rounded-[2rem] bg-zinc-950 border border-zinc-900 shadow-2xl ${className}`}>{children}</div>;
}

function Button({ onClick, children, className = "", disabled = false, variant = "primary" }: any) {
  const base = "w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 btn-3d select-none transition-all active:scale-95";
  const styles = {
    primary: "bg-[#0088CC] text-white shadow-[0_10px_20px_rgba(0,136,204,0.2)]",
    secondary: "bg-zinc-800 text-white border border-zinc-700",
    disabled: "bg-zinc-800/50 text-zinc-600 cursor-not-allowed opacity-50 shadow-none transform-none",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${disabled ? styles.disabled : (variant === "primary" ? styles.primary : styles.secondary)} ${className}`}>
      {children}
    </button>
  );
}

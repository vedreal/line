"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { showAd } from "@/lib/adsgram";
import { CheckCircle2, XCircle, Clock, Calendar, Users, Wallet, Trophy, User as UserIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
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

  const AIRDROP_END_DATE = new Date("2025-03-10T00:00:00Z");

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return;

      const checkTelegram = async () => {
        const webApp = (window as any).Telegram?.WebApp;
        
        // Let's use whatever user ID we can find, even if initData is not fully synced
        // Sometimes only initDataUnsafe is available first
        const tgUser = webApp?.initDataUnsafe?.user;
        const tgId = tgUser?.id;
        
        console.log("WebApp Object:", !!webApp, "User Object:", !!tgUser, "ID:", tgId);

        if (tgId) {
          try {
            // First, make sure we stop the retry loop
            if (intervalId) clearInterval(intervalId);

            let { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('telegram_id', tgId)
              .single();

            if (error && error.code === 'PGRST116') {
              const newUser = {
                telegram_id: tgId,
                username: tgUser.username || '',
                first_name: tgUser.first_name || '',
                points: 100,
                ton_balance: 0,
                is_eligible: true,
                last_check_in: null,
                email: null
              };

              const { data: createdUser, error: createError } = await supabase
                .from('users')
                .insert([newUser])
                .select()
                .single();

              if (!createError) {
                setUser(createdUser);
              }
            } else if (data) {
              setUser(data);
            }
          } catch (err) {
            console.error("Supabase Error:", err);
          } finally {
            setLoading(false);
          }
          return true;
        }
        return false;
      };

      const webApp = (window as any).Telegram?.WebApp;
      if (webApp) {
        webApp.ready();
        webApp.expand();
      }

      let intervalId: any = null;

      // Try immediately
      if (await checkTelegram()) return;

      // Retry more aggressively
      intervalId = setInterval(async () => {
        if (await checkTelegram()) {
          clearInterval(intervalId);
        }
      }, 500);

      // Final fallback after 10 seconds
      setTimeout(() => {
        if (intervalId) {
          clearInterval(intervalId);
          setLoading(false);
        }
      }, 10000);
    };
    init();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const now = new Date();
    const diff = AIRDROP_END_DATE.getTime() - now.getTime();
    if (diff <= 0) { setTimeLeft("Airdrop Ended"); return; }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
  }, [currentTime]);

  useEffect(() => {
    if (!user?.last_check_in) { setNextCheckIn(null); return; }
    const lastCheck = new Date(user.last_check_in);
    const now = new Date();
    const lastCheckDay = new Date(lastCheck).setUTCHours(0,0,0,0);
    const currentDay = new Date(now).setUTCHours(0,0,0,0);
    if (currentDay > lastCheckDay) {
      setNextCheckIn(null);
    } else {
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
    }, (err) => alert("Ad failed to load."));
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0088CC]"></div>
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <XCircle size={64} className="text-red-500 mb-4" />
      <h1 className="text-xl font-bold mb-2">Akses Ditolak</h1>
      <p className="text-zinc-400 mb-4">Silakan buka aplikasi ini melalui Telegram Mini App.</p>
      <p className="text-xs text-zinc-600">ID: {(window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id || 'Not Found'}</p>
    </div>
  );

  return (
    <div className="pb-20">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black tracking-tighter text-[#0088CC]">TONLINE</h1>
        <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-3 py-1 border border-zinc-800">
          <Wallet size={16} className="text-[#0088CC]" />
          <span className="text-sm font-medium">{(user.ton_balance || 0).toFixed(3)} TON</span>
        </div>
      </header>
      <main className="space-y-6">
        <Card className="border-[#0088CC]/30 bg-[#0088CC]/5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 size={24} className="text-green-500" />
            <h2 className="text-lg font-bold text-green-500">Akun Terverifikasi</h2>
          </div>
          <p className="text-zinc-400 text-sm">Halo, <span className="text-white font-bold">{user.first_name || user.username}</span></p>
        </Card>
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={20} className="text-[#0088CC]" /> Daily Check-in</h3>
                </div>
                {nextCheckIn ? (
                  <div className="text-center py-4 bg-black/20 rounded-lg border border-white/5">
                    <p className="text-zinc-500 text-sm mb-1">Kembali dalam</p>
                    <p className="text-xl font-mono font-bold">{formatDistanceToNow(nextCheckIn)}</p>
                  </div>
                ) : <Button onClick={handleCheckIn}>Check-in (+10 Pts)</Button>}
              </Card>
              <Card className="relative overflow-hidden">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock size={20} className="text-yellow" /> Airdrop Selesai</h3>
                <div className="text-3xl font-black text-center py-4 font-mono tracking-wider bg-black/40 rounded-xl border border-white/5">{timeLeft}</div>
              </Card>
            </motion.div>
          )}
          {activeTab === "referral" && (
            <motion.div key="referral" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <Card>
                <div className="text-center space-y-4">
                  <Users size={32} className="text-[#0088CC] mx-auto" />
                  <h2 className="text-xl font-bold">Referral</h2>
                  <p className="text-zinc-400 text-sm">Bagikan link ke teman untuk bonus.</p>
                  <div className="bg-black/30 p-3 rounded-lg flex items-center justify-between border border-white/10">
                    <code className="text-xs text-zinc-300 truncate mr-2">t.me/tonline_bot?start={user.telegram_id}</code>
                    <button className="text-[#0088CC] text-xs font-bold" onClick={() => {
                      navigator.clipboard.writeText(`https://t.me/tonline_bot?start=${user.telegram_id}`);
                      alert("Link disalin!");
                    }}>Copy</button>
                  </div>
                  <Button onClick={() => {
                    const url = `https://t.me/share/url?url=https://t.me/tonline_bot?start=${user.telegram_id}&text=Join Tonline Airdrop!`;
                    const webApp = (window as any).Telegram?.WebApp;
                    if (webApp) webApp.openTelegramLink(url);
                    else window.open(url, '_blank');
                  }}>Undang</Button>
                </div>
              </Card>
            </motion.div>
          )}
          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <Card className="bg-gradient-to-br from-[#0088CC]/20 to-black">
                <div className="text-center py-4">
                  <div className="text-zinc-400 text-sm mb-1 uppercase">Total Poin</div>
                  <div className="text-5xl font-black text-white">{user.points.toLocaleString()}</div>
                </div>
              </Card>
              <Card>
                <h3 className="font-bold mb-4">Email</h3>
                {user.email ? <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-green-500 font-mono text-sm">{user.email}</div> : (
                  <div className="space-y-3">
                    <input type="email" placeholder="Email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-[#0088CC] outline-none" />
                    {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
                    <Button onClick={handleEmailSubmit}>Simpan</Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 px-6 py-4 z-50">
        <div className="flex justify-around max-w-md mx-auto">
          <NavButton active={activeTab === "home"} onClick={() => setActiveTab("home")} icon={<Trophy size={24} />} label="Home" />
          <NavButton active={activeTab === "referral"} onClick={() => setActiveTab("referral")} icon={<Users size={24} />} label="Ref" />
          <NavButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={<UserIcon size={24} />} label="Me" />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? "text-[#0088CC]" : "text-zinc-600"}`}>
      {icon}
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card-3d p-4 ${className}`}>{children}</div>;
}

function Button({ onClick, children, className = "", disabled = false, variant = "primary" }: any) {
  const base = "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 btn-3d select-none";
  const styles = {
    primary: "bg-[#0088CC] text-white",
    secondary: "bg-zinc-800 text-white border border-zinc-700",
    disabled: "bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-50 shadow-none transform-none",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${disabled ? styles.disabled : (variant === "primary" ? styles.primary : styles.secondary)} ${className}`}>
      {children}
    </button>
  );
}

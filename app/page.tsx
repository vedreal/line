"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle2, XCircle, Clock, Calendar, Users, Wallet, Trophy, User as UserIcon, LogOut } from "lucide-react";
import { formatDistanceToNow, addDays, isAfter } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
interface UserData {
  telegramId: string;
  username: string;
  points: number;
  tonBalance: number;
  accountAgeYears: number;
  isEligible: boolean;
  lastCheckIn: string | null;
  email: string | null;
  referrals: number;
}

// --- Mock Data / Helpers ---
const MOCK_USER: UserData = {
  telegramId: "123456789",
  username: "CryptoUser",
  points: 0,
  tonBalance: 0,
  accountAgeYears: 0,
  isEligible: false,
  lastCheckIn: null,
  email: null,
  referrals: 0,
};

// --- Components ---

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
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${base} ${disabled ? styles.disabled : (variant === "primary" ? styles.primary : styles.secondary)} ${className}`}
    >
      {children}
    </button>
  );
}

// --- Main Page ---

export default function Home() {
  const [activeTab, setActiveTab] = useState<"home" | "referral" | "profile">("home");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nextCheckIn, setNextCheckIn] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Airdrop Countdown
  const AIRDROP_END_DATE = new Date("2025-03-10T00:00:00Z");

  useEffect(() => {
    // Simulate Login / Fetch Data
    const init = async () => {
      // In a real app, we'd fetch from Supabase here using window.Telegram.WebApp.initData
      // For now, we simulate a delay and mock data or load from localStorage
      await new Promise(r => setTimeout(r, 1000));
      
      const stored = localStorage.getItem("tonline_user");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // First time mock login
        const mockAge = Math.random() * 2 + 0.5; // Random age between 0.5 and 2.5 years
        const eligible = mockAge >= 1;
        const initialPoints = eligible ? Math.floor(mockAge * 1000) : 0;
        
        const newUser = {
          ...MOCK_USER,
          accountAgeYears: mockAge,
          isEligible: eligible,
          points: initialPoints,
        };
        setUser(newUser);
        localStorage.setItem("tonline_user", JSON.stringify(newUser));
      }
      setLoading(false);
    };
    init();

    // Timer Interval
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown Logic
  useEffect(() => {
    if (!AIRDROP_END_DATE) return;
    const now = new Date();
    const diff = AIRDROP_END_DATE.getTime() - now.getTime();
    
    if (diff <= 0) {
      setTimeLeft("Airdrop Ended");
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
  }, [currentTime]);

  // Check-in Logic
  useEffect(() => {
    if (!user?.lastCheckIn) return;
    
    const lastCheck = new Date(user.lastCheckIn);
    const now = new Date();
    
    // Check if next UTC day has started
    const lastCheckDay = new Date(lastCheck).setUTCHours(0,0,0,0);
    const currentDay = new Date(now).setUTCHours(0,0,0,0);
    
    if (currentDay > lastCheckDay) {
      setNextCheckIn(null); // Can check in
    } else {
      // Next check in is tomorrow 00:00 UTC
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      setNextCheckIn(tomorrow);
    }
  }, [user?.lastCheckIn, currentTime]);

  const handleCheckIn = async () => {
    if (!user) return;
    
    // Simulate Adsgram
    const confirmed = confirm("Watch ad to claim 10 points?");
    if (!confirmed) return;

    const updatedUser = {
      ...user,
      points: user.points + 10,
      lastCheckIn: new Date().toISOString()
    };
    
    setUser(updatedUser);
    localStorage.setItem("tonline_user", JSON.stringify(updatedUser));
  };

  const handleEmailSubmit = () => {
    if (!user) return;
    
    const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yandex.com'];
    const domain = emailInput.split('@')[1];
    
    if (!emailInput.includes('@') || !allowedDomains.includes(domain)) {
      setEmailError("Invalid email! Only Gmail, Hotmail, Outlook, Yahoo, Yandex allowed.");
      return;
    }

    const updatedUser = {
      ...user,
      email: emailInput
    };
    setUser(updatedUser);
    localStorage.setItem("tonline_user", JSON.stringify(updatedUser));
    setEmailError("");
  };

  const resetAccount = () => {
    localStorage.removeItem("tonline_user");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0088CC]"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black tracking-tighter text-[#0088CC]">TONLINE</h1>
        <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-3 py-1 border border-zinc-800">
          <Wallet size={16} className="text-[#0088CC]" />
          <span className="text-sm font-medium">{user.tonBalance.toFixed(3)} TON</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
        {/* ELIGIBILITY CHECK */}
        {!user.isEligible ? (
          <Card className="border-red-500/50 bg-red-950/10">
            <div className="flex flex-col items-center text-center gap-3">
              <XCircle size={48} className="text-red-500" />
              <h2 className="text-xl font-bold text-red-500">Not Eligible</h2>
              <p className="text-zinc-400 text-sm">
                Your Telegram account is {user.accountAgeYears.toFixed(1)} years old. 
                Minimum requirement is 1 year.
              </p>
              <Button onClick={resetAccount} variant="secondary" className="mt-2 text-xs py-2">Reset (Demo Only)</Button>
            </div>
          </Card>
        ) : (
          <Card className="border-[#0088CC]/30 bg-[#0088CC]/5">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 size={24} className="text-green-500" />
              <h2 className="text-lg font-bold text-green-500">You are Eligible!</h2>
            </div>
            <p className="text-zinc-400 text-sm mb-1">
              Account Age: <span className="text-white font-mono">{Math.floor(user.accountAgeYears)}y {Math.floor((user.accountAgeYears % 1) * 12)}m</span>
            </p>
            <p className="text-zinc-400 text-sm">
              Age Bonus: <span className="text-yellow font-bold">+{Math.floor(user.accountAgeYears * 1000)} pts</span>
            </p>
          </Card>
        )}

        {/* TABS CONTENT */}
        <AnimatePresence mode="wait">
          {activeTab === "home" && user.isEligible && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Daily Check-in */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Calendar size={20} className="text-[#0088CC]" />
                    Daily Check-in
                  </h3>
                  <span className="text-xs bg-[#0088CC]/20 text-[#0088CC] px-2 py-1 rounded">UTC 00:00</span>
                </div>
                
                {nextCheckIn ? (
                  <div className="text-center py-4 bg-black/20 rounded-lg border border-white/5">
                    <p className="text-zinc-500 text-sm mb-1">Next check-in in</p>
                    <p className="text-xl font-mono font-bold">
                       {formatDistanceToNow(nextCheckIn)}
                    </p>
                  </div>
                ) : (
                  <Button onClick={handleCheckIn}>
                    Check-in (+10 Pts)
                  </Button>
                )}
              </Card>

              {/* Airdrop Countdown */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0088CC]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-yellow" />
                  Airdrop Ends
                </h3>
                <div className="text-3xl font-black text-center py-4 font-mono tracking-wider bg-black/40 rounded-xl border border-white/5">
                  {timeLeft}
                </div>
                <p className="text-center text-xs text-zinc-500 mt-2">March 10, 2025</p>
              </Card>
            </motion.div>
          )}

          {activeTab === "referral" && (
            <motion.div
              key="referral"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-[#0088CC]/20 rounded-full flex items-center justify-center mx-auto">
                    <Users size={32} className="text-[#0088CC]" />
                  </div>
                  <h2 className="text-xl font-bold">Invite Friends</h2>
                  <p className="text-zinc-400 text-sm">
                    Get <span className="text-white font-bold">5 pts</span> + <span className="text-white font-bold">0.002 TON</span> for each eligible friend.
                  </p>
                  
                  <div className="bg-black/30 p-3 rounded-lg flex items-center justify-between border border-white/10">
                    <code className="text-sm text-zinc-300">t.me/tonline_bot?start={user.telegramId}</code>
                    <button className="text-[#0088CC] text-xs font-bold uppercase" onClick={() => alert("Copied!")}>Copy</button>
                  </div>
                  
                  <Button>Invite Friends</Button>
                </div>
              </Card>

              <div className="space-y-3">
                <h3 className="font-bold text-sm text-zinc-500 uppercase tracking-wider">Referral History</h3>
                {user.referrals === 0 ? (
                  <div className="text-center py-8 text-zinc-600">No referrals yet</div>
                ) : (
                   /* Mock list */
                   [1, 2].map((i) => (
                     <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">U{i}</div>
                         <div>
                           <div className="text-sm font-bold">User {i}</div>
                           <div className="text-xs text-yellow">Eligible</div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-sm font-bold text-[#0088CC]">+5 Pts</div>
                         <div className="text-xs text-zinc-500">+0.002 TON</div>
                       </div>
                     </div>
                   ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Stats */}
              <Card className="bg-gradient-to-br from-[#0088CC]/20 to-black border-[#0088CC]/30">
                <div className="text-center py-4">
                  <div className="text-zinc-400 text-sm mb-1 uppercase tracking-widest font-bold">Total Points</div>
                  <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(0,136,204,0.5)]">
                    {user.points.toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
                   <div className="text-center">
                     <div className="text-xs text-zinc-500">Check-in</div>
                     <div className="font-bold text-lg">{(user.points % 1000)}</div>
                   </div>
                   <div className="text-center border-l border-white/10">
                     <div className="text-xs text-zinc-500">Age</div>
                     <div className="font-bold text-lg">{Math.floor(user.accountAgeYears * 1000)}</div>
                   </div>
                   <div className="text-center border-l border-white/10">
                     <div className="text-xs text-zinc-500">Ref</div>
                     <div className="font-bold text-lg">0</div>
                   </div>
                </div>
              </Card>

              {/* Email Form */}
              <Card>
                <h3 className="font-bold mb-4">Email Address</h3>
                {user.email ? (
                  <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span className="text-green-500 font-mono text-sm">{user.email}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-[#0088CC] focus:outline-none transition-colors"
                    />
                    {emailError && <p className="text-red text-xs">{emailError}</p>}
                    <Button onClick={handleEmailSubmit}>Save Email</Button>
                    <p className="text-xs text-zinc-500 text-center">
                      Accepted: gmail, hotmail, outlook, yahoo, yandex.
                      <br/>
                      <span className="text-red">Cannot be changed after saving.</span>
                    </p>
                  </div>
                )}
              </Card>

              {/* Wallet */}
              <Card className="opacity-75">
                <h3 className="font-bold mb-4 text-zinc-400">Wallet Address</h3>
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 text-center text-zinc-500 italic">
                  Coming Soon
                </div>
              </Card>

              <div className="pt-4">
                 <Button onClick={resetAccount} variant="secondary" className="text-red-500 border-red-900/30 hover:bg-red-950/20">
                   <LogOut size={16} /> Reset Account (Demo)
                 </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 px-6 py-4 z-50">
        <div className="flex justify-around max-w-md mx-auto">
          <NavButton 
            active={activeTab === "home"} 
            onClick={() => setActiveTab("home")} 
            icon={<Trophy size={24} />} 
            label="Home" 
          />
          <NavButton 
            active={activeTab === "referral"} 
            onClick={() => setActiveTab("referral")} 
            icon={<Users size={24} />} 
            label="Referral" 
          />
          <NavButton 
            active={activeTab === "profile"} 
            onClick={() => setActiveTab("profile")} 
            icon={<UserIcon size={24} />} 
            label="Profile" 
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${active ? "text-[#0088CC]" : "text-zinc-600 hover:text-zinc-400"}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { CountDown } from "@/components/CountDown";
import { useUser, useEligibility, useCheckIn } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { addDays, setHours, setMinutes, setSeconds, isAfter, startOfTomorrow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { data: user, isLoading, refetch } = useUser();
  const { mutate: checkEligibility, isPending: isChecking } = useEligibility();
  const { mutate: checkIn, isPending: isCheckingIn } = useCheckIn();
  const { toast } = useToast();
  
  // Airdrop ends March 10th
  const airdropEndDate = new Date("2025-03-10T00:00:00Z");

  // Calculate next UTC midnight for check-in reset
  const [nextCheckIn, setNextCheckIn] = useState<Date>(() => {
    // Basic logic: UTC midnight is effectively start of tomorrow in UTC
    const now = new Date();
    const utcNow = new Date(now.toISOString());
    const tomorrow = new Date(utcNow);
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow;
  });

  // Check if user has already checked in "today" (since last UTC midnight)
  const canCheckIn = () => {
    if (!user?.lastCheckIn) return true;
    const last = new Date(user.lastCheckIn);
    const now = new Date();
    // Simple check: if last check-in was before today's UTC midnight, they can check in
    const todayMidnightUTC = new Date();
    todayMidnightUTC.setUTCHours(0, 0, 0, 0);
    
    return isAfter(todayMidnightUTC, last); // If midnight is AFTER last checkin, new day started
  };

  const handleCheckIn = () => {
    if (!user) return;
    
    // Simulate watching an ad
    toast({
      title: "Loading Ad...",
      description: "Please wait while the ad plays via Adsgram.",
    });

    setTimeout(() => {
      checkIn(user.telegramId);
    }, 2000);
  };

  const handleStart = () => {
    // For demo purposes, we randomly simulate account age > 1 year or < 1 year
    // In production this would be automatic
    checkEligibility(1.5); // Simulating 1.5 years old account
  };

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-[#0088CC] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#0088CC] font-bold tracking-wider animate-pulse">VERIFYING ACCOUNT...</p>
      </div>
    );
  }

  // Initial State: User not eligible or hasn't checked
  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0088CC] to-[#004466] flex items-center justify-center shadow-2xl shadow-[#0088CC]/30"
          >
            <span className="text-6xl">💎</span>
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white text-glow">TONLINE</h1>
            <p className="text-gray-400 text-lg">Premium Airdrop for OG Telegram Users</p>
          </div>

          <Card className="p-6 bg-zinc-900/50 border-white/10 w-full max-w-sm">
             <div className="space-y-4">
               <div className="flex items-center gap-3 text-left">
                 <div className="p-2 rounded-lg bg-[#0088CC]/20 text-[#0088CC]">
                   <Clock className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="font-bold text-white">Age Requirement</h3>
                   <p className="text-sm text-gray-400">Account must be 1+ year old</p>
                 </div>
               </div>
               <div className="h-px bg-white/5" />
               <p className="text-xs text-center text-gray-500">
                 We will verify your Telegram account creation date.
               </p>
             </div>
          </Card>

          <Button 
            size="lg" 
            onClick={handleStart} 
            className="w-full max-w-sm bg-[#0088CC] hover:bg-[#0077BB] text-white font-bold h-14 rounded-2xl shadow-lg shadow-[#0088CC]/20 text-lg"
          >
            Check Eligibility
          </Button>
        </div>
      </Layout>
    );
  }

  // Not Eligible State
  if (!user.isEligible) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
          <XCircle className="w-24 h-24 text-red-500 drop-shadow-lg" />
          <h2 className="text-3xl font-bold text-red-500">Not Eligible</h2>
          <p className="text-gray-400 max-w-xs mx-auto">
            Your Telegram account is less than 1 year old. <br/>
            Current age: <span className="text-white font-bold">{(user.accountAgeYears || 0).toFixed(1)} years</span>
          </p>
          <Button variant="outline" className="border-white/10 text-gray-400" disabled>
            Access Denied
          </Button>
        </div>
      </Layout>
    );
  }

  // Eligible State (Main Dashboard)
  const isAvailable = canCheckIn();

  return (
    <Layout>
      <div className="space-y-6 pt-4">
        {/* Header Status */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-zinc-900/50 border border-green-500/30 p-4 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="bg-green-500/20 p-2 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-white">Eligible</h3>
              <p className="text-xs text-green-400">Account Verified</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{user.accountAgeYears?.toFixed(1)}</p>
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Years Old</p>
          </div>
        </motion.div>

        {/* Total Balance Card */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#0088CC] to-[#005580] shadow-xl shadow-[#0088CC]/20">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" alt="TON" className="w-32 h-32" />
          </div>
          
          <div className="relative z-10 space-y-1">
            <p className="text-blue-100 text-sm font-medium tracking-wide">TOTAL REWARD</p>
            <h1 className="text-5xl font-bold text-white tracking-tight text-shadow-sm">
              {Math.floor(user.points).toLocaleString()}
              <span className="text-xl ml-2 font-medium opacity-80">PTS</span>
            </h1>
            <div className="pt-2 flex items-center gap-2">
              <span className="bg-white/20 px-2 py-1 rounded text-xs text-white font-mono">
                ≈ {user.tonBalance.toFixed(3)} TON
              </span>
            </div>
          </div>
        </div>

        {/* Daily Check-in */}
        <div className="bg-zinc-900/80 border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Daily Check-in</h3>
            <span className="text-[#0088CC] font-bold text-sm bg-[#0088CC]/10 px-3 py-1 rounded-full">+10 PTS</span>
          </div>

          {isAvailable ? (
            <Button 
              onClick={handleCheckIn}
              disabled={isCheckingIn}
              className="w-full h-14 bg-white text-black hover:bg-gray-200 font-bold text-lg rounded-xl shadow-lg shadow-white/5 transition-all active:scale-95"
            >
              {isCheckingIn ? (
                "Checking in..."
              ) : (
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  <span>Check In & Watch Ad</span>
                </div>
              )}
            </Button>
          ) : (
            <div className="w-full h-14 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/5">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Next Reset In</p>
                <CountDown targetDate={nextCheckIn} className="text-lg font-mono text-gray-300" labels={false} />
              </div>
            </div>
          )}
        </div>

        {/* Airdrop Countdown */}
        <div className="pt-4 text-center space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">Airdrop Ends In</p>
          <CountDown targetDate={airdropEndDate} className="gap-4" />
          <p className="text-[10px] text-gray-600">March 10, 2025</p>
        </div>
      </div>
    </Layout>
  );
}

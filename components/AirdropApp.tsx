"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, XCircle, Clock, Calendar, Users, Wallet, Trophy, User as UserIcon, Loader2, Camera, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
  checkInCount: number;
  checkInPoints: number;
  referralPoints: number;
  referralTon: number;
  isVerified: boolean;
}

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
    success: "bg-green-600 text-white",
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${base} ${disabled ? styles.disabled : styles[variant as keyof typeof styles] || styles.primary} ${className}`}
    >
      {children}
    </button>
  );
}

// --- Main Component ---
export default function AirdropApp() {
  const [fetchingAge, setFetchingAge] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "referral" | "verify" | "profile">("home");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nextCheckIn, setNextCheckIn] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const AIRDROP_END_DATE = new Date("2026-03-10T00:00:00Z");

  // Account age estimation function
  const estimateAccountAge = (userId: number): number => {
    if (userId < 100000000) return 11;
    if (userId < 300000000) return 9;
    if (userId < 500000000) return 7.5;
    if (userId < 800000000) return 6.5;
    if (userId < 1200000000) return 5.5;
    if (userId < 1800000000) return 4.5;
    if (userId < 2500000000) return 3.5;
    if (userId < 3500000000) return 2.8;
    if (userId < 5000000000) return 2.2;
    if (userId < 6000000000) return 1.7;
    if (userId < 7000000000) return 1.3;
    if (userId < 7500000000) return 1.0;
    if (userId < 8000000000) return 0.8;
    return 0.5;
  };

  useEffect(() => {
    const initUser = async () => {
      try {
        if (typeof window === 'undefined') return;

        const WebApp = (window as any).Telegram?.WebApp;
        if (!WebApp) {
          setError("Please open this app from Telegram");
          setLoading(false);
          return;
        }

        const tgUser = WebApp.initDataUnsafe?.user;
        if (!tgUser) {
          setError("Unable to get Telegram user data");
          setLoading(false);
          return;
        }

        const telegramId = tgUser.id.toString();

        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', telegramId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (existingUser) {
          const accountAge = existingUser.account_age_years || 0;
          
          setUser({
            telegramId: existingUser.telegram_id,
            username: existingUser.username || tgUser.username || 'User',
            points: existingUser.points || 0,
            tonBalance: parseFloat(existingUser.ton_balance) || 0,
            accountAgeYears: accountAge,
            isEligible: accountAge >= 1,
            lastCheckIn: existingUser.last_check_in,
            email: existingUser.email || null,
            referrals: 0,
            checkInCount: existingUser.check_in_count || 0,
            checkInPoints: (existingUser.check_in_count || 0) * 25,
            referralPoints: 0,
            referralTon: 0,
            isVerified: existingUser.is_verified || false
          });
        } else {
          setFetchingAge(true);
          
          let accountAge = 0;
          try {
            const response = await fetch('/api/telegram-age', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ telegramId })
            });
            
            if (response.ok) {
              const data = await response.json();
              accountAge = data.accountAgeYears || 0;
            } else {
              accountAge = estimateAccountAge(parseInt(telegramId));
            }
          } catch (apiError) {
            console.error('API error, using fallback:', apiError);
            accountAge = estimateAccountAge(parseInt(telegramId));
          } finally {
            setFetchingAge(false);
          }

          const isEligible = accountAge >= 1;
          const initialPoints = isEligible ? Math.floor(accountAge * 1000) : 0;

          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              telegram_id: telegramId,
              username: tgUser.username || null,
              first_name: tgUser.first_name || null,
              points: initialPoints,
              account_age_years: accountAge,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          setUser({
            telegramId: newUser.telegram_id,
            username: newUser.username || tgUser.username || 'User',
            points: newUser.points || 0,
            tonBalance: 0,
            accountAgeYears: accountAge,
            isEligible,
            lastCheckIn: null,
            email: null,
            referrals: 0,
            checkInCount: 0,
            checkInPoints: 0,
            referralPoints: 0,
            referralTon: 0,
            isVerified: false
          });
        }

      } catch (err) {
        console.error('Init error:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    initUser();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    if (!user?.lastCheckIn) {
      setNextCheckIn(null);
      return;
    }
    
    const lastCheck = new Date(user.lastCheckIn);
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
  }, [user?.lastCheckIn, currentTime]);

  // Cleanup camera stream when leaving verify tab
  useEffect(() => {
    if (activeTab !== "verify" && stream) {
      stopCamera();
    }
  }, [activeTab]);

  const handleCheckIn = async () => {
    if (!user) return;
    
    try {
      const newCheckInCount = (user.checkInCount || 0) + 1;
      
      const { error } = await supabase
        .from('users')
        .update({
          points: user.points + 25,
          last_check_in: new Date().toISOString(),
          check_in_count: newCheckInCount
        })
        .eq('telegram_id', user.telegramId);

      if (error) throw error;

      setUser({
        ...user,
        points: user.points + 25,
        lastCheckIn: new Date().toISOString(),
        checkInCount: newCheckInCount,
        checkInPoints: newCheckInCount * 25
      });

      const WebApp = (window as any).Telegram?.WebApp;
      if (WebApp?.showAlert) {
        WebApp.showAlert('✅ Check-in successful! +25 points');
      } else {
        alert('✅ Check-in successful! +25 points');
      }
    } catch (err) {
      console.error('Check-in error:', err);
      alert('Failed to complete check-in');
    }
  };

  const handleEmailSubmit = async () => {
    if (!user) return;
    
    const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yandex.com'];
    const domain = emailInput.split('@')[1];
    
    if (!emailInput.includes('@') || !allowedDomains.includes(domain)) {
      setEmailError("Invalid email! Only Gmail, Hotmail, Outlook, Yahoo, Yandex allowed.");
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ email: emailInput })
        .eq('telegram_id', user.telegramId);

      if (error) throw error;

      setUser({ ...user, email: emailInput });
      setEmailError("");
      
      const WebApp = (window as any).Telegram?.WebApp;
      if (WebApp?.showAlert) {
        WebApp.showAlert('✅ Email saved!');
      } else {
        alert('✅ Email saved!');
      }
    } catch (err) {
      console.error('Email save error:', err);
      alert('Failed to save email');
    }
  };

  // Face Verification Functions
  const startVerification = async () => {
    try {
      // Request camera with specific constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      setIsVerifying(true);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => {
            console.error('Video play error:', err);
            alert('Failed to start camera preview');
          });
        }
      }, 100);
      
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errorMsg = 'Failed to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMsg += 'Please allow camera permissions in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMsg += 'No camera found on your device.';
      } else {
        errorMsg += 'Please check your camera permissions.';
      }
      
      alert(errorMsg);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      alert('Camera not ready. Please try again.');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is actually playing
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      alert('Camera is loading. Please wait a moment and try again.');
      return;
    }
    
    const context = canvas.getContext('2d');
    if (!context) {
      alert('Failed to process image. Please try again.');
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Validate that we actually got image data (not blank)
    if (!imageData || imageData === 'data:,') {
      alert('Failed to capture image. Please ensure camera is working.');
      return;
    }
    
    setCapturedImage(imageData);
    stopCamera();
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsVerifying(false);
  };

  const submitVerification = async () => {
    if (!user || !capturedImage) {
      alert('Please capture your photo first.');
      return;
    }
    
    // Validate that captured image is not blank/empty
    if (capturedImage === 'data:,' || capturedImage.length < 1000) {
      alert('Invalid photo. Please retake your photo.');
      setCapturedImage(null);
      return;
    }
    
    try {
      setLoading(true);
      
      // TODO: Add actual face detection API here
      // For now, we'll do basic validation
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { error } = await supabase
        .from('users')
        .update({ 
          is_verified: true,
          points: user.points + 100,
          verification_image: capturedImage // Store for admin review
        })
        .eq('telegram_id', user.telegramId);

      if (error) throw error;

      setUser({ ...user, isVerified: true, points: user.points + 100 });
      setCapturedImage(null);
      setLoading(false);
      
      const WebApp = (window as any).Telegram?.WebApp;
      if (WebApp?.showAlert) {
        WebApp.showAlert('✅ Verification successful! +100 points');
      } else {
        alert('✅ Verification successful! +100 points');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setLoading(false);
      alert('Failed to submit verification. Please try again.');
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startVerification();
  };

  const getAgeTier = (years: number): string => {
    if (years >= 2) return "LEGEND";
    if (years >= 1.5) return "OLD";
    if (years >= 1) return "MATURE";
    return "YOUNG";
  };

  const getAgeTierColor = (years: number): string => {
    if (years >= 2) return "text-purple-400";
    if (years >= 1.5) return "text-orange-400";
    if (years >= 1) return "text-green-400";
    return "text-blue-400";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="animate-spin text-[#0088CC]" size={48} />
        {fetchingAge && <p className="text-zinc-400 text-sm">Verifying account age...</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="text-center border-red-500/50">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-zinc-400">{error}</p>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pb-20">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black tracking-tighter text-[#0088CC]">TONLINE</h1>
        <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-3 py-1 border border-zinc-800">
          <Wallet size={16} className="text-[#0088CC]" />
          <span className="text-sm font-medium">{user.tonBalance.toFixed(3)} TON</span>
        </div>
      </header>

      <main className="space-y-6">
        {!user.isEligible ? (
          <Card className="border-red-500/50 bg-red-950/10">
            <div className="flex flex-col items-center text-center gap-3">
              <XCircle size={48} className="text-red-500" />
              <h2 className="text-xl font-bold text-red-500">Not Eligible</h2>
              <p className="text-zinc-400 text-sm">
                Your Telegram account is {user.accountAgeYears.toFixed(1)} years old. 
                Minimum requirement is 1 year.
              </p>
              <p className="text-zinc-500 text-xs mt-2">User ID: {user.telegramId}</p>
            </div>
          </Card>
        ) : (
          <Card className="border-[#0088CC]/30 bg-[#0088CC]/5">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 size={24} className="text-green-500" />
              <h2 className="text-lg font-bold text-green-500">You are eligible to participate!</h2>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-zinc-400">
                ID: <span className="text-white font-mono">@{user.username}</span>
              </p>
              <p className="text-zinc-400">
                Account Age: <span className={`font-bold ${getAgeTierColor(user.accountAgeYears)}`}>{getAgeTier(user.accountAgeYears)}</span>
              </p>
            </div>
          </Card>
        )}

        <AnimatePresence mode="wait">
          {activeTab === "home" && user.isEligible && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
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
                    Check-in (+25 Pts)
                  </Button>
                )}
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0088CC]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-yellow" />
                  Airdrop Ends
                </h3>
                <div className="text-3xl font-black text-center py-4 font-mono tracking-wider bg-black/40 rounded-xl border border-white/5">
                  {timeLeft}
                </div>
                <p className="text-center text-xs text-zinc-500 mt-2">March 10, 2026</p>
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
                    Get <span className="text-white font-bold">10 pts</span> + <span className="text-white font-bold">0.01 TON</span> for each eligible friend.
                  </p>
                  
                  <div className="bg-black/30 p-3 rounded-lg flex items-center justify-between border border-white/10">
                    <code className="text-sm text-zinc-300 truncate">t.me/tonline_bot?start={user.telegramId}</code>
                    <button 
                      className="text-[#0088CC] text-xs font-bold uppercase ml-2" 
                      onClick={() => {
                        navigator.clipboard.writeText(`https://t.me/tonline_bot?start=${user.telegramId}`);
                        alert('Link copied!');
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  
                  <Button>Invite Friends</Button>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "verify" && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck size={32} className="text-green-500" />
                  </div>
                  <h2 className="text-xl font-bold">Face Verification</h2>
                  
                  {user.isVerified ? (
                    <div className="py-8">
                      <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
                      <p className="text-green-500 font-bold text-lg">Verified Successfully!</p>
                      <p className="text-zinc-400 text-sm mt-2">Your account has been verified.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-zinc-400 text-sm">
                        Verify your identity to unlock additional features and earn <span className="text-green-500 font-bold">+100 bonus points</span>.
                      </p>

                      {!isVerifying && !capturedImage && (
                        <div className="py-8 space-y-4">
                          <Camera size={64} className="text-[#0088CC] mx-auto" />
                          <div className="space-y-2 text-left bg-black/20 p-4 rounded-lg">
                            <p className="text-xs text-zinc-400">📸 Make sure:</p>
                            <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                              <li>Your face is clearly visible</li>
                              <li>Good lighting conditions</li>
                              <li>Look directly at camera</li>
                              <li>Remove glasses if possible</li>
                            </ul>
                          </div>
                          <Button onClick={startVerification}>
                            <Camera size={20} />
                            Start Verification
                          </Button>
                        </div>
                      )}

                      {isVerifying && (
                        <div className="space-y-4">
                          <div className="relative bg-black rounded-xl overflow-hidden aspect-[3/4]">
                            <video 
                              ref={videoRef}
                              autoPlay 
                              playsInline
                              muted
                              className="w-full h-full object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-48 h-64 border-4 border-green-500/60 rounded-full"></div>
                            </div>
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                              <p className="text-white text-xs bg-black/60 px-3 py-1 rounded-full inline-block">
                                Position your face in the circle
                              </p>
                            </div>
                          </div>
                          <canvas ref={canvasRef} className="hidden" />
                          <div className="flex gap-3">
                            <Button onClick={stopCamera} variant="secondary" className="flex-1">
                              Cancel
                            </Button>
                            <Button onClick={capturePhoto} className="flex-1">
                              <Camera size={20} />
                              Capture
                            </Button>
                          </div>
                        </div>
                      )}

                      {capturedImage && (
                        <div className="space-y-4">
                          <img 
                            src={capturedImage} 
                            alt="Captured" 
                            className="w-full rounded-xl border-2 border-[#0088CC]"
                          />
                          <div className="flex gap-3">
                            <Button onClick={retakePhoto} variant="secondary" className="flex-1">
                              Retake
                            </Button>
                            <Button onClick={submitVerification} variant="success" className="flex-1">
                              <CheckCircle2 size={20} />
                              Submit
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
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
              <Card className="bg-gradient-to-br from-[#0088CC]/20 to-black border-[#0088CC]/30">
                <div className="text-center py-4 mb-4">
                  <div className="text-zinc-400 text-sm mb-1 uppercase tracking-widest font-bold">Total Points</div>
                  <div className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(0,136,204,0.5)]">
                    {user.points.toLocaleString()}
                  </div>
                </div>
                
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-green-400" />
                      <span className="text-zinc-400 text-sm">Daily Check-in</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{user.checkInPoints} pts</div>
                      <div className="text-xs text-zinc-500">{user.checkInCount}x check-ins</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-purple-400" />
                      <span className="text-zinc-400 text-sm">Referral Rewards</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{user.referralPoints} pts</div>
                      <div className="text-xs text-zinc-400">+ <span className="text-white font-bold">{user.referralTon.toFixed(2)} TON</span></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-yellow" />
                      <span className="text-zinc-400 text-sm">Age Bonus</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{Math.floor(user.accountAgeYears * 1000)} pts</div>
                      <div className="text-xs text-zinc-500">{user.accountAgeYears.toFixed(1)} years</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-green-400" />
                      <span className="text-zinc-400 text-sm">Verification Status</span>
                    </div>
                    <div className="text-right">
                      {user.isVerified ? (
                        <>
                          <div className="text-green-500 font-bold flex items-center gap-1 justify-end">
                            <CheckCircle2 size={14} />
                            Verified
                          </div>
                          <div className="text-xs text-zinc-500">+100 pts earned</div>
                        </>
                      ) : (
                        <>
                          <div className="text-zinc-400 font-bold">Not Verified</div>
                          <div className="text-xs text-zinc-500">Tap Verify tab</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

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
                    </p>
                  </div>
                )}
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-yellow/20 text-yellow text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  Coming Soon
                </div>
                <h3 className="font-bold mb-4">TON Wallet Address</h3>
                <div className="space-y-3 opacity-60 pointer-events-none">
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Wallet Address</label>
                    <input 
                      type="text" 
                      placeholder="UQA..." 
                      disabled
                      className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Memo (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="Your memo" 
                      disabled
                      className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                  <Button disabled variant="disabled">
                    Save Wallet
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 text-center mt-3">
                  Wallet submission will be available soon for airdrop distribution.
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 px-4 py-4 z-50">
        <div className="flex justify-around max-w-md mx-auto">
          <NavButton 
            active={activeTab === "home"} 
            onClick={() => setActiveTab("home")} 
            icon={<Trophy size={22} />} 
            label="Home" 
          />
          <NavButton 
            active={activeTab === "referral"} 
            onClick={() => setActiveTab("referral")} 
            icon={<Users size={22} />} 
            label="Referral" 
          />
          <NavButton 
            active={activeTab === "verify"} 
            onClick={() => setActiveTab("verify")} 
            icon={<ShieldCheck size={22} />} 
            label="Verify" 
          />
          <NavButton 
            active={activeTab === "profile"} 
            onClick={() => setActiveTab("profile")} 
            icon={<UserIcon size={22} />} 
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
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

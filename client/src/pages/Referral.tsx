import { Layout } from "@/components/Layout";
import { useUser, useReferrals } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Share2, Users, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Referral() {
  const { data: user } = useUser();
  const { data: referrals, isLoading } = useReferrals(user?.telegramId);
  const { toast } = useToast();

  const inviteLink = `https://t.me/tonline_bot?start=${user?.referralCode || "ref"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  return (
    <Layout>
      <div className="space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Invite Friends</h1>
          <p className="text-gray-400 text-sm">Earn rewards for every eligible friend</p>
        </div>

        {/* Reward Card */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-zinc-900/50 border-white/10 p-4 text-center space-y-2">
             <div className="w-10 h-10 mx-auto bg-[#0088CC]/20 rounded-full flex items-center justify-center text-[#0088CC]">
               <Coins className="w-5 h-5" />
             </div>
             <div>
               <p className="text-2xl font-bold text-white">5 PTS</p>
               <p className="text-xs text-gray-500">Per Invite</p>
             </div>
          </Card>
          <Card className="bg-zinc-900/50 border-white/10 p-4 text-center space-y-2">
             <div className="w-10 h-10 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
               <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" className="w-5 h-5 opacity-80 filter grayscale brightness-200" alt="TON" />
             </div>
             <div>
               <p className="text-2xl font-bold text-white">0.002</p>
               <p className="text-xs text-gray-500">TON Coin</p>
             </div>
          </Card>
        </div>

        {/* Link Section */}
        <div className="bg-zinc-900 rounded-xl p-4 flex items-center gap-3 border border-white/5">
          <div className="flex-1 truncate text-gray-400 text-sm bg-black/50 p-3 rounded-lg font-mono">
            {inviteLink}
          </div>
          <Button size="icon" onClick={handleCopy} className="shrink-0 bg-[#0088CC] hover:bg-[#0077BB]">
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <Button className="w-full bg-white text-black font-bold h-12 rounded-xl hover:bg-gray-200">
          <Share2 className="w-4 h-4 mr-2" />
          Invite Friends
        </Button>

        {/* History Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Referral History
          </h3>
          
          <div className="bg-zinc-900/30 rounded-xl border border-white/5 min-h-[200px] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading history...</div>
            ) : referrals && referrals.length > 0 ? (
              <div className="divide-y divide-white/5">
                {referrals.map((ref) => (
                  <div key={ref.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white">
                        {ref.username?.substring(0,2).toUpperCase() || "ID"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{ref.username || "Unknown User"}</p>
                        <p className="text-[10px] text-gray-500">
                          {new Date(ref.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-yellow-400 font-bold text-sm">+5 PTS</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                <Users className="w-8 h-8 opacity-20" />
                <p className="text-sm">No referrals yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

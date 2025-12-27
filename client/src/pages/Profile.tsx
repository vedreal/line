import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useUser, useSubmitEmail } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Wallet, PieChart, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { submitEmailSchema } from "@shared/schema";

// Schema for client-side form validation (only email part needed here)
const formSchema = z.object({
  email: submitEmailSchema.shape.email,
});

export default function Profile() {
  const { data: user } = useUser();
  const { mutate: submitEmail, isPending } = useSubmitEmail();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    submitEmail({ telegramId: user.telegramId, email: values.email });
  };

  // Mock stats - in real app would come from backend breakdown
  const stats = [
    { label: "Account Age", value: user?.accountAgeYears ? (user.accountAgeYears * 1000).toFixed(0) : 0, color: "text-[#0088CC]" },
    { label: "Daily Check-in", value: "20", color: "text-green-400" }, // Mocked
    { label: "Referrals", value: "0", color: "text-yellow-400" }, // Mocked
  ];

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6 pt-4 pb-8">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0088CC] to-[#33AADD] p-1 shadow-lg shadow-[#0088CC]/20">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
               {/* Use first letter of first name as avatar */}
               <span className="text-2xl font-bold text-white">
                 {user.firstName?.charAt(0).toUpperCase() || "?"}
               </span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-gray-500">@{user.username || "username"}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-zinc-900/50 border-white/10 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Points</p>
            <p className="text-2xl font-bold text-white mt-1">{Math.floor(user.points).toLocaleString()}</p>
          </Card>
          <Card className="bg-zinc-900/50 border-white/10 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">TON Balance</p>
            <p className="text-2xl font-bold text-white mt-1">{user.tonBalance.toFixed(3)}</p>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <Card className="bg-zinc-900/30 border-white/5 p-4">
          <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Points Breakdown
          </h3>
          <div className="space-y-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{stat.label}</span>
                <span className={`font-mono font-medium ${stat.color}`}>+{stat.value}</span>
              </div>
            ))}
            <div className="h-px bg-white/5 my-2" />
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-white">Total</span>
              <span className="text-white">{Math.floor(user.points).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Email Submission Form */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#0088CC]" />
            Connect Email
          </h3>
          
          <Card className="bg-zinc-900 border-white/10 p-5">
            {user.email ? (
              <div className="flex items-center gap-3 text-green-500 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-sm font-bold">Email Connected</p>
                  <p className="text-xs opacity-80 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="yourname@gmail.com" 
                            {...field} 
                            className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-[#0088CC]"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />
                  <p className="text-[10px] text-gray-500">
                    Allowed: Gmail, Hotmail, Outlook, Yahoo, Yandex only.
                  </p>
                  <Button 
                    type="submit" 
                    disabled={isPending}
                    className="w-full bg-[#0088CC] hover:bg-[#0077BB] text-white font-bold"
                  >
                    {isPending ? "Saving..." : "Save Email Permanently"}
                  </Button>
                </form>
              </Form>
            )}
          </Card>
        </div>

        {/* Wallet Address (Coming Soon) */}
        <div className="space-y-2 opacity-60">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gray-400" />
            Withdraw Wallet
          </h3>
          <Card className="bg-zinc-900 border-white/5 p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                COMING SOON
              </span>
            </div>
            <div className="space-y-3 pointer-events-none filter blur-[2px]">
              <Input disabled placeholder="Enter TON Wallet Address" className="bg-black/30 border-white/5" />
              <Input disabled placeholder="Memo (Optional)" className="bg-black/30 border-white/5" />
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

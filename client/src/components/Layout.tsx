import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0088CC]/30">
      <div className="max-w-md mx-auto min-h-screen pb-24 relative overflow-hidden shadow-2xl shadow-[#0088CC]/10">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#0088CC]/10 to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0088CC]/20 rounded-full blur-[100px] pointer-events-none" />
        
        <main className="relative z-10 p-4">
          {children}
        </main>
        
        <BottomNav />
      </div>
    </div>
  );
}

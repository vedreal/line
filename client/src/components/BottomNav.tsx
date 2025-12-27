import { Link, useLocation } from "wouter";
import { Home, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/referral", icon: Users, label: "Referral" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-t border-white/10 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full cursor-pointer transition-colors duration-200",
                  isActive ? "text-[#0088CC]" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <item.icon className={cn("w-6 h-6 mb-1", isActive && "drop-shadow-[0_0_8px_rgba(0,136,204,0.6)]")} />
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

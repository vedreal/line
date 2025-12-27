import type { Metadata } from "next";
import { Inter, Fredoka } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "TONLINE Airdrop",
  description: "Join the TONLINE Airdrop and earn rewards!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fredoka.variable} font-sans bg-black text-white min-h-screen flex flex-col`}>
        <main className="flex-grow container mx-auto px-4 py-6 max-w-md relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}

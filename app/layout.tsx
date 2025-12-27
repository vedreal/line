'use client';

import { Inter, Fredoka } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { useEffect } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", weight: ["300", "400", "500", "600", "700"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@twa-dev/sdk').then((WebApp) => {
        WebApp.default.ready();
      });
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive"></script>
      </head>
      <body className={`${inter.variable} ${fredoka.variable} font-sans bg-black text-white min-h-screen flex flex-col`}>
        <main className="flex-grow container mx-auto px-4 py-6 max-w-md relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}

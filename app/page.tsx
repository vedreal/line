"use client";

import dynamic from 'next/dynamic';

// Dynamically import the main component with no SSR
const AirdropApp = dynamic(() => import('@/components/AirdropApp'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0088CC]"></div>
    </div>
  )
});

export default function Home() {
  return <AirdropApp />;
}

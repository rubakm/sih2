'use client';

import dynamic from 'next/dynamic';

const DynamicOcean = dynamic(() => import('./OceanScene'), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#0A0E14] via-[#06101E] to-[#0A0E14] flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      <div className="w-16 h-16 rounded-full border border-white/5 border-t-[#0A84FF]/40 animate-spin" />
    </div>
  ),
});

export default function OceanWrapper({ scrollProgress = 0 }: { scrollProgress?: number }) {
  return <DynamicOcean scrollProgress={scrollProgress} />;
}

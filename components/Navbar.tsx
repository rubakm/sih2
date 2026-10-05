'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Ship, Anchor, Bookmark } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Planner', href: '/planner', icon: Compass },
    { label: 'Ports & Vessels', href: '/ports', icon: Anchor },
    { label: 'Saved Plans', href: '/saved', icon: Bookmark },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 px-5 py-2.5 shadow-2xl">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-[#0A84FF]/20 flex items-center justify-center border border-[#0A84FF]/40 text-[#0A84FF] group-hover:scale-105 transition-transform duration-300">
            <Ship className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              LODESTAR
              <span className="text-[9px] uppercase tracking-wider text-[#86868B] font-mono border border-white/10 px-1 py-0.2 rounded">
                SIH26006
              </span>
            </span>
            <span className="text-[10px] text-[#86868B] tracking-tight">Coking Coal Charter Decision Tool</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                    : 'text-[#86868B] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

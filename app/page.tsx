'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import OceanWrapper from '@/components/3d/OceanWrapper';
import { ArrowRight, Compass, Shield, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-[175vh] bg-[#0A0E14] text-[#F5F5F7] selection:bg-[#0A84FF] selection:text-white">
      {/* Sticky Translucent Apple Navigation */}
      <Navbar />

      {/* 3D WebGL Ocean Canvas with procedural bulk carriers */}
      <div className="fixed inset-0 z-0">
        <OceanWrapper scrollProgress={scrollProgress} />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          {/* Subtle Category Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-xl mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
            <span className="text-xs uppercase tracking-wider text-[#86868B] font-mono">
              Smart India Hackathon SIH26006
            </span>
          </div>

          {/* One Large Light-weight Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-[-0.02em] text-white max-w-3xl leading-[1.08]">
            Chartering with clarity.
          </h1>

          {/* One Subline */}
          <p className="mt-6 text-[17px] text-[#86868B] max-w-2xl leading-relaxed font-normal">
            Landed freight optimization, port draft constraints, and contract hedging for Indian East Coast
            coking coal imports.
          </p>

          {/* One Button */}
          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/planner"
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#0A84FF] hover:bg-[#0071E3] text-white text-base font-medium shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Open planner</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#86868B]/70">
          <span className="text-[11px] uppercase tracking-widest font-mono">Scroll to explore</span>
          <div className="w-4 h-7 rounded-full border border-white/20 flex items-start justify-center p-1">
            <div className="w-1 h-1.5 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Coastal Approaches Section (Revealed on Scroll as Camera Moves Toward Shore) */}
      <section className="relative z-10 py-32 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-widest text-[#0A84FF] font-semibold">
            Charter Decision Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mt-2">
            Built for Steel Logistics
          </h2>
          <p className="text-sm text-[#86868B] max-w-xl mx-auto mt-2">
            Evaluate every vessel class and discharge terminal along the Bay of Bengal with genuine physical and
            stochastic models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="apple-glass p-7 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#0A84FF] mb-5">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium text-white tracking-tight">
                Draft-Limited Payloads
              </h3>
              <p className="text-sm text-[#86868B] leading-relaxed mt-2.5">
                Unlike simple exclusions, draft restrictions penalize unit freight through calculated partial
                load factors. Capesizes at Paradip (16.5m) load to 86.7% capacity, preserving large vessel
                economies of scale.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-[#86868B]">
              <span>Discharge ports</span>
              <span className="text-white">6 terminals + anchorage</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="apple-glass p-7 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#30D158] mb-5">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium text-white tracking-tight">
                Monte Carlo Demurrage
              </h3>
              <p className="text-sm text-[#86868B] leading-relaxed mt-2.5">
                Simulates 2,000 lognormal arrival waiting draws centered on calibrated port priors. The risk
                slider lets charterers blend expected cost with P90 tail risk to balance commercial exposure.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-[#86868B]">
              <span>Sample draws</span>
              <span className="text-white">2,000 per combination</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="apple-glass p-7 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF9F0A] mb-5">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium text-white tracking-tight">
                Hedging & Timing Signals
              </h3>
              <p className="text-sm text-[#86868B] leading-relaxed mt-2.5">
                Synthetic TCE rate time-series bootstrapped with mean-reversion at 14, 30, and 60 days. Clear
                quantitative signals advise whether to fix immediate tonnage or wait for market softening.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-[#86868B]">
              <span>Contract structures</span>
              <span className="text-white">Spot vs COA vs Period</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium border border-white/15 backdrop-blur-xl transition-all shadow-xl hover:scale-105"
          >
            <span>Launch Charter Decision Planner</span>
            <ArrowRight className="w-4 h-4 text-[#0A84FF]" />
          </Link>
        </div>
      </section>
    </div>
  );
}

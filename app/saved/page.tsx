'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Bookmark, Trash2, ArrowUpRight, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedPlanRecord {
  id: string;
  createdAt: string;
  title: string;
  inputsJson: string;
  resultJson: string;
}

interface ParsedResultSummary {
  vesselName?: string;
  portName?: string;
  landedCostPerTonne?: number;
  voyagesNeeded?: number;
  loadFactorPct?: number;
  bindingConstraint?: string;
}

export default function SavedPlansPage() {
  const [plans, setPlans] = useState<SavedPlanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPlans(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved plan?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E14] text-[#F5F5F7] pb-24 selection:bg-[#0A84FF] selection:text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-[#0A84FF] font-semibold">
                Saved Charter Scenarios
              </span>
              <span className="chip-assumed">PRISMA PERSISTED</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-1">
              Archived Charter Decisions
            </h1>
            <p className="text-xs sm:text-sm text-[#86868B] mt-0.5">
              Review and audit previously simulated landed freight calculations and contract structures
            </p>
          </div>

          <Link
            href="/planner"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#0A84FF] hover:bg-[#0071E3] text-white transition-all shadow-md w-fit"
          >
            <span>Open New Planner</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Empty state or list */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#86868B]">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#0A84FF] animate-spin" />
            <span className="text-xs">Loading saved plans from database...</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="py-24 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[#86868B] mb-3">
              <Bookmark className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">No Saved Plans Yet</h3>
            <p className="text-xs text-[#86868B] max-w-sm mt-1 mb-5">
              Run simulations in the Charter Planner and click &ldquo;Save plan&rdquo; to persist optimized
              voyages and scenario stress-tests.
            </p>
            <Link
              href="/planner"
              className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all"
            >
              Go to Planner
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {plans.map((p) => {
                let parsedResult: ParsedResultSummary = {};
                try {
                  parsedResult = JSON.parse(p.resultJson) as ParsedResultSummary;
                } catch {
                  parsedResult = {};
                }

                const createdDate = new Date(p.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-white/20 transition-all shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-base font-semibold text-white tracking-tight">
                            {p.title}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-[#86868B] mt-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            <span>{createdDate}</span>
                          </div>
                        </div>

                        <span className="chip-status-green">SAVED RESULT</span>
                      </div>

                      {parsedResult && (
                        <div className="grid grid-cols-3 gap-2 my-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-[#86868B] block">Landed Cost</span>
                            <span className="text-base font-semibold text-white">
                              ${parsedResult.landedCostPerTonne ? parsedResult.landedCostPerTonne.toFixed(2) : '—'}
                            </span>
                            <span className="text-[10px] text-[#86868B] block">/ tonne</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#86868B] block">Vessel / Port</span>
                            <span className="text-white font-medium truncate block">
                              {parsedResult.vesselName || '—'}
                            </span>
                            <span className="text-[10px] text-[#86868B] truncate block">
                              @ {parsedResult.portName || '—'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#86868B] block">Voyages</span>
                            <span className="text-white font-medium block">
                              {parsedResult.voyagesNeeded || 1} req
                            </span>
                            <span className="text-[10px] text-[#86868B] block">
                              {parsedResult.loadFactorPct || 100}% load
                            </span>
                          </div>
                        </div>
                      )}

                      {parsedResult?.bindingConstraint && (
                        <p className="text-[11px] text-[#86868B] italic mb-3">
                          &ldquo;{parsedResult.bindingConstraint}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                      <Link
                        href="/planner"
                        className="text-xs text-[#0A84FF] hover:text-[#0071E3] font-medium flex items-center gap-1"
                      >
                        <span>Re-simulate in Planner</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>

                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="p-1.5 rounded-lg text-[#86868B] hover:text-[#FF453A] hover:bg-white/5 transition-colors"
                        title="Delete saved plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

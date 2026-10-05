'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Anchor, Navigation, ShieldCheck, AlertTriangle, AlertCircle, Compass } from 'lucide-react';
import { RouteOptionResult } from '@/lib/engine';

interface RouteStripProps {
  origin: string;
  destination: string;
  result: RouteOptionResult | null;
  distanceNm: number;
}

export default function RouteStrip({ origin, destination, result, distanceNm }: RouteStripProps) {
  let statusColor = '#30D158'; // Green
  let statusBadge = 'Low Risk';
  let StatusIcon = ShieldCheck;

  if (result) {
    if (result.blendedDemurragePerTonne > 3.0 || result.loadFactorPct < 80) {
      statusColor = '#FF453A'; // Red
      statusBadge = 'High Demurrage Risk';
      StatusIcon = AlertCircle;
    } else if (result.blendedDemurragePerTonne > 1.4 || result.loadFactorPct < 92) {
      statusColor = '#FF9F0A'; // Amber
      statusBadge = 'Moderate Waiting Risk';
      StatusIcon = AlertTriangle;
    }
  }

  // Calculate animated voyage progress (e.g. 70% along lane)
  const seaDays = result ? result.seaDays : (distanceNm / (13 * 24)).toFixed(1);
  const portDays = result ? result.portDays : '2.5';

  return (
    <div className="w-full rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Background glow tinted by risk */}
      <div
        className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: statusColor }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-white/70">
            <Compass className="w-3.5 h-3.5 text-[#0A84FF]" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-white/90 uppercase">
            Active Charter Voyage Trajectory
          </span>
          <span className="chip-assumed">ASSUMED ROUTING</span>
        </div>

        {result && (
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: `${statusColor}18`,
                borderColor: `${statusColor}40`,
                color: statusColor,
              }}
            >
              <StatusIcon className="w-3 h-3" />
              <span>{statusBadge}</span>
            </div>
            <span className="text-xs text-[#86868B] font-mono">
              {result.vesselName} ({result.loadFactorPct}% load)
            </span>
          </div>
        )}
      </div>

      {/* 2D/3D-Stylized Track Strip */}
      <div className="relative py-4 px-2 sm:px-6">
        {/* Track Line with dashed nautical effect */}
        <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 bottom-0 left-0 rounded-full"
            style={{ backgroundColor: statusColor }}
            initial={{ width: '0%' }}
            animate={{ width: '75%' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>

        {/* Origin Node */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 sm:-translate-x-3 flex flex-col items-center">
          <div className="w-7 h-7 rounded-full bg-[#0A0E14] border-2 border-[#0A84FF] flex items-center justify-center shadow-lg">
            <Navigation className="w-3.5 h-3.5 text-[#0A84FF] rotate-45" />
          </div>
          <div className="absolute top-8 text-center whitespace-nowrap">
            <p className="text-xs font-medium text-white">{origin}</p>
            <p className="text-[10px] text-[#86868B] font-mono">Loading Port</p>
          </div>
        </div>

        {/* Waypoint Waymarker */}
        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-white/30 border border-white/50" />
          <div className="absolute top-6 text-center whitespace-nowrap">
            <span className="text-[10px] text-[#86868B] font-mono tracking-tight">
              {distanceNm.toLocaleString()} nm @ 13.0 kn (~{seaDays} sea d)
            </span>
          </div>
        </div>

        {/* Moving Ship along trajectory */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
          initial={{ left: '15%' }}
          animate={{ left: '72%' }}
          transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xl border backdrop-blur-md"
            style={{
              backgroundColor: '#0A0E14',
              borderColor: statusColor,
            }}
          >
            {/* Stylized procedural bulk carrier SVG */}
            <svg
              className="w-5 h-3.5"
              viewBox="0 0 40 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: statusColor }}
            >
              <path
                d="M2 14L6 6H34L38 14H2Z"
                fill="currentColor"
                opacity="0.8"
              />
              <rect x="10" y="4" width="4" height="2" fill="white" />
              <rect x="16" y="4" width="4" height="2" fill="white" />
              <rect x="22" y="4" width="4" height="2" fill="white" />
              <rect x="28" y="2" width="6" height="4" fill="white" opacity="0.9" />
              <rect x="32" y="0" width="2" height="2" fill="#FF453A" />
            </svg>
            <span className="text-[11px] font-mono font-semibold text-white">
              {result ? `${result.voyageDays.toFixed(1)}d total` : 'En route'}
            </span>
          </div>
        </motion.div>

        {/* Destination Port Node */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 sm:translate-x-3 flex flex-col items-center">
          <div
            className="w-7 h-7 rounded-full bg-[#0A0E14] border-2 flex items-center justify-center shadow-lg"
            style={{ borderColor: statusColor }}
          >
            <Anchor className="w-3.5 h-3.5" style={{ color: statusColor }} />
          </div>
          <div className="absolute top-8 text-center whitespace-nowrap">
            <p className="text-xs font-medium text-white">{destination}</p>
            <p className="text-[10px] text-[#86868B] font-mono">Discharge Port (~{portDays}d ops/wait)</p>
          </div>
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
}

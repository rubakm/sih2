'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { PortData, VesselData, OriginData } from '@/lib/engine';
import { Anchor, Ship, Navigation, CheckCircle, Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PortsRegistryPage() {
  const [ports, setPorts] = useState<PortData[]>([]);
  const [vessels, setVessels] = useState<VesselData[]>([]);
  const [origins, setOrigins] = useState<OriginData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Editing state for Port
  const [editingPort, setEditingPort] = useState<PortData | null>(null);
  const [editingVessel, setEditingVessel] = useState<VesselData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [portsRes, vesselsRes, originsRes] = await Promise.all([
        fetch('/api/ports'),
        fetch('/api/vessels'),
        fetch('/api/origins'),
      ]);
      const [p, v, o] = await Promise.all([portsRes.json(), vesselsRes.json(), originsRes.json()]);
      if (Array.isArray(p)) setPorts(p);
      if (Array.isArray(v)) setVessels(v);
      if (Array.isArray(o)) setOrigins(o);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSavePort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPort) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/ports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPort),
      });
      if (res.ok) {
        showToast(`Saved changes for port ${editingPort.name}`);
        setEditingPort(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVessel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVessel) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/vessels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingVessel),
      });
      if (res.ok) {
        showToast(`Saved vessel class ${editingVessel.name}`);
        setEditingVessel(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E14] text-[#F5F5F7] pb-24 selection:bg-[#0A84FF] selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-[#0A84FF] font-semibold">
                Port & Vessel Infrastructure Registry
              </span>
              <span className="chip-assumed">DATABASE PERSISTED</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-1">
              Terminal Constraints & Fleet Registry
            </h1>
            <p className="text-xs sm:text-sm text-[#86868B] mt-0.5">
              Live database records of East Coast berthing depths, waiting priors, and bulk carrier dimensions
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="text-xs text-[#86868B] flex items-center gap-1.5 mr-2">
                <div className="w-3 h-3 rounded-full border border-white/20 border-t-[#0A84FF] animate-spin" />
                <span>Syncing registry...</span>
              </div>
            )}
            <span className="chip-assumed">ALL SEED VALUES FLAGGED ASSUMED</span>
          </div>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#30D158]/15 border border-[#30D158]/30 rounded-xl px-4 py-3 flex items-center gap-2 text-xs font-medium text-[#30D158] shadow-2xl"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECTION 1: Discharge Ports Registry */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Anchor className="w-4 h-4 text-[#0A84FF]" />
              <h2 className="text-sm font-semibold tracking-tight text-white uppercase">
                Discharge Ports & Anchorage Nodes (India East Coast)
              </h2>
            </div>
            <span className="text-xs text-[#86868B]">Click &ldquo;Edit&rdquo; to modify port limits</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/5 text-[#86868B]">
                  <th className="py-2.5 px-3 font-normal">Port Name</th>
                  <th className="py-2.5 px-3 font-normal text-right">Max Draft (m)</th>
                  <th className="py-2.5 px-3 font-normal text-right">Max LOA (m)</th>
                  <th className="py-2.5 px-3 font-normal text-right">Max Beam (m)</th>
                  <th className="py-2.5 px-3 font-normal text-right">Wait Prior (d)</th>
                  <th className="py-2.5 px-3 font-normal text-right">Discharge (t/d)</th>
                  <th className="py-2.5 px-3 font-normal">Confidence</th>
                  <th className="py-2.5 px-3 font-normal">Source & Marine Notes</th>
                  <th className="py-2.5 px-3 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ports.map((port) => {
                  const isDhamra = port.name.toLowerCase().includes('dhamra');
                  const isHaldia = port.name.toLowerCase().includes('haldia');

                  return (
                    <tr key={port.id || port.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-medium text-white font-sans flex flex-col">
                        <span>{port.name}</span>
                        {isDhamra && (
                          <span className="chip-status-amber mt-1 inline-flex w-fit">
                            CONFLICT (17.5m vs 18.0m in sources)
                          </span>
                        )}
                        {isHaldia && (
                          <span className="chip-status-red mt-1 inline-flex w-fit">
                            VERIFY WITH PORT NOTICE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-white">
                        {port.maxDraft.toFixed(1)} m
                      </td>
                      <td className="py-3 px-3 text-right text-[#86868B]">{port.maxLoa} m</td>
                      <td className="py-3 px-3 text-right text-[#86868B]">{port.maxBeam} m</td>
                      <td className="py-3 px-3 text-right text-[#FF9F0A]">{port.waitPriorDays.toFixed(1)} d</td>
                      <td className="py-3 px-3 text-right text-[#86868B]">
                        {(port.dischargeRate / 1000).toFixed(0)}k
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                            port.confidence === 'high'
                              ? 'bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30'
                              : port.confidence === 'med'
                              ? 'bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30'
                              : 'bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30'
                          }`}
                        >
                          {port.confidence}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-[#86868B] max-w-xs">
                        <p className="truncate text-white/90 text-[11px]">{port.notes}</p>
                        <p className="text-[10px] text-[#86868B]/70 truncate mt-0.5">
                          {port.source} • Verified {port.lastVerified}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setEditingPort({ ...port })}
                          className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 text-white text-[11px] font-sans transition-all flex items-center gap-1 ml-auto"
                        >
                          <Edit2 className="w-3 h-3 text-[#0A84FF]" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: Vessel Classes Registry */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-[#0A84FF]" />
              <h2 className="text-sm font-semibold tracking-tight text-white uppercase">
                Bulk Carrier Fleet Specifications
              </h2>
            </div>
            <span className="chip-assumed">STANDARD BULK DESIGNS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {vessels.map((v) => (
              <div
                key={v.name}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{v.name}</span>
                    <span className="text-xs font-mono text-[#86868B]">
                      {(v.dwt / 1000).toFixed(0)}k DWT
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs font-mono text-[#86868B] my-3">
                    <div className="flex justify-between">
                      <span>Nominal Payload:</span>
                      <strong className="text-white">{(v.dwt * 0.95 / 1000).toFixed(1)}k t</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Design Draft:</span>
                      <span className="text-white">{v.designDraft.toFixed(1)} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Light Draft (30%):</span>
                      <span className="text-white">{(v.designDraft * 0.3).toFixed(1)} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dimensions (LOA x Beam):</span>
                      <span className="text-white">{v.loa}m x {v.beam}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bunker Consumption:</span>
                      <span className="text-white">{v.burnPerDay} t/day</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setEditingVessel({ ...v })}
                  className="w-full mt-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white border border-white/10 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Edit2 className="w-3 h-3 text-[#0A84FF]" />
                  <span>Edit Vessel Specs</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Origin Loading Port Draft Caps */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#0A84FF]" />
              <h2 className="text-sm font-semibold tracking-tight text-white uppercase">
                Loading Port Origins & Channel Limits
              </h2>
            </div>
            <span className="chip-assumed">ASSUMED DRAFT CAPS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {origins.map((o) => (
              <div key={o.name} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-xs font-semibold text-white truncate">{o.name}</p>
                <p className="text-[11px] font-mono text-[#86868B] mt-1">
                  {o.distanceToParadipNm.toLocaleString()} nm to Paradip
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px] font-mono">
                  <span className="text-[#86868B]">Draft Cap:</span>
                  <span className="text-[#30D158] font-semibold">{o.loadDraftCap.toFixed(1)} m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* EDIT PORT MODAL */}
      <AnimatePresence>
        {editingPort && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-[#0A0E14] border border-white/20 p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 className="text-base font-semibold text-white">
                  Edit Port Parameters: {editingPort.name}
                </h3>
                <button
                  onClick={() => setEditingPort(null)}
                  className="text-[#86868B] hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePort} className="flex flex-col gap-3 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[#86868B] block mb-1">Max Draft (m)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={editingPort.maxDraft}
                      onChange={(e) =>
                        setEditingPort({ ...editingPort, maxDraft: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[#86868B] block mb-1">Max LOA (m)</label>
                    <input
                      type="number"
                      value={editingPort.maxLoa}
                      onChange={(e) =>
                        setEditingPort({ ...editingPort, maxLoa: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[#86868B] block mb-1">Max Beam (m)</label>
                    <input
                      type="number"
                      value={editingPort.maxBeam}
                      onChange={(e) =>
                        setEditingPort({ ...editingPort, maxBeam: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#86868B] block mb-1">Wait Prior (days)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={editingPort.waitPriorDays}
                      onChange={(e) =>
                        setEditingPort({
                          ...editingPort,
                          waitPriorDays: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[#86868B] block mb-1">Discharge Rate (t/day)</label>
                    <input
                      type="number"
                      step={1000}
                      value={editingPort.dischargeRate}
                      onChange={(e) =>
                        setEditingPort({
                          ...editingPort,
                          dischargeRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#86868B] block mb-1">Confidence</label>
                  <select
                    value={editingPort.confidence}
                    onChange={(e) => setEditingPort({ ...editingPort, confidence: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                  >
                    <option value="high" className="bg-[#0A0E14]">High</option>
                    <option value="med" className="bg-[#0A0E14]">Medium</option>
                    <option value="low" className="bg-[#0A0E14]">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#86868B] block mb-1">Source Reference</label>
                  <input
                    type="text"
                    value={editingPort.source}
                    onChange={(e) => setEditingPort({ ...editingPort, source: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[#86868B] block mb-1">Operational Notes</label>
                  <textarea
                    rows={2}
                    value={editingPort.notes}
                    onChange={(e) => setEditingPort({ ...editingPort, notes: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingPort(null)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] text-white font-medium flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save & Persist'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDIT VESSEL MODAL */}
        {editingVessel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-[#0A0E14] border border-white/20 p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 className="text-base font-semibold text-white">
                  Edit Vessel Specs: {editingVessel.name}
                </h3>
                <button
                  onClick={() => setEditingVessel(null)}
                  className="text-[#86868B] hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveVessel} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="text-[#86868B] block mb-1">DWT (Deadweight Tonnes)</label>
                  <input
                    type="number"
                    value={editingVessel.dwt}
                    onChange={(e) =>
                      setEditingVessel({ ...editingVessel, dwt: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#86868B] block mb-1">LOA (m)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={editingVessel.loa}
                      onChange={(e) =>
                        setEditingVessel({ ...editingVessel, loa: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[#86868B] block mb-1">Beam (m)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={editingVessel.beam}
                      onChange={(e) =>
                        setEditingVessel({ ...editingVessel, beam: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#86868B] block mb-1">Design Draft (m)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={editingVessel.designDraft}
                      onChange={(e) =>
                        setEditingVessel({
                          ...editingVessel,
                          designDraft: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[#86868B] block mb-1">Bunker Burn (t/day)</label>
                    <input
                      type="number"
                      step={1}
                      value={editingVessel.burnPerDay}
                      onChange={(e) =>
                        setEditingVessel({
                          ...editingVessel,
                          burnPerDay: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingVessel(null)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] text-white font-medium flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save & Persist'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Shield, Send, CheckCircle, Clock, Building, DollarSign } from 'lucide-react';
import { formatUsdc } from '@/lib/stellar';

interface BiddingRoomProps {
  batches: any[];
  selectedBatch: any;
  setSelectedBatch: (b: any) => void;
  walletAddress: string;
  onRefresh: () => void;
}

export default function BiddingRoom({
  batches,
  selectedBatch,
  setSelectedBatch,
  walletAddress,
  onRefresh,
}: BiddingRoomProps) {
  const [brokerName, setBrokerName] = useState('Agencia Despachante Acreditada Bolivia SRL');
  const [freightCost, setFreightCost] = useState(240);
  const [customsCost, setCustomsCost] = useState(160);
  const [domesticCost, setDomesticCost] = useState(90);
  const [estimatedDays, setEstimatedDays] = useState(45);
  const [bondPercent, setBondPercent] = useState(5);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const batch = selectedBatch || batches[0];

  const totalQuote = freightCost + customsCost + domesticCost;
  const targetUsdc = batch?.onchain ? Number(formatUsdc(batch.onchain.targetAmount)) : 3000;
  const bondRequired = Math.round((targetUsdc * bondPercent) / 100);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) return;

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/batches/${batch.batchId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerAddress: walletAddress,
          brokerName,
          freightCostUsdc: freightCost,
          customsClearanceUsdc: customsCost,
          domesticDeliveryUsdc: domesticCost,
          totalQuoteUsdc: totalQuote,
          estimatedDays,
          bondRequired,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setMsg({ text: '¡Cotización vinculante registrada exitosamente en Neon y lista para adjudicación!' });
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleLockBond = async () => {
    setLoading(true);
    setMsg(null);
    try {
      // Simulación de interacción on-chain: lock_broker_bond
      await new Promise((r) => setTimeout(r, 1500));
      setMsg({ text: `¡Fianza de $${bondRequired} USDC bloqueada en el Escrow! Estado: FundedAndBondedLocked.` });
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Selector Banner */}
      <div className="glass-card-highlight p-6 rounded-2xl border border-[#F39C12]/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#F5B041] font-mono font-bold">
            Módulo B2B • Agencias Despachantes de Aduana (Ley Nº 1990)
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Sala de Licitación Logística y Depósito de Fianza (Bond)</h2>
        </div>

        {/* Batch Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-[#94A3B8] whitespace-nowrap">Lote Activo:</label>
          <select
            value={batch?.batchId}
            onChange={(e) => {
              const b = batches.find((x) => x.batchId === e.target.value);
              if (b) setSelectedBatch(b);
            }}
            className="px-3 py-1.5 rounded-xl glass-input text-xs bg-[#04120e] text-white font-mono"
          >
            {batches.map((b) => (
              <option key={b.batchId} value={b.batchId}>
                Lote #{b.batchId} - {b.sku}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bidding Form */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-[#165B48]/40 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 pb-3 border-b border-[#165B48]/30">
            <Building className="w-4 h-4 text-[#F39C12]" />
            <span>Presentar Oferta Logística y Fianza Dinámica</span>
          </h3>

          <form onSubmit={handleSubmitBid} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] text-[#94A3B8] mb-1 font-semibold">
                Razón Social de la Agencia Despachante
              </label>
              <input
                type="text"
                required
                value={brokerName}
                onChange={(e) => setBrokerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono">
              <div>
                <label className="block text-[10px] text-[#94A3B8] mb-1">Flete Int. ($USDC)</label>
                <input
                  type="number"
                  min="0"
                  value={freightCost}
                  onChange={(e) => setFreightCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#94A3B8] mb-1">Aduana / DIM ($USDC)</label>
                <input
                  type="number"
                  min="0"
                  value={customsCost}
                  onChange={(e) => setCustomsCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#94A3B8] mb-1">Entrega Local ($USDC)</label>
                <input
                  type="number"
                  min="0"
                  value={domesticCost}
                  onChange={(e) => setDomesticCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-white font-bold"
                />
              </div>
            </div>

            {/* Dynamic Bonding Slider */}
            <div className="p-3.5 rounded-xl bg-[#04120e] border border-[#165B48]/30 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#94A3B8] flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>Fianza de Cumplimiento (Bond):</span>
                </span>
                <span className="text-[#F5B041] font-bold">{bondPercent}% (${bondRequired} USDC)</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="10"
                step="0.5"
                value={bondPercent}
                onChange={(e) => setBondPercent(parseFloat(e.target.value))}
                className="w-full accent-[#F39C12]"
              />
              <div className="flex justify-between text-[10px] text-[#94A3B8]">
                <span>Nivel 2 (+10 lotes): 1.5%</span>
                <span>Nivel 1 (Verificado): 3.0%</span>
                <span>Nivel 0 (Génesis): 5.0%</span>
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-3.5 rounded-xl bg-[#081c16] border border-[#F39C12]/30 flex justify-between items-center text-xs">
              <div>
                <span className="text-[#94A3B8] block text-[10px]">Cotización Total Consolidada</span>
                <span className="text-base font-bold text-white font-mono">${totalQuote} USDC</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px]">Tiempo Estimado Entrega</span>
                <span className="text-base font-bold text-[#34D399] font-mono">{estimatedDays} días</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-4 rounded-xl bg-[#0F382C] hover:bg-[#165B48] text-[#F5B041] border border-[#F39C12]/40 font-bold transition-colors flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Presentar Cotización</span>
              </button>

              <button
                type="button"
                onClick={handleLockBond}
                disabled={loading}
                className="py-2.5 px-4 rounded-xl bg-[#F39C12] hover:bg-[#E58E0B] text-black font-bold transition-all shadow-md shadow-[#F39C12]/20 flex items-center justify-center space-x-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Bloquear Fianza (${bondRequired} USDC)</span>
              </button>
            </div>

            {msg && (
              <div
                className={`p-3 rounded-lg text-xs font-mono ${
                  msg.isError
                    ? 'bg-red-950/40 text-[#F87171] border border-red-500/30'
                    : 'bg-emerald-950/40 text-[#34D399] border border-emerald-500/30'
                }`}
              >
                {msg.text}
              </div>
            )}
          </form>
        </div>

        {/* Right: Existing Bids in Neon */}
        <div className="glass-card p-6 rounded-2xl border border-[#165B48]/40 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white pb-3 border-b border-[#165B48]/30 mb-3">
              Ofertas Recibidas en Neon DB
            </h3>

            <div className="space-y-3">
              {batch?.bids && batch.bids.length > 0 ? (
                batch.bids.map((bid: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#04120e] border border-[#165B48]/40 space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between text-white font-bold font-sans">
                      <span className="truncate">{bid.brokerName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                        {bid.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-[#94A3B8]">
                      <span>Cotización Total:</span>
                      <span className="text-[#F5B041] font-bold">${bid.totalQuoteUsdc} USDC</span>
                    </div>

                    <div className="flex justify-between text-[11px] text-[#94A3B8]">
                      <span>Fianza (Bond):</span>
                      <span className="text-white">${bid.bondRequired} USDC</span>
                    </div>

                    <div className="flex justify-between text-[11px] text-[#94A3B8]">
                      <span>Tiempo estimado:</span>
                      <span className="text-[#38BDF8]">{bid.estimatedDays} días</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-[#94A3B8] text-xs">
                  No hay cotizaciones previas para este lote. Sé la primera agencia en presentar oferta.
                </div>
              )}
            </div>
          </div>

          {/* Legal Box */}
          <div className="mt-4 p-3 rounded-xl bg-[#081c16] border border-white/5 text-[11px] text-[#94A3B8] space-y-1">
            <span className="font-bold text-white block">Marco Normativo:</span>
            <span>
              Licitación bajo la Ley General de Aduanas Nº 1990 y DS Nº 25870. La fianza se restituye íntegramente al completarse el Hito 3.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

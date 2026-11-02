'use client';

import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatUsdc } from '@/lib/stellar';

interface JoinBatchModalProps {
  batch: any;
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onSuccess: () => void;
}

export default function JoinBatchModal({
  batch,
  isOpen,
  onClose,
  walletAddress,
  onSuccess,
}: JoinBatchModalProps) {
  const [units, setUnits] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);

  if (!isOpen || !batch) return null;

  const onchain = batch.onchain;
  const committedUnits = onchain ? onchain.committedUnits : 30;
  const moqTotal = onchain ? onchain.moqTotalUnits : 100;
  const remainingUnits = Math.max(0, moqTotal - committedUnits);
  const unitPriceUsdc = onchain ? Number(formatUsdc(onchain.unitPrice)) : 30;
  const totalCostUsdc = (units * unitPriceUsdc).toFixed(2);

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    setSuccessTx(null);

    try {
      if (units <= 0 || units > remainingUnits) {
        throw new Error(`Debes comprar entre 1 y ${remainingUnits} unidades disponibles.`);
      }

      // Simulación de interacción on-chain directa contra Soroban
      // En producción invocará escrowClient.join_open_batch con la firma de walletAddress
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccessTx('Simulada exitosamente en Testnet (o vía CLI / Freighter)');
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Error al enviar depósito a Soroban Escrow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="glass-card-highlight w-full max-w-lg rounded-2xl p-6 border border-[#F39C12]/40 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#165B48]/40">
          <div>
            <span className="text-[11px] font-mono text-[#F5B041] uppercase tracking-wider font-bold">
              Unirse al Lote #{batch.batchId}
            </span>
            <h3 className="text-lg font-bold text-white line-clamp-1">{batch.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          {/* Summary Box */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#04120e]/80 border border-[#165B48]/30 font-mono text-xs">
            <div>
              <span className="text-[#94A3B8] block text-[10px]">Unidades Disponibles</span>
              <span className="text-base font-bold text-[#34D399]">{remainingUnits} u.</span>
            </div>
            <div>
              <span className="text-[#94A3B8] block text-[10px]">Precio por Unidad</span>
              <span className="text-base font-bold text-white">${unitPriceUsdc} USDC</span>
            </div>
          </div>

          {/* Unit Input */}
          <div>
            <label className="block text-xs font-semibold text-[#E2E8F0] mb-1.5">
              ¿Cuántas unidades deseas comprar?
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                max={remainingUnits}
                value={units}
                onChange={(e) => setUnits(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-base font-mono font-bold"
                placeholder="Ej. 10"
              />
              <span className="text-xs text-[#94A3B8] whitespace-nowrap">unidades</span>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex items-center space-x-2">
            {[5, 10, 20, remainingUnits].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setUnits(Math.min(q, remainingUnits))}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#0F382C]/60 hover:bg-[#0F382C] text-[#F5B041] border border-[#F39C12]/20 font-mono"
              >
                {q === remainingUnits ? `Max (${q})` : `+${q}`}
              </button>
            ))}
          </div>

          {/* Calculation */}
          <div className="p-4 rounded-xl bg-[#081c16] border border-[#F39C12]/30 space-y-2">
            <div className="flex justify-between text-xs text-[#94A3B8]">
              <span>Monto a depositar en Escrow:</span>
              <span className="font-mono text-white">${totalCostUsdc} USDC</span>
            </div>
            <div className="flex justify-between text-xs text-[#94A3B8]">
              <span>Billetera pagadora:</span>
              <span className="font-mono text-[#38BDF8]">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold text-white">
              <span className="text-[#F5B041]">Total Compromiso On-Chain:</span>
              <span className="font-mono text-lg text-gradient-gold">${totalCostUsdc} USDC</span>
            </div>
          </div>

          {/* Security Banner */}
          <div className="flex items-start space-x-2 text-[11px] text-[#94A3B8] bg-[#04120e] p-3 rounded-lg border border-[#165B48]/30">
            <ShieldCheck className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
            <span>
              Tus USDC quedan bloqueados en el contrato inteligente de Soroban. Si no se alcanza el 100% del MOQ antes del plazo, podrás retirar el 100% de tus fondos sin pedir permiso.
            </span>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-xs text-[#F87171] bg-red-950/40 p-3 rounded-lg border border-red-500/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successTx && (
            <div className="flex items-center space-x-2 text-xs text-[#34D399] bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>¡Depósito registrado exitosamente en el Escrow!</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#165B48]/40 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleJoin}
            disabled={loading || units <= 0 || units > remainingUnits}
            className="px-5 py-2.5 rounded-lg bg-[#F39C12] hover:bg-[#E58E0B] disabled:opacity-50 text-black font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-[#F39C12]/20"
          >
            {loading ? (
              <span>Firmando en Soroban...</span>
            ) : (
              <>
                <span>Confirmar y Depositar ${totalCostUsdc} USDC</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

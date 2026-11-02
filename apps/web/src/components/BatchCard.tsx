'use client';

import React from 'react';
import Image from 'next/image';
import { formatUsdc, BATCH_STATUS_META } from '@/lib/stellar';
import { Users, Clock, Shield, ArrowUpRight, CheckCircle, AlertTriangle } from 'lucide-react';

interface BatchCardProps {
  batch: any;
  onJoinClick: (batch: any) => void;
  onTrackClick: (batch: any) => void;
  onBidClick?: (batch: any) => void;
}

export default function BatchCard({
  batch,
  onJoinClick,
  onTrackClick,
  onBidClick,
}: BatchCardProps) {
  const onchain = batch.onchain;
  const committedUnits = onchain ? onchain.committedUnits : 30;
  const moqTotal = onchain ? onchain.moqTotalUnits : 100;
  const unitPriceUsdc = onchain
    ? formatUsdc(onchain.unitPrice)
    : '30.00';
  const collectedUsdc = onchain
    ? formatUsdc(onchain.collectedAmount)
    : '900.00';
  const status = onchain ? onchain.status : 0;
  const statusMeta = BATCH_STATUS_META[status] || BATCH_STATUS_META[0];

  const percent = Math.min(100, Math.round((committedUnits / moqTotal) * 100));
  const remainingUnits = Math.max(0, moqTotal - committedUnits);

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col group border border-[#165B48]/40 hover:border-[#F39C12]/50 transition-all duration-300">
      {/* Top Media & Tags */}
      <div className="relative h-48 w-full overflow-hidden bg-[#04120e]">
        <Image
          src={batch.imageUrl || '/assets/hero_ship.jpg'}
          alt={batch.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081c16] via-transparent to-black/40"></div>

        {/* Badges on Image */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#F5B041] border border-[#F39C12]/30 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F39C12]"></span>
            <span>Lote #{batch.batchId}</span>
          </span>

          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md border ${statusMeta.badgeClass}`}
          >
            {statusMeta.label}
          </span>
        </div>

        {/* Origin to Destination */}
        <div className="absolute bottom-3 left-3 flex items-center space-x-1 text-xs text-[#E2E8F0] font-medium bg-[#04120e]/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
          <span>{batch.originCity || 'Shenzhen, CN'}</span>
          <span className="text-[#F39C12]">→</span>
          <span className="text-[#34D399] font-bold">{batch.targetDepartment || 'La Paz, BO'}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & NANDINA */}
          <div className="flex items-center space-x-2 text-[11px] text-[#94A3B8] font-mono mb-2">
            <span className="text-[#38BDF8]">{batch.category || 'General'}</span>
            <span>•</span>
            <span className="truncate">{batch.nandinaCode || 'NANDINA Estandarizada'}</span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-white group-hover:text-[#F5B041] transition-colors line-clamp-2 mb-2">
            {batch.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed mb-4">
            {batch.description}
          </p>
        </div>

        {/* MOQ Progress Box */}
        <div className="bg-[#04120e]/60 rounded-xl p-3.5 border border-[#165B48]/30 mb-4">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-[#94A3B8] flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-[#F39C12]" />
              <span>Progreso MOQ:</span>
            </span>
            <span className="text-white font-mono">
              <span className="text-[#34D399] font-bold">{committedUnits}</span> / {moqTotal} u. ({percent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-[#0F382C]/50 rounded-full overflow-hidden p-0.5 border border-[#165B48]/40">
            <div
              className="h-full bg-gradient-to-r from-[#10B981] via-[#F5B041] to-[#F39C12] rounded-full transition-all duration-700"
              style={{ width: `${percent}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mt-2 font-mono">
            <span>Faltan: <strong className="text-[#F5B041]">{remainingUnits} u.</strong></span>
            <span>Recaudado: <strong className="text-white">${collectedUsdc} USDC</strong></span>
          </div>
        </div>

        {/* Pricing & Footer Actions */}
        <div>
          <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-[#165B48]/30">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold">Precio Unitario</div>
              <div className="text-lg font-black text-white font-mono">
                ${unitPriceUsdc} <span className="text-xs text-[#94A3B8] font-normal">USDC / u.</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold">Límite Fondeo</div>
              <div className="text-xs text-[#34D399] font-mono flex items-center space-x-1">
                <Clock className="w-3 h-3 text-[#F39C12]" />
                <span>En Plazo</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {status === 0 && remainingUnits > 0 ? (
              <button
                onClick={() => onJoinClick(batch)}
                className="col-span-1 py-2 px-3 rounded-lg bg-[#F39C12] hover:bg-[#E58E0B] text-black font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-[#F39C12]/20 hover:scale-[1.02]"
              >
                <span>Unirse al Lote</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onTrackClick(batch)}
                className="col-span-1 py-2 px-3 rounded-lg bg-[#165B48] hover:bg-[#165B48]/80 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>Ver Hitos Escrow</span>
              </button>
            )}

            <button
              onClick={() => onTrackClick(batch)}
              className="col-span-1 py-2 px-3 rounded-lg bg-[#04120e] hover:bg-[#081c16] text-[#E2E8F0] font-semibold text-xs border border-[#165B48] hover:border-[#F39C12]/40 transition-colors flex items-center justify-center space-x-1"
            >
              <Shield className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Rastreo On-Chain</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

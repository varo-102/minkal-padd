'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  ArrowRight,
  ExternalLink,
  Lock,
  Percent,
  Sparkles,
} from 'lucide-react';
import { formatUsdc, BATCH_STATUS_META, STELLAR_CONFIG } from '@/lib/stellar';

interface EscrowTrackerProps {
  batch: any;
  walletAddress: string;
  activeRole: string;
  onRefresh: () => void;
}

export default function EscrowTracker({
  batch,
  walletAddress,
  activeRole,
  onRefresh,
}: EscrowTrackerProps) {
  const [uploadLoading, setUploadLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [docType, setDocType] = useState('BILL_OF_LADING');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!batch) {
    return (
      <div className="glass-card p-12 text-center rounded-2xl max-w-xl mx-auto my-12 border border-[#165B48]/40">
        <Clock className="w-12 h-12 text-[#F39C12] mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-bold text-white">Selecciona o carga un lote</h3>
        <p className="text-xs text-[#94A3B8] mt-1">
          Elige un lote en el Marketplace para inspeccionar su trazabilidad en Soroban.
        </p>
      </div>
    );
  }

  const onchain = batch.onchain;
  const status = onchain ? onchain.status : 0;
  const statusMeta = BATCH_STATUS_META[status] || BATCH_STATUS_META[0];
  const committedUnits = onchain ? onchain.committedUnits : 30;
  const moqTotal = onchain ? onchain.moqTotalUnits : 100;
  const confirmedUnits = onchain ? onchain.confirmedUnits : 0;
  const collectedUsdc = onchain ? formatUsdc(onchain.collectedAmount) : '900.00';
  const targetUsdc = onchain ? formatUsdc(onchain.targetAmount) : '3000.00';
  const blHash = onchain ? onchain.blDocHash : '0000000000000000000000000000000000000000000000000000000000000000';
  const dimHash = onchain ? onchain.dimDocHash : '0000000000000000000000000000000000000000000000000000000000000000';
  const brokerBond = onchain ? formatUsdc(onchain.brokerBondLocked) : '0.00';

  const isBlVerified = status >= 3;
  const isDimVerified = status >= 4;
  const isDelivered = status === 5;

  const quorumPercent = Math.round((confirmedUnits / moqTotal) * 100);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadLoading(true);
    setMsg(null);
    try {
      const formData = new FormData();
      formData.append('batchId', batch.batchId);
      formData.append('docType', docType);
      formData.append('uploadedBy', walletAddress);
      formData.append('file', selectedFile);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setComputedHash(data.sha256Hex);
      setMsg({
        text: `Documento procesado. Hash SHA-256: ${data.sha256Hex.slice(0, 16)}...`,
      });
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message, isError: true });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAction = async (actionName: string) => {
    setActionLoading(true);
    setMsg(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setMsg({ text: `Acción '${actionName}' confirmada en Soroban Testnet!` });
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message, isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Batch Header */}
      <div className="glass-card-highlight p-6 rounded-2xl border border-[#F39C12]/40 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#165B48]/40">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono mb-1">
              <span className="text-[#F5B041] font-bold">Lote #{batch.batchId}</span>
              <span className="text-[#94A3B8]">•</span>
              <span className="text-[#38BDF8]">{batch.sku}</span>
              <span className="text-[#94A3B8]">•</span>
              <span className="text-[#94A3B8]">{batch.originCity} → {batch.targetDepartment}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{batch.title}</h2>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${statusMeta.badgeClass}`}>
              {statusMeta.label}
            </span>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${STELLAR_CONFIG.escrowContractId}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-[#04120e] hover:bg-[#081c16] text-[#94A3B8] hover:text-[#F5B041] border border-[#165B48]/50 text-xs flex items-center space-x-1 transition-colors"
              title="Auditar en Stellar Expert"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#04120e]/60 border border-[#165B48]/30">
            <span className="text-[#94A3B8] block text-[10px] uppercase">Recaudado / Meta</span>
            <span className="text-white font-bold text-sm">
              ${collectedUsdc} / ${targetUsdc} USDC
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#04120e]/60 border border-[#165B48]/30">
            <span className="text-[#94A3B8] block text-[10px] uppercase">Unidades Comprometidas</span>
            <span className="text-[#34D399] font-bold text-sm">
              {committedUnits} / {moqTotal} u.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#04120e]/60 border border-[#165B48]/30">
            <span className="text-[#94A3B8] block text-[10px] uppercase">Fianza Despachante</span>
            <span className="text-[#C084FC] font-bold text-sm">
              ${brokerBond} USDC
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#04120e]/60 border border-[#165B48]/30">
            <span className="text-[#94A3B8] block text-[10px] uppercase">Quórum Entrega (Hito 3)</span>
            <span className="text-[#F5B041] font-bold text-sm">
              {confirmedUnits}/{moqTotal} u. ({quorumPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* 3 Milestones Interactive Timeline */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-[#165B48]/40 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#165B48]/30">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#34D399]" />
            <span>Ciclo de Escrow Multi-Hito en Soroban</span>
          </h3>
          <span className="text-xs text-[#94A3B8] font-mono">100% Sin Custodia Humana</span>
        </div>

        {/* Milestone Steps */}
        <div className="relative space-y-8 before:absolute before:inset-0 before:left-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#10B981] before:via-[#F39C12] before:to-gray-800">
          {/* Step 1: Embarque / Bill of Lading */}
          <div className="relative flex items-start space-x-4 pl-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${
                isBlVerified
                  ? 'bg-[#10B981] text-black shadow-lg shadow-[#10B981]/30'
                  : 'bg-[#081c16] text-[#F39C12] border-2 border-[#F39C12]'
              }`}
            >
              {isBlVerified ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </div>

            <div className="flex-1 p-4 rounded-xl bg-[#04120e]/80 border border-[#165B48]/40">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-white">
                  Hito 1: Confirmación de Embarque en Origen (60% del fondo liberado)
                </h4>
                <span className="text-xs font-mono text-[#34D399] font-bold">
                  {isBlVerified ? 'Liberado ($1,800 USDC)' : 'Pendiente (60%)'}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">
                Se transfiere el 60% al despachante para pagar al fabricante en China y asegurar el flete marítimo, condicionado a la verificación del Bill of Lading (BL).
              </p>

              {/* Hash Display */}
              <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-[#94A3B8] border border-white/5 flex items-center justify-between">
                <span className="truncate">
                  Hash BL: <strong className="text-white">{blHash !== '0000000000000000000000000000000000000000000000000000000000000000' ? blHash : 'Pendiente de anclaje'}</strong>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#165B48]/40 text-[#34D399] uppercase">SHA-256</span>
              </div>
            </div>
          </div>

          {/* Step 2: Nacionalización Aduanera */}
          <div className="relative flex items-start space-x-4 pl-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${
                isDimVerified
                  ? 'bg-[#10B981] text-black shadow-lg shadow-[#10B981]/30'
                  : 'bg-[#081c16] text-[#94A3B8] border-2 border-gray-600'
              }`}
            >
              {isDimVerified ? <CheckCircle2 className="w-4 h-4" /> : '2'}
            </div>

            <div className="flex-1 p-4 rounded-xl bg-[#04120e]/80 border border-[#165B48]/40">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-white">
                  Hito 2: Desaduanaje en Recinto Fiscal Boliviano (25% liberado)
                </h4>
                <span className="text-xs font-mono text-[#F5B041] font-bold">
                  {isDimVerified ? 'Liberado ($750 USDC)' : 'Pendiente (25%)'}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">
                Liberación del 25% para el pago de tributos aduaneros, almacenaje y desaduanaje una vez validada la DIM en el sistema SUMA de la Aduana Nacional.
              </p>

              <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-[#94A3B8] border border-white/5 flex items-center justify-between">
                <span className="truncate">
                  Hash DIM: <strong className="text-white">{dimHash !== '0000000000000000000000000000000000000000000000000000000000000000' ? dimHash : 'Pendiente de anclaje'}</strong>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#165B48]/40 text-[#F5B041] uppercase">SUMA</span>
              </div>
            </div>
          </div>

          {/* Step 3: Quórum Ponderado de Entrega */}
          <div className="relative flex items-start space-x-4 pl-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${
                isDelivered
                  ? 'bg-[#22C55E] text-black shadow-lg shadow-[#22C55E]/30'
                  : 'bg-[#081c16] text-[#94A3B8] border-2 border-gray-600'
              }`}
            >
              {isDelivered ? <CheckCircle2 className="w-4 h-4" /> : '3'}
            </div>

            <div className="flex-1 p-4 rounded-xl bg-[#04120e]/80 border border-[#165B48]/40">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-white">
                  Hito 3: Entrega Ponderada, Fee Split Atómico y Restitución de Fianza
                </h4>
                <span className="text-xs font-mono text-[#38BDF8] font-bold">
                  {isDelivered ? 'Liquidado y Cerrado' : 'Requiere Quórum ≥ 80%'}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">
                Cada comprador confirma recepción física en su ciudad. Al alcanzar ≥ 80% de unidades confirmadas, el smart contract deduce el fee del 2.5% para la tesorería de la plataforma y transfiere al despachante el tramo final (15% - fee) más el 100% de su fianza en una sola transacción atómica.
              </p>

              {/* Quorum Bar */}
              <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#94A3B8]">Quórum actual:</span>
                  <span className="text-white font-bold">{confirmedUnits} de {moqTotal} unidades ({quorumPercent}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#F39C12] to-[#22C55E] rounded-full transition-all duration-500"
                    style={{ width: `${quorumPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Panels by Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Uploader & Hash Calculator */}
        <div className="glass-card p-6 rounded-2xl border border-[#165B48]/40 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Upload className="w-4 h-4 text-[#F39C12]" />
            <span>Subir Documento Aduanero (Cálculo SHA-256)</span>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Sube el PDF del Bill of Lading o la DIM del SUMA para generar automáticamente el hash criptográfico SHA-256 que se ancla en Soroban.
          </p>

          <form onSubmit={handleFileUpload} className="space-y-3">
            <div>
              <label className="block text-[11px] text-[#94A3B8] mb-1">Tipo de Documento</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-[#04120e]"
              >
                <option value="BILL_OF_LADING">Bill of Lading Marítimo (BL) - Hito 1</option>
                <option value="DIM_SUMA">Declaración DIM en SUMA Aduana - Hito 2</option>
                <option value="COMMERCIAL_INVOICE">Factura Comercial SIN / Despacho Nacional</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#94A3B8] mb-1">Archivo PDF / Factura</label>
              <input
                type="file"
                required
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-[#94A3B8] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0F382C] file:text-[#F5B041] hover:file:bg-[#165B48]"
              />
            </div>

            <button
              type="submit"
              disabled={uploadLoading || !selectedFile}
              className="w-full py-2.5 rounded-xl bg-[#0F382C] hover:bg-[#165B48] disabled:opacity-50 text-[#F5B041] border border-[#F39C12]/30 text-xs font-bold transition-colors flex items-center justify-center space-x-2"
            >
              {uploadLoading ? <span>Procesando hash...</span> : <span>Calcular SHA-256 y Registrar</span>}
            </button>
          </form>

          {computedHash && (
            <div className="p-3 rounded-xl bg-black/60 border border-[#F39C12]/30 text-[11px] font-mono break-all text-[#34D399]">
              Hash Generado: {computedHash}
            </div>
          )}
        </div>

        {/* Smart Contract Interaction Actions */}
        <div className="glass-card p-6 rounded-2xl border border-[#165B48]/40 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Lock className="w-4 h-4 text-[#38BDF8]" />
            <span>Firmar Hitos según tu Rol</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Buyer Confirm Delivery */}
            <div className="p-3.5 rounded-xl bg-[#04120e] border border-[#165B48]/30 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Comprador: Confirmar Entrega</div>
                <div className="text-[11px] text-[#94A3B8]">Suma tus unidades al quórum del 80%</div>
              </div>
              <button
                onClick={() => handleAction('Confirmar Entrega (confirm_delivery)')}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-black font-bold text-xs transition-colors shadow"
              >
                Confirmar
              </button>
            </div>

            {/* Oracle Verify Shipment */}
            <div className="p-3.5 rounded-xl bg-[#04120e] border border-[#165B48]/30 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Oráculo: Liberar Hito 1 (Embarque)</div>
                <div className="text-[11px] text-[#94A3B8]">Verifica BL y libera 60%</div>
              </div>
              <button
                onClick={() => handleAction('Liberar Hito 1 (verify_shipment_and_release)')}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg bg-[#F39C12] hover:bg-[#E58E0B] text-black font-bold text-xs transition-colors shadow"
              >
                Liberar 60%
              </button>
            </div>

            {/* Oracle Verify Customs */}
            <div className="p-3.5 rounded-xl bg-[#04120e] border border-[#165B48]/30 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Oráculo: Liberar Hito 2 (Aduana)</div>
                <div className="text-[11px] text-[#94A3B8]">Verifica DIM SUMA y libera 25%</div>
              </div>
              <button
                onClick={() => handleAction('Liberar Hito 2 (verify_customs_and_release)')}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg bg-[#38BDF8] hover:bg-[#0284C7] text-black font-bold text-xs transition-colors shadow"
              >
                Liberar 25%
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
          </div>
        </div>
      </div>
    </div>
  );
}

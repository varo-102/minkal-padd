'use client';

import React, { useState } from 'react';
import { X, Plus, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onSuccess: () => void;
  nextBatchId: number;
}

export default function CreateBatchModal({
  isOpen,
  onClose,
  walletAddress,
  onSuccess,
  nextBatchId,
}: CreateBatchModalProps) {
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [nandinaCode, setNandinaCode] = useState('8504.40.90.00');
  const [category, setCategory] = useState('Energía Solar y Renovables');
  const [description, setDescription] = useState('');
  const [moqTotalUnits, setMoqTotalUnits] = useState(100);
  const [unitPrice, setUnitPrice] = useState(30);
  const [anchorUnits, setAnchorUnits] = useState(30);
  const [daysDeadline, setDaysDeadline] = useState(7);
  const [originCity, setOriginCity] = useState('Shenzhen, China');
  const [targetDepartment, setTargetDepartment] = useState('La Paz / Santa Cruz');
  const [isDomestic, setIsDomestic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalTargetUsdc = (moqTotalUnits * unitPrice).toFixed(2);
  const anchorDepositUsdc = (anchorUnits * unitPrice).toFixed(2);
  const anchorPercent = Math.round((anchorUnits / moqTotalUnits) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!title || !sku) {
        throw new Error('Título y SKU son obligatorios.');
      }
      if (anchorUnits <= 0 || anchorUnits > moqTotalUnits) {
        throw new Error('Las unidades iniciales del ancla deben ser mayores a 0 y menores o iguales al MOQ total.');
      }

      // Guardar metadatos en Neon PostgreSQL
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: nextBatchId,
          title,
          description,
          sku,
          nandinaCode,
          category,
          imageUrl: '/assets/hero_ship.jpg',
          originCity,
          targetDepartment,
          isDomestic,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar metadatos en base de datos');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al crear el lote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="glass-card-highlight w-full max-w-2xl rounded-2xl p-6 border border-[#F39C12]/40 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#165B48]/40">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-[#0F382C] text-[#F39C12] border border-[#F39C12]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#F5B041] uppercase tracking-wider font-bold">
                Lanzar Lote • Modelo Importador Ancla (Día 1)
              </span>
              <h3 className="text-xl font-bold text-white">Nuevo Lote Mayorista #{nextBatchId}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Modalidad Toggle */}
          <div className="grid grid-cols-2 gap-3 p-1.5 rounded-xl bg-[#04120e] border border-[#165B48]/40">
            <button
              type="button"
              onClick={() => {
                setIsDomestic(false);
                setOriginCity('Shenzhen, China');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                !isDomestic
                  ? 'bg-[#0F382C] text-[#F5B041] border border-[#F39C12]/40 shadow'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              🚢 Importación Internacional (Asia → Bolivia, 3 Hitos)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDomestic(true);
                setOriginCity('Planta Industrial, Bolivia');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                isDomestic
                  ? 'bg-[#0F382C] text-[#F5B041] border border-[#F39C12]/40 shadow'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              🏭 Compra Mayorista Nacional (Fabricante BO, 2 Hitos)
            </button>
          </div>

          {/* Title & SKU */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#E2E8F0] mb-1">
                Nombre del Producto / Ficha Técnica *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Baterías de Litio LiFePO4 48V 100Ah"
                className="w-full px-3 py-2 rounded-xl glass-input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#E2E8F0] mb-1">
                Código SKU *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="LITHIUM-48V-100"
                className="w-full px-3 py-2 rounded-xl glass-input text-sm font-mono"
              />
            </div>
          </div>

          {/* NANDINA & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#E2E8F0] mb-1">
                Partida Arancelaria NANDINA
              </label>
              <input
                type="text"
                value={nandinaCode}
                onChange={(e) => setNandinaCode(e.target.value)}
                placeholder="8507.60.00.00"
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#E2E8F0] mb-1">
                Categoría Industrial
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-[#04120e]"
              >
                <option value="Energía Solar y Renovables">Energía Solar y Renovables</option>
                <option value="Tecnología y Redes">Tecnología y Redes</option>
                <option value="Envases, Empaques y Plásticos">Envases, Empaques y Plásticos</option>
                <option value="Insumos Alimentarios y HoReCa">Insumos Alimentarios y HoReCa</option>
                <option value="Insumos Textiles y Confección">Insumos Textiles y Confección</option>
              </select>
            </div>
          </div>

          {/* MOQ, Price and Anchor Deposit */}
          <div className="p-4 rounded-xl bg-[#04120e]/80 border border-[#165B48]/40 space-y-3">
            <div className="text-xs font-bold text-[#F5B041] uppercase tracking-wider flex items-center justify-between">
              <span>Parámetros Financieros On-Chain (Soroban)</span>
              <span className="text-[10px] text-[#94A3B8] font-normal">USDC Nativo Stellar</span>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] text-[#94A3B8] mb-1">MOQ Total Requerido</label>
                <input
                  type="number"
                  min="1"
                  value={moqTotalUnits}
                  onChange={(e) => setMoqTotalUnits(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#94A3B8] mb-1">Precio Unitario ($USDC)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#94A3B8] mb-1">Tus Unidades Ancla (Día 1)</label>
                <input
                  type="number"
                  min="1"
                  max={moqTotalUnits}
                  value={anchorUnits}
                  onChange={(e) => setAnchorUnits(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-[#34D399] font-bold"
                />
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-2 border-t border-[#165B48]/30 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#94A3B8] block text-[11px]">Meta Total del Lote:</span>
                <span className="text-white font-bold font-mono">${totalTargetUsdc} USDC ({moqTotalUnits} u.)</span>
              </div>
              <div className="text-right">
                <span className="text-[#F5B041] block text-[11px] font-bold">Tu Depósito Inicial Obligatorio:</span>
                <span className="text-lg font-black text-gradient-gold font-mono">
                  ${anchorDepositUsdc} USDC ({anchorPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#E2E8F0] mb-1">
              Descripción detallada y condiciones de compra
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Especificaciones técnicas, garantías de fábrica, tiempos de despacho..."
              className="w-full px-3 py-2 rounded-xl glass-input text-xs"
            ></textarea>
          </div>

          {/* Commitment Notice */}
          <div className="flex items-start space-x-2 text-[11px] text-[#94A3B8] bg-[#04120e] p-3 rounded-lg border border-[#165B48]/30">
            <ShieldCheck className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
            <span>
              Al crear el lote, se requerirá firmar la transacción en Soroban transfiriendo los <strong>${anchorDepositUsdc} USDC</strong> desde tu cuenta de Importador Ancla hacia el contrato de Escrow.
            </span>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-xs text-[#F87171] bg-red-950/40 p-3 rounded-lg border border-red-500/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#165B48]/40 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || moqTotalUnits <= 0 || unitPrice <= 0 || anchorUnits <= 0}
              className="px-5 py-2.5 rounded-lg bg-[#F39C12] hover:bg-[#E58E0B] disabled:opacity-50 text-black font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-[#F39C12]/20"
            >
              {loading ? (
                <span>Publicando en Neon y Soroban...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publicar Lote y Depositar ${anchorDepositUsdc} USDC</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

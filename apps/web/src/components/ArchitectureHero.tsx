'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  TrendingUp,
  Percent,
  Calculator,
  ArrowRight,
  Layers,
  FileCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface ArchitectureHeroProps {
  onEnterDapp: () => void;
}

export default function ArchitectureHero({ onEnterDapp }: ArchitectureHeroProps) {
  // Calculator state
  const [calcUnits, setCalcUnits] = useState(25);
  const [unitPriceFob, setUnitPriceFob] = useState(15);

  // Individual import calculation:
  // Castigo MOQ en fábrica (+40%), Flete mínimo 1 CBM ($450), Póliza/IBNORCA ($200)
  const individualUnitFob = unitPriceFob * 1.4;
  const individualFixedCosts = 650;
  const individualTotal = individualUnitFob * calcUnits + individualFixedCosts;
  const individualPerUnit = (individualTotal / calcUnits).toFixed(2);

  // Minkal Colectivo calculation:
  // Precio mayorista fábrica (-0%), Costos fijos compartidos ($650 / 25 compradores = $26), Fee plataforma (2.5%)
  const minkalUnitFob = unitPriceFob;
  const minkalFixedShare = 650 / 25;
  const minkalPerUnitRaw = minkalUnitFob + minkalFixedShare / calcUnits;
  const minkalTotal = (minkalPerUnitRaw * calcUnits * 1.025).toFixed(2);
  const minkalPerUnit = (Number(minkalTotal) / calcUnits).toFixed(2);

  const savingsPercent = Math.round(
    ((individualTotal - Number(minkalTotal)) / individualTotal) * 100
  );
  const savingsTotalUsdc = (individualTotal - Number(minkalTotal)).toFixed(2);

  return (
    <div className="space-y-16 py-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden glass-card-highlight border border-[#F39C12]/40 p-8 sm:p-14 shadow-2xl">
        <div className="radial-glow-top absolute inset-0 pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0F382C] border border-[#F39C12]/40 text-xs font-mono text-[#F5B041]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>PROTOTIPO FUNCIONAL • STELLAR TESTNET</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            Primer Colectivo Aduanero On-Chain en{' '}
            <span className="text-gradient-gold">Stellar para Bolivia</span>
          </h1>

          <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Unimos la demanda de microimportadores en los 9 departamentos de Bolivia por el mismo SKU
            para comprar directo de fábrica en China, licitar agencias aduaneras con 1 solo trámite y
            custodiar cada dólar con smart contracts multi-hito en Soroban.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onEnterDapp}
              className="px-6 py-3.5 rounded-xl bg-[#F39C12] hover:bg-[#E58E0B] text-black font-extrabold text-sm transition-all shadow-xl shadow-[#F39C12]/20 hover:scale-105 flex items-center space-x-2"
            >
              <span>Explorar Lotes Activos</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#calculadora"
              className="px-6 py-3.5 rounded-xl bg-[#04120e] hover:bg-[#081c16] text-[#E2E8F0] font-bold text-sm border border-[#165B48] transition-colors flex items-center space-x-2"
            >
              <Calculator className="w-4 h-4 text-[#F39C12]" />
              <span>Calculadora de Ahorro</span>
            </a>
          </div>

          {/* Metrics Pill Grid */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#165B48]/40">
            <div>
              <div className="text-2xl font-black text-gradient-gold font-mono">25% a 45%</div>
              <div className="text-xs text-[#94A3B8]">Ahorro neto puesto en almacén</div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#34D399] font-mono">100%</div>
              <div className="text-xs text-[#94A3B8]">Sin custodia de fondos (Soroban)</div>
            </div>
            <div>
              <div className="text-2xl font-black text-[#38BDF8] font-mono">1 Trámite</div>
              <div className="text-xs text-[#94A3B8]">DIM única nacional en SUMA</div>
            </div>
          </div>
        </div>
      </div>

      {/* The 3 Pillars */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono text-[#F39C12] font-bold uppercase tracking-wider">
            Arquitectura de Negocio
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            El Motor Minkal: Solución Estructural
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-2">
            Reemplazamos el caos de WhatsApp con una plataforma coordinada que aprovecha la Ley de
            Aduanas Nº 1990 para licitar un solo despacho formal para todo el país.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-[#165B48]/40 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F382C] text-[#F39C12] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Agregación Nacional por SKU</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Compradores de La Paz, Santa Cruz y Cochabamba se coordinan en un catálogo común. Al
              alcanzar el MOQ de fábrica, se activa el precio mayorista más bajo sin intermediarios.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-[#165B48]/40 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F382C] text-[#38BDF8] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Licitación de Despachantes</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Agencias Despachantes autorizadas compiten en subasta inversa ofreciendo su tarifa más
              baja para el lote consolidado, depositando una fianza dinámica en Soroban (Dynamic Bonding).
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-[#165B48]/40 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F382C] text-[#34D399] flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">1 Solo Bill of Lading y DIM</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Toda la carga viaja bajo 1 solo BL marítimo y se desaduaniza con 1 sola DIM en el
              sistema SUMA. Las certificaciones obligatorias (IBNORCA/SENASAG) se pagan una sola vez.
            </p>
          </div>
        </div>
      </div>

      {/* Unit Economics Interactive Calculator */}
      <div id="calculadora" className="glass-card-highlight p-8 sm:p-10 rounded-3xl border border-[#F39C12]/40 shadow-2xl">
        <div className="max-w-2xl mb-8">
          <div className="text-xs font-mono text-[#F5B041] uppercase tracking-wider font-bold">
            Simulador Cuantitativo
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">Calculadora de Ahorro Unit Economics</h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            Comprueba en tiempo real cuánto dinero ahorras importando tu pedido mediante el Colectivo
            Aduanero Minkal frente a la importación individual aislada.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Controls */}
          <div className="space-y-5 bg-[#04120e]/80 p-6 rounded-2xl border border-[#165B48]/40 font-mono text-xs">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#94A3B8]">Cantidad de unidades deseadas:</span>
                <span className="text-white font-bold text-sm">{calcUnits} unidades</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={calcUnits}
                onChange={(e) => setCalcUnits(parseInt(e.target.value))}
                className="w-full accent-[#F39C12]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#94A3B8]">Precio unitario de fábrica FOB ($USDC):</span>
                <span className="text-white font-bold text-sm">${unitPriceFob} USDC</span>
              </div>
              <input
                type="range"
                min="5"
                max="150"
                step="5"
                value={unitPriceFob}
                onChange={(e) => setUnitPriceFob(parseInt(e.target.value))}
                className="w-full accent-[#F39C12]"
              />
            </div>

            <div className="pt-3 border-t border-white/10 text-[11px] text-[#94A3B8] font-sans">
              * El cálculo considera los costos fijos reales en Bolivia ($450 flete mínimo 1 CBM + $200 DIM/póliza individual) frente al prorrateo colectivo en Soroban.
            </div>
          </div>

          {/* Results Comparison Card */}
          <div className="p-6 rounded-2xl bg-[#081c16] border border-[#F39C12]/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#165B48]/40">
              <span className="text-xs uppercase text-[#94A3B8] font-bold">Importación Individual Aislada</span>
              <span className="text-sm font-bold text-[#F87171] font-mono">${individualPerUnit} / u.</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-[#165B48]/40">
              <span className="text-xs uppercase text-[#F5B041] font-bold">Colectivo Aduanero Minkal</span>
              <span className="text-lg font-black text-[#34D399] font-mono">${minkalPerUnit} / u.</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0F382C]/60 border border-[#165B48]/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#94A3B8] block">Tu Ahorro Neto Total:</span>
                <span className="text-2xl font-black text-gradient-gold font-mono">${savingsTotalUsdc} USDC</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30 font-mono">
                  -{savingsPercent}%
                </span>
              </div>
            </div>

            <button
              onClick={onEnterDapp}
              className="w-full py-3 rounded-xl bg-[#F39C12] hover:bg-[#E58E0B] text-black font-extrabold text-xs transition-colors flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>Asegurar este Ahorro en el Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { DEMO_ROLES, STELLAR_CONFIG } from '@/lib/stellar';
import { Wallet, ShieldCheck, RefreshCw, ChevronDown, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeRole: string;
  setActiveRole: (role: string) => void;
  walletAddress: string;
  setWalletAddress: (addr: string) => void;
}

export const ROLE_PRESETS = [
  {
    id: 'anchor-buyer',
    name: 'Importador Ancla',
    address: DEMO_ROLES.anchorBuyer,
    badge: 'Creador Lote (Día 1)',
    color: 'border-[#F39C12] text-[#F5B041]',
  },
  {
    id: 'co-buyer',
    name: 'Co-Importador',
    address: DEMO_ROLES.coBuyer,
    badge: 'Comprador Fraccionado',
    color: 'border-[#38BDF8] text-[#38BDF8]',
  },
  {
    id: 'customs-broker',
    name: 'Agencia Despachante',
    address: DEMO_ROLES.customsBroker,
    badge: 'Desaduanaje & Bond',
    color: 'border-[#34D399] text-[#34D399]',
  },
  {
    id: 'admin-oracle',
    name: 'Oráculo / Verificador',
    address: DEMO_ROLES.adminOracle,
    badge: 'Verificador BL/DIM',
    color: 'border-[#A855F7] text-[#C084FC]',
  },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  activeRole,
  setActiveRole,
  walletAddress,
  setWalletAddress,
}: NavbarProps) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [isFreighterConnected, setIsFreighterConnected] = useState(false);

  const currentRole = ROLE_PRESETS.find((r) => r.id === activeRole) || ROLE_PRESETS[0];

  const connectFreighter = async () => {
    try {
      const freighter = await import('@stellar/freighter-api');
      const isAvailable = await freighter.isConnected();
      if (!isAvailable) {
        alert(
          'La extensión Freighter no está instalada o no está activa en tu navegador. Puedes continuar usando las identidades de prueba simuladas en Testnet.'
        );
        return;
      }
      const res = await freighter.getAddress();
      if (res && res.address) {
        setWalletAddress(res.address);
        setIsFreighterConnected(true);
      }
    } catch (e) {
      console.warn('Freighter connect error:', e);
    }
  };

  const handleSelectRole = (preset: typeof ROLE_PRESETS[0]) => {
    setActiveRole(preset.id);
    setWalletAddress(preset.address);
    setIsFreighterConnected(false);
    setRoleMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#071511]/90 border-b border-[#165B48]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('marketplace')}>
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#F39C12]/40 shadow-lg shadow-[#F39C12]/20">
              <Image
                src="/assets/logo.png"
                alt="MINKAL Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-extrabold tracking-wider text-gradient-gold">
                  MINKAL
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#165B48]/60 text-[#34D399] font-mono border border-[#34D399]/30">
                  TESTNET
                </span>
              </div>
              <p className="text-[10px] text-[#94A3B8] tracking-tight font-medium">
                Colectivo Aduanero On-Chain • Stellar Soroban
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {[
              { id: 'marketplace', label: 'Marketplace de Lotes' },
              { id: 'create', label: 'Lanzar Lote (Ancla)' },
              { id: 'bidding', label: 'Licitación Aduanera' },
              { id: 'tracker', label: 'Escrow Multi-Hito' },
              { id: 'about', label: 'Arquitectura & Modelo' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#0F382C] text-[#F5B041] border border-[#F39C12]/40 shadow-md shadow-[#F39C12]/10'
                    : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#165B48]/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Role Switcher & Wallet */}
          <div className="flex items-center space-x-3">
            {/* Role Preset Selector */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#04120e] border border-[#165B48] text-xs hover:border-[#F39C12]/50 transition-colors"
                title="Cambiar rol de prueba para simular interacciones"
              >
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] text-[#94A3B8] leading-none">Rol Activo:</div>
                  <div className="font-semibold text-[#E2E8F0]">{currentRole.name}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
              </button>

              {/* Dropdown Menu */}
              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#081c16] border border-[#F39C12]/30 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-[#94A3B8] border-b border-[#165B48]/40">
                    Cambiar Identidad de Prueba (Stellar Testnet)
                  </div>
                  <div className="mt-1 space-y-1">
                    {ROLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectRole(preset)}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          activeRole === preset.id && !isFreighterConnected
                            ? 'bg-[#0F382C] text-white border border-[#F39C12]/50'
                            : 'hover:bg-[#165B48]/20 text-[#E2E8F0]'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center space-x-1.5">
                            <span>{preset.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-[#F5B041] border border-[#F39C12]/20">
                              {preset.badge}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                            {preset.address.slice(0, 6)}...{preset.address.slice(-4)}
                          </div>
                        </div>
                        {activeRole === preset.id && !isFreighterConnected && (
                          <CheckCircle2 className="w-4 h-4 text-[#F39C12]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#165B48]/40">
                    <button
                      onClick={connectFreighter}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-[#F39C12] hover:bg-[#E58E0B] text-black font-bold text-xs transition-colors shadow-md"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Conectar Freighter Wallet</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Address Pill */}
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#04120e] border border-[#165B48]/50 text-xs font-mono text-[#94A3B8]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
              <span>
                {walletAddress ? `${walletAddress.slice(0, 5)}...${walletAddress.slice(-4)}` : 'No Conectado'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Navbar, { ROLE_PRESETS } from '@/components/Navbar';
import BatchCard from '@/components/BatchCard';
import JoinBatchModal from '@/components/JoinBatchModal';
import CreateBatchModal from '@/components/CreateBatchModal';
import EscrowTracker from '@/components/EscrowTracker';
import BiddingRoom from '@/components/BiddingRoom';
import ArchitectureHero from '@/components/ArchitectureHero';
import { DEMO_ROLES } from '@/lib/stellar';
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Sparkles,
  ShieldCheck,
  Building,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [activeRole, setActiveRole] = useState('anchor-buyer');
  const [walletAddress, setWalletAddress] = useState(DEMO_ROLES.anchorBuyer);

  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/batches');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBatches(data);
        if (!selectedBatch && data.length > 0) {
          setSelectedBatch(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch batches:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.nandinaCode && b.nandinaCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' || b.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    'ALL',
    'Energía Solar y Renovables',
    'Tecnología y Redes',
    'Envases, Empaques y Plásticos',
    'Insumos Textiles y Confección',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#071511] text-[#E2E8F0]">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        walletAddress={walletAddress}
        setWalletAddress={setWalletAddress}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Marketplace View */}
        {activeTab === 'marketplace' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header / Banner */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#165B48]/30">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono text-[#F5B041] mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                  <span>CATÁLOGO NACIONAL DE COMPRAS COLECTIVAS</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Lotes con Compromiso Real On-Chain
                </h1>
                <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-2xl">
                  Cada lote cuenta con depósito real en USDC bloqueado por un Importador Ancla desde
                  el Día 1. Súmate adquiriendo fracciones para completar el MOQ y activar el precio mayorista.
                </p>
              </div>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#F39C12] hover:bg-[#E58E0B] text-black font-extrabold text-xs transition-all shadow-lg shadow-[#F39C12]/20 hover:scale-105 flex items-center space-x-2 shrink-0 self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Lanzar Lote como Importador Ancla</span>
              </button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por producto, SKU o partida NANDINA..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs font-sans placeholder-[#94A3B8]"
                />
              </div>

              {/* Refresh Button */}
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  onClick={fetchBatches}
                  disabled={loading}
                  className="p-2 rounded-xl bg-[#04120e] hover:bg-[#081c16] text-[#94A3B8] hover:text-[#F5B041] border border-[#165B48]/40 text-xs flex items-center space-x-1.5 transition-colors"
                  title="Actualizar estado de Soroban y Neon"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Sincronizar</span>
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#F39C12] text-black shadow-md shadow-[#F39C12]/20'
                      : 'bg-[#04120e] text-[#94A3B8] hover:text-white border border-[#165B48]/30'
                  }`}
                >
                  {cat === 'ALL' ? 'Todos los SKUs' : cat}
                </button>
              ))}
            </div>

            {/* Batches Grid */}
            {loading && batches.length === 0 ? (
              <div className="p-12 text-center text-[#94A3B8] text-xs font-mono">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F39C12]" />
                <span>Cargando lotes desde Neon DB y Soroban Testnet...</span>
              </div>
            ) : filteredBatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBatches.map((batch) => (
                  <BatchCard
                    key={batch.batchId}
                    batch={batch}
                    onJoinClick={(b) => {
                      setSelectedBatch(b);
                      setIsJoinOpen(true);
                    }}
                    onTrackClick={(b) => {
                      setSelectedBatch(b);
                      setActiveTab('tracker');
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 text-center rounded-2xl max-w-md mx-auto space-y-3">
                <p className="text-sm font-bold text-white">No se encontraron lotes con este filtro</p>
                <p className="text-xs text-[#94A3B8]">
                  Sé el primer Importador Ancla en crear una necesidad para este producto.
                </p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#F39C12] text-black font-bold text-xs"
                >
                  Lanzar Nuevo Lote
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Batch View (Tab) */}
        {activeTab === 'create' && (
          <div className="animate-in fade-in duration-300">
            <CreateBatchModal
              isOpen={true}
              onClose={() => setActiveTab('marketplace')}
              walletAddress={walletAddress}
              onSuccess={() => {
                fetchBatches();
                setActiveTab('marketplace');
              }}
              nextBatchId={batches.length + 1}
            />
          </div>
        )}

        {/* Bidding Room View (Tab) */}
        {activeTab === 'bidding' && (
          <div className="animate-in fade-in duration-300">
            <BiddingRoom
              batches={batches}
              selectedBatch={selectedBatch}
              setSelectedBatch={setSelectedBatch}
              walletAddress={walletAddress}
              onRefresh={fetchBatches}
            />
          </div>
        )}

        {/* Escrow Tracker View (Tab) */}
        {activeTab === 'tracker' && (
          <div className="animate-in fade-in duration-300">
            <EscrowTracker
              batch={selectedBatch || batches[0]}
              walletAddress={walletAddress}
              activeRole={activeRole}
              onRefresh={fetchBatches}
            />
          </div>
        )}

        {/* About / Architecture Landing View (Tab) */}
        {activeTab === 'about' && (
          <div className="animate-in fade-in duration-300">
            <ArchitectureHero onEnterDapp={() => setActiveTab('marketplace')} />
          </div>
        )}
      </main>

      {/* Join Batch Modal */}
      {selectedBatch && (
        <JoinBatchModal
          batch={selectedBatch}
          isOpen={isJoinOpen}
          onClose={() => setIsJoinOpen(false)}
          walletAddress={walletAddress}
          onSuccess={() => {
            fetchBatches();
            setIsJoinOpen(false);
          }}
        />
      )}

      {/* Create Batch Modal (Popup when in other tabs) */}
      {isCreateOpen && activeTab !== 'create' && (
        <CreateBatchModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          walletAddress={walletAddress}
          onSuccess={() => {
            fetchBatches();
            setIsCreateOpen(false);
          }}
          nextBatchId={batches.length + 1}
        />
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-[#165B48]/30 bg-[#04120e] py-10 text-xs text-[#94A3B8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-extrabold text-gradient-gold">MINKAL</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#165B48]/50 text-[#34D399] font-mono">
                STELLAR & SOROBAN
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm">
              Plataforma B2B de compras grupales directas de fábrica y licitación aduanera con Escrow
              multi-hito no-custodial construido sobre Stellar y Soroban.
            </p>
            <div className="text-[11px] text-[#94A3B8]">
              Cumplimiento normativo bajo la Ley General de Aduanas Nº 1990 y Resolución ASFI / DS Nº 5384.
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider">Ecosistema</h4>
            <ul className="space-y-1.5 font-mono text-[11px]">
              <li>
                <a
                  href="https://developers.stellar.org/docs/build/smart-contracts/overview"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#F5B041] flex items-center space-x-1"
                >
                  <span>Soroban Smart Contracts</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://stellar.expert/explorer/testnet"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#F5B041] flex items-center space-x-1"
                >
                  <span>Stellar Expert Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#F5B041] flex items-center space-x-1"
                >
                  <span>SEP-24 Hosted Ramps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2 text-xs uppercase tracking-wider">Identidad y Contratos</h4>
            <div className="space-y-2 font-mono text-[10px]">
              <div>
                <span className="text-[#94A3B8] block">Escrow Contract:</span>
                <span className="text-[#F5B041] truncate block">
                  CAREO7IJLLZOPDMSKDHR7DKLLO4TTTZHTK6OJOSO6OJCKQYGUBAYJDUJ
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] block">USDC SAC Contract:</span>
                <span className="text-[#38BDF8] truncate block">
                  CCH3SF26ZOJYBJYJH7FOANNQIWA52S5ISPZ3AFA6PFJY6TQXXXU7XVRY
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

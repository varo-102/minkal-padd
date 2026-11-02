import { Client as EscrowClient, networks as escrowNetworks, BatchStatus } from '@/contracts/escrow-client';
import { Client as UsdcClient, networks as usdcNetworks } from '@/contracts/usdc-client';

export { BatchStatus };

export const STELLAR_CONFIG = {
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET',
  networkPassphrase:
    process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ||
    'Test SDF Network ; September 2015',
  rpcUrl:
    process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
  escrowContractId:
    process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID ||
    escrowNetworks.testnet.contractId,
  usdcContractId:
    process.env.NEXT_PUBLIC_USDC_CONTRACT_ID || usdcNetworks.testnet.contractId,
};

export const DEMO_ROLES = {
  adminOracle:
    process.env.NEXT_PUBLIC_ADMIN_ORACLE ||
    'GALOEHLWM72IVDN7HVRPMQOMIR4T67ZCT6JB75MO5IXEENMPKHJIGNP4',
  platformTreasury:
    process.env.NEXT_PUBLIC_PLATFORM_TREASURY ||
    'GBF5RJOZABGYZAHR7U65KYY2T4IMX7ZWVL5K3KBL356OF4H2DTPGPQVC',
  anchorBuyer:
    process.env.NEXT_PUBLIC_ANCHOR_BUYER ||
    'GCUUSHOEML4XXS4VQ2AEJ4EVVUAVQWSUPVYKW5LR6J72P2GCR5WC3SEX',
  coBuyer:
    process.env.NEXT_PUBLIC_CO_BUYER ||
    'GBS6RVXUTSWKNIRX5ZZU5JG2RABVSI5PLYOLJUPH2OCVB2M4V2LP2MN6',
  customsBroker:
    process.env.NEXT_PUBLIC_CUSTOMS_BROKER ||
    'GCM4R5FSYYTJPHZ23KRYZRHXWTBNUXFUYLLTVPMQRRQ5APTAV2PLVN2H',
};

export function getEscrowClient(publicKey?: string) {
  return new EscrowClient({
    networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    contractId: STELLAR_CONFIG.escrowContractId,
    rpcUrl: STELLAR_CONFIG.rpcUrl,
    publicKey,
  });
}

export function getUsdcClient(publicKey?: string) {
  return new UsdcClient({
    networkPassphrase: STELLAR_CONFIG.networkPassphrase,
    contractId: STELLAR_CONFIG.usdcContractId,
    rpcUrl: STELLAR_CONFIG.rpcUrl,
    publicKey,
  });
}

/**
 * Convierte monto en Stroops (7 decimales) a string de USDC
 * Ej: 9000000000 -> "900.00"
 */
export function formatUsdc(stroops: bigint | number | string): string {
  try {
    const val = typeof stroops === 'bigint' ? stroops : BigInt(stroops);
    const divisor = BigInt(10000000);
    const whole = val / divisor;
    const fraction = val % divisor;
    const fractionStr = fraction.toString().padStart(7, '0').slice(0, 2);
    return `${whole.toLocaleString('es-BO')}.${fractionStr}`;
  } catch {
    return '0.00';
  }
}

/**
 * Convierte monto en USDC a Stroops
 * Ej: 30 -> 300000000n
 */
export function parseUsdc(usdc: number | string): bigint {
  const num = typeof usdc === 'string' ? parseFloat(usdc) : usdc;
  if (isNaN(num)) return BigInt(0);
  return BigInt(Math.round(num * 10000000));
}

export const BATCH_STATUS_META: Record<
  number,
  { label: string; color: string; badgeClass: string; step: number }
> = {
  [BatchStatus.OpenForFunding]: {
    label: 'Abierto para Fondeo',
    color: '#F39C12',
    badgeClass: 'bg-[#F39C12]/20 text-[#F5B041] border-[#F39C12]/40',
    step: 1,
  },
  [BatchStatus.MoqReachedPendingBroker]: {
    label: 'MOQ 100% Cubierto (Esperando Fianza)',
    color: '#38BDF8',
    badgeClass: 'bg-[#0284C7]/20 text-[#38BDF8] border-[#38BDF8]/40',
    step: 2,
  },
  [BatchStatus.FundedAndBondedLocked]: {
    label: 'Fianza Bloqueada (Listo para Embarque)',
    color: '#A855F7',
    badgeClass: 'bg-[#9333EA]/20 text-[#C084FC] border-[#A855F7]/40',
    step: 3,
  },
  [BatchStatus.ShippedFromOrigin]: {
    label: 'Embarcado en Origen (Hito 1: 60% Liberado)',
    color: '#34D399',
    badgeClass: 'bg-[#059669]/20 text-[#34D399] border-[#34D399]/40',
    step: 4,
  },
  [BatchStatus.CustomsClearedBo]: {
    label: 'Nacionalizado en Bolivia (Hito 2: 25% Liberado)',
    color: '#10B981',
    badgeClass: 'bg-[#10B981]/20 text-[#6EE7B7] border-[#10B981]/40',
    step: 5,
  },
  [BatchStatus.DeliveredCompleted]: {
    label: 'Entregado y Liquidado (Hito 3: 100% Éxito)',
    color: '#22C55E',
    badgeClass: 'bg-[#22C55E]/20 text-[#4ADE80] border-[#22C55E]/40',
    step: 6,
  },
  [BatchStatus.ExpiredRefundable]: {
    label: 'Expirado (Reembolso Habilitado)',
    color: '#EF4444',
    badgeClass: 'bg-[#EF4444]/20 text-[#F87171] border-[#EF4444]/40',
    step: 0,
  },
  [BatchStatus.SlashedCancelled]: {
    label: 'Despachante Penalizado (Slashing)',
    color: '#DC2626',
    badgeClass: 'bg-[#DC2626]/20 text-[#EF4444] border-[#DC2626]/40',
    step: 0,
  },
  [BatchStatus.DomesticDispatchedBo]: {
    label: 'Despacho Nacional (Hito 1: 70% Liberado)',
    color: '#F59E0B',
    badgeClass: 'bg-[#F59E0B]/20 text-[#FCD34D] border-[#F59E0B]/40',
    step: 4,
  },
};

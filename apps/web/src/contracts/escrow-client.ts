import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CAREO7IJLLZOPDMSKDHR7DKLLO4TTTZHTK6OJOSO6OJCKQYGUBAYJDUJ",
  }
} as const

export type DataKey = {tag: "AdminOracle", values: void} | {tag: "PlatformFeeRecipient", values: void} | {tag: "PlatformFeeBps", values: void} | {tag: "Batch", values: readonly [u64]} | {tag: "BuyerPos", values: readonly [u64, string]} | {tag: "BrokerProfile", values: readonly [string]};


export interface BatchEscrow {
  anchor_buyer: string;
  batch_id: u64;
  bl_doc_hash: Buffer;
  broker: Option<string>;
  broker_bond_locked: i128;
  broker_bond_required: i128;
  buyer_count: u32;
  collected_amount: i128;
  committed_units: u32;
  confirmed_units: u32;
  dim_doc_hash: Buffer;
  funding_deadline: u64;
  is_domestic: boolean;
  moq_total_units: u32;
  status: BatchStatus;
  subsidy_bonus: i128;
  target_amount: i128;
  token: string;
  unit_price: i128;
}

export enum BatchStatus {
  OpenForFunding = 0,
  MoqReachedPendingBroker = 1,
  FundedAndBondedLocked = 2,
  ShippedFromOrigin = 3,
  CustomsClearedBo = 4,
  DeliveredCompleted = 5,
  ExpiredRefundable = 6,
  SlashedCancelled = 7,
  DomesticDispatchedBo = 8,
}


export interface BrokerStats {
  completed_batches: u32;
  slashed_batches: u32;
  total_volume_usdc: i128;
}


export interface BuyerPosition {
  amount_deposited: i128;
  confirmed_delivery: boolean;
  refunded: boolean;
  units: u32;
}

export interface Client {
  /**
   * Construct and simulate a get_batch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_batch: ({batch_id}: {batch_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Option<BatchEscrow>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * 0. Inicialización de parámetros globales del contrato (Instance Storage)
   */
  initialize: ({oracle, fee_recipient, fee_bps}: {oracle: string, fee_recipient: string, fee_bps: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a slash_broker transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * 7. Penalización al Despachante por incumplimiento grave (Slashing)
   */
  slash_broker: ({batch_id}: {batch_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_buyer_pos transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_buyer_pos: ({batch_id, buyer}: {batch_id: u64, buyer: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<BuyerPosition>>>

  /**
   * Construct and simulate a join_open_batch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * 2. Otros importadores se unen al lote abierto cubriendo unidades restantes del MOQ
   */
  join_open_batch: ({batch_id, buyer, units_to_buy}: {batch_id: u64, buyer: string, units_to_buy: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a confirm_delivery transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * 6. Hito Final: Confirmación de entrega ponderada por unidades, Fee Split atómico y reputación
   */
  confirm_delivery: ({batch_id, buyer}: {batch_id: u64, buyer: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_admin_oracle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_admin_oracle: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a lock_broker_bond transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * 3B. El Despachante o Proveedor adjudicado deposita su colateral (Bond) en USDC
   */
  lock_broker_bond: ({batch_id, broker}: {batch_id: u64, broker: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a create_open_batch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * 1. El Importador Ancla lanza el lote y deposita su cuota inicial en USDC (Compromiso Día 1)
   */
  create_open_batch: ({batch_id, anchor_buyer, token, unit_price, moq_total_units, anchor_units, funding_deadline, is_domestic}: {batch_id: u64, anchor_buyer: string, token: string, unit_price: i128, moq_total_units: u32, anchor_units: u32, funding_deadline: u64, is_domestic: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_broker_profile transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_broker_profile: ({broker}: {broker: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<BrokerStats>>>

  /**
   * Construct and simulate a claim_expired_refund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * 2B. Reembolso sin permiso (Permissionless Refund) si el lote expira sin completar el MOQ
   */
  claim_expired_refund: ({batch_id, buyer}: {batch_id: u64, buyer: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_platform_fee_bps transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_platform_fee_bps: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a assign_broker_and_bond transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * 3A. Asignación de la Agencia Despachante ganadora de la licitación y su fianza requerida
   */
  assign_broker_and_bond: ({batch_id, broker, bond_required}: {batch_id: u64, broker: string, bond_required: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a verify_domestic_dispatch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * 4B. Hito 1 (Nacional): Despacho de Fábrica con Factura Fiscal SIN y Guía de Remisión (70%)
   */
  verify_domestic_dispatch: ({batch_id, invoice_and_waybill_hash}: {batch_id: u64, invoice_and_waybill_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_platform_fee_recipient transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_platform_fee_recipient: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a verify_customs_and_release transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * 5. Hito 2 (Internacional): Nacionalización verificada en Recinto Fiscal Boliviano (DIM / SUMA) -> Libera 25%
   */
  verify_customs_and_release: ({batch_id, dim_doc_hash}: {batch_id: u64, dim_doc_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a verify_shipment_and_release transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * 4. Hito 1 (Internacional): Confirmación de Embarque (Bill of Lading) y liberación del Tramo 1 (60%)
   */
  verify_shipment_and_release: ({batch_id, bl_doc_hash}: {batch_id: u64, bl_doc_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAJZ2V0X2JhdGNoAAAAAAAAAQAAAAAAAAAIYmF0Y2hfaWQAAAAGAAAAAQAAA+gAAAfQAAAAC0JhdGNoRXNjcm93AA==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABgAAAAAAAAAAAAAAC0FkbWluT3JhY2xlAAAAAAAAAAAAAAAAFFBsYXRmb3JtRmVlUmVjaXBpZW50AAAAAAAAAAAAAAAOUGxhdGZvcm1GZWVCcHMAAAAAAAEAAAAAAAAABUJhdGNoAAAAAAAAAQAAAAYAAAABAAAAAAAAAAhCdXllclBvcwAAAAIAAAAGAAAAEwAAAAEAAAAAAAAADUJyb2tlclByb2ZpbGUAAAAAAAABAAAAEw==",
        "AAAAAAAAAEowLiBJbmljaWFsaXphY2nDs24gZGUgcGFyw6FtZXRyb3MgZ2xvYmFsZXMgZGVsIGNvbnRyYXRvIChJbnN0YW5jZSBTdG9yYWdlKQAAAAAACmluaXRpYWxpemUAAAAAAAMAAAAAAAAABm9yYWNsZQAAAAAAEwAAAAAAAAANZmVlX3JlY2lwaWVudAAAAAAAABMAAAAAAAAAB2ZlZV9icHMAAAAABAAAAAA=",
        "AAAAAAAAAEM3LiBQZW5hbGl6YWNpw7NuIGFsIERlc3BhY2hhbnRlIHBvciBpbmN1bXBsaW1pZW50byBncmF2ZSAoU2xhc2hpbmcpAAAAAAxzbGFzaF9icm9rZXIAAAABAAAAAAAAAAhiYXRjaF9pZAAAAAYAAAAA",
        "AAAAAAAAAAAAAAANZ2V0X2J1eWVyX3BvcwAAAAAAAAIAAAAAAAAACGJhdGNoX2lkAAAABgAAAAAAAAAFYnV5ZXIAAAAAAAATAAAAAQAAA+gAAAfQAAAADUJ1eWVyUG9zaXRpb24AAAA=",
        "AAAAAQAAAAAAAAAAAAAAC0JhdGNoRXNjcm93AAAAABMAAAAAAAAADGFuY2hvcl9idXllcgAAABMAAAAAAAAACGJhdGNoX2lkAAAABgAAAAAAAAALYmxfZG9jX2hhc2gAAAAD7gAAACAAAAAAAAAABmJyb2tlcgAAAAAD6AAAABMAAAAAAAAAEmJyb2tlcl9ib25kX2xvY2tlZAAAAAAACwAAAAAAAAAUYnJva2VyX2JvbmRfcmVxdWlyZWQAAAALAAAAAAAAAAtidXllcl9jb3VudAAAAAAEAAAAAAAAABBjb2xsZWN0ZWRfYW1vdW50AAAACwAAAAAAAAAPY29tbWl0dGVkX3VuaXRzAAAAAAQAAAAAAAAAD2NvbmZpcm1lZF91bml0cwAAAAAEAAAAAAAAAAxkaW1fZG9jX2hhc2gAAAPuAAAAIAAAAAAAAAAQZnVuZGluZ19kZWFkbGluZQAAAAYAAAAAAAAAC2lzX2RvbWVzdGljAAAAAAEAAAAAAAAAD21vcV90b3RhbF91bml0cwAAAAAEAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAALQmF0Y2hTdGF0dXMAAAAAAAAAAA1zdWJzaWR5X2JvbnVzAAAAAAAACwAAAAAAAAANdGFyZ2V0X2Ftb3VudAAAAAAAAAsAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAKdW5pdF9wcmljZQAAAAAACw==",
        "AAAAAwAAAAAAAAAAAAAAC0JhdGNoU3RhdHVzAAAAAAkAAAAAAAAADk9wZW5Gb3JGdW5kaW5nAAAAAAAAAAAAAAAAABdNb3FSZWFjaGVkUGVuZGluZ0Jyb2tlcgAAAAABAAAAAAAAABVGdW5kZWRBbmRCb25kZWRMb2NrZWQAAAAAAAACAAAAAAAAABFTaGlwcGVkRnJvbU9yaWdpbgAAAAAAAAMAAAAAAAAAEEN1c3RvbXNDbGVhcmVkQm8AAAAEAAAAAAAAABJEZWxpdmVyZWRDb21wbGV0ZWQAAAAAAAUAAAAAAAAAEUV4cGlyZWRSZWZ1bmRhYmxlAAAAAAAABgAAAAAAAAAQU2xhc2hlZENhbmNlbGxlZAAAAAcAAAAAAAAAFERvbWVzdGljRGlzcGF0Y2hlZEJvAAAACA==",
        "AAAAAQAAAAAAAAAAAAAAC0Jyb2tlclN0YXRzAAAAAAMAAAAAAAAAEWNvbXBsZXRlZF9iYXRjaGVzAAAAAAAABAAAAAAAAAAPc2xhc2hlZF9iYXRjaGVzAAAAAAQAAAAAAAAAEXRvdGFsX3ZvbHVtZV91c2RjAAAAAAAACw==",
        "AAAAAAAAAFIyLiBPdHJvcyBpbXBvcnRhZG9yZXMgc2UgdW5lbiBhbCBsb3RlIGFiaWVydG8gY3VicmllbmRvIHVuaWRhZGVzIHJlc3RhbnRlcyBkZWwgTU9RAAAAAAAPam9pbl9vcGVuX2JhdGNoAAAAAAMAAAAAAAAACGJhdGNoX2lkAAAABgAAAAAAAAAFYnV5ZXIAAAAAAAATAAAAAAAAAAx1bml0c190b19idXkAAAAEAAAAAA==",
        "AAAAAQAAAAAAAAAAAAAADUJ1eWVyUG9zaXRpb24AAAAAAAAEAAAAAAAAABBhbW91bnRfZGVwb3NpdGVkAAAACwAAAAAAAAASY29uZmlybWVkX2RlbGl2ZXJ5AAAAAAABAAAAAAAAAAhyZWZ1bmRlZAAAAAEAAAAAAAAABXVuaXRzAAAAAAAABA==",
        "AAAAAAAAAGA2LiBIaXRvIEZpbmFsOiBDb25maXJtYWNpw7NuIGRlIGVudHJlZ2EgcG9uZGVyYWRhIHBvciB1bmlkYWRlcywgRmVlIFNwbGl0IGF0w7NtaWNvIHkgcmVwdXRhY2nDs24AAAAQY29uZmlybV9kZWxpdmVyeQAAAAIAAAAAAAAACGJhdGNoX2lkAAAABgAAAAAAAAAFYnV5ZXIAAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAAQZ2V0X2FkbWluX29yYWNsZQAAAAAAAAABAAAD6AAAABM=",
        "AAAAAAAAAE4zQi4gRWwgRGVzcGFjaGFudGUgbyBQcm92ZWVkb3IgYWRqdWRpY2FkbyBkZXBvc2l0YSBzdSBjb2xhdGVyYWwgKEJvbmQpIGVuIFVTREMAAAAAABBsb2NrX2Jyb2tlcl9ib25kAAAAAgAAAAAAAAAIYmF0Y2hfaWQAAAAGAAAAAAAAAAZicm9rZXIAAAAAABMAAAAA",
        "AAAAAAAAAFwxLiBFbCBJbXBvcnRhZG9yIEFuY2xhIGxhbnphIGVsIGxvdGUgeSBkZXBvc2l0YSBzdSBjdW90YSBpbmljaWFsIGVuIFVTREMgKENvbXByb21pc28gRMOtYSAxKQAAABFjcmVhdGVfb3Blbl9iYXRjaAAAAAAAAAgAAAAAAAAACGJhdGNoX2lkAAAABgAAAAAAAAAMYW5jaG9yX2J1eWVyAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAp1bml0X3ByaWNlAAAAAAALAAAAAAAAAA9tb3FfdG90YWxfdW5pdHMAAAAABAAAAAAAAAAMYW5jaG9yX3VuaXRzAAAABAAAAAAAAAAQZnVuZGluZ19kZWFkbGluZQAAAAYAAAAAAAAAC2lzX2RvbWVzdGljAAAAAAEAAAAA",
        "AAAAAAAAAAAAAAASZ2V0X2Jyb2tlcl9wcm9maWxlAAAAAAABAAAAAAAAAAZicm9rZXIAAAAAABMAAAABAAAD6AAAB9AAAAALQnJva2VyU3RhdHMA",
        "AAAAAAAAAFgyQi4gUmVlbWJvbHNvIHNpbiBwZXJtaXNvIChQZXJtaXNzaW9ubGVzcyBSZWZ1bmQpIHNpIGVsIGxvdGUgZXhwaXJhIHNpbiBjb21wbGV0YXIgZWwgTU9RAAAAFGNsYWltX2V4cGlyZWRfcmVmdW5kAAAAAgAAAAAAAAAIYmF0Y2hfaWQAAAAGAAAAAAAAAAVidXllcgAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAUZ2V0X3BsYXRmb3JtX2ZlZV9icHMAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAFozQS4gQXNpZ25hY2nDs24gZGUgbGEgQWdlbmNpYSBEZXNwYWNoYW50ZSBnYW5hZG9yYSBkZSBsYSBsaWNpdGFjacOzbiB5IHN1IGZpYW56YSByZXF1ZXJpZGEAAAAAABZhc3NpZ25fYnJva2VyX2FuZF9ib25kAAAAAAADAAAAAAAAAAhiYXRjaF9pZAAAAAYAAAAAAAAABmJyb2tlcgAAAAAAEwAAAAAAAAANYm9uZF9yZXF1aXJlZAAAAAAAAAsAAAAA",
        "AAAAAAAAAF00Qi4gSGl0byAxIChOYWNpb25hbCk6IERlc3BhY2hvIGRlIEbDoWJyaWNhIGNvbiBGYWN0dXJhIEZpc2NhbCBTSU4geSBHdcOtYSBkZSBSZW1pc2nDs24gKDcwJSkAAAAAAAAYdmVyaWZ5X2RvbWVzdGljX2Rpc3BhdGNoAAAAAgAAAAAAAAAIYmF0Y2hfaWQAAAAGAAAAAAAAABhpbnZvaWNlX2FuZF93YXliaWxsX2hhc2gAAAPuAAAAIAAAAAA=",
        "AAAAAAAAAAAAAAAaZ2V0X3BsYXRmb3JtX2ZlZV9yZWNpcGllbnQAAAAAAAAAAAABAAAD6AAAABM=",
        "AAAAAAAAAG01LiBIaXRvIDIgKEludGVybmFjaW9uYWwpOiBOYWNpb25hbGl6YWNpw7NuIHZlcmlmaWNhZGEgZW4gUmVjaW50byBGaXNjYWwgQm9saXZpYW5vIChESU0gLyBTVU1BKSAtPiBMaWJlcmEgMjUlAAAAAAAAGnZlcmlmeV9jdXN0b21zX2FuZF9yZWxlYXNlAAAAAAACAAAAAAAAAAhiYXRjaF9pZAAAAAYAAAAAAAAADGRpbV9kb2NfaGFzaAAAA+4AAAAgAAAAAA==",
        "AAAAAAAAAGU0LiBIaXRvIDEgKEludGVybmFjaW9uYWwpOiBDb25maXJtYWNpw7NuIGRlIEVtYmFycXVlIChCaWxsIG9mIExhZGluZykgeSBsaWJlcmFjacOzbiBkZWwgVHJhbW8gMSAoNjAlKQAAAAAAABt2ZXJpZnlfc2hpcG1lbnRfYW5kX3JlbGVhc2UAAAAAAgAAAAAAAAAIYmF0Y2hfaWQAAAAGAAAAAAAAAAtibF9kb2NfaGFzaAAAAAPuAAAAIAAAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_batch: this.txFromJSON<Option<BatchEscrow>>,
        initialize: this.txFromJSON<null>,
        slash_broker: this.txFromJSON<null>,
        get_buyer_pos: this.txFromJSON<Option<BuyerPosition>>,
        join_open_batch: this.txFromJSON<null>,
        confirm_delivery: this.txFromJSON<null>,
        get_admin_oracle: this.txFromJSON<Option<string>>,
        lock_broker_bond: this.txFromJSON<null>,
        create_open_batch: this.txFromJSON<null>,
        get_broker_profile: this.txFromJSON<Option<BrokerStats>>,
        claim_expired_refund: this.txFromJSON<null>,
        get_platform_fee_bps: this.txFromJSON<u32>,
        assign_broker_and_bond: this.txFromJSON<null>,
        verify_domestic_dispatch: this.txFromJSON<null>,
        get_platform_fee_recipient: this.txFromJSON<Option<string>>,
        verify_customs_and_release: this.txFromJSON<null>,
        verify_shipment_and_release: this.txFromJSON<null>
  }
}
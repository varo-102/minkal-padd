import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions } from "@stellar/stellar-sdk/contract";
import type { u32, u64, i128, Option } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CAREO7IJLLZOPDMSKDHR7DKLLO4TTTZHTK6OJOSO6OJCKQYGUBAYJDUJ";
    };
};
export type DataKey = {
    tag: "AdminOracle";
    values: void;
} | {
    tag: "PlatformFeeRecipient";
    values: void;
} | {
    tag: "PlatformFeeBps";
    values: void;
} | {
    tag: "Batch";
    values: readonly [u64];
} | {
    tag: "BuyerPos";
    values: readonly [u64, string];
} | {
    tag: "BrokerProfile";
    values: readonly [string];
};
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
export declare enum BatchStatus {
    OpenForFunding = 0,
    MoqReachedPendingBroker = 1,
    FundedAndBondedLocked = 2,
    ShippedFromOrigin = 3,
    CustomsClearedBo = 4,
    DeliveredCompleted = 5,
    ExpiredRefundable = 6,
    SlashedCancelled = 7,
    DomesticDispatchedBo = 8
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
    get_batch: ({ batch_id }: {
        batch_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Option<BatchEscrow>>>;
    /**
     * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * 0. Inicialización de parámetros globales del contrato (Instance Storage)
     */
    initialize: ({ oracle, fee_recipient, fee_bps }: {
        oracle: string;
        fee_recipient: string;
        fee_bps: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a slash_broker transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * 7. Penalización al Despachante por incumplimiento grave (Slashing)
     */
    slash_broker: ({ batch_id }: {
        batch_id: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_buyer_pos transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_buyer_pos: ({ batch_id, buyer }: {
        batch_id: u64;
        buyer: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Option<BuyerPosition>>>;
    /**
     * Construct and simulate a join_open_batch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * 2. Otros importadores se unen al lote abierto cubriendo unidades restantes del MOQ
     */
    join_open_batch: ({ batch_id, buyer, units_to_buy }: {
        batch_id: u64;
        buyer: string;
        units_to_buy: u32;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a confirm_delivery transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * 6. Hito Final: Confirmación de entrega ponderada por unidades, Fee Split atómico y reputación
     */
    confirm_delivery: ({ batch_id, buyer }: {
        batch_id: u64;
        buyer: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_admin_oracle transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_admin_oracle: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>;
    /**
     * Construct and simulate a lock_broker_bond transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * 3B. El Despachante o Proveedor adjudicado deposita su colateral (Bond) en USDC
     */
    lock_broker_bond: ({ batch_id, broker }: {
        batch_id: u64;
        broker: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a create_open_batch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * 1. El Importador Ancla lanza el lote y deposita su cuota inicial en USDC (Compromiso Día 1)
     */
    create_open_batch: ({ batch_id, anchor_buyer, token, unit_price, moq_total_units, anchor_units, funding_deadline, is_domestic }: {
        batch_id: u64;
        anchor_buyer: string;
        token: string;
        unit_price: i128;
        moq_total_units: u32;
        anchor_units: u32;
        funding_deadline: u64;
        is_domestic: boolean;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_broker_profile transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_broker_profile: ({ broker }: {
        broker: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<Option<BrokerStats>>>;
    /**
     * Construct and simulate a claim_expired_refund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * 2B. Reembolso sin permiso (Permissionless Refund) si el lote expira sin completar el MOQ
     */
    claim_expired_refund: ({ batch_id, buyer }: {
        batch_id: u64;
        buyer: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_platform_fee_bps transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_platform_fee_bps: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>;
    /**
     * Construct and simulate a assign_broker_and_bond transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * 3A. Asignación de la Agencia Despachante ganadora de la licitación y su fianza requerida
     */
    assign_broker_and_bond: ({ batch_id, broker, bond_required }: {
        batch_id: u64;
        broker: string;
        bond_required: i128;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a verify_domestic_dispatch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * 4B. Hito 1 (Nacional): Despacho de Fábrica con Factura Fiscal SIN y Guía de Remisión (70%)
     */
    verify_domestic_dispatch: ({ batch_id, invoice_and_waybill_hash }: {
        batch_id: u64;
        invoice_and_waybill_hash: Buffer;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_platform_fee_recipient transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_platform_fee_recipient: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>;
    /**
     * Construct and simulate a verify_customs_and_release transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * 5. Hito 2 (Internacional): Nacionalización verificada en Recinto Fiscal Boliviano (DIM / SUMA) -> Libera 25%
     */
    verify_customs_and_release: ({ batch_id, dim_doc_hash }: {
        batch_id: u64;
        dim_doc_hash: Buffer;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a verify_shipment_and_release transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * 4. Hito 1 (Internacional): Confirmación de Embarque (Bill of Lading) y liberación del Tramo 1 (60%)
     */
    verify_shipment_and_release: ({ batch_id, bl_doc_hash }: {
        batch_id: u64;
        bl_doc_hash: Buffer;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        get_batch: (json: string) => AssembledTransaction<Option<BatchEscrow>>;
        initialize: (json: string) => AssembledTransaction<null>;
        slash_broker: (json: string) => AssembledTransaction<null>;
        get_buyer_pos: (json: string) => AssembledTransaction<Option<BuyerPosition>>;
        join_open_batch: (json: string) => AssembledTransaction<null>;
        confirm_delivery: (json: string) => AssembledTransaction<null>;
        get_admin_oracle: (json: string) => AssembledTransaction<Option<string>>;
        lock_broker_bond: (json: string) => AssembledTransaction<null>;
        create_open_batch: (json: string) => AssembledTransaction<null>;
        get_broker_profile: (json: string) => AssembledTransaction<Option<BrokerStats>>;
        claim_expired_refund: (json: string) => AssembledTransaction<null>;
        get_platform_fee_bps: (json: string) => AssembledTransaction<number>;
        assign_broker_and_bond: (json: string) => AssembledTransaction<null>;
        verify_domestic_dispatch: (json: string) => AssembledTransaction<null>;
        get_platform_fee_recipient: (json: string) => AssembledTransaction<Option<string>>;
        verify_customs_and_release: (json: string) => AssembledTransaction<null>;
        verify_shipment_and_release: (json: string) => AssembledTransaction<null>;
    };
}

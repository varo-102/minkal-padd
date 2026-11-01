#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, BytesN, Env,
};

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[repr(u32)]
pub enum BatchStatus {
    OpenForFunding = 0,          // Creado por Importador Ancla con su depósito inicial
    MoqReachedPendingBroker = 1, // 100% del MOQ cubierto por importadores; esperando fianza del despachante
    FundedAndBondedLocked = 2,   // MOQ 100% + Fianza del despachante bloqueada; listo para embarque
    ShippedFromOrigin = 3,       // Hito 1 liberado (60%) con hash de Bill of Lading (BL)
    CustomsClearedBo = 4,        // Hito 2 liberado (25%) con hash de DIM en Aduana Nacional
    DeliveredCompleted = 5,      // Hito 3 liberado (15% - Fee) + Fianza devuelta + Reputación actualizada
    ExpiredRefundable = 6,       // Plazo vencido sin completar MOQ; reembolsos habilitados
    SlashedCancelled = 7,        // Incumplimiento grave del despachante; colateral ejecutado
    DomesticDispatchedBo = 8,    // Hito 1 Nacional liberado al 70% con hash de Factura Comercial SIN y Guía de Remisión
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct BatchEscrow {
    pub batch_id: u64,
    pub anchor_buyer: Address,       // Importador Ancla que lanzó la necesidad
    pub broker: Option<Address>,     // Agencia Despachante o Proveedor local adjudicado
    pub token: Address,              // Dirección del contrato SAC de USDC
    pub unit_price: i128,            // Precio unitario en USDC (7 decimales en Stellar)
    pub moq_total_units: u32,        // Cantidad mínima total requerida por el fabricante (MOQ)
    pub committed_units: u32,        // Unidades ya compradas y pagadas on-chain
    pub target_amount: i128,         // Monto total objetivo (moq_total_units * unit_price)
    pub collected_amount: i128,      // Monto actual depositado en USDC por los importadores
    pub funding_deadline: u64,       // Timestamp límite para completar el MOQ
    pub broker_bond_required: i128,  // Fianza exigida al despachante adjudicado
    pub broker_bond_locked: i128,    // Fianza efectivamente depositada por el despachante
    pub subsidy_bonus: i128,         // Bono de arranque en frío financiado por el pool
    pub status: BatchStatus,
    pub bl_doc_hash: BytesN<32>,     // Hash SHA-256 del Bill of Lading (Hito 1) o Factura Fiscal/Guía (Nacional)
    pub dim_doc_hash: BytesN<32>,    // Hash SHA-256 de la DIM en SUMA Aduana (Hito 2)
    pub buyer_count: u32,            // Número de importadores participantes
    pub confirmed_units: u32,        // Unidades cuyos compradores ya confirmaron recepción
    pub is_domestic: bool,           // true = Fabricante/Representante en Bolivia; false = Importación Internacional
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct BuyerPosition {
    pub units: u32,
    pub amount_deposited: i128,
    pub confirmed_delivery: bool,
    pub refunded: bool,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct BrokerStats {
    pub completed_batches: u32,
    pub slashed_batches: u32,
    pub total_volume_usdc: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    AdminOracle,
    PlatformFeeRecipient,
    PlatformFeeBps,                  // Ej. 250 = 2.50%
    Batch(u64),
    BuyerPos(u64, Address),          // Posición de cada importador en el lote
    BrokerProfile(Address),
}

#[contract]
pub struct GroupImportEscrowContract;

#[contractimpl]
impl GroupImportEscrowContract {
    /// 0. Inicialización de parámetros globales del contrato (Instance Storage)
    pub fn initialize(
        env: Env,
        oracle: Address,
        fee_recipient: Address,
        fee_bps: u32,
    ) {
        assert!(!env.storage().instance().has(&DataKey::AdminOracle), "Ya inicializado");
        assert!(fee_bps <= 1000, "Comision maxima excedida");
        env.storage().instance().set(&DataKey::AdminOracle, &oracle);
        env.storage().instance().set(&DataKey::PlatformFeeRecipient, &fee_recipient);
        env.storage().instance().set(&DataKey::PlatformFeeBps, &fee_bps);
    }

    /// 1. El Importador Ancla lanza el lote y deposita su cuota inicial en USDC (Compromiso Día 1)
    pub fn create_open_batch(
        env: Env,
        batch_id: u64,
        anchor_buyer: Address,
        token: Address,
        unit_price: i128,
        moq_total_units: u32,
        anchor_units: u32,
        funding_deadline: u64,
        is_domestic: bool,
    ) {
        anchor_buyer.require_auth();
        let key = DataKey::Batch(batch_id);
        assert!(!env.storage().persistent().has(&key), "ID de lote ya existe");
        assert!(unit_price > 0 && moq_total_units > 0, "Parametros de MOQ invalidos");
        assert!(anchor_units > 0 && anchor_units <= moq_total_units, "Unidades ancla invalidas");
        assert!(funding_deadline > env.ledger().timestamp(), "Deadline debe ser futuro");

        let anchor_deposit = unit_price.checked_mul(anchor_units as i128).unwrap();
        let target_amount = unit_price.checked_mul(moq_total_units as i128).unwrap();

        // Transferencia real de USDC del Importador Ancla al contrato desde el Día 1
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(
            &anchor_buyer,
            &env.current_contract_address(),
            &anchor_deposit,
        );

        let initial_status = if anchor_units == moq_total_units {
            BatchStatus::MoqReachedPendingBroker
        } else {
            BatchStatus::OpenForFunding
        };

        let batch = BatchEscrow {
            batch_id,
            anchor_buyer: anchor_buyer.clone(),
            broker: None,
            token,
            unit_price,
            moq_total_units,
            committed_units: anchor_units,
            target_amount,
            collected_amount: anchor_deposit,
            funding_deadline,
            broker_bond_required: 0,
            broker_bond_locked: 0,
            subsidy_bonus: 0,
            status: initial_status,
            bl_doc_hash: BytesN::from_array(&env, &[0u8; 32]),
            dim_doc_hash: BytesN::from_array(&env, &[0u8; 32]),
            buyer_count: 1,
            confirmed_units: 0,
            is_domestic,
        };

        let pos_key = DataKey::BuyerPos(batch_id, anchor_buyer.clone());
        let pos = BuyerPosition {
            units: anchor_units,
            amount_deposited: anchor_deposit,
            confirmed_delivery: false,
            refunded: false,
        };

        env.storage().persistent().set(&key, &batch);
        env.storage().persistent().set(&pos_key, &pos);
        env.storage().persistent().extend_ttl(&key, 500_000, 1_200_000);
        env.storage().persistent().extend_ttl(&pos_key, 500_000, 1_200_000);

        env.events().publish(
            (symbol_short!("created"), batch_id),
            (anchor_buyer, anchor_units, moq_total_units),
        );
    }

    /// 2. Otros importadores se unen al lote abierto cubriendo unidades restantes del MOQ
    pub fn join_open_batch(
        env: Env,
        batch_id: u64,
        buyer: Address,
        units_to_buy: u32,
    ) {
        buyer.require_auth();
        assert!(units_to_buy > 0, "Debe comprar al menos 1 unidad");

        let key = DataKey::Batch(batch_id);
        let mut batch: BatchEscrow = env.storage().persistent().get(&key).expect("Lote no existe");

        assert!(batch.status == BatchStatus::OpenForFunding, "Lote no disponible para fondeo");
        assert!(env.ledger().timestamp() <= batch.funding_deadline, "Plazo de fondeo vencido");
        assert!(
            batch.committed_units + units_to_buy <= batch.moq_total_units,
            "Excede las unidades disponibles del MOQ"
        );

        let deposit_amount = batch.unit_price.checked_mul(units_to_buy as i128).unwrap();
        let token_client = token::Client::new(&env, &batch.token);
        token_client.transfer(&buyer, &env.current_contract_address(), &deposit_amount);

        let pos_key = DataKey::BuyerPos(batch_id, buyer.clone());
        let mut pos: BuyerPosition = env.storage().persistent().get(&pos_key).unwrap_or(
            BuyerPosition {
                units: 0,
                amount_deposited: 0,
                confirmed_delivery: false,
                refunded: false,
            },
        );

        if pos.units == 0 {
            batch.buyer_count += 1;
        }
        pos.units += units_to_buy;
        pos.amount_deposited += deposit_amount;

        batch.committed_units += units_to_buy;
        batch.collected_amount += deposit_amount;

        if batch.committed_units == batch.moq_total_units {
            batch.status = BatchStatus::MoqReachedPendingBroker;
        }

        env.storage().persistent().set(&pos_key, &pos);
        env.storage().persistent().set(&key, &batch);
        env.storage().persistent().extend_ttl(&key, 500_000, 1_200_000);
        env.storage().persistent().extend_ttl(&pos_key, 500_000, 1_200_000);

        env.events().publish(
            (symbol_short!("joined"), batch_id),
            (buyer, units_to_buy, batch.committed_units),
        );
    }

    /// 2B. Reembolso sin permiso (Permissionless Refund) si el lote expira sin completar el MOQ
    pub fn claim_expired_refund(env: Env, batch_id: u64, buyer: Address) {
        buyer.require_auth();
        let key = DataKey::Batch(batch_id);
        let mut batch: BatchEscrow = env.storage().persistent().get(&key).expect("Lote no existe");

        if batch.status == BatchStatus::OpenForFunding
            && env.ledger().timestamp() > batch.funding_deadline
            && batch.committed_units < batch.moq_total_units
        {
            batch.status = BatchStatus::ExpiredRefundable;
        }

        assert!(
            batch.status == BatchStatus::ExpiredRefundable,
            "El lote no es elegible para reembolso por expiracion"
        );

        let pos_key = DataKey::BuyerPos(batch_id, buyer.clone());
        let mut pos: BuyerPosition = env.storage().persistent().get(&pos_key).expect("Posicion no encontrada");
        assert!(!pos.refunded && pos.amount_deposited > 0, "Ya reembolsado o sin saldo");

        let refund_amount = pos.amount_deposited;
        pos.refunded = true;
        pos.amount_deposited = 0;

        let token_client = token::Client::new(&env, &batch.token);
        token_client.transfer(&env.current_contract_address(), &buyer, &refund_amount);

        env.storage().persistent().set(&pos_key, &pos);
        env.storage().persistent().set(&key, &batch);

        env.events().publish((symbol_short!("refunded"), batch_id), (buyer, refund_amount));
    }

    /// 3A. Asignación de la Agencia Despachante ganadora de la licitación y su fianza requerida
    pub fn assign_broker_and_bond(
        env: Env,
        batch_id: u64,
        broker: Address,
        bond_required: i128,
    ) {
        let oracle: Address = env.storage().instance().get(&DataKey::AdminOracle).expect("No inicializado");
        oracle.require_auth();

        let key = DataKey::Batch(batch_id);
        let mut batch: BatchEscrow = env.storage().persistent().get(&key).expect("Lote no existe");
        assert!(
            batch.status == BatchStatus::MoqReachedPendingBroker
                || batch.status == BatchStatus::OpenForFunding,
            "Estado invalido para adjudicar despachante"
        );
        assert!(bond_required > 0, "La fianza debe ser mayor a cero");

        batch.broker = Some(broker.clone());
        batch.broker_bond_required = bond_required;
        env.storage().persistent().set(&key, &batch);

        env.events().publish((symbol_short!("assigned"), batch_id), (broker, bond_required));
    }

    /// 3B. El Despachante o Proveedor adjudicado deposita su colateral (Bond) en USDC
    pub fn lock_broker_bond(env: Env, batch_id: u64, broker: Address) {
        broker.require_auth();
        let key = DataKey::Batch(batch_id);
        let mut batch: BatchEscrow = env.storage().persistent().get(&key).expect("Lote no existe");

        assert!(batch.status == BatchStatus::MoqReachedPendingBroker, "MOQ aun no completado");
        assert!(batch.broker == Some(broker.clone()), "No es el despachante adjudicado");
        assert!(batch.broker_bond_locked == 0, "Fianza ya depositada");

        let token_client = token::Client::new(&env, &batch.token);
        token_client.transfer(
            &broker,
            &env.current_contract_address(),
            &batch.broker_bond_required,
        );

        batch.broker_bond_locked = batch.broker_bond_required;
        batch.status = BatchStatus::FundedAndBondedLocked;

        env.storage().persistent().set(&key, &batch);
        env.storage().persistent().extend_ttl(&key, 500_000, 1_200_000);

        env.events().publish((symbol_short!("bonded"), batch_id), (broker, batch.broker_bond_locked));
    }

    /// 4. Hito 1 (Internacional): Confirmación de Embarque (Bill of Lading) y liberación del Tramo 1 (60%)
    pub fn verify_shipment_and_release(
        env: Env,
        batch_id: u64,
        bl_doc_hash: BytesN<32>,
    ) {
        let oracle: Address = env.storage().instance().get(&DataKey::AdminOracle).expect("No inicializado");
        oracle.require_auth();

        let key = DataKey::Batch(batch_id);
        let mut batch: BatchEscrow = env.storage().persistent().get(&key).expect("Lote no existe");
        assert!(!batch.is_domestic, "Funcion exclusiva para lotes internacionales");
        assert!(
            batch.status == BatchStatus::FundedAndBondedLocked,
            "El lote debe tener MOQ completo y fianza bloqueada"
        );

        let broker = batch.broker.clone().unwrap();
        batch.bl_doc_hash = bl_doc_hash;
        batch.status = BatchStatus::ShippedFromOrigin;

        // Liberar 60% para pago FOB en origen y flete internacional
        let tranche_1 = (batch.collected_amount * 60) / 100;
        let token_client = token::Client::new(&env, &batch.token);
        token_client.transfer(&env.current_contract_address(), &broker, &tranche_1);

        env.storage().persistent().set(&key, &batch);
        env.events().publish((symbol_short!("shipped"), batch_id), tranche_1);
    }

    /// 4B. Hito 1 (Nacional): Despacho de Fábrica con Factura Fiscal SIN y Guía de Remisión (70%)
    pub fn verify_domestic_dispatch(
        env: Env,
        batch_id: u64,
        invoice_and_waybill_hash: BytesN<32>,
    ) {
        let oracle: Address = env.storage().instance().get(&DataKey::AdminOracle).expect("No inicializado");
        oracle.require_auth();

        let key = DataKey::Batch(batch_id);
        let mut batch: BatchEscrow = env.storage().persistent().get(&key).expect("Lote no existe");
        assert!(batch.is_domestic, "Funcion exclusiva para lotes nacionales");
        assert!(
            batch.status == BatchStatus::FundedAndBondedLocked,
            "El lote debe tener MOQ completo y fianza bloqueada"
        );

        let broker = batch.broker.clone().unwrap();
        batch.bl_doc_hash = invoice_and_waybill_hash;
        batch.status = BatchStatus::DomesticDispatchedBo;

        // Liberar 70% contra factura fiscal y despacho desde planta/distribuidora
        let tranche_domestic_1 = (batch.collected_amount * 70) / 100;
        let token_client = token::Client::new(&env, &batch.token);
        token_client.transfer(&env.current_contract_address(), &broker, &tranche_domestic_1);

        env.storage().persistent().set(&key, &batch);
        env.events().publish((symbol_short!("dom_disp"), batch_id), tranche_domestic_1);
    }

    /// 5. Hito 2 (Internacional): Nacionalización verificada en Recinto Fiscal Boliviano (DIM / SUMA) -> Libera 25%
    pub fn verify_customs_and_release(
        env: Env,
        batch_id: u64,
        dim_doc_hash: BytesN<32>,
    ) {
        let oracle: Address = env.storage().instance().get(&DataKey::AdminOracle).expect("No inicializado");
        oracle.require_auth();

        let key = DataKey::Batch(batch_id);
        let mut batch: BatchEscrow = env.storage().persistent().get(&key).expect("Lote no existe");
        assert!(!batch.is_domestic, "Funcion exclusiva para lotes internacionales");
        assert!(batch.status == BatchStatus::ShippedFromOrigin, "Estado invalido");

        let broker = batch.broker.clone().unwrap();
        batch.dim_doc_hash = dim_doc_hash;
        batch.status = BatchStatus::CustomsClearedBo;

        // Liberar 25% para tributos aduaneros y gastos de desaduanaje
        let tranche_2 = (batch.collected_amount * 25) / 100;
        let token_client = token::Client::new(&env, &batch.token);
        token_client.transfer(&env.current_contract_address(), &broker, &tranche_2);

        env.storage().persistent().set(&key, &batch);
        env.events().publish((symbol_short!("customs"), batch_id), tranche_2);
    }

    /// 6. Hito Final: Confirmación de entrega ponderada por unidades, Fee Split atómico y reputación
    pub fn confirm_delivery(env: Env, batch_id: u64, buyer: Address) {
        buyer.require_auth();

        let pos_key = DataKey::BuyerPos(batch_id, buyer.clone());
        let mut pos: BuyerPosition = env.storage().persistent().get(&pos_key).expect("No es comprador activo");
        assert!(pos.units > 0 && !pos.refunded, "No es comprador activo de este lote");
        assert!(!pos.confirmed_delivery, "Este comprador ya confirmo la entrega");

        let key = DataKey::Batch(batch_id);
        let mut batch: BatchEscrow = env.storage().persistent().get(&key).expect("Lote no existe");
        assert!(
            batch.status == BatchStatus::CustomsClearedBo
                || batch.status == BatchStatus::DomesticDispatchedBo,
            "Lote no se encuentra en estado apto para confirmar entrega"
        );

        pos.confirmed_delivery = true;
        batch.confirmed_units += pos.units;
        env.storage().persistent().set(&pos_key, &pos);

        // Si se alcanza el quórum ponderado (>= 80% de las unidades totales del MOQ confirmadas)
        if (batch.confirmed_units as u64) * 100 >= (batch.moq_total_units as u64) * 80 {
            batch.status = BatchStatus::DeliveredCompleted;

            let broker = batch.broker.clone().unwrap();
            let fee_recipient: Address = env
                .storage()
                .instance()
                .get(&DataKey::PlatformFeeRecipient)
                .expect("Fee recipient no configurado");
            let fee_bps: u32 = env
                .storage()
                .instance()
                .get(&DataKey::PlatformFeeBps)
                .unwrap_or(250);

            let token_client = token::Client::new(&env, &batch.token);

            // Cálculo del tramo final restante según modalidad (15% internacional vs. 30% nacional)
            let tranche_final_gross = if batch.is_domestic {
                batch.collected_amount - ((batch.collected_amount * 70) / 100)
            } else {
                batch.collected_amount
                    - ((batch.collected_amount * 60) / 100)
                    - ((batch.collected_amount * 25) / 100)
            };

            // Fee Split Atómico hacia la tesorería de software de la plataforma (ej. 2.5% del lote)
            let platform_fee = (batch.collected_amount * (fee_bps as i128)) / 10_000;
            let broker_final_tranche = tranche_final_gross - platform_fee;

            // Pago de comisión de software
            if platform_fee > 0 {
                token_client.transfer(
                    &env.current_contract_address(),
                    &fee_recipient,
                    &platform_fee,
                );
            }

            // Liquidación final al despachante o proveedor + devolución de su fianza + bono de arranque
            let total_broker_payout =
                broker_final_tranche + batch.broker_bond_locked + batch.subsidy_bonus;
            token_client.transfer(
                &env.current_contract_address(),
                &broker,
                &total_broker_payout,
            );

            // Actualizar reputación inmutable del Despachante o Proveedor en Persistent Storage
            let rep_key = DataKey::BrokerProfile(broker.clone());
            let mut stats: BrokerStats = env.storage().persistent().get(&rep_key).unwrap_or(
                BrokerStats {
                    completed_batches: 0,
                    slashed_batches: 0,
                    total_volume_usdc: 0,
                },
            );
            stats.completed_batches += 1;
            stats.total_volume_usdc += batch.collected_amount;
            env.storage().persistent().set(&rep_key, &stats);
            env.storage().persistent().extend_ttl(&rep_key, 500_000, 1_200_000);
        }

        env.storage().persistent().set(&key, &batch);
    }

    /// 7. Penalización al Despachante por incumplimiento grave (Slashing)
    pub fn slash_broker(env: Env, batch_id: u64) {
        let oracle: Address = env.storage().instance().get(&DataKey::AdminOracle).expect("No inicializado");
        oracle.require_auth();

        let key = DataKey::Batch(batch_id);
        let mut batch: BatchEscrow = env.storage().persistent().get(&key).expect("Lote no existe");
        assert!(
            batch.status != BatchStatus::DeliveredCompleted
                && batch.status != BatchStatus::ExpiredRefundable
                && batch.status != BatchStatus::SlashedCancelled,
            "Lote no es elegible para penalizacion"
        );

        batch.status = BatchStatus::SlashedCancelled;

        if let Some(broker) = batch.broker.clone() {
            let rep_key = DataKey::BrokerProfile(broker.clone());
            let mut stats: BrokerStats = env.storage().persistent().get(&rep_key).unwrap_or(
                BrokerStats {
                    completed_batches: 0,
                    slashed_batches: 0,
                    total_volume_usdc: 0,
                },
            );
            stats.slashed_batches += 1;
            env.storage().persistent().set(&rep_key, &stats);
            env.storage().persistent().extend_ttl(&rep_key, 500_000, 1_200_000);
        }

        env.storage().persistent().set(&key, &batch);
        env.events().publish((symbol_short!("slashed"), batch_id), ());
    }

    // --- Métodos de consulta (Getters) para Frontend / Backend / Bindings ---

    pub fn get_batch(env: Env, batch_id: u64) -> Option<BatchEscrow> {
        env.storage().persistent().get(&DataKey::Batch(batch_id))
    }

    pub fn get_buyer_pos(env: Env, batch_id: u64, buyer: Address) -> Option<BuyerPosition> {
        env.storage().persistent().get(&DataKey::BuyerPos(batch_id, buyer))
    }

    pub fn get_broker_profile(env: Env, broker: Address) -> Option<BrokerStats> {
        env.storage().persistent().get(&DataKey::BrokerProfile(broker))
    }

    pub fn get_admin_oracle(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::AdminOracle)
    }

    pub fn get_platform_fee_recipient(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::PlatformFeeRecipient)
    }

    pub fn get_platform_fee_bps(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::PlatformFeeBps).unwrap_or(250)
    }
}

#[cfg(test)]
mod test;

#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, BytesN, Env,
};

fn setup_test_env() -> (
    Env,
    Address, // contract_id
    GroupImportEscrowContractClient<'static>,
    Address, // token_address
    token::StellarAssetClient<'static>,
    Address, // oracle
    Address, // treasury
    Address, // anchor
    Address, // co_buyer
    Address, // broker
) {
    let env = Env::default();
    env.mock_all_auths();

    let oracle = Address::generate(&env);
    let treasury = Address::generate(&env);
    let anchor = Address::generate(&env);
    let co_buyer = Address::generate(&env);
    let broker = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin);
    let token_address = token_contract.address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    let contract_id = env.register(GroupImportEscrowContract, ());
    let client = GroupImportEscrowContractClient::new(&env, &contract_id);

    // Initial setup
    client.initialize(&oracle, &treasury, &250); // 2.5% fee

    // Mint tokens
    token_admin_client.mint(&anchor, &1_000_000_0000000); // 1,000,000 USDC
    token_admin_client.mint(&co_buyer, &1_000_000_0000000);
    token_admin_client.mint(&broker, &1_000_000_0000000);

    (
        env,
        contract_id,
        client,
        token_address,
        token_admin_client,
        oracle,
        treasury,
        anchor,
        co_buyer,
        broker,
    )
}

#[test]
fn test_full_international_import_lifecycle() {
    let (
        env,
        contract_id,
        client,
        token_address,
        _token_admin,
        _oracle,
        treasury,
        anchor,
        co_buyer,
        broker,
    ) = setup_test_env();

    let token_client = token::Client::new(&env, &token_address);

    let batch_id = 1u64;
    let unit_price = 30_0000000i128; // 30 USDC
    let moq_total = 100u32;
    let anchor_units = 30u32;
    let deadline = env.ledger().timestamp() + 86400 * 7;

    // 1. Create open batch with Anchor deposit (30 units = 900 USDC)
    client.create_open_batch(
        &batch_id,
        &anchor,
        &token_address,
        &unit_price,
        &moq_total,
        &anchor_units,
        &deadline,
        &false,
    );

    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.committed_units, 30);
    assert_eq!(batch.collected_amount, 900_0000000);
    assert_eq!(batch.status, BatchStatus::OpenForFunding);
    assert_eq!(token_client.balance(&contract_id), 900_0000000);

    // 2. Co-buyer joins with 70 units (2100 USDC) -> MOQ 100 reached!
    client.join_open_batch(&batch_id, &co_buyer, &70u32);

    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.committed_units, 100);
    assert_eq!(batch.collected_amount, 3000_0000000);
    assert_eq!(batch.status, BatchStatus::MoqReachedPendingBroker);
    assert_eq!(token_client.balance(&contract_id), 3000_0000000);

    // 3. Assign broker and broker locks bond (150 USDC bond = 5%)
    let bond_required = 150_0000000i128;
    client.assign_broker_and_bond(&batch_id, &broker, &bond_required);
    client.lock_broker_bond(&batch_id, &broker);

    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.status, BatchStatus::FundedAndBondedLocked);
    assert_eq!(batch.broker_bond_locked, bond_required);
    assert_eq!(token_client.balance(&contract_id), 3150_0000000);

    // 4. Milestone 1 (Shipping - 60% released to broker = 1800 USDC)
    let broker_balance_before_m1 = token_client.balance(&broker);
    let bl_hash = BytesN::from_array(&env, &[1u8; 32]);
    client.verify_shipment_and_release(&batch_id, &bl_hash);

    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.status, BatchStatus::ShippedFromOrigin);
    assert_eq!(
        token_client.balance(&broker),
        broker_balance_before_m1 + 1800_0000000
    );

    // 5. Milestone 2 (Customs - 25% released to broker = 750 USDC)
    let broker_balance_before_m2 = token_client.balance(&broker);
    let dim_hash = BytesN::from_array(&env, &[2u8; 32]);
    client.verify_customs_and_release(&batch_id, &dim_hash);

    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.status, BatchStatus::CustomsClearedBo);
    assert_eq!(
        token_client.balance(&broker),
        broker_balance_before_m2 + 750_0000000
    );

    // 6. Milestone 3 (Delivery confirmation - Quorum 80%)
    // Anchor confirms delivery (30 units = 30%) -> Quorum not reached yet
    client.confirm_delivery(&batch_id, &anchor);
    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.status, BatchStatus::CustomsClearedBo);
    assert_eq!(batch.confirmed_units, 30);

    // Co-buyer confirms delivery (70 units -> 100% >= 80% quorum!)
    // Final tranche = 15% (450 USDC).
    // Platform fee = 2.5% of 3000 USDC = 75 USDC.
    // Broker final payout = (450 - 75) + 150 (bond returned) = 525 USDC.
    let broker_balance_before_m3 = token_client.balance(&broker);
    let treasury_balance_before = token_client.balance(&treasury);

    client.confirm_delivery(&batch_id, &co_buyer);

    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.status, BatchStatus::DeliveredCompleted);
    assert_eq!(batch.confirmed_units, 100);

    // Verify Treasury received 75 USDC platform fee
    assert_eq!(
        token_client.balance(&treasury),
        treasury_balance_before + 75_0000000
    );

    // Verify Broker received 525 USDC (375 remaining + 150 bond refund)
    assert_eq!(
        token_client.balance(&broker),
        broker_balance_before_m3 + 525_0000000
    );

    // Verify contract has 0 remaining balance
    assert_eq!(token_client.balance(&contract_id), 0);

    // Verify Broker reputation updated
    let profile = client.get_broker_profile(&broker).unwrap();
    assert_eq!(profile.completed_batches, 1);
    assert_eq!(profile.slashed_batches, 0);
    assert_eq!(profile.total_volume_usdc, 3000_0000000);
}

#[test]
fn test_expired_refund_flow() {
    let (
        env,
        _contract_id,
        client,
        token_address,
        _token_admin,
        _oracle,
        _treasury,
        anchor,
        co_buyer,
        _broker,
    ) = setup_test_env();

    let token_client = token::Client::new(&env, &token_address);

    let batch_id = 2u64;
    let unit_price = 50_0000000i128; // 50 USDC
    let moq_total = 100u32;
    let anchor_units = 20u32; // 1000 USDC
    let deadline = env.ledger().timestamp() + 86400 * 3;

    client.create_open_batch(
        &batch_id,
        &anchor,
        &token_address,
        &unit_price,
        &moq_total,
        &anchor_units,
        &deadline,
        &false,
    );

    // Co-buyer joins with 30 units (1500 USDC), total = 50/100 units
    client.join_open_batch(&batch_id, &co_buyer, &30u32);

    let anchor_balance_after_join = token_client.balance(&anchor);
    let cobuyer_balance_after_join = token_client.balance(&co_buyer);

    // Fast-forward ledger time past deadline
    env.ledger().set_timestamp(deadline + 10);

    // Anchor claims refund
    client.claim_expired_refund(&batch_id, &anchor);
    assert_eq!(
        token_client.balance(&anchor),
        anchor_balance_after_join + 1000_0000000
    );

    // Co-buyer claims refund
    client.claim_expired_refund(&batch_id, &co_buyer);
    assert_eq!(
        token_client.balance(&co_buyer),
        cobuyer_balance_after_join + 1500_0000000
    );

    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.status, BatchStatus::ExpiredRefundable);
}

#[test]
fn test_domestic_wholesale_batch_flow() {
    let (
        env,
        contract_id,
        client,
        token_address,
        _token_admin,
        _oracle,
        treasury,
        anchor,
        _co_buyer,
        broker,
    ) = setup_test_env();

    let token_client = token::Client::new(&env, &token_address);

    let batch_id = 3u64;
    let unit_price = 20_0000000i128; // 20 USDC
    let moq_total = 50u32;
    let anchor_units = 50u32; // 1000 USDC (anchor completes 100% on day 1)
    let deadline = env.ledger().timestamp() + 86400 * 5;

    // Create domestic batch
    client.create_open_batch(
        &batch_id,
        &anchor,
        &token_address,
        &unit_price,
        &moq_total,
        &anchor_units,
        &deadline,
        &true, // is_domestic = true
    );

    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.status, BatchStatus::MoqReachedPendingBroker);

    // Broker locks bond
    let bond = 50_0000000i128;
    client.assign_broker_and_bond(&batch_id, &broker, &bond);
    client.lock_broker_bond(&batch_id, &broker);

    // Domestic Dispatch Milestone (70% released to local distributor = 700 USDC)
    let broker_bal_before = token_client.balance(&broker);
    let invoice_hash = BytesN::from_array(&env, &[9u8; 32]);
    client.verify_domestic_dispatch(&batch_id, &invoice_hash);

    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.status, BatchStatus::DomesticDispatchedBo);
    assert_eq!(token_client.balance(&broker), broker_bal_before + 700_0000000);

    // Confirm delivery: 30% gross = 300 USDC. Fee = 2.5% of 1000 = 25 USDC.
    // Broker gets (300 - 25) + 50 bond = 325 USDC. Treasury gets 25 USDC.
    let broker_bal_before_final = token_client.balance(&broker);
    let treasury_before = token_client.balance(&treasury);

    client.confirm_delivery(&batch_id, &anchor);

    let batch = client.get_batch(&batch_id).unwrap();
    assert_eq!(batch.status, BatchStatus::DeliveredCompleted);
    assert_eq!(token_client.balance(&treasury), treasury_before + 25_0000000);
    assert_eq!(
        token_client.balance(&broker),
        broker_bal_before_final + 325_0000000
    );
    assert_eq!(token_client.balance(&contract_id), 0);
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEscrowClient } from '@/lib/stellar';


export async function GET() {
  try {
    const batches = await prisma.batchMetadata.findMany({
      include: {
        bids: {
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const client = getEscrowClient();

    // Enriquecer cada lote con el estado en vivo de Soroban Testnet
    const enriched = await Promise.all(
      batches.map(async (batch) => {
        try {
          const tx = await client.get_batch({
            batch_id: batch.batchId,
          });
          const onchain = tx.result;

          if (onchain) {
            return {
              ...batch,
              batchId: batch.batchId.toString(),
              onchain: {
                anchorBuyer: onchain.anchor_buyer,
                broker: onchain.broker ?? null,
                unitPrice: onchain.unit_price.toString(),
                moqTotalUnits: onchain.moq_total_units,
                committedUnits: onchain.committed_units,
                targetAmount: onchain.target_amount.toString(),
                collectedAmount: onchain.collected_amount.toString(),
                fundingDeadline: Number(onchain.funding_deadline),
                brokerBondRequired: onchain.broker_bond_required.toString(),
                brokerBondLocked: onchain.broker_bond_locked.toString(),
                status: onchain.status,
                buyerCount: onchain.buyer_count,
                confirmedUnits: onchain.confirmed_units,
                blDocHash: onchain.bl_doc_hash.toString('hex'),
                dimDocHash: onchain.dim_doc_hash.toString('hex'),
                isDomestic: onchain.is_domestic,
              },
            };
          }
        } catch (err) {
          console.warn(`Could not fetch on-chain batch ${batch.batchId}:`, err);
        }

        return {
          ...batch,
          batchId: batch.batchId.toString(),
          onchain: null,
        };
      })
    );

    const serialized = JSON.parse(
      JSON.stringify(enriched, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al obtener lotes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      batchId,
      title,
      description,
      sku,
      nandinaCode,
      category,
      imageUrl,
      factoryUrl,
      originCity,
      targetDepartment,
      isDomestic,
    } = body;

    if (!batchId || !title || !sku) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (batchId, title, sku)' },
        { status: 400 }
      );
    }

    const created = await prisma.batchMetadata.create({
      data: {
        batchId: BigInt(batchId),
        title,
        description: description || '',
        sku,
        nandinaCode,
        category: category || 'General',
        imageUrl: imageUrl || '/assets/hero_ship.jpg',
        factoryUrl,
        originCity: originCity || 'Shenzhen, China',
        targetDepartment: targetDepartment || 'La Paz / Nacional',
        isDomestic: Boolean(isDomestic),
      },
    });

    return NextResponse.json({
      ...created,
      batchId: created.batchId.toString(),
    });
  } catch (error: any) {
    console.error('Error creating batch metadata:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al guardar metadatos del lote' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batchId = BigInt(id);
    const body = await request.json();

    const {
      brokerAddress,
      brokerName,
      freightCostUsdc,
      customsClearanceUsdc,
      domesticDeliveryUsdc,
      totalQuoteUsdc,
      estimatedDays,
      bondRequired,
    } = body;

    if (!brokerAddress || !brokerName || totalQuoteUsdc === undefined) {
      return NextResponse.json(
        { error: 'Campos requeridos incompletos' },
        { status: 400 }
      );
    }

    const bid = await prisma.brokerBid.create({
      data: {
        batchId,
        brokerAddress,
        brokerName,
        freightCostUsdc: Number(freightCostUsdc) || 0,
        customsClearanceUsdc: Number(customsClearanceUsdc) || 0,
        domesticDeliveryUsdc: Number(domesticDeliveryUsdc) || 0,
        totalQuoteUsdc: Number(totalQuoteUsdc),
        estimatedDays: Number(estimatedDays) || 45,
        bondRequired: Number(bondRequired) || 0,
        status: 'PENDING',
      },
    });

    return NextResponse.json(bid);
  } catch (error: any) {
    console.error('Error creating bid:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al guardar cotización aduanera' },
      { status: 500 }
    );
  }
}

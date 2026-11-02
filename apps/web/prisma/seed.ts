import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial batch metadata for Batch #1...');

  await prisma.batchMetadata.upsert({
    where: { batchId: BigInt(1) },
    update: {},
    create: {
      batchId: BigInt(1),
      title: 'Inversores Solares Híbridos 5kW MPPT (Deye / Growatt Compatible)',
      description: 'Lote colectivo de inversores solares híbridos directos de fábrica en Shenzhen. Incluye certificación de origen, embalaje reforzado y desaduanaje unificado en Aduana Interior La Paz con distribución a los 9 departamentos.',
      sku: 'SOLAR-INV-5KW-BO',
      nandinaCode: '8504.40.90.00 - Inversores Solares Híbridos',
      category: 'Energía Solar y Renovables',
      imageUrl: '/assets/hero_ship.jpg',
      factoryUrl: 'https://alibaba.com/sample-factory-deye',
      originCity: 'Shenzhen, China',
      targetDepartment: 'La Paz / Nacional',
      isDomestic: false,
      bids: {
        create: [
          {
            brokerAddress: 'GCM4R5FSYYTJPHZ23KRYZRHXWTBNUXFUYLLTVPMQRRQ5APTAV2PLVN2H',
            brokerName: 'Agencia Despachante Acreditada Aduana Nacional (BO-AD-01)',
            freightCostUsdc: 250,
            customsClearanceUsdc: 180,
            domesticDeliveryUsdc: 120,
            totalQuoteUsdc: 550,
            estimatedDays: 45,
            bondRequired: 150, // 5% de 3000 USDC
            status: 'ACCEPTED',
          },
        ],
      },
    },
  });

  console.log('✅ Batch #1 seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

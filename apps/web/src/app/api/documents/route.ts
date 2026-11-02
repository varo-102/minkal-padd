import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const batchIdStr = formData.get('batchId') as string;
    const docType = formData.get('docType') as string;
    const uploadedBy = formData.get('uploadedBy') as string;
    const file = formData.get('file') as File | null;

    if (!batchIdStr || !docType || !file) {
      return NextResponse.json(
        { error: 'Faltan parámetros (batchId, docType, file)' },
        { status: 400 }
      );
    }

    const batchId = BigInt(batchIdStr);
    const buffer = Buffer.from(await file.arrayBuffer());

    // Cálculo del hash SHA-256 criptográfico para Soroban BytesN<32>
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    const document = await prisma.batchDocument.create({
      data: {
        batchId,
        docType,
        fileName: file.name,
        fileUrl: `/uploads/${file.name}`,
        fileHash: hash,
        uploadedBy: uploadedBy || 'Anonymous',
        verified: true,
      },
    });

    return NextResponse.json({
      ...document,
      batchId: document.batchId.toString(),
      sha256Hex: hash,
      bytes32Array: Array.from(Buffer.from(hash, 'hex')),
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al procesar documento aduanero' },
      { status: 500 }
    );
  }
}

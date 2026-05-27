import { NextResponse } from "next/server";
import { z } from "zod";
import { createBatchInvoice } from "@/lib/breez";
import { createPendingBatch } from "@/lib/db";

const payloadSchema = z.object({
  batchId: z.string().min(6),
  drugName: z.string().min(2),
  manufacturer: z.string().min(2),
  manufactureDate: z.string().min(4),
  expiryDate: z.string().min(4),
});

export async function POST(req: Request) {
  try {
    const payload = payloadSchema.parse(await req.json());
    const invoiceData = await createBatchInvoice(payload.batchId);

    await createPendingBatch(payload, invoiceData.paymentHash, invoiceData.invoice);

    return NextResponse.json({
      success: true,
      invoice: invoiceData.invoice,
      paymentHash: invoiceData.paymentHash,
      amountSats: invoiceData.amountSats,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}

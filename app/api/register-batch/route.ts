import { NextResponse } from "next/server";
import { z } from "zod";
import { createBatchInvoice } from "@/lib/breez";
import { createPendingBatch } from "@/lib/db";

export const runtime = "nodejs";

const payloadSchema = z.object({
  batchId: z.string().trim().min(3).max(24).regex(/^[A-Za-z0-9-]+$/),
  drugName: z.string().trim().min(2),
  manufacturer: z.string().trim().min(2),
  manufactureDate: z.string().trim().min(4),
  expiryDate: z.string().trim().min(4),
});

export async function POST(req: Request) {
  try {
    const raw = payloadSchema.parse(await req.json());
    // Store batch ID normalized (uppercase, no hyphens) so OCR lookups always match
    const payload = { ...raw, batchId: raw.batchId.toUpperCase().replace(/[^A-Z0-9]/g, "") };
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

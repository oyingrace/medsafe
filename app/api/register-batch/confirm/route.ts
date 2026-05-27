import { NextResponse } from "next/server";
import { checkPaymentStatus } from "@/lib/breez";
import { getBatchByPaymentHash, markBatchRegistered } from "@/lib/db";
import { createBatchEvent, publishBatchEvent } from "@/lib/nostr";

function pick(record: unknown, a: string, b?: string) {
  if (!record || typeof record !== "object") return "";
  const row = record as Record<string, unknown>;
  const value = row[a] ?? (b ? row[b] : undefined);
  return String(value ?? "");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const paymentHash = searchParams.get("paymentHash");

  if (!paymentHash) {
    return NextResponse.json({ success: false, error: "paymentHash is required" }, { status: 400 });
  }

  const status = await checkPaymentStatus(paymentHash);
  if (status !== "paid") return NextResponse.json({ success: true, status });

  const batch = await getBatchByPaymentHash(paymentHash);
  if (!batch) return NextResponse.json({ success: false, error: "Pending batch not found" }, { status: 404 });

  const privateKey = process.env.MANUFACTURER_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json({ success: false, error: "MANUFACTURER_PRIVATE_KEY missing" }, { status: 500 });
  }

  const event = createBatchEvent(
    {
      batchId: pick(batch, "batch_id", "batchId"),
      drugName: pick(batch, "drug_name", "drugName"),
      manufacturer: pick(batch, "manufacturer"),
      manufactureDate: pick(batch, "manufacture_date", "manufactureDate"),
      expiryDate: pick(batch, "expiry_date", "expiryDate"),
    },
    privateKey,
    paymentHash,
  );
  const publishResult = await publishBatchEvent(event);
  await markBatchRegistered(pick(batch, "batch_id", "batchId"), publishResult.eventId);

  return NextResponse.json({
    success: true,
    status: "paid",
    nostrEventId: publishResult.eventId,
    relay: publishResult.relayUrl,
  });
}

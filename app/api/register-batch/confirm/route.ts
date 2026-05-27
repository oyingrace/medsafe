import { NextResponse } from "next/server";
import { checkPaymentStatus } from "@/lib/breez";
import { getBatchByPaymentHash, markBatchRegistered } from "@/lib/db";
import { createBatchEvent, publishBatchEvent } from "@/lib/nostr";

export const runtime = "nodejs";

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

  const existingNostr = pick(batch, "nostr_event_id", "nostrEventId");
  if (existingNostr) {
    return NextResponse.json({
      success: true,
      status: "paid",
      nostrEventId: existingNostr,
      relay: process.env.NOSTR_RELAY_URL?.split(",")[0]?.trim() ?? "in-memory",
    });
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
  try {
    const publishResult = await publishBatchEvent(event);
    await markBatchRegistered(pick(batch, "batch_id", "batchId"), publishResult.eventId);

    return NextResponse.json({
      success: true,
      status: "paid",
      nostrEventId: publishResult.eventId,
      relay: publishResult.relayUrl,
    });
  } catch (err) {
    console.error("[register-batch/confirm] nostr publish failed:", err);
    return NextResponse.json(
      {
        success: false,
        status: "paid",
        error: "Payment recorded but Nostr publish failed; retry this request.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 },
    );
  }
}

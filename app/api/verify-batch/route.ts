import { NextResponse } from "next/server";
import { logAndCheckAnomaly } from "@/lib/anomaly";
import {
  isTrustedManufacturer,
  queryBatchById,
  verifyEventSignature,
} from "@/lib/nostr";

export const runtime = "nodejs";

function toDetails(event: Awaited<ReturnType<typeof queryBatchById>>) {
  if (!event) return undefined;
  const map = new Map(event.tags.map((t) => [t[0], t[1]]));
  return {
    batchId: map.get("d") ?? "",
    drugName: map.get("drug_name") ?? "",
    manufacturer: map.get("manufacturer") ?? "",
    manufactureDate: map.get("manufacture_date") ?? "",
    expiryDate: map.get("expiry_date") ?? "",
    paymentHash: map.get("lightning_payment_hash") ?? "",
    eventId: event.id,
    createdAt: event.created_at,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");
  const userPhone = searchParams.get("userPhone") ?? undefined;
  const region = searchParams.get("region") ?? undefined;

  if (!batchId) {
    return NextResponse.json({ success: false, error: "batchId is required" }, { status: 400 });
  }

  // Normalize: uppercase and strip non-alphanumeric so OCR noise doesn't break lookup
  const normalizedId = batchId.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const event = await queryBatchById(normalizedId);
  if (!event) {
    await logAndCheckAnomaly(normalizedId, "fake", userPhone, region);
    return NextResponse.json({ success: true, status: "fake" as const, reason: "not_found" });
  }
  if (!verifyEventSignature(event)) {
    await logAndCheckAnomaly(normalizedId, "fake", userPhone, region);
    return NextResponse.json({ success: true, status: "fake" as const, reason: "bad_signature" });
  }
  if (!isTrustedManufacturer(event)) {
    await logAndCheckAnomaly(normalizedId, "fake", userPhone, region);
    return NextResponse.json({ success: true, status: "fake" as const, reason: "wrong_manufacturer_pubkey" });
  }

  const anomaly = await logAndCheckAnomaly(normalizedId, "verified", userPhone, region);
  if (anomaly.isAnomaly) {
    return NextResponse.json({ success: true, status: "anomaly" as const, details: toDetails(event) });
  }

  return NextResponse.json({ success: true, status: "verified" as const, details: toDetails(event) });
}

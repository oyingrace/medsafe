import { NextResponse } from "next/server";
import { getPayerDebugStatus } from "@/lib/breez";

export const runtime = "nodejs";

export async function GET() {
  try {
    const status = await getPayerDebugStatus();
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), payer: status });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

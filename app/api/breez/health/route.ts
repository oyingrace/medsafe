import { NextResponse } from "next/server";
import { getBreezDebugStatus } from "@/lib/breez";

export const runtime = "nodejs";

export async function GET() {
  try {
    const status = await getBreezDebugStatus();
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      breez: status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Breez health check failed",
      },
      { status: 503 },
    );
  }
}

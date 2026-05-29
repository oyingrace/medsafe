import { NextResponse } from "next/server";
import { z } from "zod";
import { logAndCheckAnomaly } from "@/lib/anomaly";

const schema = z.object({
  batchId: z.string().min(3),
  result: z.enum(["verified", "fake", "anomaly"]).default("verified"),
  userPhone: z.string().optional(),
  region: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const res = await logAndCheckAnomaly(body.batchId, body.result, body.userPhone, body.region);
    return NextResponse.json({ success: true, ...res });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}

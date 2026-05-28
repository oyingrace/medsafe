import { NextResponse } from "next/server";
import { extractBatchIdFromImage, extractBatchIdFromText } from "@/lib/ocr";
import {
  deriveRegionHint,
  formatWhatsAppVerificationMessage,
  isGreeting,
  WELCOME_MESSAGE,
} from "@/lib/twilio";

export const runtime = "nodejs";

function twiml(message: string) {
  // Escape XML special chars so the TwiML stays valid
  const safe = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return new NextResponse(`<Response><Message>${safe}</Message></Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const body = String(formData.get("Body") ?? "");
  const from = String(formData.get("From") ?? "");
  const mediaUrl = formData.get("MediaUrl0");

  // Greetings → welcome message (TwiML only — no extra API call)
  if (isGreeting(body) && !mediaUrl) {
    return twiml(WELCOME_MESSAGE);
  }

  let batchId: string | null = extractBatchIdFromText(body);
  if (!batchId && mediaUrl) {
    const ocr = await extractBatchIdFromImage(String(mediaUrl));
    batchId = ocr.batchId ?? null;
    if (!batchId && ocr.confidence > 0 && ocr.confidence < 70) {
      return twiml("⚠️ Photo unclear. Retake a closer photo of the batch code or type the ID as text.");
    }
  }

  if (!batchId) {
    return twiml("⚠️ Could not read a batch ID. Please send a clear photo or type the ID (e.g. B260500).");
  }

  const verifyUrl = new URL("/api/verify-batch", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  verifyUrl.searchParams.set("batchId", batchId);
  verifyUrl.searchParams.set("userPhone", from);
  const regionHint = deriveRegionHint(from);
  if (regionHint) verifyUrl.searchParams.set("region", regionHint);

  const verifyResp = await fetch(verifyUrl.toString(), { method: "GET" });
  const verifyBody = (await verifyResp.json()) as { status: "verified" | "fake" | "anomaly" };
  const reply = formatWhatsAppVerificationMessage(verifyBody.status, batchId);

  return twiml(reply);
}

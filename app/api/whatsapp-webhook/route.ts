import { NextResponse } from "next/server";
import { extractBatchIdFromImage, extractBatchIdFromText } from "@/lib/ocr";
import { formatWhatsAppVerificationMessage, sendWhatsAppMessage } from "@/lib/twilio";

export async function POST(req: Request) {
  const formData = await req.formData();
  const body = String(formData.get("Body") ?? "");
  const from = String(formData.get("From") ?? "");
  const mediaUrl = formData.get("MediaUrl0");

  let batchId = extractBatchIdFromText(body);
  if (!batchId && mediaUrl) {
    const ocr = await extractBatchIdFromImage(String(mediaUrl));
    batchId = ocr.batchId;
  }

  if (!batchId) {
    const reply = "⚠️ Could not read batch ID. Please send a clear photo or text ID.";
    await sendWhatsAppMessage(from, reply);
    return new NextResponse(`<Response><Message>${reply}</Message></Response>`, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const verifyUrl = new URL("/api/verify-batch", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  verifyUrl.searchParams.set("batchId", batchId);
  verifyUrl.searchParams.set("userPhone", from);
  const verifyResp = await fetch(verifyUrl.toString(), { method: "GET" });
  const verifyBody = (await verifyResp.json()) as { status: "verified" | "fake" | "anomaly" };
  const reply = formatWhatsAppVerificationMessage(verifyBody.status, batchId);

  await sendWhatsAppMessage(from, reply);
  return new NextResponse(`<Response><Message>${reply}</Message></Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

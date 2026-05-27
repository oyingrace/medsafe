import twilio from "twilio";

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_WHATSAPP_FROM;

const client = sid && token ? twilio(sid, token) : null;

export async function sendWhatsAppMessage(to: string, message: string) {
  if (!client || !from) return { sent: false };
  const msg = await client.messages.create({
    from,
    to,
    body: message.slice(0, 160),
  });
  return { sent: true, sid: msg.sid };
}

export function formatWhatsAppVerificationMessage(status: "verified" | "fake" | "anomaly", batchId: string) {
  if (status === "verified") return `✅ VERIFIED: ${batchId} is authentic in MedSafe.`;
  if (status === "anomaly") return `⚠️ ANOMALY: ${batchId} appears suspicious. Contact manufacturer.`;
  return `❌ NOT FOUND: ${batchId} is not registered in MedSafe.`;
}

/** Coarse region hint for anomaly detection (NOT full geolocation). */
export function deriveRegionHint(whatsappFrom: string) {
  const digits = whatsappFrom.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("234")) return "cc:234";
  if (digits.startsWith("1") && digits.length >= 11) return "cc:1";
  if (digits.startsWith("44")) return "cc:44";
  if (digits.startsWith("233")) return "cc:233";
  if (digits.startsWith("254")) return "cc:254";
  if (digits.startsWith("27")) return "cc:27";
  return `cc:${digits.slice(0, 4)}`;
}

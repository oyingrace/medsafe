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

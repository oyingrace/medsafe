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
    body: message.slice(0, 1600),
  });
  return { sent: true, sid: msg.sid };
}

export const WELCOME_MESSAGE =
  `👋 Welcome to *MedSafe* drug verification system.\n\n` +
  `You can:\n` +
  `1️⃣ *Verify a drug*: send the batch ID\n` +
  `   e.g. B260500\n\n` +
  `2️⃣ *Verify a company* — type:\n` +
  `   verify company Emzor\n\n` +
  `3️⃣ *Or send a photo of the drug label for automatic check\n\n`;

/** Returns true when the message looks like a greeting */
export function isGreeting(text: string) {
  return /^\s*(hi|hello|hey|start|help|helo|howdy|hy|yo)[\s,!.]*(?:medsafe)?\s*$/i.test(text.trim());
}

export interface BatchDetails {
  drugName?: string;
  manufacturer?: string;
  manufactureDate?: string;
  expiryDate?: string;
}

export function formatWhatsAppVerificationMessage(
  status: "verified" | "fake" | "anomaly",
  batchId: string,
  details?: BatchDetails,
) {
  if (status === "verified") {
    return (
      `✅ *Batch Verified!*\n\n` +
      `*Batch ID:* ${batchId}\n` +
      `*Drug:* ${details?.drugName || "—"}\n` +
      `*Manufacturer:* ${details?.manufacturer || "—"}\n` +
      `*Manufactured:* ${details?.manufactureDate || "—"}\n` +
      `*Expiry Date:* ${details?.expiryDate || "—"}\n\n` +
      `This batch is registered on the MedSafe network. ✔️`
    );
  }
  if (status === "anomaly") {
    return (
      `⚠️ *ANOMALY DETECTED*\n\n` +
      `*Batch ID:* ${batchId}\n` +
      `*Drug:* ${details?.drugName || "—"}\n\n` +
      `This batch has been verified an unusual number of times across multiple regions. ` +
      `The drug may be genuine but the batch is being flagged for review. ` +
      `Please contact the manufacturer or NAFDAC directly.`
    );
  }
  return (
    `❌ *Not Found*\n\n` +
    `Batch ID *${batchId}* is not registered on the MedSafe network.\n\n` +
    `⚠️ This medicine may be *counterfeit*. Do NOT consume it.\n` +
    `Report to your nearest NAFDAC office.`
  );
}

/**
 * Detects "verify company <name>" intent.
 * Matches: "verify company Emzor", "check company Fidson", "company: Emzor", etc.
 * Returns the company name string, or null if no match.
 */
export function parseCompanyQuery(text: string): string | null {
  const t = text.trim();
  const m = t.match(
    /^(?:verify|check|lookup|search|find)?\s*(?:company|manufacturer|mfr|brand)\s*[:\-]?\s*(.+)$/i,
  );
  return m ? m[1].trim() : null;
}

export interface ManufacturerBatch {
  batchId: string;
  drugName: string;
  manufacturer: string;
  expiryDate: string;
}

export function formatCompanyMessage(
  query: string,
  batches: ManufacturerBatch[],
): string {
  if (batches.length === 0) {
    return (
      `❌ *No registered batches found for "${query}"*\n\n` +
      `This company may not be on MedSafe yet, or their batches have not been published.\n\n`
    );
  }

  const manufacturerName = batches[0].manufacturer;
  const lines = batches
    .map((b, i) => `${i + 1}. *${b.batchId}* — ${b.drugName} (Exp: ${b.expiryDate})`)
    .join("\n");

  return (
    `🏭 *${manufacturerName}*\n` +
    `✅ Registered on MedSafe\n\n` +
    `📦 *${batches.length} registered batch${batches.length > 1 ? "es" : ""}:*\n` +
    `${lines}\n\n`
  );
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

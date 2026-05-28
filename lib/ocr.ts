import { createWorker } from "tesseract.js";
import { Jimp, JimpMime } from "jimp";

/**
 * Priority 1 — labeled "BN", "Batch No.", "LOT" prefix.
 * Lenient: captures any word-like token (possibly with a space gap) after the label.
 * Handles dot-matrix OCR artefacts and O/0 confusion.
 */
const LABELED_BN_RE =
  /(?:batch\s*n[o0]\.?|b\.?\s*n\.?|lot\s*n[o0]\.?|lot)\s*[:\-]?\s*([A-Z0-9]{1,4}\s*[A-Z0-9]{4,12})/gi;

/**
 * Priority 2 — pharma batch shape.
 * 1–4 letters then 4+ alphanumeric chars — allows O/0 confusion (B26O5OO → B260500).
 */
const PHARMA_BATCH_RE = /\b([A-Z]{1,4}[A-Z0-9]{4,12})\b/g;

/**
 * Priority 3 fallback — mixed alphanumeric tokens (letters + digits, ≥6 chars).
 * Pure words (PARACETAMOL) and pure numbers (260500) are excluded.
 */
const MIXED_TOKEN_RE = /\b(?=[A-Z0-9]*[A-Z])(?=[A-Z0-9]*[0-9])[A-Z0-9]{6,16}\b/g;

async function fetchImageBytes(url: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const headers: HeadersInit = {};
  const isTwilio = url.includes("api.twilio.com");
  if (isTwilio && sid && token) {
    headers.Authorization = `Basic ${Buffer.from(`${sid}:${token}`, "utf8").toString("base64")}`;
  }
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(14000) });
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function preprocessImage(buffer: Buffer) {
  const image = await Jimp.read(buffer);
  await image.greyscale();
  await image.contrast(0.18);
  return Buffer.from(await image.getBuffer(JimpMime.jpeg));
}

/**
 * Normalize common OCR confusables in what looks like a batch ID token.
 * Applied only AFTER extraction to avoid corrupting surrounding text.
 */
function normalizeBatchToken(token: string): string {
  return token
    .toUpperCase()
    .replace(/\s+/g, "")   // collapse spaces OCR inserts mid-token
    .replace(/O/g, "0")     // letter O → digit 0
    .replace(/I/g, "1")     // letter I → digit 1
    .replace(/L/g, "1")     // letter L → digit 1  (dot-matrix risk)
    .replace(/[^A-Z0-9]/g, ""); // strip anything else
}

/** Tokens that are never batch IDs regardless of length */
const STOP_WORDS = new Set([
  "PARACETAMOL", "AMOXICILLIN", "TABLETS", "CAPSULES", "SYRUP", "INJECTION",
  "HERITAGE", "QUALITY", "RELIEF", "ACTING", "STOMACH", "GENTLE", "EFFECTIVE",
]);

function pickBestBatchId(text: string) {
  const upper = text.toUpperCase();

  let m: RegExpExecArray | null;

  // Priority 1 — labeled "BN" / "Batch No" / "LOT" prefix
  LABELED_BN_RE.lastIndex = 0;
  const labeledMatches: string[] = [];
  while ((m = LABELED_BN_RE.exec(upper)) !== null) {
    const candidate = normalizeBatchToken(m[1]);
    if (candidate.length >= 5 && !STOP_WORDS.has(candidate)) {
      labeledMatches.push(candidate);
    }
  }
  if (labeledMatches.length) {
    return labeledMatches.sort((a, b) => b.length - a.length)[0];
  }

  // Priority 2 — pharma batch shape (1–4 letters + 4+ alphanumeric chars)
  // Filter stop words and tokens that are pure-alpha (e.g. QUALITY, TABLETS)
  PHARMA_BATCH_RE.lastIndex = 0;
  const pharmaMatches: string[] = [];
  while ((m = PHARMA_BATCH_RE.exec(upper)) !== null) {
    const candidate = m[1];
    const normalized = normalizeBatchToken(candidate);
    const hasDigit = /[0-9]/.test(normalized);
    if (hasDigit && normalized.length >= 5 && !STOP_WORDS.has(candidate)) {
      pharmaMatches.push(normalized);
    }
  }
  if (pharmaMatches.length) {
    return pharmaMatches.sort((a, b) => b.length - a.length)[0];
  }

  // Priority 3 — mixed alphanumeric fallback (≥6 chars, letters + digits)
  const cleaned = upper.replace(/[^\w]/g, " ");
  MIXED_TOKEN_RE.lastIndex = 0;
  const mixedMatches: string[] = [];
  while ((m = MIXED_TOKEN_RE.exec(cleaned)) !== null) {
    if (!STOP_WORDS.has(m[0])) mixedMatches.push(m[0]);
  }
  if (mixedMatches.length) {
    return mixedMatches.sort((a, b) => b.length - a.length)[0];
  }
  return null;
}

export async function extractBatchIdFromImage(imageUrl: string) {
  try {
    const raw = await fetchImageBytes(imageUrl);
    const prepared = await preprocessImage(raw);

    const worker = await createWorker("eng");
    const {
      data: { text, confidence },
    } = await worker.recognize(prepared);
    await worker.terminate();

    const batchId = pickBestBatchId(text);

    const conf = typeof confidence === "number" ? confidence : 0;
    if (!batchId || conf < 60) {
      return {
        batchId: null as string | null,
        confidence: conf,
        rawSnippet: text.slice(0, 120).trim(),
      };
    }

    return { batchId, confidence: conf, rawSnippet: undefined as string | undefined };
  } catch (err) {
    console.warn("[ocr] extract failed:", err);
    return { batchId: null as string | null, confidence: 0, error: String(err) };
  }
}

export function extractBatchIdFromText(text: string) {
  // Strip "BN:", "Batch No:", "LOT:" prefix if the user typed it
  const stripped = text.replace(/^(?:batch\s*n[o0]\.?|b\.?\s*n\.?|lot\s*n[o0]\.?|lot)\s*[:\-]?\s*/i, "");
  const upper = stripped.toUpperCase();

  // Try pharma batch shape first: 1–4 letters + 4+ digits (e.g. B260500, AFY001)
  const pharma = upper.match(/\b([A-Z]{1,4}\d{4,}[A-Z0-9\-]{0,8})\b/);
  if (pharma) return pharma[1].replace(/[^A-Z0-9]/g, "");

  // Fallback: any alphanumeric token 6–16 chars
  const fallback = upper.replace(/[^A-Z0-9]/g, " ").match(/\b[A-Z0-9]{6,16}\b/);
  return fallback?.[0] ?? null;
}

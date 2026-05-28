import { createWorker } from "tesseract.js";
import { Jimp, JimpMime } from "jimp";

/**
 * Priority 1 — labeled: "BN:", "Batch No.", "LOT:" followed by the value.
 * Captures: BN: B260500 | Batch No: AMX-2025-Q1 | LOT: AFY001
 */
const LABELED_BN_RE =
  /(?:batch\s*n[o0]\.?|b\.?\s*n\.?|lot\s*n[o0]\.?|lot)\s*[:\-]?\s*([A-Z]{2,}[-\/]?\d{2,}[A-Z0-9\-\/]{0,12})/gi;

/**
 * Priority 2 — pharma batch number shape (matches the reference project pattern):
 * 2+ uppercase letters + optional hyphen + 2+ digits, e.g. B260500, AFY-001, AMX-2025
 */
const PHARMA_BATCH_RE = /\b([A-Z]{2,}-?\d{2,}[A-Z0-9\-]{0,10})\b/g;

/** Priority 3 fallback — longest standalone alphanumeric token 6–16 chars */
const BATCH_ID_RE = /\b[A-Z0-9]{6,16}\b/g;

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

function pickBestBatchId(text: string) {
  const upper = text.toUpperCase();

  // Priority 1 — labeled "BN:" / "Batch No:" / "LOT:" prefix
  const labeledMatches: string[] = [];
  let m: RegExpExecArray | null;
  LABELED_BN_RE.lastIndex = 0;
  while ((m = LABELED_BN_RE.exec(upper)) !== null) {
    const candidate = m[1].replace(/[^A-Z0-9\-]/g, "");
    if (candidate.length >= 4) labeledMatches.push(candidate);
  }
  if (labeledMatches.length) {
    return labeledMatches.sort((a, b) => b.length - a.length)[0];
  }

  // Priority 2 — pharma batch shape: 2+ letters + optional hyphen + 2+ digits
  // e.g. B260500, AFY-001, AMX2025Q1
  const pharmaMatches: string[] = [];
  PHARMA_BATCH_RE.lastIndex = 0;
  while ((m = PHARMA_BATCH_RE.exec(upper)) !== null) {
    pharmaMatches.push(m[1]);
  }
  if (pharmaMatches.length) {
    return pharmaMatches.sort((a, b) => b.length - a.length)[0];
  }

  // Priority 3 — longest standalone alphanumeric token (last resort)
  const normalized = upper.replace(/[^\w]/g, " ");
  const matches = normalized.match(BATCH_ID_RE);
  if (!matches?.length) return null;
  return matches.sort((a, b) => b.length - a.length)[0] ?? null;
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

  // Try pharma batch shape first: 2+ letters + optional hyphen + 2+ digits
  const pharma = upper.match(/\b([A-Z]{2,}-?\d{2,}[A-Z0-9\-]{0,10})\b/);
  if (pharma) return pharma[1].replace(/[^A-Z0-9]/g, "");

  // Fallback: any alphanumeric token 6–16 chars
  const fallback = upper.replace(/[^A-Z0-9]/g, " ").match(/\b[A-Z0-9]{6,16}\b/);
  return fallback?.[0] ?? null;
}

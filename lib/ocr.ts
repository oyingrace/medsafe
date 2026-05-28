import { createWorker } from "tesseract.js";
import { Jimp, JimpMime } from "jimp";

// ---------------------------------------------------------------------------
// Image fetching & preprocessing
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Batch ID normalization & validation
// ---------------------------------------------------------------------------

/** Common OCR confusables inside a captured batch token */
function normalizeBatchToken(token: string): string {
  return token
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/O/g, "0")
    .replace(/I/g, "1")
    .replace(/L(?=[0-9])/g, "1") // L before a digit is almost always 1
    .replace(/[^A-Z0-9]/g, "");
}

const STOP_WORDS = new Set([
  "PARACETAMOL", "AMOXICILLIN", "TABLETS", "CAPSULES", "SYRUP", "INJECTION",
  "HERITAGE", "QUALITY", "RELIEF", "ACTING", "STOMACH", "GENTLE", "EFFECTIVE",
  "YEARS", "QUICK", "FAST", "FEVER", "ACHES", "PAINS",
]);

/** Return true if the token looks like a plausible pharma batch number */
function isPharmaToken(token: string): boolean {
  if (STOP_WORDS.has(token)) return false;
  // Must have at least one letter AND at least one digit
  if (!/[A-Z]/.test(token) || !/[0-9]/.test(token)) return false;
  // Must be 5–16 chars
  if (token.length < 5 || token.length > 16) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Regex patterns for extracting batch IDs from raw text
// ---------------------------------------------------------------------------

/** Priority 1 — labeled "BN / Batch No / LOT" prefix */
const LABELED_BN_RE =
  /(?:batch\s*n[o0]\.?|b\.?\s*n\.?|lot\s*n[o0]\.?|lot)\s*[:\-]?\s*([A-Z0-9]{1,4}\s*[A-Z0-9]{4,12})/gi;

/** Priority 2 — pharma batch shape: 1–4 letters then 4+ alphanumeric */
const PHARMA_BATCH_RE = /\b([A-Z]{1,4}[A-Z0-9]{4,12})\b/g;

/** Priority 3 — any mixed alphanumeric token ≥6 chars */
const MIXED_TOKEN_RE = /\b(?=[A-Z0-9]*[A-Z])(?=[A-Z0-9]*[0-9])[A-Z0-9]{6,16}\b/g;

function pickBestBatchId(text: string): string | null {
  const upper = text.toUpperCase();
  let m: RegExpExecArray | null;

  // Priority 1 — labeled prefix
  LABELED_BN_RE.lastIndex = 0;
  const labeledMatches: string[] = [];
  while ((m = LABELED_BN_RE.exec(upper)) !== null) {
    const candidate = normalizeBatchToken(m[1]);
    if (isPharmaToken(candidate)) labeledMatches.push(candidate);
  }
  if (labeledMatches.length) return labeledMatches.sort((a, b) => b.length - a.length)[0];

  // Priority 2 — pharma batch shape
  PHARMA_BATCH_RE.lastIndex = 0;
  const pharmaMatches: string[] = [];
  while ((m = PHARMA_BATCH_RE.exec(upper)) !== null) {
    const candidate = normalizeBatchToken(m[1]);
    if (isPharmaToken(candidate)) pharmaMatches.push(candidate);
  }
  if (pharmaMatches.length) return pharmaMatches.sort((a, b) => b.length - a.length)[0];

  // Priority 3 — mixed alphanumeric fallback
  const cleaned = upper.replace(/[^\w]/g, " ");
  MIXED_TOKEN_RE.lastIndex = 0;
  const mixedMatches: string[] = [];
  while ((m = MIXED_TOKEN_RE.exec(cleaned)) !== null) {
    const candidate = normalizeBatchToken(m[0]);
    if (isPharmaToken(candidate)) mixedMatches.push(candidate);
  }
  if (mixedMatches.length) return mixedMatches.sort((a, b) => b.length - a.length)[0];

  return null;
}

// ---------------------------------------------------------------------------
// Primary: Gemini Flash via OpenRouter
// ---------------------------------------------------------------------------

async function extractWithGemini(imageBuffer: Buffer): Promise<{ batchId: string | null; confidence: number; source: "gemini" }> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const base64 = imageBuffer.toString("base64");
  // Detect mime type from magic bytes (JPEG vs PNG)
  const mimeType = base64.startsWith("/9j") || imageBuffer[0] === 0xff ? "image/jpeg" : "image/png";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://medisafe.app",
      "X-Title": "MedSafe Drug Verification",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-lite-001",
      max_tokens: 32,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: "text",
              text: "Extract only the batch number from this drug packaging. It is printed near labels like BN, Batch No, Batch Number, or LOT. Reply with ONLY the batch number (letters and digits, no spaces or punctuation). If you cannot find one, reply with the single word: NONE",
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

  if (!raw || raw.toUpperCase() === "NONE") return { batchId: null, confidence: 95, source: "gemini" };

  const normalized = normalizeBatchToken(raw);
  const batchId = isPharmaToken(normalized) ? normalized : pickBestBatchId(raw);
  return { batchId, confidence: 95, source: "gemini" };
}

// ---------------------------------------------------------------------------
// Fallback: Tesseract.js
// ---------------------------------------------------------------------------

async function extractWithTesseract(imageBuffer: Buffer): Promise<{ batchId: string | null; confidence: number; source: "tesseract" }> {
  const prepared = await preprocessImage(imageBuffer);
  const worker = await createWorker("eng");
  const { data: { text, confidence } } = await worker.recognize(prepared);
  await worker.terminate();

  const conf = typeof confidence === "number" ? confidence : 0;
  if (conf < 60) return { batchId: null, confidence: conf, source: "tesseract" };

  const batchId = pickBestBatchId(text);
  return { batchId, confidence: conf, source: "tesseract" };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function extractBatchIdFromImage(imageUrl: string) {
  try {
    const raw = await fetchImageBytes(imageUrl);

    // Try Gemini Flash first
    if (process.env.OPENROUTER_API_KEY?.trim()) {
      try {
        const result = await extractWithGemini(raw);
        console.log(`[ocr] gemini extracted: ${result.batchId ?? "none"}`);
        return result;
      } catch (geminiErr) {
        console.warn("[ocr] gemini failed, falling back to tesseract:", geminiErr);
      }
    }

    // Fallback: Tesseract
    const result = await extractWithTesseract(raw);
    console.log(`[ocr] tesseract extracted: ${result.batchId ?? "none"} (conf ${result.confidence})`);
    return result;
  } catch (err) {
    console.warn("[ocr] extract failed:", err);
    return { batchId: null as string | null, confidence: 0, source: "error" as const, error: String(err) };
  }
}

export function extractBatchIdFromText(text: string) {
  // Strip "BN:", "Batch No:", "LOT:" prefix if the user typed it
  const stripped = text.replace(/^(?:batch\s*n[o0]\.?|b\.?\s*n\.?|lot\s*n[o0]\.?|lot)\s*[:\-]?\s*/i, "");
  const upper = stripped.toUpperCase();

  // Try pharma batch shape first: 1–4 letters + 4+ alphanumeric
  const pharma = upper.match(/\b([A-Z]{1,4}[A-Z0-9]{4,12})\b/);
  if (pharma) {
    const candidate = normalizeBatchToken(pharma[1]);
    if (isPharmaToken(candidate)) return candidate;
  }

  // Fallback: any mixed alphanumeric token ≥6 chars
  const fallback = upper.replace(/[^A-Z0-9]/g, " ").match(/\b(?=[A-Z0-9]*[A-Z])(?=[A-Z0-9]*[0-9])[A-Z0-9]{6,16}\b/);
  return fallback ? normalizeBatchToken(fallback[0]) : null;
}

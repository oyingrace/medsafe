import { createWorker } from "tesseract.js";
import { Jimp, JimpMime } from "jimp";

/** Batch IDs: uppercase letters + digits, 6–16 chars (aligned with SKILL) */
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
  const normalized = text.replace(/[^\w]/g, " ").toUpperCase();
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
    if (!batchId || conf < 70) {
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
  const normalized = text.replace(/[^a-zA-Z0-9]/g, " ").toUpperCase();
  const match = normalized.match(/\b[A-Z0-9]{6,16}\b/);
  return match?.[0] ?? null;
}

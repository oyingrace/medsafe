export async function extractBatchIdFromImage(imageUrl: string) {
  void imageUrl;
  return { batchId: null as string | null, confidence: 0 };
}

export function extractBatchIdFromText(text: string) {
  const normalized = text.replace(/[^a-zA-Z0-9]/g, " ").toUpperCase();
  const match = normalized.match(/\b[A-Z0-9]{6,16}\b/);
  return match?.[0] ?? null;
}

import {
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  verifyEvent,
  type EventTemplate,
  type VerifiedEvent,
} from "nostr-tools";
import type { Filter } from "nostr-tools/filter";
import { SimplePool } from "nostr-tools/pool";
import type { BatchRegistrationInput } from "@/types";

const BATCH_KIND = 30078;

const relayUrlsRaw = () =>
  (process.env.NOSTR_RELAY_URL ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

const shouldUseMemoryRelay = () => relayUrlsRaw().length === 0 || process.env.NOSTR_RELAY_DISABLED === "1";

/** In-process fallback when no relay URLs are configured */
const registry = new Map<string, VerifiedEvent>();

let pool: SimplePool | null = null;

function getPool() {
  if (!pool) {
    pool = new SimplePool({ enableReconnect: true });
  }
  return pool;
}

export function generateManufacturerKeypair() {
  const privateKeyBytes = generateSecretKey();
  const privateKey = Buffer.from(privateKeyBytes).toString("hex");
  const publicKey = getPublicKey(privateKeyBytes);
  return { privateKey, publicKey };
}

export function createBatchEvent(input: BatchRegistrationInput, privateKeyHex: string, paymentHash: string) {
  const tags: string[][] = [
    ["d", input.batchId],
    ["drug_name", input.drugName],
    ["manufacturer", input.manufacturer],
    ["manufacture_date", input.manufactureDate],
    ["expiry_date", input.expiryDate],
    ["lightning_payment_hash", paymentHash],
  ];

  const tmpl: EventTemplate = {
    kind: BATCH_KIND,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: "MedSafe batch registration",
  };

  const sk = new Uint8Array(Buffer.from(privateKeyHex, "hex"));
  return finalizeEvent(tmpl, sk);
}

/** When set, only events authored by this hex pubkey count as legitimate batches */
export function isTrustedManufacturer(event: VerifiedEvent) {
  const expected = process.env.MANUFACTURER_PUBLIC_KEY?.trim();
  if (!expected) return true;
  return event.pubkey.toLowerCase() === expected.toLowerCase();
}

export async function publishBatchEvent(event: VerifiedEvent) {
  const idTag = tagValue(event.tags, "d") ?? event.id;
  registry.set(idTag, event);

  if (shouldUseMemoryRelay()) {
    return { eventId: event.id, relayUrl: "in-memory" };
  }

  const urls = relayUrlsRaw();
  try {
    const results = getPool().publish(urls, event);
    await Promise.all(results);
    return { eventId: event.id, relayUrl: urls[0] };
  } catch (err) {
    console.error("[nostr] publish failed", err);
    throw err instanceof Error ? err : new Error("Nostr publish failed");
  }
}

export async function queryBatchById(batchId: string) {
  if (!shouldUseMemoryRelay()) {
    const urls = relayUrlsRaw();
    try {
      const pool = getPool();
      const filter: Filter = {
        kinds: [BATCH_KIND],
        "#d": [batchId],
        limit: 5,
      };

      const found = await pool.get(urls, filter, { maxWait: 8000 });
      if (found && verifyEvent(found)) {
        const verified = found as VerifiedEvent;
        registry.set(batchId, verified);
        return verified;
      }
    } catch (err) {
      console.warn("[nostr] relay query failed, falling back to local cache:", err);
    }
  }

  return registry.get(batchId) ?? null;
}

export function verifyEventSignature(event: VerifiedEvent) {
  return verifyEvent(event);
}

function tagValue(tags: string[][], key: string) {
  return tags.find((t) => t[0] === key)?.[1];
}

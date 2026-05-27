import {
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  verifyEvent,
  type EventTemplate,
  type VerifiedEvent,
} from "nostr-tools";
import type { BatchRegistrationInput } from "@/types";

const relayUrl = process.env.NOSTR_RELAY_URL;
const registry = new Map<string, VerifiedEvent>();

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
    kind: 30078,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content: "MedSafe batch registration",
  };

  const sk = new Uint8Array(Buffer.from(privateKeyHex, "hex"));
  return finalizeEvent(tmpl, sk);
}

export async function publishBatchEvent(event: VerifiedEvent) {
  registry.set(tagValue(event.tags, "d") ?? event.id, event);
  return {
    eventId: event.id,
    relayUrl: relayUrl ?? "in-memory",
  };
}

export async function queryBatchById(batchId: string) {
  return registry.get(batchId) ?? null;
}

export function verifyEventSignature(event: VerifiedEvent) {
  return verifyEvent(event);
}

function tagValue(tags: string[][], key: string) {
  return tags.find((t) => t[0] === key)?.[1];
}

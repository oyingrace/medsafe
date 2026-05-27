const paidHashes = new Set<string>();
const paymentCreatedAt = new Map<string, number>();

const REGISTRATION_SATS = Number(process.env.BATCH_REGISTRATION_SATS ?? 100);

export async function initBreezSDK() {
  return {
    initialized: true,
    network: process.env.BREEZ_NETWORK ?? "regtest",
  };
}

export async function createBatchInvoice(batchId: string) {
  const paymentHash = `ph_${batchId}_${crypto.randomUUID().slice(0, 8)}`;
  paymentCreatedAt.set(paymentHash, Date.now());
  return {
    invoice: `lnbc${REGISTRATION_SATS}${paymentHash}`,
    paymentHash,
    amountSats: REGISTRATION_SATS,
  };
}

export async function checkPaymentStatus(paymentHash: string): Promise<"pending" | "paid" | "failed"> {
  if (paidHashes.has(paymentHash)) return "paid";

  const createdAt = paymentCreatedAt.get(paymentHash);
  if (!createdAt) return "failed";

  if (Date.now() - createdAt > 3000) {
    paidHashes.add(paymentHash);
    return "paid";
  }

  return "pending";
}

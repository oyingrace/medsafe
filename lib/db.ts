import { neon } from "@neondatabase/serverless";
import type { BatchRecord, BatchRegistrationInput, VerificationStatus } from "@/types";

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

const mem = {
  batches: new Map<string, BatchRecord>(),
  verifications: [] as Array<{
    batchId: string;
    result: VerificationStatus;
    userPhone?: string;
    region?: string;
    queriedAt: number;
  }>,
};

let idSeq = 1;

export async function createPendingBatch(
  input: BatchRegistrationInput,
  paymentHash: string,
  invoice: string,
) {
  if (sql) {
    await sql`
      CREATE TABLE IF NOT EXISTS medsafe_batches (
        id SERIAL PRIMARY KEY,
        batch_id TEXT UNIQUE NOT NULL,
        drug_name TEXT NOT NULL,
        manufacturer TEXT NOT NULL,
        manufacture_date TEXT NOT NULL,
        expiry_date TEXT NOT NULL,
        status TEXT NOT NULL,
        payment_hash TEXT,
        invoice TEXT,
        nostr_event_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      INSERT INTO medsafe_batches (
        batch_id, drug_name, manufacturer, manufacture_date, expiry_date, status, payment_hash, invoice
      ) VALUES (
        ${input.batchId}, ${input.drugName}, ${input.manufacturer}, ${input.manufactureDate}, ${input.expiryDate}, 'pending_payment', ${paymentHash}, ${invoice}
      )
      ON CONFLICT (batch_id) DO UPDATE SET
        drug_name = EXCLUDED.drug_name,
        manufacturer = EXCLUDED.manufacturer,
        manufacture_date = EXCLUDED.manufacture_date,
        expiry_date = EXCLUDED.expiry_date,
        status = EXCLUDED.status,
        payment_hash = EXCLUDED.payment_hash,
        invoice = EXCLUDED.invoice
    `;
    return;
  }

  mem.batches.set(input.batchId, {
    id: idSeq++,
    ...input,
    status: "pending_payment",
    paymentHash,
    invoice,
    nostrEventId: null,
    createdAt: new Date().toISOString(),
  });
}

export async function markBatchRegistered(batchId: string, nostrEventId: string) {
  if (sql) {
    await sql`
      UPDATE medsafe_batches
      SET status = 'registered', nostr_event_id = ${nostrEventId}
      WHERE batch_id = ${batchId}
    `;
    return;
  }
  const batch = mem.batches.get(batchId);
  if (!batch) return;
  batch.status = "registered";
  batch.nostrEventId = nostrEventId;
}

export async function getBatchByPaymentHash(paymentHash: string) {
  if (sql) {
    const rows = await sql`
      SELECT * FROM medsafe_batches WHERE payment_hash = ${paymentHash} LIMIT 1
    `;
    return rows[0] as Record<string, unknown> | undefined;
  }
  return Array.from(mem.batches.values()).find((item) => item.paymentHash === paymentHash);
}

export async function listBatches() {
  if (sql) {
    const rows = await sql`SELECT * FROM medsafe_batches ORDER BY id DESC`;
    return rows as Array<Record<string, unknown>>;
  }
  return Array.from(mem.batches.values()).sort((a, b) => b.id - a.id);
}

export async function logVerification(
  batchId: string,
  result: VerificationStatus,
  userPhone?: string,
  region?: string,
) {
  if (sql) {
    await sql`
      CREATE TABLE IF NOT EXISTS verification_logs (
        id SERIAL PRIMARY KEY,
        batch_id TEXT NOT NULL,
        result TEXT NOT NULL,
        user_phone TEXT,
        region TEXT,
        queried_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      INSERT INTO verification_logs (batch_id, result, user_phone, region)
      VALUES (${batchId}, ${result}, ${userPhone ?? null}, ${region ?? null})
    `;
    return;
  }
  mem.verifications.push({
    batchId,
    result,
    userPhone,
    region,
    queriedAt: Date.now(),
  });
}

export async function getRecentVerifications(batchId: string, lookbackHours = 24) {
  const minTime = Date.now() - lookbackHours * 60 * 60 * 1000;
  if (sql) {
    const rows = await sql`
      SELECT batch_id, result, user_phone, region, queried_at
      FROM verification_logs
      WHERE batch_id = ${batchId}
        AND queried_at > NOW() - (${lookbackHours} || ' hour')::INTERVAL
      ORDER BY queried_at DESC
    `;
    return rows;
  }
  return mem.verifications.filter(
    (v) => v.batchId === batchId && v.queriedAt >= minTime,
  );
}

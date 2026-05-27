"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/PaymentModal";

const initial = {
  batchId: "",
  drugName: "",
  manufacturer: "",
  manufactureDate: "",
  expiryDate: "",
};

export function BatchRegistrationForm() {
  const [form, setForm] = useState(initial);
  const [invoice, setInvoice] = useState("");
  const [paymentHash, setPaymentHash] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "paid" | "failed">("idle");
  const [nostrEventId, setNostrEventId] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const resp = await fetch("/api/register-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await resp.json();
    if (!resp.ok) {
      setError(data.error ?? "Failed to create invoice");
      return;
    }
    setInvoice(data.invoice);
    setPaymentHash(data.paymentHash);
    setStatus("pending");
  }

  const checkStatus = useCallback(async () => {
    if (!paymentHash) return;
    const resp = await fetch(`/api/register-batch/confirm?paymentHash=${encodeURIComponent(paymentHash)}`);
    const data = (await resp.json()) as {
      success?: boolean;
      status?: "pending" | "paid" | "failed";
      nostrEventId?: string;
      error?: string;
      detail?: string;
    };
    if (!resp.ok) {
      setError(data.detail ?? data.error ?? "Could not confirm payment / publish to Nostr");
      setStatus("pending");
      return;
    }
    setError("");
    setStatus(data.status ?? "pending");
    if (data.nostrEventId) setNostrEventId(data.nostrEventId);
  }, [paymentHash]);

  useEffect(() => {
    if (!paymentHash || status === "paid" || status === "failed") return;
    const immediate = window.setTimeout(() => {
      void checkStatus();
    }, 0);
    const timer = window.setInterval(() => {
      void checkStatus();
    }, 2000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, [paymentHash, status, checkStatus]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={submit} className="space-y-3 rounded-xl border p-4 bg-white">
        <h2 className="text-xl font-semibold">Register Batch</h2>
        {Object.entries(form).map(([key, value]) => (
          <input
            key={key}
            value={value}
            onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value }))}
            placeholder={key}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />
        ))}
        <Button type="submit">Create invoice</Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {nostrEventId ? <p className="text-sm text-green-700 break-all">Registered ✅ {nostrEventId}</p> : null}
      </form>
      {invoice ? (
        <PaymentModal invoice={invoice} paymentHash={paymentHash} status={status} onCheckStatus={checkStatus} />
      ) : null}
    </div>
  );
}

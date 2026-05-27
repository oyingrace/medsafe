"use client";

import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

interface PaymentModalProps {
  invoice: string;
  paymentHash: string;
  status: "idle" | "pending" | "paid" | "failed";
  onCheckStatus: () => void;
}

export function PaymentModal({ invoice, paymentHash, status, onCheckStatus }: PaymentModalProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
      <h3 className="text-lg font-semibold">Lightning Payment</h3>
      <p className="text-sm text-zinc-600">Pay invoice and click check status.</p>
      <div className="bg-zinc-50 p-3 rounded-lg w-fit">
        <QRCodeSVG value={invoice} size={180} />
      </div>
      <code className="block text-xs break-all rounded bg-zinc-100 p-2">{invoice}</code>
      <p className="text-xs text-zinc-500">Hash: {paymentHash}</p>
      <Button onClick={onCheckStatus}>{status === "paid" ? "Paid ✅" : "Check payment status"}</Button>
    </div>
  );
}

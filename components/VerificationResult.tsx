import type { VerifyBatchResponse } from "@/types";

const statusStyles = {
  verified: "bg-green-100 text-green-800",
  fake: "bg-red-100 text-red-800",
  anomaly: "bg-amber-100 text-amber-800",
} as const;

export function VerificationResult({ result }: { result: VerifyBatchResponse | null }) {
  if (!result) return null;
  return (
    <div className={`rounded-lg px-3 py-2 text-sm font-medium ${statusStyles[result.status]}`}>
      Status: {result.status.toUpperCase()}
    </div>
  );
}

import Link from "next/link";

export default function DashboardHome() {
  return (
    <main className="mx-auto w-full max-w-5xl p-6 space-y-4">
      <h1 className="text-3xl font-bold text-green-700">MedSafe Dashboard</h1>
      <p className="text-zinc-700">
        Register pharmaceutical batches on Nostr, secured with Lightning micropayments.
      </p>
      <div className="flex gap-3">
        <Link href="/register" className="rounded-lg bg-green-600 px-4 py-2 text-white">
          Register Batch
        </Link>
        <Link href="/batches" className="rounded-lg border px-4 py-2">
          View Batches
        </Link>
      </div>
    </main>
  );
}

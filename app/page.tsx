import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <section className="rounded-2xl bg-green-50 border border-green-200 p-6">
        <h1 className="text-3xl font-bold text-green-800">MedSafe</h1>
        <p className="mt-2 text-zinc-700">
          Drug batch verification using Nostr for records and Lightning for anti-spam registration.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/register" className="rounded-lg bg-green-600 px-4 py-2 text-white">
            Register Batch
          </Link>
          <Link href="/batches" className="rounded-lg border px-4 py-2">
            View Batches
          </Link>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="text-xl font-semibold">WhatsApp verification endpoint</h2>
        <p className="text-sm text-zinc-600 mt-2">
          Configure Twilio webhook to <code>/api/whatsapp-webhook</code>. Users send a batch ID or photo and receive
          verification status.
        </p>
      </section>
    </main>
  );
}

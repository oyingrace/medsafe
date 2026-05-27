import { BatchTable } from "@/components/BatchTable";
import { listBatches } from "@/lib/db";

export default async function BatchesPage() {
  const rows = await listBatches();

  return (
    <main className="mx-auto w-full max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Registered Batches</h1>
      <BatchTable rows={rows} />
    </main>
  );
}

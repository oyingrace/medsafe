export function StatsCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-zinc-600">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-green-700 tabular-nums">{value}</p>
    </div>
  );
}

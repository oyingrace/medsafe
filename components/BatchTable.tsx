type Row = Record<string, unknown>;

function toRow(value: unknown): Row {
  if (value && typeof value === "object") return value as Row;
  return {};
}

export function BatchTable({ rows }: { rows: unknown[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-50 text-left">
          <tr>
            <th className="p-2">Batch ID</th>
            <th className="p-2">Drug</th>
            <th className="p-2">Manufacturer</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((value, idx) => {
            const row = toRow(value);
            return (
            <tr key={idx} className="border-t">
              <td className="p-2">{String(row.batch_id ?? row.batchId ?? "-")}</td>
              <td className="p-2">{String(row.drug_name ?? row.drugName ?? "-")}</td>
              <td className="p-2">{String(row.manufacturer ?? "-")}</td>
              <td className="p-2">{String(row.status ?? "-")}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import { createAnomalyAlert, getRecentVerifications, logVerification } from "@/lib/db";

function rowRegion(row: unknown) {
  if (!row || typeof row !== "object") return undefined;
  const r = row as Record<string, unknown>;
  const v = r.region;
  return typeof v === "string" && v.trim() ? v : undefined;
}

const minChecks = () => Math.max(5, Number(process.env.MEDSAFE_ANOMALY_MIN_CHECKS ?? 50));
const minRegions = () => Math.max(2, Number(process.env.MEDSAFE_ANOMALY_MIN_REGIONS ?? 3));

export async function logAndCheckAnomaly(
  batchId: string,
  result: "verified" | "fake" | "anomaly",
  userPhone?: string,
  region?: string,
) {
  await logVerification(batchId, result, userPhone, region);
  if (result !== "verified") return { isAnomaly: false };

  const checks = await getRecentVerifications(batchId, 24);
  const regions = new Set<string>();

  for (const row of checks) {
    const value = rowRegion(row);
    if (value) regions.add(value);
  }

  const thresholdChecks = minChecks();
  const thresholdRegions = minRegions();
  const isAnomaly = checks.length > thresholdChecks && regions.size > thresholdRegions;

  if (isAnomaly) {
    await createAnomalyAlert(batchId, "multi_region_spike", Array.from(regions));
  }

  return {
    isAnomaly,
    totalChecks: checks.length,
    uniqueRegions: regions.size,
    thresholds: { checks: thresholdChecks, regions: thresholdRegions },
  };
}

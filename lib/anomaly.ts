import { getRecentVerifications, logVerification } from "@/lib/db";

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

  checks.forEach((c) => {
    const value =
      (typeof c === "object" &&
        c &&
        "region" in c &&
        typeof (c as { region?: string }).region === "string" &&
        (c as { region: string }).region) ||
      undefined;
    if (value) regions.add(value);
  });

  const isAnomaly = checks.length > 50 && regions.size > 3;
  return { isAnomaly, totalChecks: checks.length, uniqueRegions: regions.size };
}

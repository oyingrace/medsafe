import { NextResponse } from "next/server";
import { getPayerSdk, waitForLeafOptimizationPublic, toNumberSafePublic } from "@/lib/breez";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let invoice = "";
  try {
    const body = (await req.json()) as { invoice?: string };
    invoice = body.invoice?.trim() ?? "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!invoice) {
    return NextResponse.json({ ok: false, error: "invoice is required" }, { status: 422 });
  }

  try {
    const sdk = await getPayerSdk();
    await sdk.syncWallet({});

    const [info, parsed, optimization] = await Promise.all([
      sdk.getInfo({ ensureSynced: true }),
      sdk.parse(invoice).catch((e: unknown) => ({ parseError: e instanceof Error ? e.message : String(e) })),
      waitForLeafOptimizationPublic(sdk),
    ]);

    let prepareResult: unknown = null;
    let prepareError: string | null = null;
    try {
      const res = await sdk.prepareSendPayment({ paymentRequest: invoice });
      prepareResult = {
        paymentMethodType: res.paymentMethod.type,
        amount: toNumberSafePublic(res.amount),
        fee:
          res.paymentMethod.type === "sparkInvoice"
            ? res.paymentMethod.fee
            : res.paymentMethod.type === "sparkAddress"
              ? res.paymentMethod.fee
              : null,
      };
    } catch (e) {
      prepareError = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      wallet: {
        balanceSats: Number(info.balanceSats ?? 0),
        optimization,
      },
      parsedInvoice: parsed,
      prepareResult,
      prepareError,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

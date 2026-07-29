/**
 * Fallback conversion factor used when the live rate can't be fetched
 * (offline, API down, or request timeout). Mirrors the previous hardcoded
 * FE-13 constant so behavior degrades gracefully instead of breaking.
 */
export const FALLBACK_USD_TO_NGN_RATE = 1_600;

const EXCHANGE_RATE_API_URL =
  process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_URL ?? "https://open.er-api.com/v6/latest/USD";

const DEFAULT_TIMEOUT_MS = 8_000;

export interface ExchangeRateResult {
  /** Amount of NGN equal to 1 USD. */
  rate: number;
  source: "api" | "fallback";
}

interface OpenErApiResponse {
  result: string;
  rates: Record<string, number>;
}

/**
 * Fetches the live USD → NGN exchange rate.
 *
 * Falls back to FALLBACK_USD_TO_NGN_RATE on any network error, timeout, or
 * malformed response, mirroring the fallback pattern used elsewhere in this
 * app (e.g. simulateScenario, fetchBridgeQuote) so the UI keeps working
 * offline/in dev even without a configured API.
 */
export async function fetchUsdToNgnRate(signal?: AbortSignal): Promise<ExchangeRateResult> {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort());

  try {
    const res = await fetch(EXCHANGE_RATE_API_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`Exchange rate API error ${res.status}`);

    const data = (await res.json()) as OpenErApiResponse;
    const rate = data?.rates?.NGN;

    if (data.result !== "success" || typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      throw new Error("Malformed exchange rate response");
    }

    return { rate, source: "api" };
  } catch {
    return { rate: FALLBACK_USD_TO_NGN_RATE, source: "fallback" };
  } finally {
    clearTimeout(timerId);
  }
}

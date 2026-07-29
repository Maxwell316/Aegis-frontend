const COINGECKO_API_URL =
  process.env.NEXT_PUBLIC_COINGECKO_API_URL ?? "https://api.coingecko.com/api/v3";

const DEFAULT_TIMEOUT_MS = 8_000;

/** Map of CoinGecko asset id → live USD spot price. */
export type SpotPrices = Record<string, number>;

interface SimplePriceRaw {
  [id: string]: { usd?: number } | undefined;
}

/**
 * Fetches live USD spot prices for the given CoinGecko asset ids from the
 * public `simple/price` endpoint (no API key required).
 *
 * Throws on network error, timeout, non-2xx response, or a response missing
 * every requested id. Callers are expected to catch this and keep showing
 * their last known-good prices (see usePriceTracker) rather than clearing
 * the UI on a transient failure.
 */
export async function fetchSpotPrices(ids: string[], signal?: AbortSignal): Promise<SpotPrices> {
  if (ids.length === 0) return {};

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort());

  try {
    const url = `${COINGECKO_API_URL}/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`CoinGecko API error ${res.status}`);

    const data = (await res.json()) as SimplePriceRaw;
    const prices: SpotPrices = {};

    for (const id of ids) {
      const price = data[id]?.usd;
      if (typeof price === "number" && Number.isFinite(price) && price > 0) {
        prices[id] = price;
      }
    }

    if (Object.keys(prices).length === 0) {
      throw new Error("Malformed price response");
    }

    return prices;
  } finally {
    clearTimeout(timerId);
  }
}

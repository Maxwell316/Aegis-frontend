const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL;

export type AttributionPeriod = "1W" | "1M" | "3M" | "All";

export interface AttributionSource {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface AttributionData {
  total: number;
  sources: AttributionSource[];
}

/**
 * Fetches portfolio yield breakdown from the backend AI API.
 *
 * Calls NEXT_PUBLIC_AI_API_URL/api/attribution when configured; falls back to
 * local mock data otherwise or on failure.
 */
export async function fetchAttribution(
  period: AttributionPeriod,
  signal?: AbortSignal,
): Promise<AttributionData> {
  if (AI_API_URL) {
    try {
      const res = await fetch(
        new URL(`/api/attribution?period=${period}`, AI_API_URL).toString(),
        { signal },
      );
      if (res.ok) {
        const json = (await res.json()) as AttributionData;
        return { ...json, sources: normalizeSources(json.sources) };
      }
    } catch {
      // Fall through to local mock
    }
  }

  return computeLocalAttribution(period);
}

function normalizeSources(sources: AttributionSource[]): AttributionSource[] {
  const total = sources.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return sources;
  return sources.map((s) => ({
    ...s,
    percentage: Math.round((s.value / total) * 10000) / 100,
  }));
}

function computeLocalAttribution(
  period: AttributionPeriod,
): AttributionData {
  const multiplier = period === "1W" ? 1 : period === "1M" ? 4.3 : period === "3M" ? 13 : 52;

  const sources: AttributionSource[] = [
    {
      name: "Stablecoin Yield",
      value: Math.round(42 * multiplier * 10) / 10,
      percentage: 35,
      color: "hsl(142, 76%, 36%)",
    },
    {
      name: "LP Incentives",
      value: Math.round(30 * multiplier * 10) / 10,
      percentage: 25,
      color: "hsl(200, 98%, 39%)",
    },
    {
      name: "Synthetic Hedges",
      value: Math.round(24 * multiplier * 10) / 10,
      percentage: 20,
      color: "hsl(262, 83%, 58%)",
    },
    {
      name: "Trading Fees",
      value: Math.round(18 * multiplier * 10) / 10,
      percentage: 15,
      color: "hsl(24, 95%, 53%)",
    },
    {
      name: "Governance Rewards",
      value: Math.round(6 * multiplier * 10) / 10,
      percentage: 5,
      color: "hsl(340, 82%, 52%)",
    },
  ];

  return {
    total: sources.reduce((sum, s) => sum + s.value, 0),
    sources,
  };
}

"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StaleDataIndicator } from "@/components/StaleDataIndicator";
import { usePriceTracker } from "@/hooks/usePriceTracker";
import { BRIDGE_TOKENS } from "@/lib/bridge/allbridge";

const TRACKED_ASSETS: { symbol: string; coingeckoId: string }[] = [
  { symbol: "XLM", coingeckoId: "stellar" },
  ...BRIDGE_TOKENS.filter((t) => t.coingeckoId).map((t) => ({
    symbol: t.symbol,
    coingeckoId: t.coingeckoId as string,
  })),
];

const TRACKED_IDS = TRACKED_ASSETS.map((a) => a.coingeckoId);

function formatUsd(price: number): string {
  return `$${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

/** Live USD spot prices for the assets supported by the bridge, polled via usePriceTracker. */
export function AssetPriceTracker() {
  const { prices, loading, error, freshnessLevel, lastUpdatedLabel } = usePriceTracker({
    ids: TRACKED_IDS,
  });

  return (
    <Card>
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
            Live Asset Prices
          </CardTitle>
          {!loading && (
            <StaleDataIndicator freshnessLevel={freshnessLevel} lastUpdatedLabel={lastUpdatedLabel} />
          )}
        </div>
        <CardDescription>Live USD spot prices, polled every 30 seconds.</CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Fetching live prices…</p>
        ) : (
          <ul className="space-y-2">
            {TRACKED_ASSETS.map(({ symbol, coingeckoId }) => {
              const price = prices[coingeckoId];
              return (
                <li key={coingeckoId} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{symbol}</span>
                  <span className="font-mono text-muted-foreground" aria-live="polite">
                    {price !== undefined ? formatUsd(price) : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {error && !loading && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400" role="status">
            Live prices unavailable — showing last known values.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

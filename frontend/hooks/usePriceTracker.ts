"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchSpotPrices, type SpotPrices } from "@/lib/prices/coingecko";
import { useStaleData, type FreshnessLevel } from "./useStaleData";

/** How often to re-poll for live prices while tracking is enabled. */
const DEFAULT_POLL_INTERVAL_MS = 30_000;

export interface UsePriceTrackerOptions {
  /** CoinGecko asset ids to track, e.g. ["stellar", "usd-coin"]. */
  ids: string[];
  pollIntervalMs?: number;
  enabled?: boolean;
}

export interface UsePriceTrackerResult {
  /** Map of CoinGecko id → last known USD spot price. */
  prices: SpotPrices;
  /** True only until the first fetch attempt settles. */
  loading: boolean;
  /** Set when the most recent poll failed; `prices` still holds the last known-good values. */
  error: string | null;
  freshnessLevel: FreshnessLevel;
  lastUpdatedLabel: string;
  /** Manually re-poll immediately. */
  refresh: () => void;
}

/**
 * Polls CoinGecko's public simple-price endpoint for live USD spot prices.
 *
 * On a failed poll, keeps showing the last known-good prices and surfaces the
 * failure via `error` + the staleness fields instead of clearing the UI —
 * mirroring the keep-last-good-data pattern used by useRealtimeVault and
 * useOnChainNotifications elsewhere in this app.
 */
export function usePriceTracker({
  ids,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  enabled = true,
}: UsePriceTrackerOptions): UsePriceTrackerResult {
  const [prices, setPrices] = useState<SpotPrices>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { freshnessLevel, lastUpdatedLabel, markFetched } = useStaleData();

  const mountedRef = useRef(true);
  const idsRef = useRef(ids);
  idsRef.current = ids;

  // Stable, content-based key so the effect only restarts when the actual
  // set of ids changes, not on every render that passes a new array literal.
  const idsKey = [...ids].sort().join(",");

  const fetchPrices = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const result = await fetchSpotPrices(idsRef.current, signal);
        if (!mountedRef.current) return;
        setPrices(result);
        setError(null);
        markFetched();
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to fetch live prices");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [markFetched],
  );

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || idsRef.current.length === 0) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetchPrices(controller.signal);

    const intervalId = setInterval(() => fetchPrices(controller.signal), pollIntervalMs);

    return () => {
      mountedRef.current = false;
      controller.abort();
      clearInterval(intervalId);
    };
    // idsKey (not ids) intentionally drives re-subscription; see idsRef above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, enabled, pollIntervalMs, fetchPrices]);

  const refresh = useCallback(() => {
    fetchPrices();
  }, [fetchPrices]);

  return { prices, loading, error, freshnessLevel, lastUpdatedLabel, refresh };
}

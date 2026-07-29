"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { fetchUsdToNgnRate, FALLBACK_USD_TO_NGN_RATE } from "@/lib/currency/exchangeRate";

/** How often to re-fetch the live rate while the app is open. */
const POLL_INTERVAL_MS = 5 * 60_000;

type Currency = "USD" | "NGN";

interface CurrencyContextValue {
  currency: Currency;
  toggleCurrency: () => void;
  /** Format a USD-denominated value into the active currency string. */
  formatAmount: (usdValue: number) => string;
  symbol: string;
  /** Live USD→NGN rate (1 USD = `rate` NGN), or the fallback if unavailable. */
  rate: number;
  /** Whether `rate` came from the live API or the offline fallback constant. */
  rateSource: "api" | "fallback";
  isLoadingRate: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [rate, setRate] = useState<number>(FALLBACK_USD_TO_NGN_RATE);
  const [rateSource, setRateSource] = useState<"api" | "fallback">("fallback");
  const [isLoadingRate, setIsLoadingRate] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    const loadRate = async () => {
      setIsLoadingRate(true);
      const result = await fetchUsdToNgnRate(controller.signal);
      if (!mountedRef.current) return;
      setRate(result.rate);
      setRateSource(result.source);
      setIsLoadingRate(false);
    };

    loadRate();
    const intervalId = setInterval(loadRate, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      controller.abort();
      clearInterval(intervalId);
    };
  }, []);

  const toggleCurrency = useCallback(
    () => setCurrency((c) => (c === "USD" ? "NGN" : "USD")),
    [],
  );

  const symbol = currency === "USD" ? "$" : "₦";

  const formatAmount = useCallback(
    (usdValue: number): string => {
      const converted = currency === "NGN" ? usdValue * rate : usdValue;
      return new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }).format(converted);
    },
    [currency, rate],
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, toggleCurrency, formatAmount, symbol, rate, rateSource, isLoadingRate }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}

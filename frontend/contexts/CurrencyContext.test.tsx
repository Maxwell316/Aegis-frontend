import { renderHook, act, waitFor } from "@testing-library/react";
import { CurrencyProvider, useCurrency } from "./CurrencyContext";
import { FALLBACK_USD_TO_NGN_RATE } from "@/lib/currency/exchangeRate";

describe("CurrencyContext", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("adopts the live rate once the fetch resolves", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: "success", rates: { NGN: 1500 } }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useCurrency(), {
      wrapper: CurrencyProvider,
    });

    await waitFor(() => expect(result.current.rate).toBe(1500));
    expect(result.current.rateSource).toBe("api");
    expect(result.current.isLoadingRate).toBe(false);
  });

  it("formats NGN amounts using the live rate, not the old hardcoded constant", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: "success", rates: { NGN: 2000 } }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useCurrency(), {
      wrapper: CurrencyProvider,
    });

    await waitFor(() => expect(result.current.rate).toBe(2000));

    act(() => {
      if (result.current.currency !== "NGN") result.current.toggleCurrency();
    });

    await waitFor(() => expect(result.current.currency).toBe("NGN"));
    expect(result.current.formatAmount(1)).toContain("2,000");
  });

  it("keeps the fallback rate when the API is unreachable", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;

    const { result } = renderHook(() => useCurrency(), {
      wrapper: CurrencyProvider,
    });

    await waitFor(() => expect(result.current.isLoadingRate).toBe(false));
    expect(result.current.rate).toBe(FALLBACK_USD_TO_NGN_RATE);
    expect(result.current.rateSource).toBe("fallback");
  });
});

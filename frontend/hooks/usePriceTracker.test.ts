import { renderHook, act, waitFor } from "@testing-library/react";
import { usePriceTracker } from "./usePriceTracker";
import type { SpotPrices } from "@/lib/prices/coingecko";

const fetchSpotPrices = jest.fn<Promise<SpotPrices>, any[]>();
jest.mock("@/lib/prices/coingecko", () => ({
  fetchSpotPrices: (...args: any[]) => fetchSpotPrices(...args),
}));

describe("usePriceTracker", () => {
  beforeEach(() => {
    fetchSpotPrices.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts loading and resolves with the fetched prices", async () => {
    fetchSpotPrices.mockResolvedValue({ stellar: 0.17 });

    const { result } = renderHook(() => usePriceTracker({ ids: ["stellar"] }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.prices).toEqual({ stellar: 0.17 });
    expect(result.current.error).toBeNull();
  });

  it("polls again after pollIntervalMs and updates prices", async () => {
    fetchSpotPrices.mockResolvedValueOnce({ stellar: 0.17 });

    const { result } = renderHook(() =>
      usePriceTracker({ ids: ["stellar"], pollIntervalMs: 1000 }),
    );

    await waitFor(() => expect(result.current.prices).toEqual({ stellar: 0.17 }));

    fetchSpotPrices.mockResolvedValueOnce({ stellar: 0.18 });

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.prices).toEqual({ stellar: 0.18 }));
    expect(fetchSpotPrices).toHaveBeenCalledTimes(2);
  });

  it("keeps the last known-good prices and sets error when a poll fails", async () => {
    fetchSpotPrices.mockResolvedValueOnce({ stellar: 0.17 });

    const { result } = renderHook(() =>
      usePriceTracker({ ids: ["stellar"], pollIntervalMs: 1000 }),
    );

    await waitFor(() => expect(result.current.prices).toEqual({ stellar: 0.17 }));

    fetchSpotPrices.mockRejectedValueOnce(new Error("network down"));

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.error).toBe("network down"));
    expect(result.current.prices).toEqual({ stellar: 0.17 });
  });

  it("does not fetch when disabled", async () => {
    fetchSpotPrices.mockResolvedValue({ stellar: 0.17 });

    const { result } = renderHook(() =>
      usePriceTracker({ ids: ["stellar"], enabled: false }),
    );

    expect(result.current.loading).toBe(false);
    expect(fetchSpotPrices).not.toHaveBeenCalled();
    expect(result.current.prices).toEqual({});
  });

  it("refresh() triggers an immediate re-fetch", async () => {
    fetchSpotPrices.mockResolvedValueOnce({ stellar: 0.17 });

    const { result } = renderHook(() =>
      usePriceTracker({ ids: ["stellar"], pollIntervalMs: 60_000 }),
    );

    await waitFor(() => expect(result.current.prices).toEqual({ stellar: 0.17 }));

    fetchSpotPrices.mockResolvedValueOnce({ stellar: 0.2 });

    await act(async () => {
      result.current.refresh();
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.prices).toEqual({ stellar: 0.2 }));
  });
});

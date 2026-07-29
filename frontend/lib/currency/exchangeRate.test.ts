import { fetchUsdToNgnRate, FALLBACK_USD_TO_NGN_RATE } from "./exchangeRate";

describe("fetchUsdToNgnRate", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns the live NGN rate on a successful response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: "success", rates: { NGN: 1550.25 } }),
    }) as unknown as typeof fetch;

    const result = await fetchUsdToNgnRate();

    expect(result).toEqual({ rate: 1550.25, source: "api" });
  });

  it("falls back to the constant when the API responds with an error status", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;

    const result = await fetchUsdToNgnRate();

    expect(result).toEqual({ rate: FALLBACK_USD_TO_NGN_RATE, source: "fallback" });
  });

  it("falls back to the constant when the request throws (network error)", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const result = await fetchUsdToNgnRate();

    expect(result).toEqual({ rate: FALLBACK_USD_TO_NGN_RATE, source: "fallback" });
  });

  it("falls back to the constant when the response is missing the NGN rate", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: "success", rates: { EUR: 0.9 } }),
    }) as unknown as typeof fetch;

    const result = await fetchUsdToNgnRate();

    expect(result).toEqual({ rate: FALLBACK_USD_TO_NGN_RATE, source: "fallback" });
  });

  it("falls back to the constant when the API reports a non-success result", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: "error", rates: { NGN: 1550.25 } }),
    }) as unknown as typeof fetch;

    const result = await fetchUsdToNgnRate();

    expect(result).toEqual({ rate: FALLBACK_USD_TO_NGN_RATE, source: "fallback" });
  });
});

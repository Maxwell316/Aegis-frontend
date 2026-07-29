import { fetchSpotPrices } from "./coingecko";

describe("fetchSpotPrices", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns an empty object without calling fetch when no ids are given", async () => {
    global.fetch = jest.fn();

    const result = await fetchSpotPrices([]);

    expect(result).toEqual({});
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns live USD prices for every requested id on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          stellar: { usd: 0.17 },
          "usd-coin": { usd: 0.999 },
        }),
    }) as unknown as typeof fetch;

    const result = await fetchSpotPrices(["stellar", "usd-coin"]);

    expect(result).toEqual({ stellar: 0.17, "usd-coin": 0.999 });
  });

  it("omits ids missing from the response instead of throwing, as long as at least one resolves", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stellar: { usd: 0.17 } }),
    }) as unknown as typeof fetch;

    const result = await fetchSpotPrices(["stellar", "unknown-token"]);

    expect(result).toEqual({ stellar: 0.17 });
  });

  it("throws when the API responds with an error status", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    await expect(fetchSpotPrices(["stellar"])).rejects.toThrow("CoinGecko API error 500");
  });

  it("throws when the request fails outright (network error)", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;

    await expect(fetchSpotPrices(["stellar"])).rejects.toThrow();
  });

  it("throws when none of the requested ids are present in the response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;

    await expect(fetchSpotPrices(["stellar"])).rejects.toThrow("Malformed price response");
  });
});

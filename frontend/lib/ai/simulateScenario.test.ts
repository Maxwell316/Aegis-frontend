import { simulateScenario } from "./simulateScenario";

describe("simulateScenario (local fallback, no NEXT_PUBLIC_AI_API_URL configured)", () => {
  it("applies the full FX shock to the unhedged projection", async () => {
    const result = await simulateScenario({
      fxShockPercent: -20,
      volatilityShockPercent: 0,
      portfolioValueUsd: 10_000,
    });

    expect(result.source).toBe("local");
    expect(result.withoutAegis.changePercent).toBe(-20);
    expect(result.withoutAegis.projectedValueUsd).toBe(8_000);
  });

  it("dampens the hedged projection relative to the unhedged one", async () => {
    const result = await simulateScenario({
      fxShockPercent: -30,
      volatilityShockPercent: 20,
      portfolioValueUsd: 10_000,
    });

    expect(Math.abs(result.withAegis.changePercent)).toBeLessThan(
      Math.abs(result.withoutAegis.changePercent),
    );
    expect(result.strategyShiftPercent).toBeGreaterThan(0);
  });

  it("produces no shift and no impact for a zero shock", async () => {
    const result = await simulateScenario({
      fxShockPercent: 0,
      volatilityShockPercent: 0,
      portfolioValueUsd: 10_000,
    });

    expect(result.withoutAegis.projectedValueUsd).toBe(10_000);
    expect(result.withAegis.projectedValueUsd).toBe(10_000);
    expect(result.strategyShiftPercent).toBe(0);
  });

  it("caps the dampening factor at 70%", async () => {
    const result = await simulateScenario({
      fxShockPercent: -50,
      volatilityShockPercent: 50,
      portfolioValueUsd: 10_000,
    });

    expect(result.strategyShiftPercent).toBeLessThanOrEqual(70);
  });
});

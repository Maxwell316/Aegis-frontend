const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL;

export interface ScenarioParams {
  /** Hypothetical FX rate shock, in percent. Negative = local currency devalues. */
  fxShockPercent: number;
  /** Hypothetical volatility shock, in percent above baseline. */
  volatilityShockPercent: number;
  /** Starting portfolio value in USD, used to project the shocked outcome. */
  portfolioValueUsd: number;
}

export interface ScenarioProjection {
  /** Projected portfolio value under the shock, in USD. */
  projectedValueUsd: number;
  /** Change from the current portfolio value, in percent. */
  changePercent: number;
}

export interface ScenarioResult {
  withoutAegis: ScenarioProjection;
  withAegis: ScenarioProjection;
  /** Share of the strategy shifted into hedges/stable reserves in response to the shock, in percent. */
  strategyShiftPercent: number;
  source: "api" | "local";
}

/**
 * Runs a "what-if" FX shock scenario against the current portfolio.
 *
 * Calls the backend AI API (NEXT_PUBLIC_AI_API_URL) when configured; falls
 * back to a deterministic local approximation otherwise or if the call
 * fails, mirroring the fallback pattern used for on-chain data elsewhere in
 * this app (e.g. StrategyAllocationPie, useOnChainNotifications).
 */
export async function simulateScenario(
  params: ScenarioParams,
  signal?: AbortSignal,
): Promise<ScenarioResult> {
  if (AI_API_URL) {
    try {
      const res = await fetch(new URL("/api/simulate", AI_API_URL).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal,
      });
      if (res.ok) {
        return { ...((await res.json()) as Omit<ScenarioResult, "source">), source: "api" };
      }
    } catch {
      // Network error, timeout, or backend unavailable — fall through to the
      // local approximation below so the simulator still works offline/in dev.
    }
  }

  return { ...computeLocalProjection(params), source: "local" };
}

/**
 * Deterministic local approximation, used when no AI backend is configured
 * (or it's unreachable). Not a real risk model — just enough to make the
 * "what-if" tool interactive and directionally sensible:
 *
 * - Without Aegis: the portfolio absorbs the full FX shock directly.
 * - With Aegis: the strategy shifts capital toward hedges/stable reserves in
 *   proportion to the shock size, damping the impact by up to 70%.
 */
function computeLocalProjection(
  params: ScenarioParams,
): Omit<ScenarioResult, "source"> {
  const { fxShockPercent, volatilityShockPercent, portfolioValueUsd } = params;

  const rawImpactPercent = fxShockPercent - volatilityShockPercent * 0.1;
  const withoutValue = portfolioValueUsd * (1 + rawImpactPercent / 100);

  // Larger shocks trigger a larger defensive shift, capped at 70% dampening.
  const shockMagnitude = Math.min(Math.abs(fxShockPercent) + Math.abs(volatilityShockPercent), 100);
  const dampeningFactor = Math.min(0.7, shockMagnitude / 100);
  const hedgedImpactPercent = rawImpactPercent * (1 - dampeningFactor);
  const withValue = portfolioValueUsd * (1 + hedgedImpactPercent / 100);

  return {
    withoutAegis: {
      projectedValueUsd: Math.round(withoutValue),
      changePercent: Number(rawImpactPercent.toFixed(2)),
    },
    withAegis: {
      projectedValueUsd: Math.round(withValue),
      changePercent: Number(hedgedImpactPercent.toFixed(2)),
    },
    strategyShiftPercent: Number((dampeningFactor * 100).toFixed(1)),
  };
}

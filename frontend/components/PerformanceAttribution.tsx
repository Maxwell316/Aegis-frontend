"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchAttribution, type AttributionPeriod, type AttributionSource } from "@/lib/ai/fetchAttribution";
import { PieChartIcon, RefreshCw } from "lucide-react";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: AttributionSource }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const source = payload[0].payload;
    return (
      <div className="bg-background border border-border p-3 rounded-lg shadow-xl space-y-1">
        <p className="text-sm font-medium text-foreground">{source.name}</p>
        <p className="text-xs text-muted-foreground">
          Yield: ${source.value.toLocaleString()}
        </p>
        <p className="text-xs font-bold text-primary">
          {source.percentage}% of total
        </p>
      </div>
    );
  }
  return null;
}

const PERIODS: { key: AttributionPeriod; label: string }[] = [
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "All", label: "All" },
];

export const PerformanceAttribution = React.memo(function PerformanceAttribution() {
  const [period, setPeriod] = useState<AttributionPeriod>("1M");
  const [data, setData] = useState<AttributionSource[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAttribution(period);
      setData(result.sources);
      setTotal(result.total);
    } catch {
      setError("Failed to load attribution data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="w-full min-h-[300px] bg-card rounded-xl border border-border animate-pulse flex items-center justify-center">
        <p className="text-muted-foreground">Loading attribution data...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3 md:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Performance Attribution
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Yield breakdown by return source
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Refresh attribution data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex bg-muted p-1 rounded-lg">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={period === key}
                onClick={() => setPeriod(key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  period === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={load}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Total yield:{" "}
            <span className="text-lg font-bold text-green-500">
              +${total.toLocaleString()}
            </span>
          </p>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              layout="vertical"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal
                stroke="hsl(var(--muted-foreground))"
                opacity={0.1}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                width={130}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="percentage"
                radius={[0, 4, 4, 0]}
                animationDuration={1000}
                label={{
                  position: "right",
                  formatter: (label) => `${label}%`,
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});

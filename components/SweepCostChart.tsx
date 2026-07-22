"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEth, formatUsd } from "@/lib/format";
import type { SweepLadderRow } from "@/lib/types";

type SweepCostChartProps = {
  data: SweepLadderRow[];
};

export function SweepCostChart({ data }: SweepCostChartProps) {
  const chartData = data.map((row) => ({
    ...row,
    targetLabel: formatEth(row.targetFloor).replace(" ETH", ""),
  }));

  return (
    <section className="chart-panel">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Sweep Cost</h2>
        <p className="mt-1 text-sm text-slate-400">
          Estimated ETH required below each target floor.
        </p>
      </div>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={chartData} margin={{ bottom: 8, left: 0, right: 8, top: 12 }}>
            <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="targetLabel"
              stroke="var(--color-chart-axis)"
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="var(--color-chart-axis)"
              tickFormatter={(value) => `${value}`}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) {
                  return null;
                }

                const row = payload[0].payload as SweepLadderRow;

                return (
                  <div className="rounded-md border border-cyan-400/30 bg-slate-950 px-3 py-2 text-sm shadow-xl">
                    <p className="font-semibold text-cyan-100">Target {label} ETH</p>
                    <p className="text-slate-300">{formatEth(row.costEth)}</p>
                    <p className="text-slate-300">{formatUsd(row.costUsd)}</p>
                  </div>
                );
              }}
              cursor={{ fill: "var(--color-chart-cursor-primary)" }}
            />
            <Bar dataKey="costEth" fill="var(--color-chart-primary)" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Sweep cost means the estimated total cost to buy every listed NFT below the
        selected target floor.
      </p>
    </section>
  );
}

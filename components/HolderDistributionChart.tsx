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
import { formatNumber } from "@/lib/format";
import type { HolderAnalysisData } from "@/lib/types";

type HolderDistributionChartProps = {
  data: HolderAnalysisData;
};

export function HolderDistributionChart({ data }: HolderDistributionChartProps) {
  const coverage =
    data.totalHolders && data.totalHolders > 0
      ? Math.min((data.fetchedHolders / data.totalHolders) * 100, 100)
      : null;

  return (
    <section className="chart-panel chart-panel--holder">
      <header className="chart-panel__header">
        <div>
          <p className="terminal-kicker">Ownership structure</p>
          <h2>Holder distribution</h2>
        </div>
        <span>{formatNumber(data.totalHolders, 0)} holders</span>
      </header>

      {data.distribution.length ? (
        <div className="h-80">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data.distribution} margin={{ bottom: 8, left: 0, right: 8, top: 12 }}>
              <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="bucket"
                interval={0}
                stroke="var(--color-chart-axis)"
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis stroke="var(--color-chart-axis)" tick={{ fontSize: 12 }} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as HolderAnalysisData["distribution"][number];

                  return (
                    <div className="chart-tooltip">
                      <strong>{row.bucket}</strong>
                      <span>{formatNumber(row.holders, 0)} wallets</span>
                      <span>{formatNumber(row.nfts, 0)} NFTs held</span>
                    </div>
                  );
                }}
                cursor={{ fill: "var(--color-chart-cursor-primary)" }}
              />
              <Bar dataKey="holders" fill="var(--color-chart-primary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-empty">
          Holder rows are unavailable. Total holder count still comes from collection statistics.
        </div>
      )}

      <p className="chart-panel__note">
        {data.complete
          ? `All ${formatNumber(data.fetchedHolders, 0)} indexed holders are represented.`
          : data.fetchedHolders > 0
            ? `${formatNumber(data.fetchedHolders, 0)} holders sampled${coverage === null ? "" : ` (${coverage.toFixed(1)}% coverage)`}.`
            : "OpenSea holder detail is temporarily unavailable."}
      </p>
    </section>
  );
}

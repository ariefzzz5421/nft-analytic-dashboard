"use client";

import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNative } from "@/lib/format";
import type { ListingDistributionBucket } from "@/lib/types";

type ListingDistributionChartProps = {
  data: ListingDistributionBucket[];
  symbol?: string;
};

type ListingChartRow = ListingDistributionBucket & {
  cumulativeListings: number;
};

export function ListingDistributionChart({ data, symbol = "ETH" }: ListingDistributionChartProps) {
  const chartData = data.reduce<ListingChartRow[]>((rows, row) => {
    const cumulativeListings = (rows.at(-1)?.cumulativeListings ?? 0) + row.count;
    return [...rows, { ...row, cumulativeListings }];
  }, []);

  return (
    <section className="chart-panel chart-panel--listing">
      <header className="chart-panel__header">
        <div>
          <p className="terminal-kicker">Price structure</p>
          <h2>Listing price depth</h2>
        </div>
        <span>{data.reduce((total, row) => total + row.count, 0)} listings</span>
      </header>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={chartData} margin={{ bottom: 8, left: 0, right: 8, top: 12 }}>
            <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="bucket"
              interval={0}
              stroke="var(--color-chart-axis)"
              tickLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis stroke="var(--color-chart-axis)" tickLine={false} tick={{ fontSize: 12 }} yAxisId="count" />
            <YAxis
              orientation="right"
              stroke="var(--color-chart-axis)"
              tickLine={false}
              tick={{ fontSize: 12 }}
              yAxisId="cumulative"
            />
            <Tooltip
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) {
                  return null;
                }

                const row = payload[0].payload as ListingChartRow;

                return (
                  <div className="chart-tooltip">
                    <strong>{label}</strong>
                    <span>{row.count} listings in range</span>
                    <span>{row.cumulativeListings} cumulative listings</span>
                    <span>{formatNative(row.totalEth, symbol)} listed value</span>
                  </div>
                );
              }}
              cursor={{ fill: "var(--color-chart-cursor-positive)" }}
            />
            <Bar dataKey="count" fill="var(--color-chart-positive)" radius={[3, 3, 0, 0]} yAxisId="count" />
            <Line
              dataKey="cumulativeListings"
              dot={false}
              stroke="var(--color-chart-primary)"
              strokeWidth={2}
              type="monotone"
              yAxisId="cumulative"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-panel__note">Bars show listings in each price range; the line shows cumulative sell-side depth.</p>
    </section>
  );
}

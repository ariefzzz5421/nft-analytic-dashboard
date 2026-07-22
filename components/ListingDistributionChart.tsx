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
import { formatEth } from "@/lib/format";
import type { ListingDistributionBucket } from "@/lib/types";

type ListingDistributionChartProps = {
  data: ListingDistributionBucket[];
};

export function ListingDistributionChart({ data }: ListingDistributionChartProps) {
  return (
    <section className="chart-panel">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Listing Distribution</h2>
        <p className="mt-1 text-sm text-slate-400">
          Active listings grouped by price range.
        </p>
      </div>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} margin={{ bottom: 8, left: 0, right: 8, top: 12 }}>
            <CartesianGrid stroke="var(--color-chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="bucket"
              interval={0}
              stroke="var(--color-chart-axis)"
              tickLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis stroke="var(--color-chart-axis)" tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) {
                  return null;
                }

                const row = payload[0].payload as ListingDistributionBucket;

                return (
                  <div className="rounded-md border border-emerald-400/30 bg-slate-950 px-3 py-2 text-sm shadow-xl">
                    <p className="font-semibold text-emerald-100">{label}</p>
                    <p className="text-slate-300">{row.count} listings</p>
                    <p className="text-slate-300">{formatEth(row.totalEth)} total</p>
                  </div>
                );
              }}
              cursor={{ fill: "var(--color-chart-cursor-positive)" }}
            />
            <Bar dataKey="count" fill="var(--color-chart-positive)" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

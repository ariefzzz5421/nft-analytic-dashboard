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
    <div className="rounded-lg border border-slate-800 bg-slate-950/82 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Listing Distribution</h2>
        <p className="mt-1 text-sm text-slate-400">
          Active listings grouped by price range.
        </p>
      </div>
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} margin={{ bottom: 8, left: 0, right: 8, top: 12 }}>
            <CartesianGrid stroke="#1f2c36" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="bucket"
              interval={0}
              stroke="#91a4b4"
              tickLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis stroke="#91a4b4" tickLine={false} tick={{ fontSize: 12 }} />
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
              cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
            />
            <Bar dataKey="count" fill="#34d399" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { EthUsdValue } from "@/components/EthUsdValue";
import { formatNumber, formatPercent } from "@/lib/format";
import type { CollectionSummaryData } from "@/lib/types";

type CollectionSummaryProps = {
  collection: CollectionSummaryData;
  ethUsd?: number | null;
  slug: string;
};

type Metric =
  | {
      ethValue?: never;
      label: string;
      value: string;
    }
  | {
      ethValue: number | null | undefined;
      label: string;
      value?: never;
    };

function MetricCard({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/82 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 min-h-8 break-words font-mono text-xl font-semibold text-white">{children}</p>
    </div>
  );
}

export function CollectionSummary({ collection, ethUsd, slug }: CollectionSummaryProps) {
  const metrics: Metric[] = [
    { label: "Total supply", value: formatNumber(collection.supply, 0) },
    { ethValue: collection.floor, label: "Current floor" },
    { ethValue: collection.topOffer, label: "Top offer" },
    { label: "Listed count", value: formatNumber(collection.listedCount, 0) },
    { label: "Listed percentage", value: formatPercent(collection.listedPercentage) },
    { label: "Owners", value: formatNumber(collection.owners, 0) },
    { ethValue: collection.volume24h, label: "24h volume" },
    { ethValue: collection.totalVolume, label: "Total volume" },
  ];

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-4 rounded-lg border border-cyan-400/18 bg-slate-950/88 p-4 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-700 bg-slate-900">
          {collection.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={collection.name}
              className="h-full w-full object-cover"
              src={collection.imageUrl}
            />
          ) : (
            <span className="text-xl font-semibold text-cyan-200">
              {collection.name.slice(0, 1)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-400">Collection</p>
          <h2 className="break-words text-2xl font-semibold text-white">{collection.name}</h2>
          <p className="mt-1 break-all font-mono text-sm text-cyan-200">{slug}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label}>
            {"ethValue" in metric ? (
              <EthUsdValue ethUsd={ethUsd} label={metric.label} value={metric.ethValue} />
            ) : (
              metric.value
            )}
          </MetricCard>
        ))}
      </div>
    </section>
  );
}

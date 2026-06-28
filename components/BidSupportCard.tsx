import { Activity, Gauge } from "lucide-react";
import { formatEth, formatNumber } from "@/lib/format";
import type { CollectionSummaryData, RiskSummary } from "@/lib/types";

type BidSupportCardProps = {
  collection: CollectionSummaryData;
  risk: RiskSummary;
};

export function BidSupportCard({ collection, risk }: BidSupportCardProps) {
  return (
    <aside className="rounded-lg border border-emerald-400/18 bg-slate-950/82 p-4">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald-400/25 bg-emerald-400/10 text-emerald-200">
          <Gauge size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Bid Support</h2>
          <p className="text-sm text-slate-400">Offer depth compared with floor.</p>
        </div>
      </div>

      <dl className="grid gap-3">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <dt className="text-sm text-slate-400">Top offer</dt>
          <dd className="font-mono text-sm text-white">{formatEth(collection.topOffer)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <dt className="text-sm text-slate-400">Current floor</dt>
          <dd className="font-mono text-sm text-white">{formatEth(collection.floor)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <dt className="text-sm text-slate-400">Bid/floor ratio</dt>
          <dd className="font-mono text-sm text-white">
            {risk.bidFloorRatio === null ? "Unknown" : formatNumber(risk.bidFloorRatio, 4)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 rounded-md border border-cyan-400/20 bg-cyan-400/8 p-3">
        <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Interpretation</p>
        <p className="mt-1 font-semibold text-white">{risk.bidSupportLabel}</p>
      </div>

      <div className="mt-3 rounded-md border border-emerald-400/20 bg-emerald-400/8 p-3">
        <div className="flex items-center gap-2 text-emerald-200">
          <Activity size={16} aria-hidden="true" />
          <p className="text-xs uppercase tracking-[0.16em]">Pumpability</p>
        </div>
        <p className="mt-1 font-semibold text-white">{risk.pumpabilityLabel}</p>
        <p className="mt-1 font-mono text-sm text-slate-300">
          Score: {risk.pumpabilityScore ?? "Unknown"}
        </p>
      </div>
    </aside>
  );
}

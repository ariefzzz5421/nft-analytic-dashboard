"use client";

import Link from "next/link";
import { ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { formatEth, formatPercent } from "@/lib/format";
import { calculateSweepLadder, DEFAULT_TARGET_FLOORS, generateSmartTargets } from "@/lib/sweep";
import type { SweepApiResponse, WatchlistItem } from "@/lib/types";

type WatchlistCardProps = {
  item: WatchlistItem;
  onRefresh: () => void;
  onRemove: () => void;
  record: {
    data: SweepApiResponse | null;
    error: string;
    loading: boolean;
  };
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm text-slate-100">{value}</p>
    </div>
  );
}

function isDefaultTargetSet(targets: number[]) {
  return (
    targets.length === DEFAULT_TARGET_FLOORS.length &&
    targets.every((target, index) => target === DEFAULT_TARGET_FLOORS[index])
  );
}

export function WatchlistCard({ item, onRefresh, onRemove, record }: WatchlistCardProps) {
  const data = record.data;
  const smartTargets = data ? generateSmartTargets(data.collection.floor ?? 0) : [];
  const targetFloors =
    item.targetFloors.length && !isDefaultTargetSet(item.targetFloors)
      ? item.targetFloors
      : smartTargets;
  const ladder = data
    ? calculateSweepLadder(data.listings, targetFloors, data.ethUsd, data.collection.floor)
    : [];
  const lowestTarget = ladder[0];
  const highestTarget = ladder[ladder.length - 1];
  const imageUrl = data?.collection.imageUrl ?? item.imageUrl;
  const name = data?.collection.name ?? item.name ?? item.slug;

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950/82 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-700 bg-slate-900">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={name} className="h-full w-full object-cover" src={imageUrl} />
          ) : (
            <span className="text-lg font-semibold text-cyan-200">{name.slice(0, 1)}</span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white">{name}</h3>
          <p className="truncate font-mono text-xs text-cyan-200">{item.slug}</p>
        </div>
      </div>

      {record.loading ? (
        <div className="grid gap-2">
          <div className="h-4 w-2/3 rounded bg-slate-800" />
          <div className="h-4 w-1/2 rounded bg-slate-800" />
          <div className="h-4 w-3/4 rounded bg-slate-800" />
        </div>
      ) : null}

      {record.error ? (
        <div className="rounded-md border border-red-400/20 bg-red-400/8 p-3 text-sm text-red-100">
          {record.error}
        </div>
      ) : null}

      {data ? (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Floor" value={formatEth(data.collection.floor)} />
          <Stat label="Top offer" value={formatEth(data.collection.topOffer)} />
          <Stat label="Listed" value={String(data.collection.listedCount)} />
          <Stat label="Listed %" value={formatPercent(data.collection.listedPercentage)} />
          <Stat label="24h volume" value={formatEth(data.collection.volume24h)} />
          <Stat label="Risk" value={data.risk.bidSupportLabel} />
          <Stat label="Lowest target cost" value={formatEth(lowestTarget?.costEth)} />
          <Stat label="Highest target cost" value={formatEth(highestTarget?.costEth)} />
        </div>
      ) : null}

      <div className="mt-auto grid grid-cols-2 gap-2">
        <Link
          className="inline-flex items-center justify-center rounded-md bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
          href={`/collection/${item.slug}`}
        >
          Open Detail
        </Link>
        <a
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50"
          href={`https://opensea.io/collection/${item.slug}`}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink size={14} aria-hidden="true" />
          OpenSea
        </a>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50"
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Refresh
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md border border-red-400/25 px-3 py-2 text-sm text-red-100 transition hover:border-red-300"
          onClick={onRemove}
          type="button"
        >
          <Trash2 size={14} aria-hidden="true" />
          Remove
        </button>
      </div>
    </article>
  );
}

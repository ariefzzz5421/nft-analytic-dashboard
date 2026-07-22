"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { EthUsdValue } from "@/components/EthUsdValue";
import { formatPercent } from "@/lib/format";
import { calculateSweepLadder, DEFAULT_TARGET_FLOORS, generateSmartTargets } from "@/lib/sweep";
import type { SweepApiResponse, WatchlistItem } from "@/lib/types";

type WatchlistCardProps = {
  item: WatchlistItem;
  liveEthUsd?: number | null;
  onRefresh: () => void;
  onRemove: () => void;
  record: {
    data: SweepApiResponse | null;
    error: string;
    loading: boolean;
  };
};

function Stat({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="watchlist-stat">
      <p>{label}</p>
      <strong>{children}</strong>
    </div>
  );
}

function isDefaultTargetSet(targets: number[]) {
  return (
    targets.length === DEFAULT_TARGET_FLOORS.length &&
    targets.every((target, index) => target === DEFAULT_TARGET_FLOORS[index])
  );
}

export function WatchlistCard({ item, liveEthUsd, onRefresh, onRemove, record }: WatchlistCardProps) {
  const data = record.data;
  const ethUsd = liveEthUsd ?? data?.ethUsd ?? null;
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
    <article className="watchlist-row">
      <div className="watchlist-row__identity">
        <div className="watchlist-row__art">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={name} src={imageUrl} />
          ) : (
            <span className="text-lg font-semibold text-cyan-200">{name.slice(0, 1)}</span>
          )}
        </div>
        <div className="watchlist-row__name">
          <h3>{name}</h3>
          <p>{item.slug}</p>
        </div>
      </div>

      {record.loading ? (
        <div className="watchlist-row__loading">
          <div className="h-4 w-2/3 rounded bg-slate-800" />
          <div className="h-4 w-1/2 rounded bg-slate-800" />
          <div className="h-4 w-3/4 rounded bg-slate-800" />
        </div>
      ) : null}

      {record.error ? (
        <div className="watchlist-row__error">
          {record.error}
        </div>
      ) : null}

      {data ? (
        <div className="watchlist-row__metrics">
          <Stat label="Floor">
            <EthUsdValue ethUsd={ethUsd} label="Floor" value={data.collection.floor} />
          </Stat>
          <Stat label="Top offer">
            <EthUsdValue ethUsd={ethUsd} label="Top offer" value={data.collection.topOffer} />
          </Stat>
          <Stat label="Listed">{String(data.collection.listedCount)}</Stat>
          <Stat label="Listed %">{formatPercent(data.collection.listedPercentage)}</Stat>
          <Stat label="24h volume">
            <EthUsdValue ethUsd={ethUsd} label="24h volume" value={data.collection.volume24h} />
          </Stat>
          <Stat label="Risk">{data.risk.bidSupportLabel}</Stat>
          <Stat label="Lowest target cost">
            <EthUsdValue ethUsd={ethUsd} label="Lowest target cost" value={lowestTarget?.costEth} />
          </Stat>
          <Stat label="Highest target cost">
            <EthUsdValue ethUsd={ethUsd} label="Highest target cost" value={highestTarget?.costEth} />
          </Stat>
        </div>
      ) : null}

      <div className="watchlist-row__actions">
        <Link
          className="button button--primary"
          href={`/collection/${item.slug}`}
        >
          Open Detail
        </Link>
        <a
          className="button button--secondary"
          href={`https://opensea.io/collection/${item.slug}`}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink size={14} aria-hidden="true" />
          OpenSea
        </a>
        <button
          className="icon-button"
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span className="sr-only">Refresh {name}</span>
        </button>
        <button
          className="icon-button icon-button--danger"
          onClick={onRemove}
          type="button"
        >
          <Trash2 size={14} aria-hidden="true" />
          <span className="sr-only">Remove {name}</span>
        </button>
      </div>
    </article>
  );
}

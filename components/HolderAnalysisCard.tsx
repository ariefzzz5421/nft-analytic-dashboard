"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { Network } from "lucide-react";
import { EthUsdValue } from "@/components/EthUsdValue";
import { formatAddress, formatNumber, formatPercent } from "@/lib/format";
import type { NormalizedListing, SweepApiResponse } from "@/lib/types";

type HolderAnalysisCardProps = {
  data: SweepApiResponse;
  ethUsd: number | null | undefined;
};

type HolderRow = {
  id: string;
  label: string;
  listings: NormalizedListing[];
  orderCount: number;
};

function parseFloorFilter(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function sumEth(listings: NormalizedListing[]) {
  return listings.reduce((total, listing) => total + listing.priceEth, 0);
}

function buildTopHolders(listings: NormalizedListing[]) {
  const bySeller = new Map<string, NormalizedListing[]>();

  for (const listing of listings) {
    if (!listing.seller) {
      continue;
    }

    bySeller.set(listing.seller, [...(bySeller.get(listing.seller) ?? []), listing]);
  }

  return [...bySeller.entries()]
    .map(([seller, sellerListings]) => ({
      id: seller,
      label: formatAddress(seller),
      listings: sellerListings,
      orderCount: new Set(
        sellerListings
          .map((listing) => listing.orderHash)
          .filter((orderHash) => orderHash && orderHash !== "unknown"),
      ).size,
    }))
    .sort((left, right) => {
      const listingDiff = right.listings.length - left.listings.length;
      return listingDiff === 0 ? sumEth(right.listings) - sumEth(left.listings) : listingDiff;
    });
}

function hasBundleSignal(holder: HolderRow) {
  return holder.listings.length > 1 || holder.orderCount > 1;
}

export function HolderAnalysisCard({ data, ethUsd }: HolderAnalysisCardProps) {
  const [floorFilter, setFloorFilter] = useState("");
  const maxFloor = parseFloorFilter(floorFilter);
  const filteredListings = useMemo(
    () =>
      maxFloor === null
        ? data.listings
        : data.listings.filter((listing) => listing.priceEth <= maxFloor),
    [data.listings, maxFloor],
  );
  const topHolders = useMemo(() => buildTopHolders(filteredListings), [filteredListings]);
  const { collection } = data;
  const ownerSpread =
    collection.owners !== null && collection.supply !== null && collection.supply > 0
      ? (collection.owners / collection.supply) * 100
      : null;
  const averageItemsPerHolder =
    collection.owners !== null && collection.owners > 0 && collection.supply !== null
      ? collection.supply / collection.owners
      : null;
  const activeSellerCount = topHolders.length || null;
  const largestHolder = topHolders[0] ?? null;
  const bundleCount = topHolders.filter(hasBundleSignal).length;

  function handleFloorChange(event: ChangeEvent<HTMLInputElement>) {
    setFloorFilter(event.target.value);
  }

  return (
    <section className="grid gap-4 rounded-lg border border-slate-800 bg-slate-950/82 p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(340px,0.38fr)]">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-400/25 bg-cyan-400/10 text-cyan-100">
              <Network size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Top Holder List</h2>
              <p className="text-sm text-slate-400">Listed wallet groups and bundle signals.</p>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
              <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Holders</dt>
              <dd className="mt-2 font-mono text-lg font-semibold text-white">
                {formatNumber(collection.owners, 0)}
              </dd>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
              <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Holder spread</dt>
              <dd className="mt-2 font-mono text-lg font-semibold text-white">
                {formatPercent(ownerSpread)}
              </dd>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
              <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg per holder</dt>
              <dd className="mt-2 font-mono text-lg font-semibold text-white">
                {formatNumber(averageItemsPerHolder, 2)}
              </dd>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
              <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Active listed wallets</dt>
              <dd className="mt-2 font-mono text-lg font-semibold text-white">
                {formatNumber(activeSellerCount, 0)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-md border border-cyan-400/20 bg-cyan-400/8 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Holder filter</p>
              <p className="mt-1 font-semibold text-white">
                {bundleCount > 0 ? `${bundleCount} bundle signal${bundleCount === 1 ? "" : "s"}` : "No bundle signal"}
              </p>
            </div>
            <div className="min-w-[128px]">
              <label className="text-xs uppercase tracking-[0.14em] text-slate-500" htmlFor="holder-floor-filter">
                Floor ETH
              </label>
              <input
                className="mt-1 h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-2 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                id="holder-floor-filter"
                inputMode="decimal"
                onChange={handleFloorChange}
                placeholder={collection.floor !== null ? String(collection.floor) : "0.0025"}
                value={floorFilter}
              />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Showing {formatNumber(filteredListings.length, 0)} of {formatNumber(data.listings.length, 0)} listings
            {maxFloor !== null ? ` at or below ${maxFloor} ETH.` : "."}
          </p>
          {largestHolder ? (
            <p className="mt-2 text-sm text-slate-400">
              Largest listed holder: {largestHolder.listings.length} listings worth{" "}
              <span className="font-mono text-slate-200">
                <EthUsdValue ethUsd={ethUsd} label="Largest holder group" value={sumEth(largestHolder.listings)} />
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Seller addresses were not exposed for this snapshot.</p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950/70">
        <div className="grid grid-cols-[52px_minmax(0,1.1fr)_90px_130px_110px] gap-3 border-b border-slate-800 px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 max-lg:hidden">
          <span>Rank</span>
          <span>Holder</span>
          <span>Listings</span>
          <span>Total value</span>
          <span>Signal</span>
        </div>
        <div className="divide-y divide-slate-800">
          {topHolders.length ? (
            topHolders.slice(0, 12).map((holder, index) => (
              <div
                className="grid gap-3 px-3 py-3 text-sm text-slate-300 lg:grid-cols-[52px_minmax(0,1.1fr)_90px_130px_110px] lg:items-center"
                key={holder.id}
              >
                <span className="font-mono text-slate-500">#{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-white">{holder.id}</p>
                  <p className="mt-1 text-xs text-slate-500">{holder.label}</p>
                </div>
                <span className="font-mono text-white">{holder.listings.length}</span>
                <span className="font-mono text-cyan-100">
                  <EthUsdValue ethUsd={ethUsd} label="Holder listed value" value={sumEth(holder.listings)} />
                </span>
                <span>
                  {hasBundleSignal(holder) ? (
                    <span className="inline-flex rounded-full border border-amber-200/35 bg-amber-300/14 px-2 py-1 text-xs font-bold text-amber-100">
                      BUNDLE
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Single</span>
                  )}
                </span>
              </div>
            ))
          ) : (
            <div className="p-5 text-sm text-slate-400">
              No holder rows available for this filter.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Network } from "lucide-react";
import { formatAddress, formatNumber, formatPercent } from "@/lib/format";
import { getAddressExplorerUrl, getChainConfig } from "@/lib/chains";
import type { NormalizedListing, SweepApiResponse } from "@/lib/types";

type HolderAnalysisCardProps = {
  data: SweepApiResponse;
};

const holdersPerPage = 15;

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
    }))
    .sort((left, right) => {
      const listingDiff = right.listings.length - left.listings.length;
      return listingDiff === 0 ? sumEth(right.listings) - sumEth(left.listings) : listingDiff;
    });
}

export function HolderAnalysisCard({ data }: HolderAnalysisCardProps) {
  const [page, setPage] = useState(1);
  const listedSellers = useMemo(() => buildTopHolders(data.listings), [data.listings]);
  const { collection } = data;
  const chainConfig = getChainConfig(data.chain);
  const ownerSpread =
    collection.owners !== null && collection.supply !== null && collection.supply > 0
      ? (collection.owners / collection.supply) * 100
      : null;
  const averageItemsPerHolder =
    collection.owners !== null && collection.owners > 0 && collection.supply !== null
      ? collection.supply / collection.owners
      : null;
  const activeSellerCount = listedSellers.length || null;
  const holderRows = data.holderAnalysis.topHolders;
  const usingHolderApi = holderRows.length > 0;
  const fallbackRows = listedSellers.map((seller) => ({
    address: seller.id,
    quantity: seller.listings.length,
    supplyShare:
      collection.supply && collection.supply > 0
        ? (seller.listings.length / collection.supply) * 100
        : null,
  }));
  const rows = usingHolderApi ? holderRows : fallbackRows;
  const listedCountByWallet = new Map(listedSellers.map((seller) => [seller.id, seller.listings.length]));
  const totalPages = Math.max(1, Math.ceil(rows.length / holdersPerPage));
  const activePage = Math.min(page, totalPages);
  const visibleHolders = rows.slice(
    (activePage - 1) * holdersPerPage,
    activePage * holdersPerPage,
  );

  return (
    <section className="holder-ledger">
      <div>
        <div className="holder-ledger__header">
          <div className="holder-ledger__icon">
            <Network size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Holder ledger</h2>
            <p className="text-sm text-slate-400">
              {usingHolderApi
                ? "Largest indexed holders, ranked by NFTs owned."
                : "Holder detail is unavailable; showing active listed wallets instead."}
            </p>
          </div>
        </div>

        <dl className="holder-ledger__metrics">
          <div className="holder-ledger__metric">
            <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Holders</dt>
            <dd className="mt-2 font-mono text-lg font-semibold text-white">
              {formatNumber(collection.owners, 0)}
            </dd>
          </div>
          <div className="holder-ledger__metric">
            <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Holder spread</dt>
            <dd className="mt-2 font-mono text-lg font-semibold text-white">
              {formatPercent(ownerSpread)}
            </dd>
          </div>
          <div className="holder-ledger__metric">
            <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg per holder</dt>
            <dd className="mt-2 font-mono text-lg font-semibold text-white">
              {formatNumber(averageItemsPerHolder, 2)}
            </dd>
          </div>
          <div className="holder-ledger__metric">
            <dt className="text-xs uppercase tracking-[0.16em] text-slate-500">Active listed wallets</dt>
            <dd className="mt-2 font-mono text-lg font-semibold text-white">
              {formatNumber(activeSellerCount, 0)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="holder-ledger__table">
        <div className="grid grid-cols-[52px_minmax(0,1.1fr)_150px_130px_120px] gap-3 border-b border-slate-800 px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 max-lg:hidden">
          <span>Rank</span>
          <span>Holder</span>
          <span>{usingHolderApi ? "NFTs held" : "NFTs listed"}</span>
          <span>Active listings</span>
          <span>Supply share</span>
        </div>
        <div className="divide-y divide-slate-800">
          {visibleHolders.length ? (
            visibleHolders.map((holder, index) => {
              const listedCount = listedCountByWallet.get(holder.address) ?? 0;

              return (
                <div
                  className="grid gap-3 px-3 py-3 text-sm text-slate-300 lg:grid-cols-[52px_minmax(0,1.1fr)_150px_130px_120px] lg:items-center"
                  key={holder.address}
                >
                  <span className="font-mono text-slate-500">#{(activePage - 1) * holdersPerPage + index + 1}</span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="min-w-0 flex-1 truncate font-mono text-white">{formatAddress(holder.address)}</p>
                      <a
                        aria-label={`Open ${formatAddress(holder.address)} on ${chainConfig.explorerName}`}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 text-slate-400 transition hover:border-cyan-400/60 hover:text-cyan-100"
                        href={getAddressExplorerUrl(data.chain, holder.address)}
                        rel="noreferrer"
                        target="_blank"
                        title={`Open on ${chainConfig.explorerName}`}
                      >
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{formatAddress(holder.address)}</p>
                  </div>
                  <div>
                    <p className="font-mono text-white">{formatNumber(holder.quantity, 0)} NFTs</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {usingHolderApi ? "indexed ownership" : "active OpenSea listings"}
                    </p>
                  </div>
                  <span className="font-mono text-cyan-100">{formatNumber(listedCount, 0)}</span>
                  <span className="font-mono text-slate-300">{formatPercent(holder.supplyShare)}</span>
                </div>
              );
            })
          ) : (
            <div className="p-5 text-sm text-slate-400">
              No holder rows available.
            </div>
          )}
        </div>
      </div>

      {rows.length > holdersPerPage ? (
        <div className="holder-ledger__pagination">
          <p className="text-sm text-slate-400">
            Showing {formatNumber((activePage - 1) * holdersPerPage + 1, 0)}-
            {formatNumber(Math.min(activePage * holdersPerPage, rows.length), 0)} of{" "}
            {formatNumber(rows.length, 0)} {usingHolderApi ? "indexed holders" : "listed wallets"}
          </p>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;

              return (
                <button
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 font-mono text-xs transition ${
                    activePage === pageNumber
                      ? "border-cyan-300 bg-cyan-300 text-slate-950"
                      : "border-slate-700 text-slate-300 hover:border-cyan-400/50"
                  }`}
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  type="button"
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { formatAddress, formatDateTime, formatNative } from "@/lib/format";
import { getAddressExplorerUrl, type SupportedChain } from "@/lib/chains";
import type {
  ActivityApiResponse,
  ActivityEventType,
  ApiErrorResponse,
  NormalizedActivityEvent,
} from "@/lib/types";

type ActivityFilter = "all" | "sale" | "transfer" | "mint" | "listing" | "offer";

type ActivityTableProps = {
  chain: SupportedChain;
  onWarningsChange?: (warnings: string[]) => void;
  slug: string;
};

const filters: Array<{ label: string; value: ActivityFilter; eventType?: string }> = [
  { label: "All", value: "all" },
  { eventType: "sale", label: "Sales", value: "sale" },
  { eventType: "transfer", label: "Transfers", value: "transfer" },
  { eventType: "mint", label: "Mints", value: "mint" },
  { eventType: "listing", label: "Listings", value: "listing" },
  { eventType: "offer,trait_offer,collection_offer", label: "Offers", value: "offer" },
];

const eventLabels: Record<ActivityEventType, string> = {
  collection_offer: "Collection offer",
  listing: "Listing",
  mint: "Mint",
  offer: "Offer",
  sale: "Sale",
  trait_offer: "Trait offer",
  transfer: "Transfer",
  unknown: "Unknown",
};

function HashCell({ event }: { event: NormalizedActivityEvent }) {
  const value = event.txHash ?? event.orderHash;

  if (!value) {
    return <span className="text-slate-600">-</span>;
  }

  return <span className="font-mono text-xs text-cyan-200">{formatAddress(value)}</span>;
}

function AddressLink({ address, chain }: { address?: string; chain: SupportedChain }) {
  if (!address) {
    return <span className="text-slate-600">-</span>;
  }

  return (
    <a
      className="font-mono text-xs text-slate-300 hover:text-cyan-100"
      href={getAddressExplorerUrl(chain, address)}
      rel="noreferrer"
      target="_blank"
    >
      {formatAddress(address)}
    </a>
  );
}

function tokenLabel(event: NormalizedActivityEvent) {
  if (event.tokenName) {
    if (!event.tokenId || event.tokenName.includes(event.tokenId)) {
      return event.tokenName;
    }

    return `${event.tokenName} #${event.tokenId}`;
  }

  return event.tokenId ? `#${event.tokenId}` : "Collection";
}

async function fetchActivity({
  cursor,
  chain,
  filter,
  slug,
}: {
  cursor?: string | null;
  chain: SupportedChain;
  filter: ActivityFilter;
  slug: string;
}) {
  const params = new URLSearchParams({ chain, limit: "50" });
  const config = filters.find((item) => item.value === filter);

  if (config?.eventType) {
    params.set("event_type", config.eventType);
  }

  if (cursor) {
    params.set("next", cursor);
  }

  const response = await fetch(`/api/activity/${encodeURIComponent(slug)}?${params.toString()}`);
  const payload = (await response.json()) as ActivityApiResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : "Activity unavailable. Try refreshing.");
  }

  return payload as ActivityApiResponse;
}

export function ActivityTable({ chain, onWarningsChange, slug }: ActivityTableProps) {
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all");
  const [events, setEvents] = useState<NormalizedActivityEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadActivity = useCallback(
    async ({ append, cursor }: { append: boolean; cursor?: string | null }) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetchActivity({
          cursor,
          chain,
          filter: activeFilter,
          slug,
        });

        setEvents((current) => (append ? [...current, ...response.events] : response.events));
        setNextCursor(response.next);
        onWarningsChange?.(response.warnings);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Activity unavailable. Try refreshing.");
        onWarningsChange?.([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeFilter, chain, onWarningsChange, slug],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadActivity({ append: false });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadActivity]);

  return (
    <section className="activity-ledger">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Activity</h2>
          <p className="mt-1 text-sm text-slate-400">Recent sales, transfers, mints, listings, and offers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              className={`button button--filter ${
                activeFilter === filter.value
                  ? "border-cyan-300 bg-cyan-300 text-slate-950"
                  : "border-slate-700 text-slate-300 hover:border-cyan-400/50"
              }`}
              key={filter.value}
              onClick={() => {
                setEvents([]);
                setNextCursor(null);
                setActiveFilter(filter.value);
              }}
              type="button"
            >
              {filter.label}
            </button>
          ))}
          <button
            className="button button--secondary"
            onClick={() => void loadActivity({ append: false })}
            type="button"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-amber-400/20 bg-amber-400/8 p-4 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="h-12 rounded-md bg-slate-900/80" key={index} />
          ))}
        </div>
      ) : null}

      {!loading && !error && events.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-700 p-5 text-sm text-slate-400">
          No recent activity found.
        </div>
      ) : null}

      {!loading && events.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.16em] text-slate-500">
                <th className="px-3 py-3 font-semibold">Time</th>
                <th className="px-3 py-3 font-semibold">Event</th>
                <th className="px-3 py-3 font-semibold">Token</th>
                <th className="px-3 py-3 font-semibold">Price</th>
                <th className="px-3 py-3 font-semibold">From/Seller</th>
                <th className="px-3 py-3 font-semibold">To/Buyer</th>
                <th className="px-3 py-3 font-semibold">Hash</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr
                  className="border-b border-slate-900/90 text-slate-200 transition hover:bg-cyan-400/5"
                  key={`${event.id}-${index}`}
                >
                  <td className="px-3 py-4 text-xs text-slate-400">{formatDateTime(event.timestamp)}</td>
                  <td className="px-3 py-4">{eventLabels[event.eventType]}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      {event.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={tokenLabel(event)}
                          className="h-8 w-8 rounded-md object-cover"
                          src={event.imageUrl}
                        />
                      ) : null}
                      <span className="line-clamp-1">{tokenLabel(event)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 font-mono">
                    {event.priceEth
                      ? formatNative(event.priceEth, event.paymentSymbol ?? (chain === "ape_chain" ? "APE" : "ETH"))
                      : event.paymentSymbol ?? "-"}
                  </td>
                  <td className="px-3 py-4">
                    <AddressLink address={event.seller ?? event.from ?? event.maker} chain={chain} />
                  </td>
                  <td className="px-3 py-4">
                    <AddressLink address={event.buyer ?? event.to} chain={chain} />
                  </td>
                  <td className="px-3 py-4">
                    <HashCell event={event} />
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex gap-2">
                      {event.etherscanUrl ? (
                        <a
                          className="button button--table"
                          href={event.etherscanUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open tx
                          <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      ) : null}
                      {event.openseaUrl ? (
                        <a
                          className="button button--table"
                          href={event.openseaUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open NFT
                          <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {nextCursor ? (
        <div className="mt-4 flex justify-center">
          <button
            className="button button--secondary"
            disabled={loadingMore}
            onClick={() => void loadActivity({ append: true, cursor: nextCursor })}
            type="button"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

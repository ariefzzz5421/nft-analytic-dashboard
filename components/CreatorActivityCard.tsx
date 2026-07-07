"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw, UserRound } from "lucide-react";
import { EthUsdValue } from "@/components/EthUsdValue";
import { formatAddress, formatDateTime } from "@/lib/format";
import type {
  ActivityApiResponse,
  ActivityEventType,
  ApiErrorResponse,
  NormalizedActivityEvent,
  SweepApiResponse,
} from "@/lib/types";

type CreatorActivityCardProps = {
  data: SweepApiResponse;
  ethUsd: number | null | undefined;
};

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

async function fetchActivity(slug: string) {
  const params = new URLSearchParams({
    event_type: "sale,transfer,mint,listing,offer",
    limit: "20",
  });
  const response = await fetch(`/api/activity/${encodeURIComponent(slug)}?${params.toString()}`);
  const payload = (await response.json()) as ActivityApiResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : "Activity unavailable.");
  }

  return payload as ActivityApiResponse;
}

function eventAddressMatches(event: NormalizedActivityEvent, address: string) {
  const lower = address.toLowerCase();
  return [event.buyer, event.from, event.maker, event.seller, event.to].some(
    (value) => value?.toLowerCase() === lower,
  );
}

function actorLabel(event: NormalizedActivityEvent) {
  const address = event.seller ?? event.from ?? event.maker ?? event.buyer ?? event.to;
  return address ? formatAddress(address) : "Unknown actor";
}

function tokenLabel(event: NormalizedActivityEvent) {
  if (event.tokenName) {
    return event.tokenId && !event.tokenName.includes(event.tokenId)
      ? `${event.tokenName} #${event.tokenId}`
      : event.tokenName;
  }

  return event.tokenId ? `#${event.tokenId}` : "Collection";
}

function AddressLink({ address, label }: { address: string | null | undefined; label: string }) {
  if (!address) {
    return <span className="font-mono text-slate-500">Unknown</span>;
  }

  return (
    <a
      className="inline-flex min-w-0 items-center gap-2 font-mono text-cyan-100 transition hover:text-cyan-50"
      href={`https://etherscan.io/address/${address}`}
      rel="noreferrer"
      target="_blank"
    >
      <span className="truncate">{formatAddress(address)}</span>
      <ExternalLink size={14} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </a>
  );
}

export function CreatorActivityCard({ data, ethUsd }: CreatorActivityCardProps) {
  const [events, setEvents] = useState<NormalizedActivityEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const creatorAddress = data.collection.creator.address;
  const latestEvent = events[0] ?? null;
  const creatorEvents = useMemo(
    () => (creatorAddress ? events.filter((event) => eventAddressMatches(event, creatorAddress)) : []),
    [creatorAddress, events],
  );
  const latestCreatorEvent = creatorEvents[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await fetchActivity(data.slug);

        if (!cancelled) {
          setEvents(response.events);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Activity unavailable.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [data.slug]);

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/82 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-400/25 bg-cyan-400/10 text-cyan-100">
            <UserRound size={19} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Creator & Latest Activity</h2>
            <p className="text-sm text-slate-400">
              Creator source: {data.collection.creator.source ?? "not exposed by OpenSea"}
            </p>
          </div>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50"
          onClick={() => {
            setEvents([]);
            setLoading(true);
            setError("");
            void fetchActivity(data.slug)
              .then((response) => setEvents(response.events))
              .catch((cause) => setError(cause instanceof Error ? cause.message : "Activity unavailable."))
              .finally(() => setLoading(false));
          }}
          type="button"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Creator address</p>
          <p className="mt-2 min-w-0">
            <AddressLink address={creatorAddress} label="Open creator on Etherscan" />
          </p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Contract address</p>
          <p className="mt-2 min-w-0">
            <AddressLink address={data.collection.creator.contractAddress} label="Open contract on Etherscan" />
          </p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest transaction</p>
          {latestEvent?.etherscanUrl ? (
            <a
              className="mt-2 inline-flex min-w-0 items-center gap-2 font-mono text-cyan-100 transition hover:text-cyan-50"
              href={latestEvent.etherscanUrl}
              rel="noreferrer"
              target="_blank"
            >
              <span className="truncate">{formatAddress(latestEvent.txHash ?? latestEvent.id)}</span>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : (
            <p className="mt-2 font-mono text-slate-500">Unknown</p>
          )}
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-md border border-amber-400/20 bg-amber-400/8 p-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-3 grid gap-2">
          <div className="h-12 rounded-md bg-slate-900/80" />
          <div className="h-12 rounded-md bg-slate-900/80" />
        </div>
      ) : null}

      {!loading ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest creator activity</p>
            {latestCreatorEvent ? (
              <div className="mt-2 text-sm text-slate-300">
                <p className="font-semibold text-white">{eventLabels[latestCreatorEvent.eventType]}</p>
                <p className="mt-1">{tokenLabel(latestCreatorEvent)}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(latestCreatorEvent.timestamp)}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No creator-matched activity in latest events.
              </p>
            )}
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Latest collection activity</p>
            {latestEvent ? (
              <div className="mt-2 text-sm text-slate-300">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{eventLabels[latestEvent.eventType]}</p>
                  {latestEvent.priceEth ? (
                    <span className="font-mono text-cyan-100">
                      <EthUsdValue ethUsd={ethUsd} label="Latest activity price" value={latestEvent.priceEth} />
                    </span>
                  ) : null}
                </div>
                <p className="mt-1">{tokenLabel(latestEvent)} by {actorLabel(latestEvent)}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(latestEvent.timestamp)}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No recent activity found.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

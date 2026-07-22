"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw, UserRound } from "lucide-react";
import { EthUsdValue } from "@/components/EthUsdValue";
import { formatAddress, formatDateTime, formatEth } from "@/lib/format";
import type {
  ActivityApiResponse,
  ActivityEventType,
  ApiErrorResponse,
  NormalizedActivityEvent,
  SweepApiResponse,
  WalletApiResponse,
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

async function fetchCreatorWallet(address: string) {
  const response = await fetch(`/api/wallet/${encodeURIComponent(address)}`);
  const payload = (await response.json()) as WalletApiResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : "Creator wallet transactions unavailable.");
  }

  return payload as WalletApiResponse;
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
  const [wallet, setWallet] = useState<WalletApiResponse | null>(null);
  const [error, setError] = useState("");
  const [walletError, setWalletError] = useState("");
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(false);
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
      setWalletLoading(Boolean(creatorAddress));
      setError("");
      setWalletError("");
      setWallet(null);

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

      if (!creatorAddress) {
        if (!cancelled) {
          setWalletLoading(false);
        }
        return;
      }

      try {
        const response = await fetchCreatorWallet(creatorAddress);

        if (!cancelled) {
          setWallet(response);
        }
      } catch (cause) {
        if (!cancelled) {
          setWalletError(cause instanceof Error ? cause.message : "Creator wallet transactions unavailable.");
        }
      } finally {
        if (!cancelled) {
          setWalletLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [creatorAddress, data.slug]);

  return (
    <section className="creator-ledger">
      <div className="creator-ledger__header">
        <div className="flex items-center gap-3">
          <div className="creator-ledger__icon">
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
          className="button button--secondary"
          onClick={() => {
            setEvents([]);
            setWallet(null);
            setLoading(true);
            setWalletLoading(Boolean(creatorAddress));
            setError("");
            setWalletError("");
            void fetchActivity(data.slug)
              .then((response) => setEvents(response.events))
              .catch((cause) => setError(cause instanceof Error ? cause.message : "Activity unavailable."))
              .finally(() => setLoading(false));
            if (creatorAddress) {
              void fetchCreatorWallet(creatorAddress)
                .then((response) => setWallet(response))
                .catch((cause) =>
                  setWalletError(
                    cause instanceof Error ? cause.message : "Creator wallet transactions unavailable.",
                  ),
                )
                .finally(() => setWalletLoading(false));
            }
          }}
          type="button"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="creator-ledger__facts">
        <div className="creator-ledger__fact">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Creator address</p>
          <p className="mt-2 min-w-0">
            <AddressLink address={creatorAddress} label="Open creator on Etherscan" />
          </p>
        </div>
        <div className="creator-ledger__fact">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Contract address</p>
          <p className="mt-2 min-w-0">
            <AddressLink address={data.collection.creator.contractAddress} label="Open contract on Etherscan" />
          </p>
        </div>
        <div className="creator-ledger__fact">
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

      <div className="creator-ledger__transactions">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Creator wallet transactions
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Showing up to 10 latest Etherscan transactions from the creator address.
            </p>
          </div>
          {wallet ? (
            <p className="font-mono text-xs text-slate-500">
              Balance {formatEth(wallet.balanceEth)}
            </p>
          ) : null}
        </div>

        {walletError ? (
          <div className="mt-3 rounded-md border border-amber-400/20 bg-amber-400/8 p-3 text-sm text-amber-100">
            {walletError}
          </div>
        ) : null}

        {walletLoading ? (
          <div className="mt-3 grid gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="h-10 rounded-md bg-slate-900/80" key={index} />
            ))}
          </div>
        ) : null}

        {!walletLoading && wallet?.recentTransactions.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-3 py-3 font-semibold">Time</th>
                  <th className="px-3 py-3 font-semibold">Direction</th>
                  <th className="px-3 py-3 font-semibold">Value</th>
                  <th className="px-3 py-3 font-semibold">From</th>
                  <th className="px-3 py-3 font-semibold">To</th>
                  <th className="px-3 py-3 font-semibold">Tx</th>
                </tr>
              </thead>
              <tbody>
                {wallet.recentTransactions.slice(0, 10).map((transaction) => (
                  <tr
                    className="border-b border-slate-900/90 text-slate-200 transition hover:bg-cyan-400/5"
                    key={transaction.hash}
                  >
                    <td className="px-3 py-3 text-xs text-slate-400">
                      {formatDateTime(transaction.timestamp)}
                    </td>
                    <td className="px-3 py-3 capitalize">{transaction.direction}</td>
                    <td className="px-3 py-3 font-mono">{formatEth(transaction.valueEth)}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-400">
                      {formatAddress(transaction.from)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-400">
                      {formatAddress(transaction.to)}
                    </td>
                    <td className="px-3 py-3">
                      <a
                        className="button button--table"
                        href={`https://etherscan.io/tx/${transaction.hash}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {formatAddress(transaction.hash)}
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!walletLoading && wallet && wallet.recentTransactions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No creator wallet transactions found.</p>
        ) : null}

        {!walletLoading && !wallet && !walletError && !creatorAddress ? (
          <p className="mt-3 text-sm text-slate-500">Creator address unavailable from OpenSea.</p>
        ) : null}
      </div>

      {!loading ? (
        <div className="creator-ledger__latest">
          <div className="creator-ledger__event">
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
          <div className="creator-ledger__event">
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

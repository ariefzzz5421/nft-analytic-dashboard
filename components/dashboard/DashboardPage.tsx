"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Clock3, LoaderCircle, Plus, RefreshCw, Search } from "lucide-react";
import { CollectionSummary } from "@/components/CollectionSummary";
import { CreatorActivityCard } from "@/components/CreatorActivityCard";
import { ErrorState } from "@/components/ErrorState";
import { EthUsdConverter } from "@/components/EthUsdConverter";
import { HolderAnalysisCard } from "@/components/HolderAnalysisCard";
import { LoadingState } from "@/components/LoadingState";
import { NetworkBadge } from "@/components/NetworkBadge";
import { RefreshRateControl } from "@/components/RefreshRateControl";
import { SweepLadderTable } from "@/components/SweepLadderTable";
import { useLiveAssetPrice, useLiveEthPrice } from "@/components/useLiveEthPrice";
import { WatchlistCard } from "@/components/dashboard/WatchlistCard";
import { MarketCollectionsTable } from "@/components/dashboard/MarketCollectionsTable";
import { getCollectionHref, getWatchlistKey, type SupportedChain } from "@/lib/chains";
import { parseCollectionInput } from "@/lib/collection-input";
import type {
  ApiErrorResponse,
  CollectionDiscoveryResponse,
  CollectionResolution,
  SweepApiResponse,
} from "@/lib/types";
import { useWatchlist } from "@/lib/watchlist";

type SweepRecord = {
  data: SweepApiResponse | null;
  error: string;
  loading: boolean;
};

async function fetchSweep(slug: string, chain: SupportedChain) {
  const params = new URLSearchParams({ chain });
  const response = await fetch(`/api/sweep/${encodeURIComponent(slug)}?${params.toString()}`);
  const payload = (await response.json()) as SweepApiResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : "Failed to analyze collection.");
  }

  return payload as SweepApiResponse;
}

async function resolveCollection(input: string) {
  const params = new URLSearchParams({ input });
  const response = await fetch(`/api/resolve-collection?${params.toString()}`);
  const payload = (await response.json()) as CollectionResolution | ApiErrorResponse;

  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : "Unable to detect collection network.");
  }

  return payload as CollectionResolution;
}

async function fetchDiscovery() {
  const response = await fetch("/api/discovery", { cache: "no-store" });
  const payload = (await response.json()) as CollectionDiscoveryResponse | ApiErrorResponse;

  if ("top" in payload && "trending" in payload) {
    return payload;
  }

  throw new Error("error" in payload ? payload.error : "OpenSea market feed is unavailable.");
}

export function DashboardPage() {
  const router = useRouter();
  const { hydrated, items, removeItem, upsertItem } = useWatchlist();
  const [query, setQuery] = useState("");
  const [oneOff, setOneOff] = useState<SweepApiResponse | null>(null);
  const [resolution, setResolution] = useState<CollectionResolution | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [records, setRecords] = useState<Record<string, SweepRecord>>({});
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [refreshSeconds, setRefreshSeconds] = useState(60);
  const [discovery, setDiscovery] = useState<CollectionDiscoveryResponse | null>(null);
  const [discoveryError, setDiscoveryError] = useState("");
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [discoveryNonce, setDiscoveryNonce] = useState(0);
  const liveEthPrice = useLiveEthPrice();
  const liveNativePrice = useLiveAssetPrice(
    oneOff?.nativeCurrency.symbol ?? "ETH",
    oneOff?.nativeUsd,
  );
  const activeNativeUsd = liveNativePrice.priceUsd ?? oneOff?.nativeUsd ?? null;
  const hasMarketData = Boolean(discovery?.top.length || discovery?.trending.length);

  useEffect(() => {
    let cancelled = false;

    void fetchDiscovery()
      .then((payload) => {
        if (cancelled) return;
        setDiscovery(payload);
        setDiscoveryError("");
      })
      .catch((cause) => {
        if (cancelled) return;
        setDiscoveryError(
          cause instanceof Error ? cause.message : "OpenSea market feed is unavailable.",
        );
      })
      .finally(() => {
        if (!cancelled) setDiscoveryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [discoveryNonce]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDiscoveryNonce((value) => value + 1);
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!hydrated || items.length === 0) {
      return;
    }

    let cancelled = false;

    for (const item of items) {
      const key = getWatchlistKey(item.slug, item.chain);

      fetchSweep(item.slug, item.chain)
        .then((data) => {
          if (cancelled) {
            return;
          }

          setRecords((current) => ({
            ...current,
            [key]: { data, error: "", loading: false },
          }));

          if (item.name !== data.collection.name || item.imageUrl !== data.collection.imageUrl) {
            upsertItem({
              ...item,
              imageUrl: data.collection.imageUrl,
              name: data.collection.name,
            });
          }
        })
        .catch((cause) => {
          if (cancelled) {
            return;
          }

          setRecords((current) => ({
            ...current,
            [key]: {
              data: null,
              error: cause instanceof Error ? cause.message : "Failed to refresh.",
              loading: false,
            },
          }));
        });
    }

    return () => {
      cancelled = true;
    };
  }, [hydrated, items, refreshNonce, upsertItem]);

  useEffect(() => {
    const parsed = parseCollectionInput(query);

    if (!parsed || parsed.kind !== "contract") {
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setDetecting(true);
      void resolveCollection(query)
        .then((nextResolution) => {
          if (!cancelled) {
            setResolution(nextResolution);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResolution(null);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setDetecting(false);
          }
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    if (!hydrated || items.length === 0 || refreshSeconds <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setRefreshNonce((value) => value + 1);
    }, refreshSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [hydrated, items.length, refreshSeconds]);

  async function analyzeOnce(event?: FormEvent) {
    event?.preventDefault();

    setLoadingAction(true);
    setError("");
    setOneOff(null);

    try {
      const nextResolution = resolution ?? (await resolveCollection(query));
      setResolution(nextResolution);
      setOneOff(await fetchSweep(nextResolution.slug, nextResolution.chain));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to analyze collection.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function addToWatchlist() {
    setLoadingAction(true);
    setError("");

    try {
      const nextResolution = resolution ?? (await resolveCollection(query));
      const data = await fetchSweep(nextResolution.slug, nextResolution.chain);
      upsertItem({
        chain: nextResolution.chain,
        contractAddress: nextResolution.contractAddress,
        imageUrl: data.collection.imageUrl,
        name: data.collection.name,
        slug: nextResolution.slug,
      });
      router.push(getCollectionHref(nextResolution.slug, nextResolution.chain));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to analyze collection.";

      if (message.includes("Missing OPENSEA_API_KEY")) {
        const parsed = parseCollectionInput(query);
        if (parsed?.kind === "slug") {
          upsertItem({ chain: "ethereum", slug: parsed.slug });
          router.push(getCollectionHref(parsed.slug, "ethereum"));
        }
        return;
      }

      setError(message);
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <main className="app-main text-slate-100">
      <div className="app-frame dashboard-shell">
        <header className="market-console-head">
          <div>
            <p className="terminal-kicker">NFT market overview</p>
            <h1>Market terminal</h1>
          </div>
          <div className="market-console-head__status">
            <span
              className={`live-pulse ${discovery && !hasMarketData ? "live-pulse--offline" : ""}`}
              aria-hidden="true"
            />
            <span>OpenSea / 60s refresh</span>
            <button
              aria-label="Refresh market data"
              className="icon-button"
              disabled={discoveryLoading}
              onClick={() => {
                setDiscoveryLoading(true);
                setDiscoveryNonce((value) => value + 1);
              }}
              title="Refresh market data"
              type="button"
            >
              <RefreshCw className={discoveryLoading ? "animate-spin" : ""} size={15} />
            </button>
          </div>
        </header>

        <section className="command-dock command-dock--terminal">
          <div className="command-dock__identity">
            <span className="command-index">01</span>
            <div>
              <h2>Analyze collection</h2>
              <p>Paste an OpenSea URL, collection slug, or contract</p>
            </div>
          </div>
          <form className="command-dock__form" onSubmit={analyzeOnce}>
            <label className="command-dock__field">
              <span className="sr-only">OpenSea collection URL or slug</span>
              <input
                className="command-dock__input"
                disabled={loadingAction}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setError("");
                  setResolution(null);
                  setDetecting(false);
                }}
                placeholder="Paste 0x contract, OpenSea URL, or collection slug"
                value={query}
              />
              <span className="command-dock__detection" aria-live="polite">
                {detecting ? (
                  <>
                    <LoaderCircle className="animate-spin" size={13} aria-hidden="true" />
                    Detecting network
                  </>
                ) : resolution ? (
                  <>
                    <NetworkBadge chain={resolution.chain} compact />
                    {resolution.slug}
                  </>
                ) : (
                  "Network detection runs automatically"
                )}
              </span>
            </label>
            <button
              className={`button button--secondary ${
                loadingAction ? "analyze-button-active" : ""
              }`}
              disabled={loadingAction}
              type="submit"
            >
              {loadingAction ? (
                <LoaderCircle className="animate-spin" size={16} aria-hidden="true" />
              ) : (
                <Search size={16} aria-hidden="true" />
              )}
              Analyze
            </button>
            <button
              className="button button--primary"
              disabled={loadingAction}
              onClick={addToWatchlist}
              type="button"
            >
              <Plus size={16} aria-hidden="true" />
              Add to watchlist
            </button>
          </form>
        </section>

        <section className="market-discovery" aria-label="OpenSea collection market">
          {discoveryLoading && !discovery ? (
            <div className="market-feed-state">
              <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
              Loading OpenSea market data
            </div>
          ) : null}

          {discoveryError && !discovery ? (
            <div className="market-feed-state market-feed-state--error">
              <strong>Market feed unavailable</strong>
              <span>{discoveryError}</span>
              <button
                className="button button--secondary"
                onClick={() => {
                  setDiscoveryLoading(true);
                  setDiscoveryNonce((value) => value + 1);
                }}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : null}

          {discovery && !hasMarketData ? (
            <div className="market-feed-state market-feed-state--error">
              <strong>OpenSea market data is unavailable</strong>
              <span>{discovery.warnings.join(" ") || "The live collection feed returned no rows."}</span>
              <button
                className="button button--secondary"
                onClick={() => {
                  setDiscoveryLoading(true);
                  setDiscoveryNonce((value) => value + 1);
                }}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : null}

          {discovery && hasMarketData ? (
            <>
              <MarketCollectionsTable items={discovery.top} title="Top traded" />
              <MarketCollectionsTable compact items={discovery.trending} title="Trending now" />
            </>
          ) : null}
        </section>

        {discovery ? (
          <div className="market-feed-note">
            <span><Clock3 aria-hidden="true" size={13} /> Updated {new Date(discovery.lastUpdated).toLocaleTimeString()}</span>
            <span>Source: OpenSea</span>
            {hasMarketData && discovery.warnings.length ? (
              <span>{discovery.warnings.join(" ")}</span>
            ) : null}
          </div>
        ) : null}

        {error ? <ErrorState message={error} /> : null}
        {loadingAction ? <LoadingState /> : null}

        {oneOff && !loadingAction ? (
          <section className="app-section analysis-result">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">One-time analysis</h2>
                <p className="text-sm text-slate-400">Not saved to watchlist.</p>
              </div>
              <Link
                className="button button--secondary"
                href={getCollectionHref(oneOff.slug, oneOff.chain)}
              >
                Open detail
              </Link>
            </div>
            <CollectionSummary
              chain={oneOff.chain}
              collection={oneOff.collection}
              ethUsd={activeNativeUsd}
              slug={oneOff.slug}
              symbol={oneOff.nativeCurrency.symbol}
            />
            <SweepLadderTable
              ethUsd={activeNativeUsd}
              ladder={oneOff.sweepLadder}
              symbol={oneOff.nativeCurrency.symbol}
            />
            <CreatorActivityCard data={oneOff} ethUsd={activeNativeUsd} />
            <HolderAnalysisCard data={oneOff} ethUsd={activeNativeUsd} />
            <Link
              className="analysis-result__link"
              href={getCollectionHref(oneOff.slug, oneOff.chain)}
            >
              Open full workbench
              <ArrowUpRight aria-hidden="true" size={15} />
            </Link>
          </section>
        ) : null}

        <section className="app-section watchlist-section" id="watchlist">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Watchlist</h2>
              <p className="text-sm text-slate-400">
                Local watchlist stored in this browser.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <RefreshRateControl compact onChange={setRefreshSeconds} />
              <button
                className="button button--secondary"
                onClick={() => setRefreshNonce((value) => value + 1)}
                type="button"
              >
                Refresh all
              </button>
            </div>
          </div>

          {hydrated && items.length === 0 ? (
            <div className="empty-ledger">
              <h3 className="text-lg font-semibold text-white">No collections saved yet</h3>
              <p className="mt-2 text-sm text-slate-400">
                Add a collection slug like the-plimpo or paste an OpenSea URL.
              </p>
            </div>
          ) : null}

          <div className="watchlist-ledger">
            {items.map((item) => (
              <WatchlistCard
                item={item}
                key={item.slug}
                liveEthUsd={item.chain === "ethereum" ? liveEthPrice.priceUsd : null}
                onRefresh={() => setRefreshNonce((value) => value + 1)}
                onRemove={() => removeItem(item.slug, item.chain)}
                record={
                  records[getWatchlistKey(item.slug, item.chain)] ?? {
                    data: null,
                    error: "",
                    loading: true,
                  }
                }
              />
            ))}
          </div>
        </section>

        <EthUsdConverter
          ethUsd={liveEthPrice.priceUsd}
          lastUpdated={liveEthPrice.lastUpdated}
          source={liveEthPrice.source}
        />
      </div>
    </main>
  );
}

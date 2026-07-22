"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Search, ShieldAlert } from "lucide-react";
import { CollectionSummary } from "@/components/CollectionSummary";
import { CreatorActivityCard } from "@/components/CreatorActivityCard";
import { ErrorState } from "@/components/ErrorState";
import { EthUsdConverter } from "@/components/EthUsdConverter";
import { HolderAnalysisCard } from "@/components/HolderAnalysisCard";
import { LoadingState } from "@/components/LoadingState";
import { RefreshRateControl } from "@/components/RefreshRateControl";
import { SweepLadderTable } from "@/components/SweepLadderTable";
import { useLiveEthPrice } from "@/components/useLiveEthPrice";
import { WatchlistCard } from "@/components/dashboard/WatchlistCard";
import { extractSlug } from "@/lib/slug";
import type { ApiErrorResponse, SweepApiResponse } from "@/lib/types";
import { useWatchlist } from "@/lib/watchlist";

type SweepRecord = {
  data: SweepApiResponse | null;
  error: string;
  loading: boolean;
};

async function fetchSweep(slug: string) {
  const response = await fetch(`/api/sweep/${encodeURIComponent(slug)}`);
  const payload = (await response.json()) as SweepApiResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : "Failed to analyze collection.");
  }

  return payload as SweepApiResponse;
}

export function DashboardPage() {
  const router = useRouter();
  const { hydrated, items, removeItem, upsertItem } = useWatchlist();
  const [query, setQuery] = useState("");
  const [oneOff, setOneOff] = useState<SweepApiResponse | null>(null);
  const [records, setRecords] = useState<Record<string, SweepRecord>>({});
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [refreshSeconds, setRefreshSeconds] = useState(60);
  const liveEthPrice = useLiveEthPrice(oneOff?.ethUsd);
  const activeEthUsd = liveEthPrice.priceUsd ?? oneOff?.ethUsd ?? null;

  useEffect(() => {
    if (!hydrated || items.length === 0) {
      return;
    }

    let cancelled = false;

    for (const item of items) {
      fetchSweep(item.slug)
        .then((data) => {
          if (cancelled) {
            return;
          }

          setRecords((current) => ({
            ...current,
            [item.slug]: { data, error: "", loading: false },
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
            [item.slug]: {
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
    if (!hydrated || items.length === 0 || refreshSeconds <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setRefreshNonce((value) => value + 1);
    }, refreshSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [hydrated, items.length, refreshSeconds]);

  function readSlug() {
    const slug = extractSlug(query);

    if (!slug) {
      setError("Enter an OpenSea collection URL or collection slug.");
      return null;
    }

    return slug;
  }

  async function analyzeOnce(event?: FormEvent) {
    event?.preventDefault();
    const slug = readSlug();

    if (!slug) {
      return;
    }

    setLoadingAction(true);
    setError("");
    setOneOff(null);

    try {
      setOneOff(await fetchSweep(slug));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to analyze collection.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function addToWatchlist() {
    const slug = readSlug();

    if (!slug) {
      return;
    }

    setLoadingAction(true);
    setError("");

    try {
      const data = await fetchSweep(slug);
      upsertItem({
        imageUrl: data.collection.imageUrl,
        name: data.collection.name,
        slug,
      });
      router.push(`/collection/${encodeURIComponent(slug)}`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to analyze collection.";

      if (message.includes("Missing OPENSEA_API_KEY")) {
        upsertItem({ slug });
        router.push(`/collection/${encodeURIComponent(slug)}`);
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
        <header className="dashboard-intro">
          <div className="dashboard-intro__copy">
            <div className="read-only-marker">
              <ShieldAlert size={14} aria-hidden="true" />
              Read-only
            </div>
            <h1>NFT Sweep Depth</h1>
            <p>
              Inspect collection liquidity, estimate sweep cost, and trace creator and holder activity from one workspace.
            </p>
          </div>
          <div className="dashboard-intro__index" aria-hidden="true">
            <span>COLLECTION</span>
            <span>LIQUIDITY</span>
            <span>RESEARCH</span>
          </div>
        </header>

        <section className="analysis-command">
          <div className="analysis-command__label">
            <Search aria-hidden="true" size={18} />
            <span>Analyze a collection</span>
          </div>
          <form className="analysis-command__form" onSubmit={analyzeOnce}>
            <label className="min-w-0">
              <span className="sr-only">OpenSea collection URL or slug</span>
              <input
                className="analysis-command__input"
                disabled={loadingAction}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Paste OpenSea collection URL or slug"
                value={query}
              />
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
                href={`/collection/${oneOff.slug}`}
              >
                Open detail
              </Link>
            </div>
            <CollectionSummary collection={oneOff.collection} ethUsd={activeEthUsd} slug={oneOff.slug} />
            <SweepLadderTable ethUsd={activeEthUsd} ladder={oneOff.sweepLadder} />
            <CreatorActivityCard data={oneOff} ethUsd={activeEthUsd} />
            <HolderAnalysisCard data={oneOff} ethUsd={activeEthUsd} />
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
                liveEthUsd={liveEthPrice.priceUsd}
                onRefresh={() => setRefreshNonce((value) => value + 1)}
                onRemove={() => removeItem(item.slug)}
                record={records[item.slug] ?? { data: null, error: "", loading: true }}
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

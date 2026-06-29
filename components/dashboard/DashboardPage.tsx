"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, ShieldAlert } from "lucide-react";
import { CollectionSummary } from "@/components/CollectionSummary";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { RefreshRateControl } from "@/components/RefreshRateControl";
import { RiskWarningCard } from "@/components/RiskWarningCard";
import { SweepLadderTable } from "@/components/SweepLadderTable";
import { WatchlistCard } from "@/components/dashboard/WatchlistCard";
import { formatEth, formatPercent } from "@/lib/format";
import { extractSlug } from "@/lib/slug";
import { calculateSweepLadder, generateSmartTargets } from "@/lib/sweep";
import type { ApiErrorResponse, SweepApiResponse, WatchlistItem } from "@/lib/types";
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

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 min-h-8 font-mono text-lg font-semibold text-white">{value}</p>
    </div>
  );
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

  const summary = useMemo(() => {
    const dataRows = items
      .map((item) => ({ data: records[item.slug]?.data ?? null, item }))
      .filter((row): row is { data: SweepApiResponse; item: WatchlistItem } => Boolean(row.data));
    const mostPumpable = [...dataRows].sort(
      (left, right) =>
        (right.data.risk.pumpabilityScore ?? -1) - (left.data.risk.pumpabilityScore ?? -1),
    )[0];
    const lowestNextTargetCost = dataRows
      .map((row) => {
        const target = generateSmartTargets(row.data.collection.floor ?? 0)[0];
        return target
          ? calculateSweepLadder(
              row.data.listings,
              [target],
              row.data.ethUsd,
              row.data.collection.floor,
            )[0]?.costEth ?? null
          : null;
      })
      .filter((value): value is number => value !== null)
      .sort((left, right) => left - right)[0];
    const highestListedRisk = [...dataRows].sort(
      (left, right) =>
        (right.data.collection.listedPercentage ?? -1) -
        (left.data.collection.listedPercentage ?? -1),
    )[0];
    const weakBidCount = dataRows.filter((row) =>
      ["Weak bid support", "Floor theater risk"].includes(row.data.risk.bidSupportLabel),
    ).length;

    return {
      highestListedRisk,
      lowestNextTargetCost,
      mostPumpable,
      weakBidCount,
    };
  }, [items, records]);

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
    <main className="min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-5 border-b border-cyan-400/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
              <ShieldAlert size={14} aria-hidden="true" />
              Read-only
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              NFT Sweep Depth
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
              Estimate sweep cost to target floors.
            </p>
          </div>
        </header>

        <section className="rounded-lg border border-slate-800 bg-slate-950/82 p-4">
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]" onSubmit={analyzeOnce}>
            <label className="min-w-0">
              <span className="sr-only">OpenSea collection URL or slug</span>
              <input
                className="h-12 w-full rounded-md border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
                disabled={loadingAction}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Paste OpenSea collection URL or slug"
                value={query}
              />
            </label>
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loadingAction}
              type="submit"
            >
              <Search size={16} aria-hidden="true" />
              Analyze once
            </button>
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
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
          <section className="grid gap-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">One-time analysis</h2>
                <p className="text-sm text-slate-400">Not saved to watchlist.</p>
              </div>
              <Link
                className="inline-flex items-center justify-center rounded-md border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300"
                href={`/collection/${oneOff.slug}`}
              >
                Open detail
              </Link>
            </div>
            <CollectionSummary collection={oneOff.collection} slug={oneOff.slug} />
            <SweepLadderTable ladder={oneOff.sweepLadder} />
          </section>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <DashboardMetric label="Collections" value={String(items.length)} />
          <DashboardMetric
            label="Most pumpable"
            value={summary.mostPumpable?.data.collection.name ?? "Unknown"}
          />
          <DashboardMetric
            label="Lowest next target"
            value={formatEth(summary.lowestNextTargetCost)}
          />
          <DashboardMetric
            label="Highest listed risk"
            value={formatPercent(summary.highestListedRisk?.data.collection.listedPercentage)}
          />
          <DashboardMetric label="Weak bid support" value={String(summary.weakBidCount)} />
        </section>

        <section className="grid gap-4" id="watchlist">
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
                className="inline-flex items-center justify-center rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50"
                onClick={() => setRefreshNonce((value) => value + 1)}
                type="button"
              >
                Refresh all
              </button>
            </div>
          </div>

          {hydrated && items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center">
              <h3 className="text-lg font-semibold text-white">No collections saved yet</h3>
              <p className="mt-2 text-sm text-slate-400">
                Add a collection slug like the-plimpo or paste an OpenSea URL.
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <WatchlistCard
                item={item}
                key={item.slug}
                onRefresh={() => setRefreshNonce((value) => value + 1)}
                onRemove={() => removeItem(item.slug)}
                record={records[item.slug] ?? { data: null, error: "", loading: true }}
              />
            ))}
          </div>
        </section>

        <RiskWarningCard />

        <p className="pb-4 text-center text-xs text-slate-500">
          This is not financial advice. This tool estimates orderbook depth only.
        </p>
      </div>
    </main>
  );
}

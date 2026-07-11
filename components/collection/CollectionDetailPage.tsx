"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus, RefreshCw, Trash2 } from "lucide-react";
import { ActivityTable } from "@/components/collection/ActivityTable";
import { BidSupportCard } from "@/components/BidSupportCard";
import { CollectionSummary } from "@/components/CollectionSummary";
import { CreatorActivityCard } from "@/components/CreatorActivityCard";
import { EthUsdValue } from "@/components/EthUsdValue";
import { EthUsdConverter } from "@/components/EthUsdConverter";
import { ErrorState } from "@/components/ErrorState";
import { HolderAnalysisCard } from "@/components/HolderAnalysisCard";
import { ListingDistributionChart } from "@/components/ListingDistributionChart";
import { LoadingState } from "@/components/LoadingState";
import { RefreshRateControl } from "@/components/RefreshRateControl";
import { SweepCostChart } from "@/components/SweepCostChart";
import { SweepLadderTable } from "@/components/SweepLadderTable";
import { useLiveEthPrice } from "@/components/useLiveEthPrice";
import { TrackedWalletsPanel } from "@/components/wallets/TrackedWalletsPanel";
import { formatDateTime, formatUsd } from "@/lib/format";
import {
  calculateSweepLadder,
  DEFAULT_TARGET_FLOORS,
  generateSmartTargets,
  sanitizeTargets,
} from "@/lib/sweep";
import type { ApiErrorResponse, SweepApiResponse, WalletApiResponse } from "@/lib/types";
import { getDefaultWatchlistItem, useWatchlist } from "@/lib/watchlist";

type CollectionDetailPageProps = {
  slug: string;
};

type TargetMode = "custom" | "range";

async function fetchSweep(slug: string) {
  const response = await fetch(`/api/sweep/${encodeURIComponent(slug)}`);
  const payload = (await response.json()) as SweepApiResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : "Failed to analyze collection.");
  }

  return payload as SweepApiResponse;
}

function parseTargetInput(value: string) {
  return value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((target) => Number.isFinite(target) && target > 0);
}

function uniqueTargets(targets: number[]) {
  return [...new Set(targets)].sort((left, right) => left - right);
}

function isDefaultTargetSet(targets: number[]) {
  return (
    targets.length === DEFAULT_TARGET_FLOORS.length &&
    targets.every((target, index) => target === DEFAULT_TARGET_FLOORS[index])
  );
}

function buildRangeTargets(start: number, end: number, step: number) {
  const targets: number[] = [];

  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step <= 0) {
    return targets;
  }

  for (let target = start; target <= end + step / 1000; target += step) {
    targets.push(Number(target.toFixed(8)));

    if (targets.length > 50) {
      break;
    }
  }

  return targets;
}

const quickTargets = [0.1, 0.5, 1];

export function CollectionDetailPage({ slug }: CollectionDetailPageProps) {
  const {
    addWallet,
    bySlug,
    hydrated,
    removeItem,
    removeWallet,
    updateTargetFloors,
    upsertItem,
  } = useWatchlist();
  const watchlistItem = bySlug.get(slug);
  const [data, setData] = useState<SweepApiResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [targetMode, setTargetMode] = useState<TargetMode>("custom");
  const [targetInput, setTargetInput] = useState("");
  const [targetError, setTargetError] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeStep, setRangeStep] = useState("");
  const [filterMin, setFilterMin] = useState("");
  const [filterMax, setFilterMax] = useState("");
  const [localTargets, setLocalTargets] = useState<number[]>([]);
  const [walletData, setWalletData] = useState<Record<string, WalletApiResponse | null>>({});
  const [refreshSeconds, setRefreshSeconds] = useState(60);
  const liveEthPrice = useLiveEthPrice(data?.ethUsd);
  const activeEthUsd = liveEthPrice.priceUsd ?? data?.ethUsd ?? null;

  const activeItem = watchlistItem ?? getDefaultWatchlistItem(slug);
  const currentFloor = data?.collection.floor ?? null;
  const smartTargets = useMemo(
    () => generateSmartTargets(currentFloor ?? 0),
    [currentFloor],
  );
  const storedTargets =
    watchlistItem && !isDefaultTargetSet(activeItem.targetFloors) ? activeItem.targetFloors : [];
  const activeTargets = storedTargets.length ? storedTargets : localTargets.length ? localTargets : smartTargets;
  const filteredTargets = useMemo(() => {
    const min = filterMin.trim() ? Number(filterMin) : null;
    const max = filterMax.trim() ? Number(filterMax) : null;

    return sanitizeTargets(activeTargets, currentFloor).filter((target) => {
      if (min !== null && Number.isFinite(min) && target < min) {
        return false;
      }

      if (max !== null && Number.isFinite(max) && target > max) {
        return false;
      }

      return true;
    });
  }, [activeTargets, currentFloor, filterMax, filterMin]);
  const visibleTargets = sanitizeTargets(activeTargets, currentFloor);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchSweep(slug);
      setData(response);

      if (
        watchlistItem &&
        (watchlistItem.name !== response.collection.name ||
          watchlistItem.imageUrl !== response.collection.imageUrl)
      ) {
        upsertItem({
          ...watchlistItem,
          imageUrl: response.collection.imageUrl,
          name: response.collection.name,
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to analyze collection.");
    } finally {
      setLoading(false);
    }
  }, [setData, setError, setLoading, slug, upsertItem, watchlistItem]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refresh]);

  useEffect(() => {
    if (refreshSeconds <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, refreshSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [refresh, refreshSeconds]);

  const ladder = useMemo(() => {
    if (!data) {
      return [];
    }

    return calculateSweepLadder(data.listings, filteredTargets, activeEthUsd ?? data.ethUsd, currentFloor);
  }, [activeEthUsd, currentFloor, data, filteredTargets]);

  const smartLadder = useMemo(() => {
    if (!data) {
      return [];
    }

    return calculateSweepLadder(data.listings, smartTargets, activeEthUsd ?? data.ethUsd, currentFloor);
  }, [activeEthUsd, currentFloor, data, smartTargets]);

  const nextMeaningfulTarget = smartLadder[0] ?? null;

  const treasuryBalanceEth = useMemo(() => {
    const balances = Object.values(walletData)
      .map((wallet) => wallet?.balanceEth)
      .filter((balance): balance is number => typeof balance === "number" && Number.isFinite(balance));

    return balances.length > 0
      ? balances.reduce((total, balance) => total + balance, 0)
      : null;
  }, [walletData]);

  const primaryCoverage = useMemo(() => {
    const row = ladder.find((candidate) => candidate.costEth > 0);

    if (!row || treasuryBalanceEth === null) {
      return null;
    }

    return {
      coverage: treasuryBalanceEth / row.costEth,
      targetFloor: row.targetFloor,
    };
  }, [ladder, treasuryBalanceEth]);

  const handleWalletData = useCallback((address: string, wallet: WalletApiResponse | null) => {
    setWalletData((current) => ({ ...current, [address.toLowerCase()]: wallet }));
  }, [setWalletData]);

  function saveTargets(targets: number[]) {
    const nextTargets = sanitizeTargets(uniqueTargets(targets), currentFloor);

    if (nextTargets.length === 0) {
      setTargetError("Targets must be numbers greater than the current floor.");
      return false;
    }

    if (watchlistItem) {
      updateTargetFloors(slug, nextTargets);
    } else {
      setLocalTargets(nextTargets);
    }

    setTargetError("");
    return true;
  }

  function addTargets(event: FormEvent) {
    event.preventDefault();
    const parsedTargets = parseTargetInput(targetInput);

    if (parsedTargets.length === 0) {
      setTargetError("Enter at least one numeric target.");
      return;
    }

    if (saveTargets([...activeTargets, ...parsedTargets])) {
      setTargetInput("");
    }
  }

  function applyRange(event: FormEvent) {
    event.preventDefault();
    const start = Number(rangeStart);
    const end = Number(rangeEnd);
    const step = Number(rangeStep);
    const rangeTargets = buildRangeTargets(start, end, step);

    if (rangeTargets.length === 0) {
      setTargetError("Range start, end, and step must be valid positive numbers.");
      return;
    }

    if (saveTargets(rangeTargets)) {
      setRangeStart("");
      setRangeEnd("");
      setRangeStep("");
    }
  }

  function resetToSmartTargets() {
    setTargetError("");

    if (watchlistItem) {
      updateTargetFloors(slug, DEFAULT_TARGET_FLOORS);
    } else {
      setLocalTargets([]);
    }
  }

  function removeTarget(target: number) {
    const nextTargets = activeTargets.filter((candidate) => candidate !== target);

    if (watchlistItem) {
      updateTargetFloors(slug, nextTargets.length ? nextTargets : smartTargets);
    } else {
      setLocalTargets(nextTargets);
    }
  }

  function toggleWatchlist() {
    if (watchlistItem) {
      removeItem(slug);
      return;
    }

    upsertItem({
      imageUrl: data?.collection.imageUrl,
      name: data?.collection.name,
      slug,
      targetFloors: activeTargets,
    });
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-700 bg-slate-900">
                {data?.collection.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={data.collection.name}
                    className="h-full w-full object-cover"
                    src={data.collection.imageUrl}
                  />
                ) : (
                  <span className="text-xl font-semibold text-cyan-200">{slug.slice(0, 1)}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate-400">Collection detail</p>
                <h1 className="truncate text-2xl font-semibold text-white sm:text-3xl">
                  {data?.collection.name ?? activeItem.name ?? slug}
                </h1>
                <p className="truncate font-mono text-sm text-cyan-200">{slug}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <RefreshRateControl compact onChange={setRefreshSeconds} />
              <a
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50"
                href={`https://opensea.io/collection/${slug}`}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink size={15} aria-hidden="true" />
                OpenSea
              </a>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300"
                onClick={refresh}
                type="button"
              >
                <RefreshCw size={15} aria-hidden="true" />
                Refresh
              </button>
              {hydrated ? (
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
                  onClick={toggleWatchlist}
                  type="button"
                >
                  {watchlistItem ? <Trash2 size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
                  {watchlistItem ? "Remove watchlist" : "Add watchlist"}
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
            <span>Last updated: {formatDateTime(data?.lastUpdated)}</span>
            {treasuryBalanceEth !== null ? (
              <span>
                Tracked balance:{" "}
                <EthUsdValue ethUsd={activeEthUsd} label="Tracked balance" value={treasuryBalanceEth} />
              </span>
            ) : null}
          </div>
        </header>

        {error ? <ErrorState message={error} onRetry={refresh} /> : null}
        {loading ? <LoadingState /> : null}

        {data && !loading ? (
          <>
            <CollectionSummary collection={data.collection} ethUsd={activeEthUsd} slug={data.slug} />

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
              <div className="rounded-lg border border-slate-800 bg-slate-950/82 p-4">
                <div className="mb-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Sweep Ladder</h2>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                        Sweep cost means the estimated total cost to buy every listed NFT below the selected target floor.
                      </p>
                    </div>
                    <button
                      className="inline-flex h-10 items-center justify-center rounded-md border border-slate-700 px-3 text-sm text-slate-200 transition hover:border-cyan-400/50"
                      onClick={resetToSmartTargets}
                      type="button"
                    >
                      Reset smart targets
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <button
                          className={`rounded-md border px-3 py-1.5 text-sm transition ${
                            targetMode === "custom"
                              ? "border-cyan-300 bg-cyan-300 text-slate-950"
                              : "border-slate-700 text-slate-300 hover:border-cyan-400/50"
                          }`}
                          onClick={() => setTargetMode("custom")}
                          type="button"
                        >
                          Custom targets
                        </button>
                        <button
                          className={`rounded-md border px-3 py-1.5 text-sm transition ${
                            targetMode === "range"
                              ? "border-cyan-300 bg-cyan-300 text-slate-950"
                              : "border-slate-700 text-slate-300 hover:border-cyan-400/50"
                          }`}
                          onClick={() => setTargetMode("range")}
                          type="button"
                        >
                          Range builder
                        </button>
                      </div>

                      {targetMode === "custom" ? (
                        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={addTargets}>
                          <input
                            className="h-10 min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                            inputMode="decimal"
                            onChange={(event) => setTargetInput(event.target.value)}
                            placeholder="0.002, 0.003, 0.1, 0.5, 1"
                            value={targetInput}
                          />
                          <button
                            className="inline-flex h-10 items-center justify-center rounded-md border border-cyan-400/30 px-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300"
                            type="submit"
                          >
                            Add targets
                          </button>
                        </form>
                      ) : (
                        <form className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={applyRange}>
                          <input
                            className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                            inputMode="decimal"
                            onChange={(event) => setRangeStart(event.target.value)}
                            placeholder="Start"
                            value={rangeStart}
                          />
                          <input
                            className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                            inputMode="decimal"
                            onChange={(event) => setRangeEnd(event.target.value)}
                            placeholder="End"
                            value={rangeEnd}
                          />
                          <input
                            className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                            inputMode="decimal"
                            onChange={(event) => setRangeStep(event.target.value)}
                            placeholder="Step"
                            value={rangeStep}
                          />
                          <button
                            className="inline-flex h-10 items-center justify-center rounded-md border border-cyan-400/30 px-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300"
                            type="submit"
                          >
                            Apply range
                          </button>
                        </form>
                      )}

                      {targetError ? (
                        <p className="mt-2 text-sm text-red-200">{targetError}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          Quick target
                        </span>
                        {quickTargets.map((target) => (
                          <button
                            className="rounded-md border border-slate-700 px-3 py-1.5 font-mono text-xs text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-100"
                            key={target}
                            onClick={() => saveTargets([...activeTargets, target])}
                            type="button"
                          >
                            {target} ETH
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-md border border-cyan-400/20 bg-cyan-400/8 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Next target</p>
                      {nextMeaningfulTarget ? (
                        <div className="mt-2 grid gap-1 text-sm">
                          <p className="font-mono text-lg font-semibold text-white">
                            <EthUsdValue
                              ethUsd={activeEthUsd}
                              label="Next target floor"
                              showInlineUsd
                              value={nextMeaningfulTarget.targetFloor}
                            />
                          </p>
                          <p className="font-mono text-cyan-100">
                            <EthUsdValue
                              ethUsd={activeEthUsd}
                              label="Next target cost"
                              value={nextMeaningfulTarget.costEth}
                            />
                          </p>
                          <p className="font-mono text-slate-300">{formatUsd(nextMeaningfulTarget.costUsd)}</p>
                          <p className="text-slate-400">{nextMeaningfulTarget.itemsToSweep} items</p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">No higher target selected.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {visibleTargets.length ? (
                      visibleTargets.map((target) => (
                        <button
                          className="rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 font-mono text-xs text-slate-200 transition hover:border-red-300/50 hover:text-red-100"
                          key={target}
                          onClick={() => removeTarget(target)}
                          type="button"
                        >
                          <EthUsdValue ethUsd={activeEthUsd} label="Target floor" showInlineUsd value={target} />
                        </button>
                      ))
                    ) : (
                      <span className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-400">
                        Smart targets active
                      </span>
                    )}
                  </div>
                  <div className="grid gap-3 rounded-md border border-slate-800 bg-slate-950/70 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <label className="text-sm text-slate-300">
                      Filter min target floor
                      <input
                        className="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                        inputMode="decimal"
                        onChange={(event) => setFilterMin(event.target.value)}
                        placeholder="0.001"
                        value={filterMin}
                      />
                    </label>
                    <label className="text-sm text-slate-300">
                      Filter max target floor
                      <input
                        className="mt-2 h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                        inputMode="decimal"
                        onChange={(event) => setFilterMax(event.target.value)}
                        placeholder="0.05"
                        value={filterMax}
                      />
                    </label>
                    <button
                      className="inline-flex h-10 items-center justify-center rounded-md border border-slate-700 px-3 text-sm text-slate-200 transition hover:border-cyan-400/50"
                      onClick={() => {
                        setFilterMin("");
                        setFilterMax("");
                      }}
                      type="button"
                    >
                      Clear filter
                    </button>
                  </div>
                </div>
                {primaryCoverage ? (
                  <p className="mt-3 rounded-md border border-emerald-400/20 bg-emerald-400/8 px-3 py-2 text-sm text-emerald-100">
                    Tracked wallet balance can cover{" "}
                    {Math.round(primaryCoverage.coverage * 100)}% of cost to{" "}
                    <EthUsdValue
                      ethUsd={activeEthUsd}
                      label="Coverage target floor"
                      showInlineUsd
                      value={primaryCoverage.targetFloor}
                    />
                    .
                  </p>
                ) : null}
                {ladder.length > 0 ? (
                  <SweepLadderTable
                    ethUsd={activeEthUsd}
                    ladder={ladder}
                    treasuryBalanceEth={treasuryBalanceEth}
                  />
                ) : (
                  <div className="rounded-md border border-dashed border-slate-700 p-5 text-sm text-slate-400">
                    No higher target selected.
                  </div>
                )}
              </div>

              <BidSupportCard collection={data.collection} ethUsd={activeEthUsd} risk={data.risk} />
            </section>

            <CreatorActivityCard data={data} ethUsd={activeEthUsd} />
            <HolderAnalysisCard data={data} ethUsd={activeEthUsd} />

            <section className="grid gap-6 xl:grid-cols-2">
              <SweepCostChart data={ladder} />
              <ListingDistributionChart data={data.listingDistribution} />
            </section>

            <ActivityTable slug={slug} />

            <TrackedWalletsPanel
              addWallet={(wallet) => {
                if (!watchlistItem) {
                  upsertItem({
                    imageUrl: data.collection.imageUrl,
                    name: data.collection.name,
                    slug,
                    targetFloors: activeTargets,
                  });
                }
                addWallet(slug, wallet);
              }}
              ethUsd={activeEthUsd ?? data.ethUsd}
              onWalletData={handleWalletData}
              removeWallet={(address) => removeWallet(slug, address)}
              wallets={activeItem.devWallets}
            />

            <EthUsdConverter
              ethUsd={liveEthPrice.priceUsd ?? data.ethUsd}
              lastUpdated={liveEthPrice.lastUpdated ?? data.lastUpdated}
              source={liveEthPrice.source}
            />
          </>
        ) : null}

        <div className="pb-4 text-center text-xs text-slate-500">
          <Link className="text-cyan-200 hover:text-cyan-100" href="/">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

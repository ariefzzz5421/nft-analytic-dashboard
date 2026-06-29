"use client";

import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { MarketAssetPrice, MarketPricesResponse } from "@/lib/types";

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    const startValue = displayRef.current;
    const delta = value - startValue;
    const duration = 700;
    const startedAt = performance.now();
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const nextValue = startValue + delta * progress;
      displayRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span>${formatNumber(displayValue, 2)}</span>;
}

function PricePill({ asset }: { asset: MarketAssetPrice }) {
  const positive = (asset.change24h ?? 0) >= 0;
  const hasPrice = asset.priceUsd > 0;

  return (
    <div className="inline-flex items-center gap-2 whitespace-nowrap rounded border border-slate-800 bg-slate-950/60 px-2.5 py-1">
      <span className="font-semibold text-slate-100">{asset.symbol}</span>
      <span className="font-mono text-cyan-100 tabular-nums">
        {hasPrice ? <AnimatedNumber value={asset.priceUsd} /> : "Unavailable"}
      </span>
      {hasPrice && asset.change24h !== null ? (
        <span className={`font-mono text-xs ${positive ? "text-emerald-300" : "text-red-300"}`}>
          {positive ? "+" : ""}
          {formatNumber(asset.change24h, 2)}%
        </span>
      ) : null}
    </div>
  );
}

export function MarketTicker() {
  const [prices, setPrices] = useState<MarketPricesResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPrices() {
      try {
        const response = await fetch("/api/market/prices");
        const payload = (await response.json()) as MarketPricesResponse;

        if (!cancelled) {
          setPrices(payload);
        }
      } catch {
        if (!cancelled) {
          setPrices(null);
        }
      }
    }

    void loadPrices();
    const interval = window.setInterval(loadPrices, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const assets = prices?.assets ?? [];
  const tickerLabel = assets.length
    ? assets.map((asset) => asset.symbol).join("/")
    : "BTC/ETH/HYPE/BNB/SOL";

  return (
    <div className="border-t border-slate-900/80 bg-slate-950/70">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-4 py-1.5 sm:px-6 lg:px-8">
        <div className="inline-flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-600">
          <Activity size={14} aria-hidden="true" />
          Market
        </div>
        <div
          aria-label={`Running prices for ${tickerLabel}`}
          className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]"
        >
          <div className="price-tape-track flex w-max gap-3 will-change-transform hover:[animation-play-state:paused]">
            {assets.length > 0 ? (
              assets.map((asset) => <PricePill asset={asset} key={asset.symbol} />)
            ) : (
              <div className="rounded-md border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-400">
                Loading BTC/ETH/HYPE/BNB/SOL prices...
              </div>
            )}
          </div>
        </div>
        {prices ? (
          <span className="hidden shrink-0 text-[11px] text-slate-600 lg:inline">
            source: {prices.source}
          </span>
        ) : null}
      </div>
    </div>
  );
}

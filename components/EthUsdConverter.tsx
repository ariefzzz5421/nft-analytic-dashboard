"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDateTime, formatNumber } from "@/lib/format";

type EthUsdConverterProps = {
  ethUsd: number | null | undefined;
  lastUpdated?: string | null;
  source?: string;
};

export function EthUsdConverter({ ethUsd, lastUpdated, source = "market" }: EthUsdConverterProps) {
  const [amount, setAmount] = useState("1");
  const priceAvailable = typeof ethUsd === "number" && Number.isFinite(ethUsd) && ethUsd > 0;
  const parsedAmount = useMemo(() => {
    const normalized = amount.trim().replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }, [amount]);
  const usdValue = priceAvailable && parsedAmount !== null ? parsedAmount * ethUsd : null;

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    setAmount(event.target.value);
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/82 p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal text-white">Konverter ETH</h2>
            <p className="mt-1 text-sm text-slate-400">
              Live ETH price: {priceAvailable ? `$${formatNumber(ethUsd, 2)}` : "unavailable"}
              {source ? ` from ${source}` : ""}
            </p>
          </div>
          {lastUpdated ? (
            <p className="text-xs text-slate-500">Updated {formatDateTime(lastUpdated)}</p>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-950">
          <div className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-200 px-4 sm:px-5">
            <input
              aria-label="ETH amount"
              className="min-w-0 bg-transparent font-mono text-2xl text-slate-950 outline-none placeholder:text-slate-300"
              inputMode="decimal"
              onChange={handleAmountChange}
              placeholder="0.0025"
              value={amount}
            />
            <span className="font-mono text-xl text-slate-500">ETH</span>
          </div>
          <div className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-5">
            <p className="min-w-0 truncate font-mono text-2xl text-slate-950">
              {usdValue !== null ? formatNumber(usdValue, 2) : "Unknown"}
            </p>
            <span className="inline-flex items-center gap-1 font-mono text-xl text-slate-500">
              USD <ChevronDown size={20} aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

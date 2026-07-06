"use client";

import { formatEth, formatNumber, formatUsd } from "@/lib/format";

type EthUsdValueProps = {
  className?: string;
  ethUsd: number | null | undefined;
  fallback?: string;
  label?: string;
  value: number | null | undefined;
};

export function EthUsdValue({
  className = "",
  ethUsd,
  fallback = "Unknown",
  label = "ETH value",
  value,
}: EthUsdValueProps) {
  const hasEth = typeof value === "number" && Number.isFinite(value);
  const hasPrice = typeof ethUsd === "number" && Number.isFinite(ethUsd) && ethUsd > 0;
  const usdValue = hasEth && hasPrice ? value * ethUsd : null;
  const ariaLabel =
    hasEth && usdValue !== null
      ? `${label}: ${formatEth(value)} equals ${formatUsd(usdValue)}`
      : `${label}: ${formatEth(value, fallback)}`;

  return (
    <span
      aria-label={ariaLabel}
      className={`group relative inline-flex w-fit cursor-help items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 ${className}`}
      tabIndex={hasEth ? 0 : undefined}
    >
      <span className="tabular-nums">{formatEth(value, fallback)}</span>
      {hasEth ? (
        <span
          className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-md border border-cyan-400/25 bg-slate-950 px-3 py-2 text-left text-xs font-normal text-slate-100 opacity-0 shadow-2xl shadow-cyan-950/30 transition duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
          role="tooltip"
        >
          <span className="block font-mono text-cyan-100">{usdValue !== null ? formatUsd(usdValue) : "USD unavailable"}</span>
          <span className="mt-1 block text-slate-400">
            ETH/USD {hasPrice ? `$${formatNumber(ethUsd, 2)}` : "unavailable"}
          </span>
        </span>
      ) : null}
    </span>
  );
}

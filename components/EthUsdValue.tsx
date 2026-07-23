"use client";

import { formatNative, formatNumber, formatUsd } from "@/lib/format";

type EthUsdValueProps = {
  className?: string;
  ethUsd: number | null | undefined;
  fallback?: string;
  label?: string;
  showInlineUsd?: boolean;
  symbol?: string;
  value: number | null | undefined;
};

export function EthUsdValue({
  className = "",
  ethUsd,
  fallback = "Unknown",
  label = "ETH value",
  showInlineUsd = false,
  symbol = "ETH",
  value,
}: EthUsdValueProps) {
  const hasEth = typeof value === "number" && Number.isFinite(value);
  const hasPrice = typeof ethUsd === "number" && Number.isFinite(ethUsd) && ethUsd > 0;
  const usdValue = hasEth && hasPrice ? value * ethUsd : null;
  const ariaLabel =
    hasEth && usdValue !== null
      ? `${label}: ${formatNative(value, symbol)} equals ${formatUsd(usdValue)}`
      : `${label}: ${formatNative(value, symbol, fallback)}`;

  return (
    <span
      aria-label={ariaLabel}
      className={`eth-usd-value group relative inline-flex w-fit cursor-help items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 ${className}`}
      tabIndex={hasEth ? 0 : undefined}
    >
      <span className="tabular-nums">
        {formatNative(value, symbol, fallback)}
        {showInlineUsd && usdValue !== null ? (
          <span className="text-slate-400"> ({formatUsd(usdValue)})</span>
        ) : null}
      </span>
      {hasEth ? (
        <span
          className="eth-usd-value__tooltip"
          role="tooltip"
        >
          <span className="block font-mono text-cyan-100">{usdValue !== null ? formatUsd(usdValue) : "USD unavailable"}</span>
          <span className="mt-1 block text-slate-400">
            {symbol}/USD {hasPrice ? `$${formatNumber(ethUsd, 2)}` : "unavailable"}
          </span>
        </span>
      ) : null}
    </span>
  );
}

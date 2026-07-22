"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { TokenLogo } from "@/components/TokenLogo";
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
    <section className="converter-band">
      <div className="converter-band__copy">
        <div className="converter-band__title">
          <TokenLogo className="h-8 w-8" symbol="ETH" />
          <div>
            <h2>ETH converter</h2>
            <p>
              Live ETH price: {priceAvailable ? `$${formatNumber(ethUsd, 2)}` : "unavailable"}
              {source ? ` from ${source}` : ""}
            </p>
          </div>
        </div>
        {lastUpdated ? <span>Updated {formatDateTime(lastUpdated)}</span> : null}
      </div>

      <div className="converter-band__fields">
          <label className="converter-field">
            <span className="sr-only">ETH amount</span>
            <input
              aria-label="ETH amount"
              className="converter-field__input"
              inputMode="decimal"
              onChange={handleAmountChange}
              placeholder="0.0025"
              value={amount}
            />
            <strong>ETH</strong>
          </label>
          <div className="converter-field converter-field--output" aria-live="polite">
            <p>
              {usdValue !== null ? formatNumber(usdValue, 2) : "Unknown"}
            </p>
            <strong>USD</strong>
          </div>
      </div>
    </section>
  );
}

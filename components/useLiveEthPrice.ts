"use client";

import { useEffect, useState } from "react";
import type { MarketPricesResponse } from "@/lib/types";

type LiveEthPrice = {
  lastUpdated: string | null;
  loading: boolean;
  priceUsd: number | null;
  source: string;
};

function readEthPrice(payload: MarketPricesResponse) {
  return payload.assets.find((asset) => asset.symbol === "ETH" && asset.priceUsd > 0) ?? null;
}

export function useLiveEthPrice(initialPriceUsd: number | null | undefined = null) {
  const [price, setPrice] = useState<LiveEthPrice>({
    lastUpdated: null,
    loading: true,
    priceUsd:
      typeof initialPriceUsd === "number" && Number.isFinite(initialPriceUsd) && initialPriceUsd > 0
        ? initialPriceUsd
        : null,
    source: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPrice() {
      try {
        const response = await fetch("/api/market/prices");
        const payload = (await response.json()) as MarketPricesResponse;
        const eth = readEthPrice(payload);

        if (cancelled) {
          return;
        }

        setPrice((current) => ({
          lastUpdated: eth?.lastUpdated ?? payload.lastUpdated ?? current.lastUpdated,
          loading: false,
          priceUsd: eth?.priceUsd ?? current.priceUsd,
          source: eth?.source ?? payload.source ?? current.source,
        }));
      } catch {
        if (cancelled) {
          return;
        }

        setPrice((current) => ({
          ...current,
          loading: false,
          source: current.priceUsd ? "fallback" : "unavailable",
        }));
      }
    }

    void loadPrice();
    const interval = window.setInterval(loadPrice, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return price;
}

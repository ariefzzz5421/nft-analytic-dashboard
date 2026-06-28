import type { OpenSeaRefreshPolicy } from "@/lib/types";

export const OPENSEA_REFRESH_POLICY: OpenSeaRefreshPolicy = {
  cacheSeconds: 45,
  defaultRefreshSeconds: 60,
  minRefreshSeconds: 30,
  note:
    "OpenSea rate limits are enforced server-side. The dashboard uses server caching and conservative refresh intervals; if OpenSea returns 429, wait for the Retry-After window.",
  recommendedRefreshSeconds: [0, 30, 60, 120, 300],
  source: "OpenSea API v2",
};

const REFRESH_STORAGE_KEY = "nft-analytic-refresh-seconds:v1";

export function readRefreshSeconds() {
  if (typeof window === "undefined") {
    return OPENSEA_REFRESH_POLICY.defaultRefreshSeconds;
  }

  const raw = window.localStorage.getItem(REFRESH_STORAGE_KEY);
  const value = raw ? Number(raw) : OPENSEA_REFRESH_POLICY.defaultRefreshSeconds;
  return Number.isFinite(value) && value >= 0
    ? value
    : OPENSEA_REFRESH_POLICY.defaultRefreshSeconds;
}

export function writeRefreshSeconds(value: number) {
  window.localStorage.setItem(REFRESH_STORAGE_KEY, String(value));
  window.dispatchEvent(new Event("refresh-rate-updated"));
}

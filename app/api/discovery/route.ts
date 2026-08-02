import { NextResponse } from "next/server";
import { normalizeCollectionLeaderboard } from "@/lib/discovery";
import {
  fetchTopCollections,
  fetchTrendingCollections,
  OpenSeaApiError,
} from "@/lib/opensea";
import type { CollectionDiscoveryResponse } from "@/lib/types";

export const revalidate = 60;

function readFailure(reason: unknown, label: string) {
  if (reason instanceof OpenSeaApiError) return `${label}: ${reason.message}`;
  if (reason instanceof Error) return `${label}: ${reason.message}`;
  return `${label}: OpenSea request failed.`;
}

export async function GET() {
  const [topResult, trendingResult] = await Promise.allSettled([
    fetchTopCollections(20),
    fetchTrendingCollections(20),
  ]);
  const warnings: string[] = [];

  if (topResult.status === "rejected") warnings.push(readFailure(topResult.reason, "Top collections"));
  if (trendingResult.status === "rejected") {
    warnings.push(readFailure(trendingResult.reason, "Trending collections"));
  }

  const payload: CollectionDiscoveryResponse = {
    lastUpdated: new Date().toISOString(),
    refreshSeconds: 60,
    source: "opensea",
    top:
      topResult.status === "fulfilled"
        ? normalizeCollectionLeaderboard(topResult.value)
        : [],
    trending:
      trendingResult.status === "fulfilled"
        ? normalizeCollectionLeaderboard(trendingResult.value)
        : [],
    warnings,
  };

  const status = payload.top.length > 0 || payload.trending.length > 0 ? 200 : 502;

  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

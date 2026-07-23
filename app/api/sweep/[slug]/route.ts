import { NextRequest, NextResponse } from "next/server";
import { getChainConfig, parseSupportedChain, type SupportedChain } from "@/lib/chains";
import {
  fetchAllCollectionOffers,
  fetchAllListings,
  fetchCollection,
  fetchCollectionStats,
  getApeUsdFallback,
  getEthUsdFallback,
  OpenSeaApiError,
} from "@/lib/opensea";
import { normalizeListings, normalizeOfferPrice } from "@/lib/normalize";
import { OPENSEA_REFRESH_POLICY } from "@/lib/refresh";
import { fetchMarketPrices } from "@/lib/server/market";
import { extractSlug } from "@/lib/slug";
import {
  buildRiskSummary,
  calculateListingDistribution,
  calculateSweepLadder,
  dedupeCheapestPerToken,
  generateSmartTargets,
  isSuspiciousOffer,
} from "@/lib/sweep";
import type { CollectionSummaryData, SweepApiResponse } from "@/lib/types";

export const revalidate = 45;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readPath(value: unknown, path: Array<string | number>) {
  return path.reduce<unknown>((current, key) => {
    if (typeof key === "number") {
      return Array.isArray(current) ? current[key] : undefined;
    }

    return isRecord(current) ? current[key] : undefined;
  }, value);
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function firstNumber(source: unknown, paths: Array<Array<string | number>>) {
  for (const path of paths) {
    const value = readNumber(readPath(source, path));

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function firstString(source: unknown, paths: Array<Array<string | number>>) {
  for (const path of paths) {
    const value = readString(readPath(source, path));

    if (value) {
      return value;
    }
  }

  return null;
}

function unwrapCollection(payload: unknown) {
  return isRecord(payload) && isRecord(payload.collection) ? payload.collection : payload;
}

function find24hVolume(stats: unknown) {
  const direct = firstNumber(stats, [
    ["one_day_volume"],
    ["volume_24h"],
    ["stats", "one_day_volume"],
  ]);

  if (direct !== null) {
    return direct;
  }

  const intervals = readPath(stats, ["intervals"]);

  if (!Array.isArray(intervals)) {
    return null;
  }

  const oneDay = intervals.find((interval) => {
    const label =
      firstString(interval, [["interval"], ["label"], ["period"]])?.toLowerCase() ?? "";
    return ["one_day", "1d", "24h", "day"].includes(label);
  });

  return firstNumber(oneDay, [["volume"], ["volume_change"], ["total_volume"]]);
}

function normalizeAddress(value: string | null) {
  return value && /^0x[a-fA-F0-9]{40}$/.test(value) ? value.toLowerCase() : null;
}

function buildCreatorSummary(collection: unknown) {
  const explicitCreator =
    normalizeAddress(
      firstString(collection, [
        ["creator", "address"],
        ["creator_address"],
        ["creatorAddress"],
        ["created_by", "address"],
        ["createdBy", "address"],
      ]),
    ) ?? null;
  const owner =
    normalizeAddress(
      firstString(collection, [
        ["owner", "address"],
        ["owner"],
        ["primary_asset_contracts", 0, "owner"],
      ]),
    ) ?? null;
  const contractAddress = normalizeAddress(
    firstString(collection, [
      ["primary_asset_contracts", 0, "address"],
      ["contracts", 0, "address"],
      ["contract", "address"],
      ["address"],
    ]),
  );
  const address = explicitCreator ?? owner;

  return {
    address,
    contractAddress,
    source: explicitCreator ? "OpenSea creator" : owner ? "OpenSea owner" : null,
  };
}

function buildCollectionSummary({
  collectionPayload,
  floorFromListings,
  listingsCount,
  statsPayload,
  topOffer,
}: {
  collectionPayload: unknown;
  floorFromListings: number | null;
  listingsCount: number;
  statsPayload: unknown;
  topOffer: number | null;
}): CollectionSummaryData {
  const collection = unwrapCollection(collectionPayload);
  const name =
    firstString(collection, [["name"], ["collection"], ["display_name"]]) ?? "Unknown collection";
  const imageUrl = firstString(collection, [["image_url"], ["imageUrl"], ["banner_image_url"]]);
  const supply = firstNumber(collection, [
    ["total_supply"],
    ["totalSupply"],
    ["stats", "total_supply"],
    ["stats", "count"],
  ]);
  const floor =
    firstNumber(statsPayload, [
      ["total", "floor_price"],
      ["total", "floor"],
      ["floor_price"],
      ["stats", "floor_price"],
    ]) ?? floorFromListings;
  const owners = firstNumber(statsPayload, [
    ["total", "num_owners"],
    ["total", "owners"],
    ["num_owners"],
    ["owners"],
  ]);
  const totalVolume = firstNumber(statsPayload, [
    ["total", "volume"],
    ["total_volume"],
    ["stats", "total_volume"],
  ]);
  const listedPercentage =
    supply !== null && supply > 0 ? Number(((listingsCount / supply) * 100).toFixed(2)) : null;

  return {
    creator: buildCreatorSummary(collection),
    floor,
    imageUrl,
    listedCount: listingsCount,
    listedPercentage,
    name,
    owners,
    supply,
    topOffer,
    totalVolume,
    volume24h: find24hVolume(statsPayload),
  };
}

function findStatsFloor(statsPayload: unknown) {
  return firstNumber(statsPayload, [
    ["total", "floor_price"],
    ["total", "floor"],
    ["floor_price"],
    ["stats", "floor_price"],
  ]);
}

function readLiveNativeUsd(
  prices: Awaited<ReturnType<typeof fetchMarketPrices>>,
  chain: SupportedChain,
) {
  const symbol = getChainConfig(chain).nativeSymbol;
  const asset = prices.assets.find((candidate) => candidate.symbol === symbol && candidate.priceUsd > 0);

  if (asset?.priceUsd) {
    return asset.priceUsd;
  }

  return chain === "ape_chain" ? getApeUsdFallback() : getEthUsdFallback();
}

function buildSanityWarnings({
  floor,
  floorFromListings,
  listedPercentage,
  listingsCount,
  normalizedOfferCount,
  rawOfferCount,
  sweepLadder,
  topOffer,
}: {
  floor: number | null;
  floorFromListings: number | null;
  listedPercentage: number | null;
  listingsCount: number;
  normalizedOfferCount: number;
  rawOfferCount: number;
  sweepLadder: ReturnType<typeof calculateSweepLadder>;
  topOffer: number | null;
}) {
  const warnings: string[] = [];

  if (isSuspiciousOffer(topOffer, floor)) {
    warnings.push(
      "Top offer looks unusually higher than floor. Check offer normalization or currency parsing.",
    );
  }

  if (topOffer !== null && floor !== null && floor > 0 && topOffer / floor < 0.5) {
    warnings.push("Bid/floor ratio is below 0.5. Floor may have weak exit liquidity.");
  }

  if (floor === null) {
    warnings.push("OpenSea floor is missing. Use listing-derived depth carefully.");
  }

  if (listingsCount === 0) {
    warnings.push("No active native-currency listings found.");
  }

  if (
    (listedPercentage !== null && listedPercentage >= 20) ||
    (listedPercentage === null && listingsCount >= 1000)
  ) {
    warnings.push("Listing count is high. Sweeping may need more capital than the headline floor implies.");
  }

  if (rawOfferCount > 0 && normalizedOfferCount === 0) {
    warnings.push("Offer currency may be unsupported, so bid support can be incomplete.");
  }

  if (floor !== null && floorFromListings !== null && floor > 0) {
    const delta = Math.abs(floor - floorFromListings) / floor;

    if (delta > 0.4) {
      warnings.push("OpenSea stats and listing-derived floor disagree heavily.");
    }
  }

  for (const row of sweepLadder) {
    if (floor !== null && floor < row.targetFloor && row.costEth === 0) {
      warnings.push(
        `Cost to ${row.targetFloor} ETH is 0 while current floor is below target. Refresh and verify listing data.`,
      );
      break;
    }
  }

  return warnings;
}

function jsonError(error: string, status: number, details?: string) {
  return NextResponse.json(
    { details, error },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status,
    },
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug: routeSlug } = await context.params;
  const slug = extractSlug(routeSlug);
  const chain = parseSupportedChain(request.nextUrl.searchParams.get("chain"));
  const chainConfig = getChainConfig(chain);

  if (!slug) {
    return jsonError("Collection slug is invalid.", 400);
  }

  try {
    const [collectionPayload, statsPayload, rawListings, marketPrices] = await Promise.all([
      fetchCollection(slug),
      fetchCollectionStats(slug),
      fetchAllListings(slug),
      fetchMarketPrices(),
    ]);

    let rawOffers: unknown[] = [];

    try {
      rawOffers = await fetchAllCollectionOffers(slug);
    } catch {
      rawOffers = [];
    }

    const listings = dedupeCheapestPerToken(normalizeListings(rawListings, chain));
    const normalizedOfferPrices = rawOffers
      .map((offer) => normalizeOfferPrice(offer, chain))
      .filter((price): price is number => price !== null);
    const topOffer = normalizedOfferPrices.sort((left, right) => right - left)[0] ?? null;
    const floorFromListings = listings[0]?.priceEth ?? null;
    const statsFloor = findStatsFloor(statsPayload);
    const collection = buildCollectionSummary({
      collectionPayload,
      floorFromListings,
      listingsCount: listings.length,
      statsPayload,
      topOffer,
    });
    const collectionWithFloor = {
      ...collection,
      floor: statsFloor ?? floorFromListings,
    };
    const nativeUsd = readLiveNativeUsd(marketPrices, chain);
    const smartTargets = generateSmartTargets(collectionWithFloor.floor ?? 0);
    const sweepLadder = calculateSweepLadder(
      listings,
      smartTargets,
      nativeUsd,
      collectionWithFloor.floor,
    );
    const response: SweepApiResponse = {
      chain,
      collection: collectionWithFloor,
      ethUsd: nativeUsd,
      lastUpdated: new Date().toISOString(),
      listingDistribution: calculateListingDistribution(listings),
      listings,
      nativeCurrency: {
        symbol: chainConfig.nativeSymbol,
        wrappedSymbol: chainConfig.wrappedSymbol,
      },
      nativeUsd,
      refreshPolicy: OPENSEA_REFRESH_POLICY,
      risk: buildRiskSummary({
        floor: collectionWithFloor.floor,
        listedPercentage: collectionWithFloor.listedPercentage,
        listings,
        topOffer,
      }),
      sanityWarnings: buildSanityWarnings({
        floor: collectionWithFloor.floor,
        floorFromListings,
        listedPercentage: collectionWithFloor.listedPercentage,
        listingsCount: listings.length,
        normalizedOfferCount: normalizedOfferPrices.length,
        rawOfferCount: rawOffers.length,
        sweepLadder,
        topOffer,
      }),
      slug,
      sweepLadder,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=30",
      },
    });
  } catch (cause) {
    if (cause instanceof OpenSeaApiError) {
      return jsonError(cause.message, cause.status);
    }

    return jsonError(
      "Unable to analyze this collection right now.",
      500,
      cause instanceof Error ? cause.message : undefined,
    );
  }
}

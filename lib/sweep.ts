import type {
  ListingDistributionBucket,
  NormalizedListing,
  RiskSummary,
  SweepLadderRow,
} from "@/lib/types";

export const DEFAULT_TARGET_FLOORS = [0.0005, 0.001, 0.005, 0.01, 0.05, 0.1];

const WARNINGS = [
  "Higher floor does not guarantee exit liquidity.",
  "Floor without bid support may be floor theater.",
  "Listings can change quickly. Refresh before making decisions.",
  "This dashboard does not execute trades.",
];

function round(value: number, decimals: number) {
  return Number(value.toFixed(decimals));
}

export function dedupeCheapestPerToken(listings: NormalizedListing[]) {
  const cheapest = new Map<string, NormalizedListing>();

  for (const listing of listings) {
    const existing = cheapest.get(listing.tokenId);

    if (!existing || listing.priceEth < existing.priceEth) {
      cheapest.set(listing.tokenId, listing);
    }
  }

  return [...cheapest.values()].sort((left, right) => left.priceEth - right.priceEth);
}

export function calculateSweepLadder(
  listings: NormalizedListing[],
  targets: number[],
  ethUsd: number,
): SweepLadderRow[] {
  const sortedTargets = [...new Set(targets)]
    .filter((target) => Number.isFinite(target) && target > 0)
    .sort((left, right) => left - right);

  return sortedTargets.map((targetFloor) => {
    const listingsBelowTarget = listings.filter((listing) => listing.priceEth < targetFloor);
    const costEth = listingsBelowTarget.reduce((total, listing) => total + listing.priceEth, 0);
    const avgPriceEth = listingsBelowTarget.length > 0 ? costEth / listingsBelowTarget.length : 0;

    return {
      avgPriceEth: round(avgPriceEth, 8),
      costEth: round(costEth, 8),
      costUsd: round(costEth * ethUsd, 2),
      itemsToSweep: listingsBelowTarget.length,
      targetFloor,
    };
  });
}

export function calculateListingDistribution(
  listings: NormalizedListing[],
): ListingDistributionBucket[] {
  const buckets = [
    { bucket: "<0.0005", max: 0.0005, min: 0 },
    { bucket: "0.0005-0.001", max: 0.001, min: 0.0005 },
    { bucket: "0.001-0.005", max: 0.005, min: 0.001 },
    { bucket: "0.005-0.01", max: 0.01, min: 0.005 },
    { bucket: "0.01-0.05", max: 0.05, min: 0.01 },
    { bucket: ">0.05", max: Number.POSITIVE_INFINITY, min: 0.05 },
  ];

  return buckets.map((bucket) => {
    const bucketListings = listings.filter(
      (listing) => listing.priceEth >= bucket.min && listing.priceEth < bucket.max,
    );
    const totalEth = bucketListings.reduce((total, listing) => total + listing.priceEth, 0);

    return {
      bucket: bucket.bucket,
      count: bucketListings.length,
      totalEth: round(totalEth, 8),
    };
  });
}

export function getBidSupportLabel(bidFloorRatio: number | null) {
  if (bidFloorRatio === null || !Number.isFinite(bidFloorRatio)) {
    return "Unknown";
  }

  if (bidFloorRatio >= 0.9) {
    return "Very strong bid support";
  }

  if (bidFloorRatio >= 0.75) {
    return "Strong bid support";
  }

  if (bidFloorRatio >= 0.5) {
    return "Weak bid support";
  }

  return "Floor theater risk";
}

export function isSuspiciousOffer(topOffer: number | null, floor: number | null) {
  return topOffer !== null && floor !== null && floor > 0 && topOffer > floor * 3;
}

export function getPumpabilityLabel(listedPercentage: number | null) {
  if (listedPercentage === null || !Number.isFinite(listedPercentage)) {
    return "Unknown";
  }

  if (listedPercentage < 5) {
    return "Very pumpable";
  }

  if (listedPercentage < 10) {
    return "Pumpable";
  }

  if (listedPercentage < 20) {
    return "Medium";
  }

  return "Heavy";
}

export function getTreasuryCoverageLabel(coverage: number | null) {
  if (coverage === null || !Number.isFinite(coverage)) {
    return "Unknown";
  }

  if (coverage >= 2) {
    return "Strong coverage";
  }

  if (coverage >= 1) {
    return "Enough to sweep target";
  }

  if (coverage >= 0.5) {
    return "Partial coverage";
  }

  return "Not enough";
}

export function calculatePumpabilityScore({
  bidFloorRatio,
  costTo2xFloor,
  listedPercentage,
}: {
  bidFloorRatio: number | null;
  costTo2xFloor: number | null;
  listedPercentage: number | null;
}) {
  if (listedPercentage === null || !Number.isFinite(listedPercentage)) {
    return null;
  }

  let score = listedPercentage < 5 ? 90 : listedPercentage < 10 ? 75 : listedPercentage < 20 ? 55 : 30;

  if (bidFloorRatio !== null && Number.isFinite(bidFloorRatio)) {
    if (bidFloorRatio >= 0.9) {
      score += 8;
    } else if (bidFloorRatio < 0.5) {
      score -= 12;
    }
  }

  if (costTo2xFloor !== null && Number.isFinite(costTo2xFloor)) {
    if (costTo2xFloor > 25) {
      score -= 8;
    } else if (costTo2xFloor < 1) {
      score += 4;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildRiskSummary({
  floor,
  listings,
  listedPercentage,
  topOffer,
}: {
  floor: number | null;
  listings: NormalizedListing[];
  listedPercentage: number | null;
  topOffer: number | null;
}): RiskSummary {
  const bidFloorRatio =
    topOffer !== null && floor !== null && floor > 0 ? round(topOffer / floor, 4) : null;
  const target2xFloor = floor !== null && floor > 0 ? floor * 2 : null;
  const costTo2xFloor =
    target2xFloor === null
      ? null
      : listings
          .filter((listing) => listing.priceEth < target2xFloor)
          .reduce((total, listing) => total + listing.priceEth, 0);

  return {
    bidFloorRatio,
    bidSupportLabel: getBidSupportLabel(bidFloorRatio),
    pumpabilityLabel: getPumpabilityLabel(listedPercentage),
    pumpabilityScore: calculatePumpabilityScore({
      bidFloorRatio,
      costTo2xFloor,
      listedPercentage,
    }),
    warnings: WARNINGS,
  };
}

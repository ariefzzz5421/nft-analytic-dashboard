import type {
  CollectionHolder,
  HolderAnalysisData,
  HolderDistributionBucket,
} from "@/lib/types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readAddress(value: unknown) {
  if (!isRecord(value)) return null;
  const candidate = value.address ?? value.owner ?? value.wallet_address;
  return typeof candidate === "string" && /^0x[a-fA-F0-9]{40}$/.test(candidate)
    ? candidate.toLowerCase()
    : null;
}

function readQuantity(value: unknown) {
  if (!isRecord(value)) return null;
  const candidate = value.quantity ?? value.quantity_string ?? value.count;
  const quantity = typeof candidate === "number" ? candidate : Number(candidate);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}

function bucketFor(quantity: number) {
  if (quantity === 1) return "1 NFT";
  if (quantity <= 3) return "2-3 NFTs";
  if (quantity <= 9) return "4-9 NFTs";
  if (quantity <= 24) return "10-24 NFTs";
  return "25+ NFTs";
}

const bucketOrder = ["1 NFT", "2-3 NFTs", "4-9 NFTs", "10-24 NFTs", "25+ NFTs"];

export function buildHolderAnalysis({
  complete,
  holders,
  supply,
  totalHolders,
}: {
  complete: boolean;
  holders: unknown[];
  supply: number | null;
  totalHolders: number | null;
}): HolderAnalysisData {
  const normalized = holders
    .map((holder): CollectionHolder | null => {
      const address = readAddress(holder);
      const quantity = readQuantity(holder);

      if (!address || quantity === null) return null;

      return {
        address,
        quantity,
        supplyShare: supply && supply > 0 ? (quantity / supply) * 100 : null,
      };
    })
    .filter((holder): holder is CollectionHolder => Boolean(holder))
    .sort((left, right) => right.quantity - left.quantity);
  const distributionByBucket = new Map<string, HolderDistributionBucket>();

  for (const holder of normalized) {
    const bucket = bucketFor(holder.quantity);
    const current = distributionByBucket.get(bucket) ?? { bucket, holders: 0, nfts: 0 };
    current.holders += 1;
    current.nfts += holder.quantity;
    distributionByBucket.set(bucket, current);
  }

  return {
    complete,
    distribution: bucketOrder
      .map((bucket) => distributionByBucket.get(bucket) ?? { bucket, holders: 0, nfts: 0 })
      .filter((bucket) => bucket.holders > 0),
    fetchedHolders: normalized.length,
    topHolders: normalized.slice(0, 150),
    totalHolders,
  };
}

export function emptyHolderAnalysis(totalHolders: number | null): HolderAnalysisData {
  return {
    complete: false,
    distribution: [],
    fetchedHolders: 0,
    topHolders: [],
    totalHolders,
  };
}

export type SupportedCurrency = "ETH" | "WETH";

export type NormalizedListing = {
  tokenId: string;
  orderHash: string;
  priceEth: number;
  currency: SupportedCurrency;
  marketplace: "opensea";
};

export type SweepLadderRow = {
  targetFloor: number;
  itemsToSweep: number;
  costEth: number;
  costUsd: number;
  avgPriceEth: number;
};

export type OpenSeaRefreshPolicy = {
  cacheSeconds: number;
  defaultRefreshSeconds: number;
  minRefreshSeconds: number;
  recommendedRefreshSeconds: number[];
  source: string;
  note: string;
};

export type ListingDistributionBucket = {
  bucket: string;
  count: number;
  totalEth: number;
};

export type CollectionSummaryData = {
  name: string;
  imageUrl: string | null;
  supply: number | null;
  floor: number | null;
  topOffer: number | null;
  listedCount: number;
  listedPercentage: number | null;
  owners: number | null;
  volume24h: number | null;
  totalVolume: number | null;
};

export type RiskSummary = {
  bidFloorRatio: number | null;
  bidSupportLabel: string;
  pumpabilityScore: number | null;
  pumpabilityLabel: string;
  warnings: string[];
};

export type TrackedWallet = {
  address: string;
  label: string;
  notes?: string;
};

export type WatchlistItem = {
  slug: string;
  name?: string;
  imageUrl?: string | null;
  addedAt: string;
  notes?: string;
  targetFloors: number[];
  devWallets: TrackedWallet[];
};

export type WalletTransaction = {
  hash: string;
  from: string;
  to: string;
  valueEth: number;
  timestamp: string;
  direction: "in" | "out" | "self";
};

export type WalletApiResponse = {
  address: string;
  balanceEth: number;
  balanceUsd: number;
  txCount: number;
  lastTxAt: string | null;
  netEthFlow: number;
  recentTransactions: WalletTransaction[];
};

export type MarketSymbol = "BTC" | "ETH" | "HYPE" | "BNB" | "SOL";

export type MarketPriceSource = "coingecko" | "yahoo" | "fallback";

export type MarketAssetPrice = {
  symbol: MarketSymbol;
  name: string;
  priceUsd: number;
  change24h: number | null;
  lastUpdated: string | null;
  source: MarketPriceSource;
};

export type MarketPricesResponse = {
  assets: MarketAssetPrice[];
  source: MarketPriceSource | "mixed";
  lastUpdated: string;
};

export type SweepApiResponse = {
  slug: string;
  ethUsd: number;
  refreshPolicy: OpenSeaRefreshPolicy;
  collection: CollectionSummaryData;
  sweepLadder: SweepLadderRow[];
  listingDistribution: ListingDistributionBucket[];
  risk: RiskSummary;
  sanityWarnings: string[];
  listings: NormalizedListing[];
  lastUpdated: string;
};

export type ApiErrorResponse = {
  error: string;
  details?: string;
};

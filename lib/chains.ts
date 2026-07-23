export type SupportedChain = "ethereum" | "ape_chain";

export type NativeCurrencySymbol = "ETH" | "APE";

export type ChainConfig = {
  chainId: number;
  explorerName: string;
  explorerUrl: string;
  name: string;
  nativeSymbol: NativeCurrencySymbol;
  openSeaSlug: SupportedChain;
  shortName: string;
  wrappedSymbol: "WETH" | "WAPE";
};

export const CHAIN_CONFIGS: Record<SupportedChain, ChainConfig> = {
  ethereum: {
    chainId: 1,
    explorerName: "Etherscan",
    explorerUrl: "https://etherscan.io",
    name: "Ethereum",
    nativeSymbol: "ETH",
    openSeaSlug: "ethereum",
    shortName: "ETH",
    wrappedSymbol: "WETH",
  },
  ape_chain: {
    chainId: 33139,
    explorerName: "ApeScan",
    explorerUrl: "https://apescan.io",
    name: "ApeChain",
    nativeSymbol: "APE",
    openSeaSlug: "ape_chain",
    shortName: "APE",
    wrappedSymbol: "WAPE",
  },
};

export const SUPPORTED_CHAINS = Object.keys(CHAIN_CONFIGS) as SupportedChain[];

export function isSupportedChain(value: string | null | undefined): value is SupportedChain {
  return Boolean(value && value in CHAIN_CONFIGS);
}

export function parseSupportedChain(
  value: string | null | undefined,
  fallback: SupportedChain = "ethereum",
) {
  return isSupportedChain(value) ? value : fallback;
}

export function getChainConfig(chain: SupportedChain) {
  return CHAIN_CONFIGS[chain];
}

export function getAddressExplorerUrl(chain: SupportedChain, address: string) {
  return `${getChainConfig(chain).explorerUrl}/address/${address}`;
}

export function getTransactionExplorerUrl(chain: SupportedChain, hash: string) {
  return `${getChainConfig(chain).explorerUrl}/tx/${hash}`;
}

export function getCollectionHref(slug: string, chain: SupportedChain) {
  return `/collection/${encodeURIComponent(slug)}?chain=${encodeURIComponent(chain)}`;
}

export function getWatchlistKey(slug: string, chain: SupportedChain) {
  return `${chain}:${slug.toLowerCase()}`;
}

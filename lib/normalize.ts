import type { NormalizedListing, SupportedCurrency } from "@/lib/types";

type UnknownRecord = Record<string, unknown>;

const supportedCurrencies = new Set<SupportedCurrency>(["ETH", "WETH"]);

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readPath(value: unknown, path: Array<string | number>): unknown {
  return path.reduce<unknown>((current, key) => {
    if (typeof key === "number") {
      return Array.isArray(current) ? current[key] : undefined;
    }

    return isRecord(current) ? current[key] : undefined;
  }, value);
}

function readString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
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

function readCurrencySymbol(value: unknown) {
  if (typeof value === "string") {
    return value.toUpperCase();
  }

  if (isRecord(value)) {
    const symbol = readString(value.symbol) ?? readString(value.name);
    return symbol?.toUpperCase() ?? null;
  }

  return null;
}

function baseUnitsToNumber(value: string, decimals: number) {
  if (value.includes(".")) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const clean = value.replace(/^0+(?=\d)/, "");
  const normalized = clean || "0";

  if (decimals <= 0) {
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const padded = normalized.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  const decimal = fraction ? `${whole}.${fraction.slice(0, 18)}` : whole;
  const parsed = Number(decimal);

  return Number.isFinite(parsed) ? parsed : null;
}

function findTokenId(listing: unknown) {
  const paths: Array<Array<string | number>> = [
    ["protocol_data", "parameters", "offer", 0, "identifierOrCriteria"],
    ["protocol_data", "parameters", "offer", 0, "identifier_or_criteria"],
    ["protocolData", "parameters", "offer", 0, "identifierOrCriteria"],
    ["asset", "token_id"],
    ["asset", "identifier"],
    ["nft", "identifier"],
    ["nft", "token_id"],
    ["token", "id"],
    ["token_id"],
    ["tokenId"],
  ];

  for (const path of paths) {
    const tokenId = readString(readPath(listing, path));

    if (tokenId) {
      return tokenId;
    }
  }

  return null;
}

function findOrderHash(listing: unknown) {
  const paths: Array<Array<string | number>> = [
    ["order_hash"],
    ["orderHash"],
    ["hash"],
    ["protocol_data", "parameters", "orderHash"],
  ];

  for (const path of paths) {
    const orderHash = readString(readPath(listing, path));

    if (orderHash) {
      return orderHash;
    }
  }

  return "unknown";
}

function readPriceParts(value: unknown) {
  const priceCurrent = readPath(value, ["price", "current"]);
  const rawValue =
    readString(readPath(priceCurrent, ["value"])) ??
    readString(readPath(value, ["price", "value"])) ??
    readString(readPath(value, ["current_price"])) ??
    readString(readPath(value, ["base_price"]));

  const currency =
    readCurrencySymbol(readPath(priceCurrent, ["currency"])) ??
    readCurrencySymbol(readPath(value, ["price", "currency"])) ??
    readCurrencySymbol(readPath(value, ["payment_token", "symbol"]));

  const decimals =
    readNumber(readPath(priceCurrent, ["decimals"])) ??
    readNumber(readPath(value, ["price", "decimals"])) ??
    readNumber(readPath(value, ["payment_token", "decimals"])) ??
    18;

  return { currency, decimals, rawValue };
}

export function normalizeListing(listing: unknown): NormalizedListing | null {
  const tokenId = findTokenId(listing);
  const orderHash = findOrderHash(listing);
  const { currency, decimals, rawValue } = readPriceParts(listing);

  if (!tokenId || !rawValue || !currency || !supportedCurrencies.has(currency as SupportedCurrency)) {
    return null;
  }

  const priceEth = baseUnitsToNumber(rawValue, decimals);

  if (priceEth === null || priceEth <= 0) {
    return null;
  }

  return {
    currency: currency as SupportedCurrency,
    marketplace: "opensea",
    orderHash,
    priceEth,
    tokenId,
  };
}

export function normalizeOfferPrice(offer: unknown) {
  const { currency, decimals, rawValue } = readPriceParts(offer);

  if (!rawValue || !currency || !supportedCurrencies.has(currency as SupportedCurrency)) {
    return null;
  }

  const priceEth = baseUnitsToNumber(rawValue, decimals);
  return priceEth !== null && priceEth > 0 ? priceEth : null;
}

export function normalizeListings(listings: unknown[]) {
  return listings
    .map((listing) => normalizeListing(listing))
    .filter((listing): listing is NormalizedListing => Boolean(listing));
}

import { OPENSEA_REFRESH_POLICY } from "@/lib/refresh";

const OPENSEA_BASE_URL = "https://api.opensea.io/api/v2";
const PAGE_LIMIT = 200;
const MAX_PAGES = 100;

export class OpenSeaApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "OpenSeaApiError";
    this.status = status;
  }
}

function getApiKey() {
  const apiKey = process.env.OPENSEA_API_KEY;

  if (!apiKey) {
    throw new OpenSeaApiError(
      "Missing OPENSEA_API_KEY. Create .env.local and add OPENSEA_API_KEY=your_key_here.",
      500,
    );
  }

  return apiKey;
}

async function fetchOpenSea<T>(path: string): Promise<T> {
  const response = await fetch(`${OPENSEA_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "X-API-KEY": getApiKey(),
    },
    next: { revalidate: OPENSEA_REFRESH_POLICY.cacheSeconds },
  });

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      throw new OpenSeaApiError(
        retryAfter
          ? `OpenSea rate limit reached. Retry after ${retryAfter} seconds.`
          : "OpenSea rate limit reached. Wait before refreshing again.",
        429,
      );
    }

    if (response.status === 404) {
      throw new OpenSeaApiError("Collection slug was not found on OpenSea.", 404);
    }

    if (response.status === 401 || response.status === 403) {
      throw new OpenSeaApiError("OpenSea rejected the API key.", response.status);
    }

    throw new OpenSeaApiError(`OpenSea request failed with status ${response.status}.`, response.status);
  }

  return (await response.json()) as T;
}

function readArrayPayload(payload: unknown, key: string) {
  if (payload && typeof payload === "object" && key in payload) {
    const value = (payload as Record<string, unknown>)[key];
    return Array.isArray(value) ? value : [];
  }

  return [];
}

function readNextCursor(payload: unknown) {
  if (payload && typeof payload === "object" && "next" in payload) {
    const value = (payload as Record<string, unknown>).next;
    return typeof value === "string" && value.length > 0 ? value : null;
  }

  return null;
}

export function fetchCollection(slug: string) {
  return fetchOpenSea<unknown>(`/collections/${encodeURIComponent(slug)}`);
}

export function fetchCollectionStats(slug: string) {
  return fetchOpenSea<unknown>(`/collections/${encodeURIComponent(slug)}/stats`);
}

export async function fetchAllListings(slug: string) {
  const listings: unknown[] = [];
  let cursor: string | null = null;
  let page = 0;

  do {
    const params = new URLSearchParams({ limit: String(PAGE_LIMIT) });

    if (cursor) {
      params.set("next", cursor);
    }

    const payload = await fetchOpenSea<unknown>(
      `/listings/collection/${encodeURIComponent(slug)}/all?${params.toString()}`,
    );

    listings.push(...readArrayPayload(payload, "listings"));
    cursor = readNextCursor(payload);
    page += 1;
  } while (cursor && page < MAX_PAGES);

  return listings;
}

export async function fetchAllCollectionOffers(slug: string) {
  const offers: unknown[] = [];
  let cursor: string | null = null;
  let page = 0;

  do {
    const params = new URLSearchParams({ limit: String(PAGE_LIMIT) });

    if (cursor) {
      params.set("next", cursor);
    }

    const payload = await fetchOpenSea<unknown>(
      `/offers/collection/${encodeURIComponent(slug)}/all?${params.toString()}`,
    );

    offers.push(...readArrayPayload(payload, "offers"));
    cursor = readNextCursor(payload);
    page += 1;
  } while (cursor && page < MAX_PAGES);

  return offers;
}

export async function fetchCollectionEvents(slug: string, params: URLSearchParams) {
  return fetchOpenSea<unknown>(
    `/events/collection/${encodeURIComponent(slug)}?${params.toString()}`,
  );
}

export function getEthUsdFallback() {
  const value = Number(process.env.ETH_USD_FALLBACK ?? "1730");
  return Number.isFinite(value) && value > 0 ? value : 1730;
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_TARGET_FLOORS } from "@/lib/sweep";
import type { TrackedWallet, WatchlistItem } from "@/lib/types";
import {
  getWatchlistKey,
  parseSupportedChain,
  type SupportedChain,
} from "@/lib/chains";

const WATCHLIST_STORAGE_KEY = "nft-sweep-depth-watchlist:v1";

function normalizeItem(item: Partial<WatchlistItem> & { slug: string }): WatchlistItem {
  return {
    addedAt: item.addedAt ?? new Date().toISOString(),
    chain: parseSupportedChain(item.chain),
    contractAddress: item.contractAddress ?? null,
    devWallets: item.devWallets ?? [],
    imageUrl: item.imageUrl ?? null,
    name: item.name,
    notes: item.notes,
    slug: item.slug.trim(),
    targetFloors: item.targetFloors?.length ? item.targetFloors : DEFAULT_TARGET_FLOORS,
  };
}

function readWatchlist() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Partial<WatchlistItem> & { slug: string } => {
        return Boolean(item && typeof item === "object" && "slug" in item);
      })
      .map((item) => normalizeItem(item));
  } catch {
    return [];
  }
}

function writeWatchlist(items: WatchlistItem[]) {
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("watchlist-updated"));
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setItems(readWatchlist());
      setHydrated(true);
    });

    function handleStorage() {
      setItems(readWatchlist());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("watchlist-updated", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("watchlist-updated", handleStorage);
    };
  }, []);

  const persist = useCallback((nextItems: WatchlistItem[]) => {
    const normalized = nextItems.map((item) => normalizeItem(item));
    writeWatchlist(normalized);
    setItems(normalized);
  }, []);

  const upsertItem = useCallback(
    (item: Partial<WatchlistItem> & { slug: string }) => {
      const current = readWatchlist();
      const chain = parseSupportedChain(item.chain);
      const existing = current.find(
        (candidate) => getWatchlistKey(candidate.slug, candidate.chain) === getWatchlistKey(item.slug, chain),
      );
      const nextItem = normalizeItem({
        ...existing,
        ...item,
        addedAt: existing?.addedAt ?? item.addedAt,
        devWallets: item.devWallets ?? existing?.devWallets,
        targetFloors: item.targetFloors ?? existing?.targetFloors,
      });
      const nextItems = [
        nextItem,
        ...current.filter(
          (candidate) =>
            getWatchlistKey(candidate.slug, candidate.chain) !== getWatchlistKey(item.slug, chain),
        ),
      ].sort((left, right) => right.addedAt.localeCompare(left.addedAt));

      persist(nextItems);
      return nextItem;
    },
    [persist],
  );

  const removeItem = useCallback(
    (slug: string, chain: SupportedChain = "ethereum") => {
      const key = getWatchlistKey(slug, chain);
      persist(
        readWatchlist().filter((item) => getWatchlistKey(item.slug, item.chain) !== key),
      );
    },
    [persist],
  );

  const updateTargetFloors = useCallback(
    (slug: string, targetFloors: number[], chain: SupportedChain = "ethereum") => {
      const current = readWatchlist();
      const key = getWatchlistKey(slug, chain);
      persist(
        current.map((item) =>
          getWatchlistKey(item.slug, item.chain) === key
            ? normalizeItem({ ...item, targetFloors })
            : item,
        ),
      );
    },
    [persist],
  );

  const addWallet = useCallback(
    (slug: string, wallet: TrackedWallet, chain: SupportedChain = "ethereum") => {
      const current = readWatchlist();
      const key = getWatchlistKey(slug, chain);
      persist(
        current.map((item) => {
          if (getWatchlistKey(item.slug, item.chain) !== key) {
            return item;
          }

          const devWallets = [
            wallet,
            ...item.devWallets.filter(
              (candidate) => candidate.address.toLowerCase() !== wallet.address.toLowerCase(),
            ),
          ];

          return normalizeItem({ ...item, devWallets });
        }),
      );
    },
    [persist],
  );

  const removeWallet = useCallback(
    (slug: string, address: string, chain: SupportedChain = "ethereum") => {
      const current = readWatchlist();
      const key = getWatchlistKey(slug, chain);
      persist(
        current.map((item) =>
          getWatchlistKey(item.slug, item.chain) === key
            ? normalizeItem({
                ...item,
                devWallets: item.devWallets.filter(
                  (wallet) => wallet.address.toLowerCase() !== address.toLowerCase(),
                ),
              })
            : item,
        ),
      );
    },
    [persist],
  );

  const bySlug = useMemo(() => {
    return new Map(items.map((item) => [item.slug, item]));
  }, [items]);
  const byKey = useMemo(() => {
    return new Map(items.map((item) => [getWatchlistKey(item.slug, item.chain), item]));
  }, [items]);

  return {
    addWallet,
    byKey,
    bySlug,
    hydrated,
    items,
    removeItem,
    removeWallet,
    updateTargetFloors,
    upsertItem,
  };
}

export function getDefaultWatchlistItem(
  slug: string,
  chain: SupportedChain = "ethereum",
): WatchlistItem {
  return normalizeItem({ chain, slug });
}

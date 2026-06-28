"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_TARGET_FLOORS } from "@/lib/sweep";
import type { TrackedWallet, WatchlistItem } from "@/lib/types";

const WATCHLIST_STORAGE_KEY = "nft-sweep-depth-watchlist:v1";

function normalizeItem(item: Partial<WatchlistItem> & { slug: string }): WatchlistItem {
  return {
    addedAt: item.addedAt ?? new Date().toISOString(),
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
      const existing = current.find((candidate) => candidate.slug === item.slug);
      const nextItem = normalizeItem({
        ...existing,
        ...item,
        addedAt: existing?.addedAt ?? item.addedAt,
        devWallets: item.devWallets ?? existing?.devWallets,
        targetFloors: item.targetFloors ?? existing?.targetFloors,
      });
      const nextItems = [
        nextItem,
        ...current.filter((candidate) => candidate.slug !== item.slug),
      ].sort((left, right) => right.addedAt.localeCompare(left.addedAt));

      persist(nextItems);
      return nextItem;
    },
    [persist],
  );

  const removeItem = useCallback(
    (slug: string) => {
      persist(readWatchlist().filter((item) => item.slug !== slug));
    },
    [persist],
  );

  const updateTargetFloors = useCallback(
    (slug: string, targetFloors: number[]) => {
      const current = readWatchlist();
      persist(
        current.map((item) =>
          item.slug === slug ? normalizeItem({ ...item, targetFloors }) : item,
        ),
      );
    },
    [persist],
  );

  const addWallet = useCallback(
    (slug: string, wallet: TrackedWallet) => {
      const current = readWatchlist();
      persist(
        current.map((item) => {
          if (item.slug !== slug) {
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
    (slug: string, address: string) => {
      const current = readWatchlist();
      persist(
        current.map((item) =>
          item.slug === slug
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

  return {
    addWallet,
    bySlug,
    hydrated,
    items,
    removeItem,
    removeWallet,
    updateTargetFloors,
    upsertItem,
  };
}

export function getDefaultWatchlistItem(slug: string): WatchlistItem {
  return normalizeItem({ slug });
}

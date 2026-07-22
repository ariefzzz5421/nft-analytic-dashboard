"use client";

import Link from "next/link";
import { WalletCards } from "lucide-react";
import { TrackedWalletsPanel } from "@/components/wallets/TrackedWalletsPanel";
import { useWatchlist } from "@/lib/watchlist";

export function WalletsPage() {
  const { addWallet, hydrated, items, removeWallet } = useWatchlist();

  return (
    <main className="app-main">
      <div className="app-frame support-page">
        <header className="page-heading">
          <div className="flex items-center gap-3">
            <span className="page-heading__icon">
              <WalletCards size={20} aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-3xl font-semibold text-white">Wallet Tracker</h1>
              <p className="mt-1 text-sm text-slate-400">
                Manual creator, treasury, deployer, and sweeper wallet labels.
              </p>
            </div>
          </div>
        </header>

        {hydrated && items.length === 0 ? (
          <section className="empty-state">
            <h2 className="text-lg font-semibold text-white">No collections in watchlist</h2>
            <p className="mt-2 text-sm text-slate-400">
              Add a collection first, then attach tracked wallets on its detail page.
            </p>
            <Link
              className="button button--primary mt-4"
              href="/"
            >
              Open dashboard
            </Link>
          </section>
        ) : null}

        <div className="grid gap-6">
          {items.map((item) => (
            <section className="wallet-collection" key={item.slug}>
              <div className="wallet-collection__header">
                <div>
                  <h2 className="text-xl font-semibold text-white">{item.name ?? item.slug}</h2>
                  <p className="font-mono text-sm text-cyan-200">{item.slug}</p>
                </div>
                <Link
                  className="button button--secondary"
                  href={`/collection/${item.slug}`}
                >
                  Open collection
                </Link>
              </div>
              <TrackedWalletsPanel
                addWallet={(wallet) => addWallet(item.slug, wallet)}
                removeWallet={(address) => removeWallet(item.slug, address)}
                wallets={item.devWallets}
              />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

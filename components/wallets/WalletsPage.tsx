"use client";

import Link from "next/link";
import { WalletCards } from "lucide-react";
import { TrackedWalletsPanel } from "@/components/wallets/TrackedWalletsPanel";
import { useWatchlist } from "@/lib/watchlist";

export function WalletsPage() {
  const { addWallet, hydrated, items, removeWallet } = useWatchlist();

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-cyan-400/10 pb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">
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
          <section className="rounded-lg border border-dashed border-slate-700 bg-slate-950/70 p-8 text-center">
            <h2 className="text-lg font-semibold text-white">No collections in watchlist</h2>
            <p className="mt-2 text-sm text-slate-400">
              Add a collection first, then attach tracked wallets on its detail page.
            </p>
            <Link
              className="mt-4 inline-flex rounded-md bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
              href="/"
            >
              Open dashboard
            </Link>
          </section>
        ) : null}

        <div className="grid gap-6">
          {items.map((item) => (
            <section className="grid gap-3" key={item.slug}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">{item.name ?? item.slug}</h2>
                  <p className="font-mono text-sm text-cyan-200">{item.slug}</p>
                </div>
                <Link
                  className="inline-flex rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50"
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

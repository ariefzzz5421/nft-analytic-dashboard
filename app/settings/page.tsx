import type { Metadata } from "next";
import { getEthUsdFallback } from "@/lib/opensea";
import { OPENSEA_REFRESH_POLICY } from "@/lib/refresh";

export const metadata: Metadata = {
  title: "Settings | NFT Sweep Depth",
};

export const dynamic = "force-dynamic";

function StatusRow({
  label,
  value,
  status,
}: {
  label: string;
  status: "configured" | "missing" | "info";
  value: string;
}) {
  const color =
    status === "configured"
      ? "border-emerald-400/25 bg-emerald-400/8 text-emerald-100"
      : status === "missing"
        ? "border-amber-400/25 bg-amber-400/8 text-amber-100"
        : "border-cyan-400/25 bg-cyan-400/8 text-cyan-100";

  return (
    <div className={`rounded-lg border p-4 ${color}`}>
      <p className="text-xs uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-2 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

export default function SettingsPage() {
  const openSeaConfigured = Boolean(process.env.OPENSEA_API_KEY);
  const etherscanConfigured = Boolean(process.env.ETHERSCAN_API_KEY);

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="border-b border-cyan-400/10 pb-6">
          <h1 className="text-3xl font-semibold text-white">Settings</h1>
          <p className="mt-2 text-sm text-slate-400">
            Runtime API status and deployment notes.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusRow
            label="OpenSea API"
            status={openSeaConfigured ? "configured" : "missing"}
            value={openSeaConfigured ? "configured" : "missing"}
          />
          <StatusRow
            label="Etherscan API"
            status={etherscanConfigured ? "configured" : "missing"}
            value={etherscanConfigured ? "configured" : "missing"}
          />
          <StatusRow label="ETH/USD fallback" status="info" value={String(getEthUsdFallback())} />
          <StatusRow label="Watchlist storage" status="info" value="localStorage" />
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-950/82 p-4">
          <h2 className="text-lg font-semibold text-white">OpenSea refresh policy</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <StatusRow
              label="Server cache"
              status="info"
              value={`${OPENSEA_REFRESH_POLICY.cacheSeconds}s`}
            />
            <StatusRow
              label="Default refresh"
              status="info"
              value={`${OPENSEA_REFRESH_POLICY.defaultRefreshSeconds}s`}
            />
            <StatusRow
              label="Minimum manual interval"
              status="info"
              value={`${OPENSEA_REFRESH_POLICY.minRefreshSeconds}s`}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {OPENSEA_REFRESH_POLICY.note}
          </p>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-950/82 p-4">
          <h2 className="text-lg font-semibold text-white">Market price API</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            BTC, ETH, HYPE, BNB, and SOL ticker uses backend route `/api/market/prices`.
            Primary source is CoinGecko Simple Price API. If that fails, the backend falls back
            to Yahoo Finance chart data where available.
          </p>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-950/82 p-4">
          <h2 className="text-lg font-semibold text-white">Watchlist note</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Local watchlist is stored in this browser. To sync across devices, add database/auth later.
          </p>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-950/82 p-4">
          <h2 className="text-lg font-semibold text-white">Vercel deployment notes</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
            <li>Add OPENSEA_API_KEY in Vercel project environment variables.</li>
            <li>Add ETHERSCAN_API_KEY in Vercel project environment variables if wallet tracker is used.</li>
            <li>Add ETH_USD_FALLBACK for the manual ETH/USD conversion value.</li>
            <li>Do not expose server keys with NEXT_PUBLIC_.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

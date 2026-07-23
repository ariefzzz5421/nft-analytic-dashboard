import type { Metadata } from "next";
import { getApeUsdFallback, getEthUsdFallback } from "@/lib/opensea";
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
  return (
    <div className={`settings-status settings-status--${status}`}>
      <p className="text-xs uppercase tracking-[0.16em] opacity-75">{label}</p>
      <p className="mt-2 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

export default function SettingsPage() {
  const openSeaConfigured = Boolean(process.env.OPENSEA_API_KEY);
  const etherscanConfigured = Boolean(process.env.ETHERSCAN_API_KEY);

  return (
    <main className="app-main">
      <div className="app-frame support-page">
        <header className="page-heading">
          <h1 className="text-3xl font-semibold text-white">Settings</h1>
          <p className="mt-2 text-sm text-slate-400">
            Runtime API status and deployment notes.
          </p>
        </header>

        <section className="settings-status-grid">
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
          <StatusRow label="APE/USD fallback" status="info" value={String(getApeUsdFallback())} />
          <StatusRow label="Watchlist storage" status="info" value="localStorage" />
        </section>

        <section className="settings-section">
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

        <section className="settings-section">
          <h2 className="text-lg font-semibold text-white">Market price API</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            BTC, ETH, APE, HYPE, BNB, and SOL ticker uses backend route `/api/market/prices`.
            Primary source is CoinGecko Simple Price API. If that fails, the backend falls back
            to Yahoo Finance chart data where available.
          </p>
        </section>

        <section className="settings-section">
          <h2 className="text-lg font-semibold text-white">Watchlist note</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Local watchlist is stored in this browser. To sync across devices, add database/auth later.
          </p>
        </section>

        <section className="settings-section">
          <h2 className="text-lg font-semibold text-white">Vercel deployment notes</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
            <li>Add OPENSEA_API_KEY in Vercel project environment variables.</li>
            <li>Add ETHERSCAN_API_KEY in Vercel project environment variables if wallet tracker is used.</li>
            <li>Add ETH_USD_FALLBACK for the manual ETH/USD conversion value.</li>
            <li>Add APE_USD_FALLBACK only if you want a manual fallback for ApeChain.</li>
            <li>Do not expose server keys with NEXT_PUBLIC_.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

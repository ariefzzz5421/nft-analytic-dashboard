"use client";

import { FormEvent, useEffect, useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { formatAddress, formatDateTime, formatEth, formatUsd } from "@/lib/format";
import type { ApiErrorResponse, TrackedWallet, WalletApiResponse } from "@/lib/types";

type TrackedWalletsPanelProps = {
  addWallet: (wallet: TrackedWallet) => void;
  ethUsd?: number;
  onWalletData?: (address: string, wallet: WalletApiResponse | null) => void;
  removeWallet: (address: string) => void;
  wallets: TrackedWallet[];
};

async function fetchWallet(address: string) {
  const response = await fetch(`/api/wallet/${encodeURIComponent(address)}`);
  const payload = (await response.json()) as WalletApiResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : "Failed to load wallet.");
  }

  return payload as WalletApiResponse;
}

function normalizeAddress(address: string) {
  return address.trim();
}

function WalletCard({
  onData,
  onRemove,
  wallet,
}: {
  onData?: (address: string, wallet: WalletApiResponse | null) => void;
  onRemove: (address: string) => void;
  wallet: TrackedWallet;
}) {
  const [data, setData] = useState<WalletApiResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve()
      .then(async () => {
        setLoading(true);
        setError("");
        return fetchWallet(wallet.address);
      })
      .then((response) => {
        if (cancelled) {
          return;
        }

        setData(response);
        onData?.(wallet.address, response);
      })
      .catch((cause) => {
        if (cancelled) {
          return;
        }

        setData(null);
        onData?.(wallet.address, null);
        setError(cause instanceof Error ? cause.message : "Failed to load wallet.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onData, wallet.address]);

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950/82 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">{wallet.label}</h3>
          <p className="mt-1 font-mono text-sm text-cyan-200">{formatAddress(wallet.address)}</p>
          {wallet.notes ? <p className="mt-2 text-sm text-slate-400">{wallet.notes}</p> : null}
        </div>
        <button
          className="rounded-md border border-red-400/25 p-2 text-red-100 transition hover:border-red-300"
          onClick={() => onRemove(wallet.address)}
          type="button"
        >
          <Trash2 size={15} aria-hidden="true" />
          <span className="sr-only">Remove wallet</span>
        </button>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-2">
          <div className="h-4 w-2/3 rounded bg-slate-800" />
          <div className="h-4 w-1/2 rounded bg-slate-800" />
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-md border border-amber-400/20 bg-amber-400/8 p-3 text-sm text-amber-100">
          {error === "Missing ETHERSCAN_API_KEY"
            ? "Add ETHERSCAN_API_KEY to enable wallet tracking."
            : error}
        </div>
      ) : null}

      {data ? (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">ETH balance</p>
            <p className="mt-1 font-mono text-slate-100">{formatEth(data.balanceEth)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">USD balance</p>
            <p className="mt-1 font-mono text-slate-100">{formatUsd(data.balanceUsd)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Recent tx count</p>
            <p className="mt-1 font-mono text-slate-100">{data.txCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Net ETH flow</p>
            <p className="mt-1 font-mono text-slate-100">{formatEth(data.netEthFlow)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Last transaction</p>
            <p className="mt-1 font-mono text-slate-100">{formatDateTime(data.lastTxAt)}</p>
          </div>
        </div>
      ) : null}

      <a
        className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50"
        href={`https://etherscan.io/address/${wallet.address}`}
        rel="noreferrer"
        target="_blank"
      >
        <ExternalLink size={14} aria-hidden="true" />
        Open Etherscan
      </a>
    </article>
  );
}

export function TrackedWalletsPanel({
  addWallet,
  onWalletData,
  removeWallet,
  wallets,
}: TrackedWalletsPanelProps) {
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const cleanAddress = normalizeAddress(address);
    const cleanLabel = label.trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
      setFormError("Enter a valid Ethereum address.");
      return;
    }

    if (!cleanLabel) {
      setFormError("Add a wallet label.");
      return;
    }

    addWallet({
      address: cleanAddress,
      label: cleanLabel,
      notes: notes.trim() || undefined,
    });
    setAddress("");
    setLabel("");
    setNotes("");
    setFormError("");
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/82 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Tracked wallets</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Tracked wallet balance does not prove intent to sweep. It only shows capacity.
        </p>
      </div>

      <form className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
        <input
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
          onChange={(event) => setAddress(event.target.value)}
          placeholder="0x wallet address"
          value={address}
        />
        <input
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Creator wallet"
          value={label}
        />
        <input
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes"
          value={notes}
        />
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-300 px-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
          type="submit"
        >
          <Plus size={15} aria-hidden="true" />
          Add
        </button>
      </form>

      {formError ? <p className="mt-2 text-sm text-red-200">{formError}</p> : null}

      {wallets.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-700 p-5 text-sm text-slate-400">
          Add labels like Creator wallet, Mint receiver, Deployer, Treasury, or Sweeper wallet.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {wallets.map((wallet) => (
            <WalletCard
              key={wallet.address}
              onData={onWalletData}
              onRemove={removeWallet}
              wallet={wallet}
            />
          ))}
        </div>
      )}
    </section>
  );
}

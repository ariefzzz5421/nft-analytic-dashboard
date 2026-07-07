"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { ReactNode, useEffect } from "react";
import { useAccount } from "wagmi";

type AppGateProps = {
  children: ReactNode;
  walletConnectConfigured: boolean;
};

const storageKey = "nft-sweep-depth-connected-wallet";

function WalletSetupMissing() {
  return (
    <main className="min-h-screen px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-lg border border-amber-400/25 bg-slate-950/88 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Wallet setup required</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">WalletConnect project ID belum diisi</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          RainbowKit membutuhkan WalletConnect project ID supaya connect wallet berjalan stabil. Tambahkan
          `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` ke `.env.local`, lalu restart dev server.
        </p>
      </div>
    </main>
  );
}

function SignInPanel() {
  return (
    <main className="min-h-screen px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-lg border border-cyan-400/20 bg-slate-950/88 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Private tools</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Sign in dulu sebelum pakai dashboard</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Akses analytics dikunci dengan Clerk. Setelah sign in, user harus connect wallet sebelum tools terbuka.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <SignInButton mode="modal">
            <button
              className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
              type="button"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50"
              type="button"
            >
              Create account
            </button>
          </SignUpButton>
        </div>
      </div>
    </main>
  );
}

function WalletGate({ children }: { children: ReactNode }) {
  const { address, chain, isConnected } = useAccount();
  const { user } = useUser();

  useEffect(() => {
    if (!isConnected || !address) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        address,
        chainId: chain?.id ?? null,
        connectedAt: new Date().toISOString(),
        userId: user?.id ?? null,
      }),
    );
  }, [address, chain?.id, isConnected, user?.id]);

  if (!isConnected) {
    return (
      <main className="min-h-screen px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-cyan-400/20 bg-slate-950/88 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Wallet required</p>
              <h1 className="mt-3 text-2xl font-semibold text-white">Connect wallet untuk membuka tools</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Wallet address akan disimpan di browser local storage bersama user ID Clerk supaya session berikutnya
                bisa dikenali.
              </p>
            </div>
            <UserButton />
          </div>
          <div className="mt-5">
            <ConnectButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-slate-400">
            Wallet connected: <span className="text-cyan-100">{address}</span>
          </p>
          <div className="flex items-center gap-3">
            <ConnectButton showBalance={false} />
            <UserButton />
          </div>
        </div>
      </div>
      {children}
    </>
  );
}

export function AppGate({ children, walletConnectConfigured }: AppGateProps) {
  const { isLoaded, isSignedIn } = useUser();

  if (!walletConnectConfigured) {
    return <WalletSetupMissing />;
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-slate-950/88 p-6">
          <p className="text-sm text-slate-400">Loading account...</p>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return <SignInPanel />;
  }

  return (
    <WalletGate>{children}</WalletGate>
  );
}

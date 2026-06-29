"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Eye, Gauge, Settings, WalletCards } from "lucide-react";
import { MarketTicker } from "@/components/MarketTicker";

const navItems = [
  { activePath: "/", href: "/", label: "Dashboard", icon: Gauge },
  { activePath: "/", href: "/#watchlist", label: "Watchlist", icon: Eye },
  { activePath: "/wallets", href: "/wallets", label: "Wallets", icon: WalletCards },
  { activePath: "/settings", href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/88 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-400/25 bg-cyan-400/10 text-cyan-200">
            <BarChart3 size={18} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">NFT Sweep Depth</span>
            <span className="block text-xs text-slate-500">Read-only analytics</span>
          </span>
        </Link>

        <div className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/#watchlist"
                ? false
                : item.activePath === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.activePath);

            return (
              <Link
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-cyan-400/10 text-cyan-100"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
                href={item.href}
                key={item.href}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
      <MarketTicker />
    </nav>
  );
}

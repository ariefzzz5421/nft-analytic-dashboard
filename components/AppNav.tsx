"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, Gauge, Settings, WalletCards } from "lucide-react";
import { MarketTicker } from "@/components/MarketTicker";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { activePath: "/", href: "/", label: "Dashboard", icon: Gauge },
  { activePath: "/", href: "/#watchlist", label: "Watchlist", icon: Eye },
  { activePath: "/wallets", href: "/wallets", label: "Wallets", icon: WalletCards },
  { activePath: "/settings", href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="app-chrome">
      <MarketTicker />
      <nav aria-label="Primary navigation" className="workspace-nav">
        <div className="workspace-nav__inner">
          <Link className="workspace-brand" href="/">
            <span aria-hidden="true" className="workspace-brand__mark">SD</span>
            <span className="workspace-brand__copy">
              <span className="workspace-brand__name">sweep.depth</span>
              <span className="workspace-brand__meta">NFT liquidity terminal</span>
            </span>
          </Link>

          <div className="workspace-nav__tools">
            <div className="workspace-nav__links">
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
                  className={`workspace-nav__link ${active ? "workspace-nav__link--active" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}

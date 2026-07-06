import type { MarketSymbol } from "@/lib/types";

type TokenLogoProps = {
  className?: string;
  symbol: MarketSymbol;
};

const tokenStyles: Record<MarketSymbol, string> = {
  BNB: "border-amber-300/30 bg-amber-300/10",
  BTC: "border-orange-300/30 bg-orange-300/10",
  ETH: "border-cyan-300/30 bg-cyan-300/10",
  HYPE: "border-emerald-300/30 bg-emerald-300/10",
  SOL: "border-fuchsia-300/30 bg-fuchsia-300/10",
};

const tokenLogoSrc: Record<MarketSymbol, string> = {
  BNB: "/token-logos/BNB.png",
  BTC: "/token-logos/BTC.png",
  ETH: "/token-logos/ETH.png",
  HYPE: "/token-logos/HYPE.png",
  SOL: "/token-logos/SOL.png",
};

export function TokenLogo({ className = "", symbol }: TokenLogoProps) {
  const imageClass =
    symbol === "SOL"
      ? "h-[78%] w-[78%] object-contain"
      : symbol === "ETH"
        ? "h-[86%] w-[86%] object-contain"
        : "h-full w-full object-cover";

  return (
    <span
      aria-label={`${symbol} logo`}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border ${tokenStyles[symbol]} ${className}`}
      title={symbol}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" className={imageClass} src={tokenLogoSrc[symbol]} />
    </span>
  );
}

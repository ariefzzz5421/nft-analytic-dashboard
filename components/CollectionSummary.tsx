import type { ReactNode } from "react";
import { EthUsdValue } from "@/components/EthUsdValue";
import { NetworkBadge } from "@/components/NetworkBadge";
import type { SupportedChain } from "@/lib/chains";
import { formatNumber, formatPercent } from "@/lib/format";
import type { CollectionSummaryData } from "@/lib/types";

type CollectionSummaryProps = {
  chain: SupportedChain;
  collection: CollectionSummaryData;
  ethUsd?: number | null;
  slug: string;
  symbol: string;
};

type Metric =
  | {
      ethValue?: never;
      label: string;
      value: string;
    }
  | {
      ethValue: number | null | undefined;
      label: string;
      value?: never;
    };

function MetricCard({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="collection-metric">
      <p>{label}</p>
      <strong>{children}</strong>
    </div>
  );
}

export function CollectionSummary({
  chain,
  collection,
  ethUsd,
  slug,
  symbol,
}: CollectionSummaryProps) {
  const metrics: Metric[] = [
    { label: "Total supply", value: formatNumber(collection.supply, 0) },
    { ethValue: collection.floor, label: "Current floor" },
    { ethValue: collection.topOffer, label: "Top offer" },
    { label: "Listed count", value: formatNumber(collection.listedCount, 0) },
    { label: "Listed percentage", value: formatPercent(collection.listedPercentage) },
    { label: "Owners", value: formatNumber(collection.owners, 0) },
    { ethValue: collection.volume24h, label: "24h volume" },
    { ethValue: collection.totalVolume, label: "Total volume" },
  ];

  return (
    <section className="collection-overview">
      <figure className="collection-overview__media">
        <div className="collection-overview__image">
          {collection.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={collection.name}
              src={collection.imageUrl}
            />
          ) : (
            <span>
              {collection.name.slice(0, 1)}
            </span>
          )}
        </div>
        <figcaption>Live OpenSea collection identity</figcaption>
      </figure>

      <div className="collection-overview__data">
        <header className="collection-overview__identity">
          <p>Collection</p>
          <div className="collection-overview__titleline">
            <h2>{collection.name}</h2>
            <NetworkBadge chain={chain} />
          </div>
          <span>{slug}</span>
        </header>

        <div className="collection-overview__metrics">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label}>
              {"ethValue" in metric ? (
                <EthUsdValue
                  ethUsd={ethUsd}
                  label={metric.label}
                  symbol={symbol}
                  value={metric.ethValue}
                />
              ) : (
                metric.value
              )}
            </MetricCard>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { getCollectionHref, isSupportedChain } from "@/lib/chains";
import type { MarketCollection } from "@/lib/types";

type MarketCollectionsTableProps = {
  compact?: boolean;
  items: MarketCollection[];
  title: string;
};

const compactNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});

function formatNative(value: number | null, symbol: string) {
  if (value === null) return "--";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${symbol}`;
}

function formatChange(value: number | null) {
  if (value === null) return "--";
  const normalized = Math.abs(value) <= 2 ? value * 100 : value;
  return `${normalized > 0 ? "+" : ""}${normalized.toFixed(1)}%`;
}

function CollectionLink({ item }: { item: MarketCollection }) {
  const content = (
    <>
      <span className="market-collection__art">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={item.imageUrl} />
        ) : (
          item.name.slice(0, 1).toUpperCase()
        )}
      </span>
      <span className="market-collection__identity">
        <span className="market-collection__name">
          {item.name}
          {item.verified ? <BadgeCheck aria-label="Verified" size={13} /> : null}
        </span>
        <span>{item.chain.replaceAll("_", " ")}</span>
      </span>
      <ArrowUpRight aria-hidden="true" className="market-collection__arrow" size={14} />
    </>
  );

  if (item.analyzable && isSupportedChain(item.chain)) {
    return (
      <Link className="market-collection" href={getCollectionHref(item.slug, item.chain)}>
        {content}
      </Link>
    );
  }

  return (
    <a
      className="market-collection"
      href={`https://opensea.io/collection/${item.slug}`}
      rel="noreferrer"
      target="_blank"
    >
      {content}
    </a>
  );
}

export function MarketCollectionsTable({
  compact = false,
  items,
  title,
}: MarketCollectionsTableProps) {
  return (
    <section className={`market-board ${compact ? "market-board--compact" : ""}`}>
      <header className="market-board__header">
        <div>
          <p>OpenSea / 24H</p>
          <h2>{title}</h2>
        </div>
        <span>{items.length} collections</span>
      </header>

      <div className="market-board__scroll">
        <table className="market-board__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Collection</th>
              <th>Floor</th>
              {!compact ? <th>24h volume</th> : null}
              {!compact ? <th>Sales</th> : null}
              <th>Floor 24h</th>
              {!compact ? <th>Owners</th> : null}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${title}-${item.chain}-${item.slug}`}>
                <td className="market-rank">{String(item.rank).padStart(2, "0")}</td>
                <td><CollectionLink item={item} /></td>
                <td className="market-number">{formatNative(item.floor, item.nativeSymbol)}</td>
                {!compact ? (
                  <td className="market-number">{formatNative(item.volume24h, item.nativeSymbol)}</td>
                ) : null}
                {!compact ? (
                  <td className="market-number">{item.sales24h === null ? "--" : compactNumber.format(item.sales24h)}</td>
                ) : null}
                <td
                  className={`market-number ${
                    item.floorChange24h === null
                      ? ""
                      : item.floorChange24h >= 0
                        ? "market-number--positive"
                        : "market-number--negative"
                  }`}
                >
                  {formatChange(item.floorChange24h)}
                </td>
                {!compact ? (
                  <td className="market-number">{item.owners === null ? "--" : compactNumber.format(item.owners)}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

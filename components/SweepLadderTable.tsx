import { EthUsdValue } from "@/components/EthUsdValue";
import { formatRatio, formatUsd } from "@/lib/format";
import { getTreasuryCoverageLabel } from "@/lib/sweep";
import type { SweepLadderRow } from "@/lib/types";

type SweepLadderTableProps = {
  ethUsd?: number | null;
  ladder: SweepLadderRow[];
  treasuryBalanceEth?: number | null;
};

export function SweepLadderTable({
  ethUsd,
  ladder,
  treasuryBalanceEth = null,
}: SweepLadderTableProps) {
  const showTreasury = treasuryBalanceEth !== null && Number.isFinite(treasuryBalanceEth);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.16em] text-slate-500">
            <th className="px-3 py-3 font-semibold">Target floor</th>
            <th className="px-3 py-3 font-semibold">Items to sweep</th>
            <th className="px-3 py-3 font-semibold">Estimated cost ETH</th>
            <th className="px-3 py-3 font-semibold">Estimated cost USD</th>
            <th className="px-3 py-3 font-semibold">Average buy price</th>
            <th className="px-3 py-3 font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {ladder.map((row) => {
            const coverage =
              showTreasury && row.costEth > 0 ? Number((treasuryBalanceEth / row.costEth).toFixed(4)) : null;
            const costUsd =
              typeof ethUsd === "number" && Number.isFinite(ethUsd) && ethUsd > 0
                ? row.costEth * ethUsd
                : row.costUsd;
            const note =
              coverage !== null
                ? `${formatRatio(coverage)} tracked-wallet coverage. ${getTreasuryCoverageLabel(coverage)}.`
                : row.itemsToSweep === 0
                  ? "No ETH/WETH listings below this target."
                  : "Target is above current floor.";

            return (
              <tr
                className="border-b border-slate-900/90 text-slate-200 transition hover:bg-cyan-400/5"
                key={row.targetFloor}
              >
                <td className="px-3 py-4 font-mono text-cyan-200">
                  <EthUsdValue ethUsd={ethUsd} label="Target floor" value={row.targetFloor} />
                </td>
                <td className="px-3 py-4 font-mono">{row.itemsToSweep}</td>
                <td className="px-3 py-4 font-mono">
                  <EthUsdValue ethUsd={ethUsd} label="Estimated cost" value={row.costEth} />
                </td>
                <td className="px-3 py-4 font-mono">{formatUsd(costUsd)}</td>
                <td className="px-3 py-4 font-mono">
                  <EthUsdValue ethUsd={ethUsd} label="Average buy price" value={row.avgPriceEth} />
                </td>
                <td className="px-3 py-4 text-slate-400">{note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

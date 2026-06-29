import { AlertTriangle } from "lucide-react";

const fallbackWarnings = [
  "Higher floor does not guarantee exit liquidity.",
  "Floor without bid support may be floor theater.",
  "Listings can change quickly. Refresh before making decisions.",
  "This dashboard does not execute trades.",
];

type RiskWarningCardProps = {
  warnings?: string[];
};

export function RiskWarningCard({ warnings = fallbackWarnings }: RiskWarningCardProps) {
  return (
    <section className="rounded-lg border border-amber-400/20 bg-amber-400/6 p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-amber-300/25 bg-amber-300/10 text-amber-200">
          <AlertTriangle size={15} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Risk Warnings</h2>
        </div>
      </div>
      <ul className="grid gap-1.5 text-xs leading-5 text-amber-50/88 md:grid-cols-2">
        {warnings.map((warning) => (
          <li className="rounded-md border border-amber-300/10 bg-slate-950/45 px-2.5 py-1.5" key={warning}>
            {warning}
          </li>
        ))}
      </ul>
    </section>
  );
}

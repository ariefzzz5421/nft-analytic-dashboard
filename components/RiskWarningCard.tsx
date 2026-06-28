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
    <section className="rounded-lg border border-amber-400/24 bg-amber-400/8 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-amber-300/25 bg-amber-300/10 text-amber-200">
          <AlertTriangle size={18} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Risk Warnings</h2>
          <p className="text-sm text-amber-100/75">Read before using the estimate.</p>
        </div>
      </div>
      <ul className="grid gap-2 text-sm leading-6 text-amber-50/88 md:grid-cols-2">
        {warnings.map((warning) => (
          <li className="rounded-md border border-amber-300/10 bg-slate-950/45 px-3 py-2" key={warning}>
            {warning}
          </li>
        ))}
      </ul>
    </section>
  );
}

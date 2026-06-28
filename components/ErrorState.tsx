import { RotateCcw, XCircle } from "lucide-react";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-red-400/24 bg-red-400/8 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-red-300">
          <XCircle size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold text-white">Could not analyze collection</h2>
          <p className="mt-1 text-sm leading-6 text-red-100/80">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md border border-red-300/25 bg-red-300/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:border-red-200"
          onClick={onRetry}
          type="button"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Retry
        </button>
      ) : null}
    </section>
  );
}

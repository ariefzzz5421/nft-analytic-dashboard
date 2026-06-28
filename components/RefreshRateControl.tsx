"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { OPENSEA_REFRESH_POLICY, readRefreshSeconds, writeRefreshSeconds } from "@/lib/refresh";

type RefreshRateControlProps = {
  compact?: boolean;
  onChange?: (seconds: number) => void;
};

export function RefreshRateControl({ compact = false, onChange }: RefreshRateControlProps) {
  const [seconds, setSeconds] = useState(OPENSEA_REFRESH_POLICY.defaultRefreshSeconds);

  useEffect(() => {
    queueMicrotask(() => {
      const value = readRefreshSeconds();
      setSeconds(value);
      onChange?.(value);
    });

    function handleUpdate() {
      const value = readRefreshSeconds();
      setSeconds(value);
      onChange?.(value);
    }

    window.addEventListener("refresh-rate-updated", handleUpdate);

    return () => window.removeEventListener("refresh-rate-updated", handleUpdate);
  }, [onChange]);

  function handleChange(value: number) {
    setSeconds(value);
    writeRefreshSeconds(value);
    onChange?.(value);
  }

  return (
    <label
      className={`inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-300 ${
        compact ? "w-full sm:w-auto" : ""
      }`}
    >
      <RefreshCw size={15} aria-hidden="true" />
      <span className="text-slate-400">Refresh</span>
      <select
        className="bg-transparent font-mono text-cyan-100 outline-none"
        onChange={(event) => handleChange(Number(event.target.value))}
        value={seconds}
      >
        {OPENSEA_REFRESH_POLICY.recommendedRefreshSeconds.map((value) => (
          <option className="bg-slate-950" key={value} value={value}>
            {value === 0 ? "Off" : `${value}s`}
          </option>
        ))}
      </select>
    </label>
  );
}

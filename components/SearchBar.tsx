"use client";

import { FormEvent } from "react";
import { Search } from "lucide-react";

type SearchBarProps = {
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  value: string;
};

export function SearchBar({ disabled = false, onChange, onSubmit, value }: SearchBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
  }

  return (
    <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
      <label className="min-w-0 flex-1">
        <span className="sr-only">OpenSea collection URL or slug</span>
        <input
          className="h-12 w-full rounded-md border border-slate-700 bg-slate-950/92 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste OpenSea collection URL or slug"
          value={value}
        />
      </label>
      <button
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        type="submit"
      >
        <Search size={17} aria-hidden="true" />
        Analyze Collection
      </button>
    </form>
  );
}

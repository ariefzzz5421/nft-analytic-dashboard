export function LoadingState() {
  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-cyan-400/18 bg-slate-950/82 p-5">
        <div className="h-5 w-48 rounded bg-slate-800" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4" key={index}>
              <div className="h-3 w-24 rounded bg-slate-800" />
              <div className="mt-3 h-7 w-28 rounded bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SetupRequired() {
  return (
    <main className="min-h-screen px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-lg border border-amber-400/25 bg-slate-950/88 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Setup required</p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Clerk wallet access belum aktif</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Tools dashboard dikunci sampai Clerk keys dan WalletConnect project ID diisi. Setelah itu user harus sign in
          dengan Clerk dan connect wallet lewat RainbowKit sebelum dashboard bisa dipakai.
        </p>
        <div className="mt-5 rounded-md border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm font-semibold text-white">Tambahkan ke .env.local</p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-200">
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id`}
          </pre>
        </div>
      </div>
    </main>
  );
}

import { LockKeyhole } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <p>NFT Sweep Depth / Collection liquidity research</p>
        <p className="app-footer__status">
          <LockKeyhole aria-hidden="true" size={14} />
          Read-only / No wallet signatures / No trade execution
        </p>
      </div>
    </footer>
  );
}

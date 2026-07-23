import { Boxes } from "lucide-react";
import { getChainConfig, type SupportedChain } from "@/lib/chains";

type NetworkBadgeProps = {
  chain: SupportedChain;
  compact?: boolean;
};

export function NetworkBadge({ chain, compact = false }: NetworkBadgeProps) {
  const config = getChainConfig(chain);

  return (
    <span className={`network-badge network-badge--${chain}`} title={`${config.name} network`}>
      <Boxes aria-hidden="true" size={compact ? 12 : 14} />
      <span>{compact ? config.shortName : config.name}</span>
      {!compact ? <span className="network-badge__id">#{config.chainId}</span> : null}
    </span>
  );
}

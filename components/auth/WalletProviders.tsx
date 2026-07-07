"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { base, mainnet, polygon } from "wagmi/chains";

type WalletProvidersProps = {
  children: ReactNode;
  projectId?: string;
};

const fallbackProjectId = "00000000000000000000000000000000";

export function WalletProviders({ children, projectId }: WalletProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [config] = useState(() =>
    getDefaultConfig({
      appName: "NFT Sweep Depth",
      chains: [mainnet, base, polygon],
      projectId: projectId || fallbackProjectId,
      ssr: true,
    }),
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#67e8f9",
            accentColorForeground: "#020617",
            borderRadius: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

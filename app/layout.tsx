import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import { AppGate } from "@/components/auth/AppGate";
import { SetupRequired } from "@/components/auth/SetupRequired";
import { WalletProviders } from "@/components/auth/WalletProviders";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "NFT Sweep Depth",
  description:
    "Read-only NFT analytics dashboard for estimating sweep depth and orderbook cost.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  const walletConnectConfigured = Boolean(walletConnectProjectId);

  return (
    <html lang="en">
      <body>
        {clerkPublishableKey ? (
          <ClerkProvider publishableKey={clerkPublishableKey}>
            <WalletProviders projectId={walletConnectProjectId}>
              <AppGate walletConnectConfigured={walletConnectConfigured}>
                <AppNav />
                {children}
              </AppGate>
            </WalletProviders>
          </ClerkProvider>
        ) : (
          <SetupRequired />
        )}
      </body>
    </html>
  );
}

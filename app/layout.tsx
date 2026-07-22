import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";
import { AppFooter } from "@/components/AppFooter";
import { AppNav } from "@/components/AppNav";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
});

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
  return (
    <html className={`${geist.variable} ${plexMono.variable}`} lang="en">
      <body>
        <AppNav />
        {children}
        <AppFooter />
      </body>
    </html>
  );
}

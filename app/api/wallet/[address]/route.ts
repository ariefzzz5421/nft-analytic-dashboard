import { NextRequest, NextResponse } from "next/server";
import { parseSupportedChain } from "@/lib/chains";
import { EtherscanApiError, fetchWalletAnalytics } from "@/lib/server/etherscan";

type RouteContext = {
  params: Promise<{ address: string }>;
};

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    {
      headers: { "Cache-Control": "no-store" },
      status,
    },
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { address } = await context.params;
  const chain = parseSupportedChain(request.nextUrl.searchParams.get("chain"));

  try {
    const response = await fetchWalletAnalytics(address, chain);

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=30",
      },
    });
  } catch (cause) {
    if (cause instanceof EtherscanApiError) {
      return jsonError(cause.message, cause.status);
    }

    return jsonError("Unable to load wallet analytics.", 500);
  }
}

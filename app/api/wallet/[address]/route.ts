import { NextResponse } from "next/server";
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

export async function GET(_request: Request, context: RouteContext) {
  const { address } = await context.params;

  try {
    const response = await fetchWalletAnalytics(address);

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

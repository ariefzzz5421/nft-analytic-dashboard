import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  return NextResponse.json({
    slug,
    wallets: [],
    message: "Collection wallet labels are stored in browser localStorage for this MVP.",
  });
}

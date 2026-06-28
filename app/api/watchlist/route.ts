import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Watchlist is stored in browser localStorage for this MVP.",
    storage: "localStorage",
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Server-side watchlist storage is not configured yet.",
    },
    { status: 501 },
  );
}

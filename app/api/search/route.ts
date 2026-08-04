import { NextRequest, NextResponse } from "next/server";
import { normalizeCollectionSearch } from "@/lib/discovery";
import { OpenSeaApiError, searchCollections } from "@/lib/opensea";
import type { CollectionSearchResponse } from "@/lib/types";

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { headers: { "Cache-Control": "no-store" }, status },
  );
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return jsonError("Enter at least two characters.", 400);
  }

  try {
    const payload: CollectionSearchResponse = {
      results: normalizeCollectionSearch(await searchCollections(query), 8),
      source: "opensea",
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch (cause) {
    if (cause instanceof OpenSeaApiError) {
      return jsonError(cause.message, cause.status);
    }

    return jsonError("Collection search is unavailable right now.", 500);
  }
}

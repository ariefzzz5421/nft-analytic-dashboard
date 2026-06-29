import { NextRequest, NextResponse } from "next/server";
import { buildActivityWarnings, normalizeActivityEvents } from "@/lib/activity";
import { fetchCollectionEvents, OpenSeaApiError } from "@/lib/opensea";
import { extractSlug } from "@/lib/slug";
import type { ActivityApiResponse, ActivityEventType, NormalizedActivityEvent } from "@/lib/types";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function readEvents(payload: unknown) {
  if (payload && typeof payload === "object" && "asset_events" in payload) {
    const value = (payload as Record<string, unknown>).asset_events;
    return Array.isArray(value) ? value : [];
  }

  if (payload && typeof payload === "object" && "events" in payload) {
    const value = (payload as Record<string, unknown>).events;
    return Array.isArray(value) ? value : [];
  }

  return [];
}

function readNext(payload: unknown) {
  if (payload && typeof payload === "object" && "next" in payload) {
    const value = (payload as Record<string, unknown>).next;
    return typeof value === "string" && value.length > 0 ? value : null;
  }

  return null;
}

function fallbackEventType(value: string | null): ActivityEventType | null {
  if (!value || value.includes(",")) {
    return null;
  }

  return ["sale", "transfer", "mint", "listing", "offer"].includes(value)
    ? (value as ActivityEventType)
    : null;
}

function applyFallbackEventType(
  events: NormalizedActivityEvent[],
  eventType: ActivityEventType | null,
) {
  if (!eventType) {
    return events;
  }

  return events.map((event) =>
    event.eventType === "unknown" ? { ...event, eventType } : event,
  );
}

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status,
    },
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug: routeSlug } = await context.params;
  const slug = extractSlug(routeSlug);

  if (!slug) {
    return jsonError("Collection slug is invalid.", 400);
  }

  const searchParams = request.nextUrl.searchParams;
  const params = new URLSearchParams({
    event_type: searchParams.get("event_type") ?? "sale,transfer,mint,listing,offer",
    limit: searchParams.get("limit") ?? "50",
  });

  for (const key of ["after", "before", "next"]) {
    const value = searchParams.get(key);

    if (value) {
      params.set(key, value);
    }
  }

  try {
    const payload = await fetchCollectionEvents(slug, params);
    const events = applyFallbackEventType(
      normalizeActivityEvents(readEvents(payload)),
      fallbackEventType(searchParams.get("event_type")),
    );
    const response: ActivityApiResponse = {
      events,
      next: readNext(payload),
      slug,
      warnings: buildActivityWarnings(events),
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=30",
      },
    });
  } catch (cause) {
    if (cause instanceof OpenSeaApiError) {
      return jsonError(cause.message, cause.status);
    }

    return jsonError("Activity unavailable. Try refreshing.", 500);
  }
}

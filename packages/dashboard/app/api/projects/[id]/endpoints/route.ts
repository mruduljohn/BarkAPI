import { NextRequest, NextResponse } from "next/server";
import { listEndpoints, countDriftsByEndpoint } from "@barkapi/core";
import { getDashboardDb } from "../../../../lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  getDashboardDb();
  const endpoints = listEndpoints(parseInt(params.id));

  // Enrich with drift count per endpoint
  const enriched = endpoints.map((ep: any) => ({
    ...ep,
    drift_count: countDriftsByEndpoint(ep.id),
  }));

  return NextResponse.json(enriched);
}

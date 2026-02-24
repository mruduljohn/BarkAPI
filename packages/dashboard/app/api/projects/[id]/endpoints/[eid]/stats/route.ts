import { NextRequest, NextResponse } from "next/server";
import {
  getEndpoint,
  countDriftsByEndpoint,
  countDriftsByType,
  countDriftsBySeverity,
} from "barkapi-core";
import { getDashboardDb } from "../../../../../../lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; eid: string } }
) {
  getDashboardDb();
  const endpointId = parseInt(params.eid);
  const endpoint = getEndpoint(endpointId);
  if (!endpoint) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    totalDrifts: countDriftsByEndpoint(endpointId),
    driftsByType: countDriftsByType(endpointId),
    driftsBySeverity: countDriftsBySeverity(endpointId),
  });
}

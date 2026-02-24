import { NextRequest, NextResponse } from "next/server";
import { listDriftsByEndpoint, countDriftsByEndpoint } from "barkapi-core";
import { getDashboardDb } from "../../../../../../lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; eid: string } }
) {
  getDashboardDb();
  const endpointId = parseInt(params.eid);
  const url = req.nextUrl;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const offset = (page - 1) * limit;

  const total = countDriftsByEndpoint(endpointId);
  const drifts = listDriftsByEndpoint(endpointId, limit, offset);

  return NextResponse.json({
    data: drifts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

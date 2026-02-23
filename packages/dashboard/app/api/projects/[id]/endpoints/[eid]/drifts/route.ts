import { NextRequest, NextResponse } from "next/server";
import { listDriftsByEndpoint } from "@barkapi/core";
import { getDashboardDb } from "../../../../../../lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; eid: string } }
) {
  getDashboardDb();
  const drifts = listDriftsByEndpoint(parseInt(params.eid));
  return NextResponse.json(drifts);
}

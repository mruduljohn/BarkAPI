import { NextRequest, NextResponse } from "next/server";
import { listCheckRuns } from "@barkapi/core";
import { getDashboardDb } from "../../../../lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  getDashboardDb();
  const runs = listCheckRuns(parseInt(params.id));
  return NextResponse.json(runs);
}

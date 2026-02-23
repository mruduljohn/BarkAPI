import { NextRequest, NextResponse } from "next/server";
import { getEndpoint } from "@barkapi/core";
import { getDashboardDb } from "../../../../../lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; eid: string } }
) {
  getDashboardDb();
  const endpoint = getEndpoint(parseInt(params.eid));
  if (!endpoint) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(endpoint);
}

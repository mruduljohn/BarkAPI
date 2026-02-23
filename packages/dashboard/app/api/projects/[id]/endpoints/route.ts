import { NextRequest, NextResponse } from "next/server";
import { listEndpoints } from "@barkapi/core";
import { getDashboardDb } from "../../../../lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  getDashboardDb();
  const endpoints = listEndpoints(parseInt(params.id));
  return NextResponse.json(endpoints);
}

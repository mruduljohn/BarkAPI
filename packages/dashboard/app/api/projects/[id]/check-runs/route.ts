import { NextRequest, NextResponse } from "next/server";
import { listCheckRuns, countCheckRuns } from "barkapi-core";
import { getDashboardDb } from "../../../../lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  getDashboardDb();
  const projectId = parseInt(params.id);
  const url = req.nextUrl;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const offset = (page - 1) * limit;

  const total = countCheckRuns(projectId);
  const runs = listCheckRuns(projectId, limit, offset);

  return NextResponse.json({
    data: runs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

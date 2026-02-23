import { NextRequest, NextResponse } from "next/server";
import {
  getProjectByName,
  createProject,
  createEndpoint,
  createCheckRun,
  finishCheckRun,
  createDriftsBatch,
  updateEndpointStatus,
} from "@barkapi/core";
import { getDashboardDb } from "../../lib/db";

/**
 * POST /api/check-runs
 * Receives a full check result from the CLI `report --push` command
 */
export async function POST(req: NextRequest) {
  getDashboardDb();
  const body = await req.json();

  // Ensure project exists
  let project = getProjectByName(body.projectName);
  if (!project) {
    project = createProject(body.projectName, "unknown", "unknown");
  }

  // Create check run
  const checkRun = createCheckRun(project.id);

  // Process each endpoint result
  for (const ep of body.endpoints || []) {
    const endpoint = createEndpoint(project.id, ep.method, ep.path);

    if (ep.drifts && ep.drifts.length > 0) {
      createDriftsBatch(checkRun.id, endpoint.id, ep.drifts);
      const hasBreaking = ep.drifts.some((d: any) => d.severity === "breaking");
      updateEndpointStatus(endpoint.id, hasBreaking ? "drifted" : "drifted");
    } else if (ep.error) {
      updateEndpointStatus(endpoint.id, "error");
    } else {
      updateEndpointStatus(endpoint.id, "healthy");
    }
  }

  // Finalize
  finishCheckRun(checkRun.id, {
    total_endpoints: body.totals?.total || 0,
    passing: body.totals?.passing || 0,
    breaking: body.totals?.breaking || 0,
    warning: body.totals?.warning || 0,
  });

  return NextResponse.json({ id: checkRun.id, projectId: project.id }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import {
  getProject,
  getLatestCheckRuns,
  getCheckRunStats,
  countEndpointsByStatus,
  countDriftsByTypeForProject,
  countDriftsBySeverityForProject,
  countTotalDriftsForProject,
} from "@barkapi/core";
import { getDashboardDb } from "../../../../lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  getDashboardDb();
  const projectId = parseInt(params.id);
  const project = getProject(projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const endpointsByStatus = countEndpointsByStatus(projectId);
  const totalDrifts = countTotalDriftsForProject(projectId);
  const driftsByType = countDriftsByTypeForProject(projectId);
  const driftsBySeverity = countDriftsBySeverityForProject(projectId);
  const checkRunStats = getCheckRunStats(projectId);
  const recentRuns = getLatestCheckRuns(projectId, 2);

  const lastRun = recentRuns[0] || null;
  const previousRun = recentRuns[1] || null;

  const formatRun = (run: typeof lastRun) => {
    if (!run) return null;
    const durationMs = run.finished_at
      ? new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()
      : null;
    return {
      id: run.id,
      started_at: run.started_at,
      finished_at: run.finished_at,
      duration_ms: durationMs,
      total_endpoints: run.total_endpoints,
      passing: run.passing,
      breaking: run.breaking,
      warning: run.warning,
    };
  };

  return NextResponse.json({
    project: {
      spec_path: project.spec_path,
      created_at: project.created_at,
      updated_at: project.updated_at,
    },
    endpointsByStatus,
    totalDrifts,
    checkRuns: {
      total: checkRunStats.total,
      avgDurationMs: checkRunStats.avgDurationMs,
      lastRun: formatRun(lastRun),
      previousRun: formatRun(previousRun),
    },
    driftsByType,
    driftsBySeverity,
  });
}

"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { usePolling } from "../../../hooks/use-polling";
import { Card, Badge, Button, GlowCard } from "../../../components/ui";
import { MiniRing } from "../../../components/health-ring";
import { Breadcrumbs } from "../../../components/breadcrumbs";
import { PageTransition } from "../../../components/page-transition";
import { SkeletonChart } from "../../../components/skeleton";
import { ProjectNav } from "../nav";
import { TimelineChart } from "./chart";

interface Project {
  id: number;
  name: string;
}

interface CheckRun {
  id: number;
  started_at: string;
  finished_at: string | null;
  total_endpoints: number;
  passing: number;
  breaking: number;
  warning: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function TimelinePage() {
  const params = useParams();
  const projectId = params.id as string;
  const [page, setPage] = useState(1);

  const { data: project } = usePolling<Project>(`/api/projects/${projectId}`);
  const { data: response, loading, lastUpdated } = usePolling<PaginatedResponse<CheckRun>>(
    `/api/projects/${projectId}/check-runs?page=${page}&limit=50`
  );

  const checkRuns = response?.data || [];
  const pagination = response?.pagination;

  return (
    <PageTransition>
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/" },
          { label: project?.name || "...", href: `/projects/${projectId}` },
          { label: "Timeline" },
        ]}
      />
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Timeline</h1>
        {lastUpdated && (
          <span className="text-xs text-[var(--muted)]">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
      <p className="text-[var(--muted)] text-sm mb-4">
        Check run history and drift over time
      </p>
      <ProjectNav projectId={projectId} active="timeline" />

      <div className="mt-6">
        {loading ? (
          <SkeletonChart />
        ) : checkRuns.length === 0 ? (
          <Card>
            <p className="text-[var(--muted)] text-center py-8">
              No check runs yet. Run <code className="text-[var(--foreground)]">barkapi check</code> to start tracking.
            </p>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <h3 className="text-sm font-semibold mb-4">Drift Over Time</h3>
              <TimelineChart runs={checkRuns} />
            </Card>

            <h3 className="text-lg font-semibold mb-3">
              Check Runs ({pagination?.total ?? checkRuns.length})
            </h3>
            <div className="space-y-2">
              {checkRuns.map((run) => {
                const durationMs = run.finished_at
                  ? new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()
                  : null;
                const healthPct = run.total_endpoints > 0
                  ? Math.round((run.passing / run.total_endpoints) * 100)
                  : 0;
                return (
                  <GlowCard
                    key={run.id}
                    color={run.breaking > 0 ? "red" : run.warning > 0 ? "yellow" : "green"}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <MiniRing value={healthPct} size={36} strokeWidth={3} />
                        <div>
                          <span className="text-sm font-mono font-medium">
                            Run #{run.id}
                          </span>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-[var(--muted)]">
                              {new Date(run.started_at).toLocaleString()}
                            </span>
                            {durationMs != null && (
                              <Badge color="gray">{(durationMs / 1000).toFixed(1)}s</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge color="green">{run.passing} passing</Badge>
                        {run.warning > 0 && (
                          <Badge color="yellow">{run.warning} warning</Badge>
                        )}
                        {run.breaking > 0 && (
                          <Badge color="red">{run.breaking} breaking</Badge>
                        )}
                      </div>
                    </div>
                  </GlowCard>
                );
              })}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-[var(--muted)]">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}

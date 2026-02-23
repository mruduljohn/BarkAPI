"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { usePolling } from "../../../hooks/use-polling";
import { Card, Badge, Button } from "../../../components/ui";
import { ProjectNav } from "../nav";
import { TimelineChart } from "./chart";

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
  const [page, setPage] = useState(1);
  const { data: response, loading, lastUpdated } = usePolling<PaginatedResponse<CheckRun>>(
    `/api/projects/${params.id}/check-runs?page=${page}&limit=50`
  );

  const checkRuns = response?.data || [];
  const pagination = response?.pagination;

  return (
    <div>
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
      <ProjectNav projectId={params.id as string} active="timeline" />

      <div className="mt-6">
        {loading ? (
          <p className="text-[var(--muted)]">Loading...</p>
        ) : checkRuns.length === 0 ? (
          <Card>
            <p className="text-[var(--muted)] text-center py-8">
              No check runs yet.
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
              {checkRuns.map((run) => (
                <Card key={run.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-mono">
                      Run #{run.id}
                    </span>
                    <span className="text-xs text-[var(--muted)] ml-3">
                      {new Date(run.started_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {run.breaking > 0 && (
                      <Badge color="red">{run.breaking} breaking</Badge>
                    )}
                    {run.warning > 0 && (
                      <Badge color="yellow">{run.warning} warning</Badge>
                    )}
                    <Badge color="green">{run.passing} passing</Badge>
                    <Badge color="gray">{run.total_endpoints} total</Badge>
                  </div>
                </Card>
              ))}
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
    </div>
  );
}

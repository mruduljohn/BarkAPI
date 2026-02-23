"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Badge } from "../../../components/ui";
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

export default function TimelinePage() {
  const params = useParams();
  const [runs, setRuns] = useState<CheckRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${params.id}/check-runs`)
      .then((r) => r.json())
      .then(setRuns)
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Timeline</h1>
      <p className="text-[var(--muted)] text-sm mb-4">
        Check run history and drift over time
      </p>
      <ProjectNav projectId={params.id as string} active="timeline" />

      <div className="mt-6">
        {loading ? (
          <p className="text-[var(--muted)]">Loading...</p>
        ) : runs.length === 0 ? (
          <Card>
            <p className="text-[var(--muted)] text-center py-8">
              No check runs yet.
            </p>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <h3 className="text-sm font-semibold mb-4">Drift Over Time</h3>
              <TimelineChart runs={runs} />
            </Card>

            <h3 className="text-lg font-semibold mb-3">
              Check Runs ({runs.length})
            </h3>
            <div className="space-y-2">
              {runs.map((run) => (
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
          </>
        )}
      </div>
    </div>
  );
}

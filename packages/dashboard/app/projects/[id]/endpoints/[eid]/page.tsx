"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePolling } from "../../../../hooks/use-polling";
import { Card, Badge, CodeBlock, StatusDot } from "../../../../components/ui";

interface Project {
  id: number;
  name: string;
}

interface Endpoint {
  id: number;
  method: string;
  path: string;
  status: "healthy" | "drifted" | "error";
}

interface Drift {
  id: number;
  field_path: string;
  drift_type: string;
  severity: "breaking" | "warning" | "info";
  expected: string | null;
  actual: string | null;
  detected_at: string;
}

const severityColors: Record<string, "red" | "yellow" | "blue"> = {
  breaking: "red",
  warning: "yellow",
  info: "blue",
};

const severityIcons: Record<string, string> = {
  breaking: "\u2717",
  warning: "\u26A0",
  info: "\u2139",
};

export default function EndpointDetail() {
  const params = useParams();
  const projectId = params.id as string;
  const endpointId = params.eid as string;

  const { data: project } = usePolling<Project>(
    `/api/projects/${projectId}`
  );
  const { data: endpoint, loading } = usePolling<Endpoint>(
    `/api/projects/${projectId}/endpoints/${endpointId}`
  );
  const { data: drifts, lastUpdated } = usePolling<Drift[]>(
    `/api/projects/${projectId}/endpoints/${endpointId}/drifts`
  );

  if (loading) {
    return <p className="text-[var(--muted)]">Loading...</p>;
  }

  if (!project || !endpoint) return <div>Not found</div>;

  const driftList = drifts || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          &larr; {project.name}
        </Link>
        {lastUpdated && (
          <span className="text-xs text-[var(--muted)]">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <StatusDot status={endpoint.status} />
        <span className="text-sm font-mono font-bold text-[var(--accent)]">
          {endpoint.method}
        </span>
        <h1 className="text-xl font-mono">{endpoint.path}</h1>
        <Badge
          color={
            endpoint.status === "healthy"
              ? "green"
              : endpoint.status === "drifted"
                ? "yellow"
                : "red"
          }
        >
          {endpoint.status}
        </Badge>
      </div>

      {driftList.length === 0 ? (
        <Card>
          <p className="text-[var(--muted)] text-center py-8">
            No drift detected for this endpoint.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Drifts ({driftList.length})
          </h2>
          {driftList.map((drift) => (
            <Card key={drift.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    {severityIcons[drift.severity]}
                  </span>
                  <code className="text-sm font-mono text-[var(--foreground)]">
                    {drift.field_path}
                  </code>
                  <Badge color={severityColors[drift.severity]}>
                    {drift.severity}
                  </Badge>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {drift.drift_type}
                </span>
              </div>
              {(drift.expected || drift.actual) && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--muted)] mb-1">
                      Expected (spec)
                    </p>
                    <CodeBlock>{drift.expected || "\u2014"}</CodeBlock>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted)] mb-1">
                      Actual (response)
                    </p>
                    <CodeBlock>{drift.actual || "\u2014"}</CodeBlock>
                  </div>
                </div>
              )}
              <p className="text-xs text-[var(--muted)] mt-2">
                Detected: {new Date(drift.detected_at).toLocaleString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

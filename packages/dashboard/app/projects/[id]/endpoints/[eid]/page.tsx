import Link from "next/link";
import {
  getProject,
  getEndpoint,
  listDriftsByEndpoint,
} from "@barkapi/core";
import { getDashboardDb } from "../../../../lib/db";
import { Card, Badge, CodeBlock, StatusDot } from "../../../../components/ui";

export const dynamic = "force-dynamic";

export default function EndpointDetail({
  params,
}: {
  params: { id: string; eid: string };
}) {
  getDashboardDb();
  const project = getProject(parseInt(params.id));
  const endpoint = getEndpoint(parseInt(params.eid));
  if (!project || !endpoint) return <div>Not found</div>;

  const drifts = listDriftsByEndpoint(endpoint.id);

  const severityColors: Record<string, "red" | "yellow" | "blue"> = {
    breaking: "red",
    warning: "yellow",
    info: "blue",
  };

  const severityIcons: Record<string, string> = {
    breaking: "✗",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/projects/${params.id}`}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← {project.name}
        </Link>
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

      {drifts.length === 0 ? (
        <Card>
          <p className="text-[var(--muted)] text-center py-8">
            No drift detected for this endpoint.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Drifts ({drifts.length})
          </h2>
          {drifts.map((drift: any) => (
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
                    <CodeBlock>{drift.expected || "—"}</CodeBlock>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted)] mb-1">
                      Actual (response)
                    </p>
                    <CodeBlock>{drift.actual || "—"}</CodeBlock>
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

import Link from "next/link";
import { getProject, listEndpoints, listCheckRuns } from "@barkapi/core";
import { getDashboardDb } from "../../lib/db";
import { Card, Badge, StatusDot } from "../../components/ui";
import { ProjectNav } from "./nav";

export const dynamic = "force-dynamic";

export default function ProjectEndpoints({
  params,
}: {
  params: { id: string };
}) {
  getDashboardDb();
  const project = getProject(parseInt(params.id));
  if (!project) return <div>Project not found</div>;

  const endpoints = listEndpoints(project.id);
  const lastRun = listCheckRuns(project.id, 1)[0];

  const methodColors: Record<string, string> = {
    GET: "text-green-400",
    POST: "text-blue-400",
    PUT: "text-yellow-400",
    PATCH: "text-purple-400",
    DELETE: "text-red-400",
  };

  const statusColors: Record<string, string> = {
    healthy: "border-green-500/30 bg-green-500/5",
    drifted: "border-yellow-500/30 bg-yellow-500/5",
    error: "border-red-500/30 bg-red-500/5",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {lastRun && (
          <span className="text-sm text-[var(--muted)]">
            Last check: {new Date(lastRun.started_at).toLocaleString()}
          </span>
        )}
      </div>
      <p className="text-[var(--muted)] text-sm mb-4">{project.base_url}</p>
      <ProjectNav projectId={params.id} active="endpoints" />

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">
          Endpoint Health Map ({endpoints.length})
        </h2>
        {endpoints.length === 0 ? (
          <Card>
            <p className="text-[var(--muted)] text-center py-8">
              No endpoints tracked yet.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {endpoints.map((ep: any) => (
              <Link
                key={ep.id}
                href={`/projects/${params.id}/endpoints/${ep.id}`}
              >
                <Card
                  className={`hover:border-[var(--accent)]/50 transition-colors cursor-pointer border ${statusColors[ep.status]}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <StatusDot status={ep.status} />
                    <span
                      className={`text-xs font-mono font-bold ${methodColors[ep.method] || ""}`}
                    >
                      {ep.method}
                    </span>
                  </div>
                  <p className="font-mono text-sm truncate">{ep.path}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge
                      color={
                        ep.status === "healthy"
                          ? "green"
                          : ep.status === "drifted"
                            ? "yellow"
                            : "red"
                      }
                    >
                      {ep.status}
                    </Badge>
                    {ep.last_checked_at && (
                      <span className="text-xs text-[var(--muted)]">
                        {new Date(ep.last_checked_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

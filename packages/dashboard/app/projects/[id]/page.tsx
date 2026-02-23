"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePolling } from "../../hooks/use-polling";
import { Card, Badge, StatusDot } from "../../components/ui";
import { EmptyState } from "../../components/empty-state";
import { ProjectNav } from "./nav";

interface Project {
  id: number;
  name: string;
  base_url: string;
}

interface Endpoint {
  id: number;
  method: string;
  path: string;
  status: "healthy" | "drifted" | "error";
  last_checked_at: string | null;
}

interface CheckRun {
  id: number;
  started_at: string;
  total_endpoints: number;
  passing: number;
  breaking: number;
  warning: number;
}

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

export default function ProjectEndpoints() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, loading: loadingProject, lastUpdated } = usePolling<Project>(
    `/api/projects/${projectId}`
  );
  const { data: endpoints } = usePolling<Endpoint[]>(
    `/api/projects/${projectId}/endpoints`
  );
  const { data: runs } = usePolling<CheckRun[]>(
    `/api/projects/${projectId}/check-runs`
  );

  if (loadingProject) {
    return <p className="text-[var(--muted)]">Loading...</p>;
  }

  if (!project) return <div>Project not found</div>;

  const eps = endpoints || [];
  const lastRun = runs?.[0] || null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs text-[var(--muted)]">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {lastRun && (
            <span className="text-sm text-[var(--muted)]">
              Last check: {new Date(lastRun.started_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <p className="text-[var(--muted)] text-sm mb-4">{project.base_url}</p>
      <ProjectNav projectId={projectId} active="endpoints" />

      {lastRun && (
        <div className="mt-6 grid gap-3 grid-cols-4">
          <Card>
            <p className="text-xs text-[var(--muted)] mb-1">Total</p>
            <p className="text-2xl font-bold">{lastRun.total_endpoints}</p>
          </Card>
          <Card>
            <p className="text-xs text-green-400 mb-1">Passing</p>
            <p className="text-2xl font-bold text-green-400">{lastRun.passing}</p>
          </Card>
          <Card>
            <p className="text-xs text-yellow-400 mb-1">Warning</p>
            <p className="text-2xl font-bold text-yellow-400">{lastRun.warning}</p>
          </Card>
          <Card>
            <p className="text-xs text-red-400 mb-1">Breaking</p>
            <p className="text-2xl font-bold text-red-400">{lastRun.breaking}</p>
          </Card>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">
          Endpoint Health Map ({eps.length})
        </h2>
        {eps.length === 0 ? (
          <EmptyState message="No endpoints tracked yet." command="barkapi check" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {eps.map((ep) => (
              <Link
                key={ep.id}
                href={`/projects/${projectId}/endpoints/${ep.id}`}
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

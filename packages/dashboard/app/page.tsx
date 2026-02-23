"use client";
import Link from "next/link";
import { usePolling } from "./hooks/use-polling";
import { useSSE } from "./hooks/use-sse";
import { Card, Badge, StatusDot } from "./components/ui";
import { EmptyState } from "./components/empty-state";

interface Project {
  id: number;
  name: string;
  base_url: string;
  created_at: string;
  updated_at: string;
}

interface Endpoint {
  id: number;
  project_id: number;
  method: string;
  path: string;
  status: "healthy" | "drifted" | "error";
  last_checked_at: string | null;
}

interface CheckRun {
  id: number;
  started_at: string;
}

export default function ProjectsPage() {
  // SSE for real-time updates, with polling fallback
  const sse = useSSE<Project[]>("/api/sse", { event: "projects" });
  const poll = usePolling<Project[]>("/api/projects", { enabled: !sse.data });
  const projects = sse.data || poll.data;
  const loading = sse.loading && poll.loading;
  const lastUpdated = sse.lastUpdated || poll.lastUpdated;

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Projects</h1>
        <p className="text-[var(--muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        {lastUpdated && (
          <span className="text-xs text-[var(--muted)]">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
      {!projects || projects.length === 0 ? (
        <EmptyState
          message="No projects yet."
          command="barkapi dev"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const { data: endpoints } = usePolling<Endpoint[]>(
    `/api/projects/${project.id}/endpoints`
  );
  const { data: runsResponse } = usePolling<{ data: CheckRun[] }>(
    `/api/projects/${project.id}/check-runs?limit=1`
  );

  const eps = endpoints || [];
  const lastRun = runsResponse?.data?.[0] || null;

  const healthy = eps.filter((e) => e.status === "healthy").length;
  const drifted = eps.filter((e) => e.status === "drifted").length;
  const errored = eps.filter((e) => e.status === "error").length;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:border-[var(--accent)]/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h2 className="font-semibold text-lg">{project.name}</h2>
          {drifted > 0 || errored > 0 ? (
            <Badge color="red">Drift detected</Badge>
          ) : eps.length > 0 ? (
            <Badge color="green">Healthy</Badge>
          ) : (
            <Badge color="gray">No data</Badge>
          )}
        </div>
        <p className="text-sm text-[var(--muted)] mb-4 truncate">
          {project.base_url}
        </p>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <StatusDot status="healthy" /> {healthy}
          </span>
          <span className="flex items-center gap-1.5">
            <StatusDot status="drifted" /> {drifted}
          </span>
          <span className="flex items-center gap-1.5">
            <StatusDot status="error" /> {errored}
          </span>
        </div>
        {lastRun && (
          <p className="text-xs text-[var(--muted)] mt-3">
            Last check: {new Date(lastRun.started_at).toLocaleString()}
          </p>
        )}
      </Card>
    </Link>
  );
}

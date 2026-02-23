import Link from "next/link";
import { listProjects, listCheckRuns, listEndpoints } from "@barkapi/core";
import { getDashboardDb } from "./lib/db";
import { Card, Badge, StatusDot } from "./components/ui";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  getDashboardDb();
  const projects = listProjects();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Projects</h1>
      {projects.length === 0 ? (
        <Card>
          <p className="text-[var(--muted)] text-center py-8">
            No projects yet. Run{" "}
            <code className="bg-black px-2 py-1 rounded text-sm">
              barkapi report --push
            </code>{" "}
            to send data here.
          </p>
        </Card>
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

function ProjectCard({ project }: { project: any }) {
  const endpoints = listEndpoints(project.id);
  const runs = listCheckRuns(project.id, 1);
  const lastRun = runs[0];

  const healthy = endpoints.filter((e: any) => e.status === "healthy").length;
  const drifted = endpoints.filter((e: any) => e.status === "drifted").length;
  const errored = endpoints.filter((e: any) => e.status === "error").length;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:border-[var(--accent)]/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h2 className="font-semibold text-lg">{project.name}</h2>
          {drifted > 0 || errored > 0 ? (
            <Badge color="red">Drift detected</Badge>
          ) : endpoints.length > 0 ? (
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

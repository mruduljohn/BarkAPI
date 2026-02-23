"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePolling } from "./hooks/use-polling";
import { useSSE } from "./hooks/use-sse";
import { Card, Badge, StatusDot, RelativeTime } from "./components/ui";
import { MiniRing } from "./components/health-ring";
import { EmptyState } from "./components/empty-state";
import { PageTransition } from "./components/page-transition";
import { SkeletonCard } from "./components/skeleton";

interface Project {
  id: number;
  name: string;
  spec_path: string;
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
  total_endpoints: number;
  passing: number;
}

interface ProjectStats {
  totalDrifts: number;
}

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ProjectsPage() {
  const sse = useSSE<Project[]>("/api/sse", { event: "projects" });
  const poll = usePolling<Project[]>("/api/projects", { enabled: !sse.data });
  const projects = sse.data || poll.data;
  const loading = sse.loading && poll.loading;
  const lastUpdated = sse.lastUpdated || poll.lastUpdated;

  if (loading) {
    return (
      <PageTransition>
        <h1 className="text-2xl font-bold mb-6">Projects</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
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
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project) => (
            <motion.div key={project.id} variants={staggerItem}>
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageTransition>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const { data: endpoints } = usePolling<Endpoint[]>(
    `/api/projects/${project.id}/endpoints`
  );
  const { data: runsResponse } = usePolling<{ data: CheckRun[] }>(
    `/api/projects/${project.id}/check-runs?limit=1`
  );
  const { data: stats } = usePolling<ProjectStats>(
    `/api/projects/${project.id}/stats`
  );

  const eps = endpoints || [];
  const lastRun = runsResponse?.data?.[0] || null;

  const healthy = eps.filter((e) => e.status === "healthy").length;
  const drifted = eps.filter((e) => e.status === "drifted").length;
  const errored = eps.filter((e) => e.status === "error").length;

  const healthPct =
    lastRun && lastRun.total_endpoints > 0
      ? Math.round((lastRun.passing / lastRun.total_endpoints) * 100)
      : eps.length > 0
        ? Math.round((healthy / eps.length) * 100)
        : 0;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">{project.name}</h2>
            <p className="text-sm text-[var(--muted)] truncate mt-0.5">
              {project.base_url}
            </p>
            {project.spec_path && (
              <p className="text-xs font-mono text-[var(--muted)] mt-1 truncate opacity-70">
                {project.spec_path}
              </p>
            )}
          </div>
          {eps.length > 0 && (
            <MiniRing value={healthPct} size={36} strokeWidth={3} className="flex-shrink-0 ml-3" />
          )}
        </div>

        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <StatusDot status="healthy" />
            <span>{healthy} healthy</span>
          </span>
          <span className="flex items-center gap-1.5">
            <StatusDot status="drifted" />
            <span>{drifted} drifted</span>
          </span>
          <span className="flex items-center gap-1.5">
            <StatusDot status="error" />
            <span>{errored} error{errored !== 1 ? "s" : ""}</span>
          </span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <RelativeTime date={project.created_at} prefix="Created" />
            {stats && stats.totalDrifts > 0 && (
              <Badge color="yellow">{stats.totalDrifts} drift{stats.totalDrifts !== 1 ? "s" : ""}</Badge>
            )}
          </div>
          {lastRun && (
            <span className="text-xs text-[var(--muted)]">
              Last check: {new Date(lastRun.started_at).toLocaleString()}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}

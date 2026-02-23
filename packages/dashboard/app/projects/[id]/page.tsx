"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { usePolling } from "../../hooks/use-polling";
import { useSSE } from "../../hooks/use-sse";
import {
  Card,
  Badge,
  StatusDot,
  GlowCard,
  AnimatedNumber,
  DeltaIndicator,
  RelativeTime,
  SegmentedBar,
  DriftTypeBadge,
  GradientBlob,
  BentoGrid,
} from "../../components/ui";
import { HealthRing } from "../../components/health-ring";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { EmptyState } from "../../components/empty-state";
import { PageTransition } from "../../components/page-transition";
import { SkeletonStat, SkeletonCard } from "../../components/skeleton";
import { ProjectNav } from "./nav";

interface Project {
  id: number;
  name: string;
  spec_path: string;
  base_url: string;
  created_at: string;
  updated_at: string;
}

interface StatsRunInfo {
  id: number;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  total_endpoints: number;
  passing: number;
  breaking: number;
  warning: number;
}

interface ProjectStats {
  project: { spec_path: string; created_at: string; updated_at: string };
  endpointsByStatus: Record<string, number>;
  totalDrifts: number;
  checkRuns: {
    total: number;
    avgDurationMs: number | null;
    lastRun: StatsRunInfo | null;
    previousRun: StatsRunInfo | null;
  };
  driftsByType: Record<string, number>;
  driftsBySeverity: Record<string, number>;
}

interface Endpoint {
  id: number;
  method: string;
  path: string;
  status: "healthy" | "drifted" | "error";
  last_checked_at: string | null;
  drift_count?: number;
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

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ProjectEndpoints() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, loading: loadingProject, lastUpdated } = usePolling<Project>(
    `/api/projects/${projectId}`
  );

  const sseEndpoints = useSSE<Endpoint[]>(`/api/sse?projectId=${projectId}`, { event: "endpoints" });
  const pollEndpoints = usePolling<Endpoint[]>(
    `/api/projects/${projectId}/endpoints`,
    { enabled: !sseEndpoints.data }
  );
  const endpoints = sseEndpoints.data || pollEndpoints.data;

  const { data: stats } = usePolling<ProjectStats>(`/api/projects/${projectId}/stats`);

  if (loadingProject) {
    return (
      <PageTransition>
        <div className="h-8 w-48 rounded bg-white/[0.04] mb-4" />
        <div className="h-4 w-64 rounded bg-white/[0.04] mb-4" />
        <div className="mt-6 grid gap-3 grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonStat key={i} />)}
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </PageTransition>
    );
  }

  if (!project) return <div>Project not found</div>;

  const eps = endpoints || [];
  const lastRun = stats?.checkRuns.lastRun || null;
  const prevRun = stats?.checkRuns.previousRun || null;
  const healthPct =
    lastRun && lastRun.total_endpoints > 0
      ? Math.round((lastRun.passing / lastRun.total_endpoints) * 100)
      : 0;

  return (
    <PageTransition>
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/" },
          { label: project.name },
        ]}
      />
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {lastUpdated && (
          <span className="text-xs text-[var(--muted)]">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
      <p className="text-[var(--muted)] text-sm mb-4">{project.base_url}</p>
      <ProjectNav projectId={projectId} active="endpoints" />

      {/* Bento Grid — Hero Stats */}
      {stats && lastRun && lastRun.total_endpoints > 0 && (
        <BentoGrid className="mt-6 grid-cols-4 grid-rows-2">
          {/* Health Ring — spans 2 rows, 2 cols */}
          <GlowCard color="blue" className="col-span-2 row-span-2 relative overflow-hidden">
            <GradientBlob />
            <div className="relative z-10 flex items-center gap-6 h-full">
              <HealthRing value={healthPct} size={150} strokeWidth={10} />
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--muted)]">Project Health</p>
                <p className="text-xs font-mono text-[var(--muted)] opacity-70">
                  {project.spec_path}
                </p>
                <div className="flex items-center gap-3">
                  <RelativeTime date={project.created_at} prefix="Created" />
                  <RelativeTime date={project.updated_at} prefix="Updated" />
                </div>
                {stats.checkRuns.lastRun?.duration_ms != null && (
                  <p className="text-xs text-[var(--muted)]">
                    Last run: {(stats.checkRuns.lastRun.duration_ms / 1000).toFixed(1)}s
                  </p>
                )}
                <p className="text-xs text-[var(--muted)]">
                  {stats.checkRuns.total} check run{stats.checkRuns.total !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </GlowCard>

          {/* Passing */}
          <GlowCard color="green">
            <p className="text-xs text-green-400 mb-1">Passing</p>
            <p className="text-4xl font-bold text-green-400">
              <AnimatedNumber value={lastRun.passing} />
            </p>
            {prevRun && (
              <DeltaIndicator value={lastRun.passing - prevRun.passing} />
            )}
          </GlowCard>

          {/* Breaking */}
          <GlowCard color="red">
            <p className="text-xs text-red-400 mb-1">Breaking</p>
            <p className="text-4xl font-bold text-red-400">
              <AnimatedNumber value={lastRun.breaking} />
            </p>
            {prevRun && (
              <DeltaIndicator value={lastRun.breaking - prevRun.breaking} invert />
            )}
          </GlowCard>

          {/* Warning */}
          <GlowCard color="yellow">
            <p className="text-xs text-yellow-400 mb-1">Warning</p>
            <p className="text-4xl font-bold text-yellow-400">
              <AnimatedNumber value={lastRun.warning} />
            </p>
            {prevRun && (
              <DeltaIndicator value={lastRun.warning - prevRun.warning} invert />
            )}
          </GlowCard>

          {/* Total Endpoints */}
          <GlowCard color="blue">
            <p className="text-xs text-[var(--muted)] mb-1">Endpoints</p>
            <p className="text-4xl font-bold">
              <AnimatedNumber value={lastRun.total_endpoints} />
            </p>
            {prevRun && (
              <DeltaIndicator value={lastRun.total_endpoints - prevRun.total_endpoints} />
            )}
          </GlowCard>
        </BentoGrid>
      )}

      {/* Drift Type Distribution */}
      {stats && stats.totalDrifts > 0 && (
        <Card className="mt-4">
          <p className="text-sm font-medium mb-3">Drift Type Distribution</p>
          <SegmentedBar
            className="h-3 rounded-lg"
            segments={Object.entries(stats.driftsByType).map(([type, count]) => ({
              value: count,
              color:
                type === "removed" || type === "type_changed" || type === "required_changed"
                  ? "bg-red-500"
                  : type === "nullability_changed" || type === "enum_changed" || type === "format_changed"
                    ? "bg-yellow-500"
                    : "bg-blue-500",
            }))}
          />
          <div className="flex flex-wrap gap-3 mt-3">
            {Object.entries(stats.driftsByType).map(([type, count]) => (
              <span key={type} className="inline-flex items-center gap-1.5">
                <DriftTypeBadge type={type} />
                <span className="text-xs text-[var(--muted)] font-medium">{count}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Endpoint Health Map */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">
            Endpoint Health Map ({eps.length})
          </h2>
        </div>
        <p className="text-xs text-[var(--muted)] mb-4">
          Click an endpoint to view its schema and drift details
        </p>
        {eps.length === 0 ? (
          <EmptyState message="No endpoints tracked yet." command="barkapi check" />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
          >
            {eps.map((ep) => (
              <motion.div key={ep.id} variants={staggerItem}>
                <Link href={`/projects/${projectId}/endpoints/${ep.id}`}>
                  <Card className={`cursor-pointer border ${statusColors[ep.status]}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusDot status={ep.status} />
                      <span className={`text-xs font-mono font-bold ${methodColors[ep.method] || ""}`}>
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
                      <div className="flex items-center gap-2">
                        {ep.drift_count != null && ep.drift_count > 0 && (
                          <span className="text-xs text-yellow-400 font-medium">
                            {ep.drift_count} drift{ep.drift_count !== 1 ? "s" : ""}
                          </span>
                        )}
                        {ep.last_checked_at && (
                          <span className="text-xs text-[var(--muted)]">
                            {new Date(ep.last_checked_at).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}

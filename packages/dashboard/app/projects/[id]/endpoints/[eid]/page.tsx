"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { XCircle, AlertTriangle, Info } from "lucide-react";
import { usePolling } from "../../../../hooks/use-polling";
import {
  Card,
  Badge,
  Button,
  Tabs,
  StatusDot,
  DriftTypeBadge,
  RelativeTime,
  SegmentedBar,
  GlowCard,
  AnimatedNumber,
  GradientBlob,
  BentoGrid,
} from "../../../../components/ui";
import { Breadcrumbs } from "../../../../components/breadcrumbs";
import { DiffDisplay } from "../../../../components/diff-display";
import { SchemaViewer } from "../../../../components/schema-viewer";
import { PageTransition } from "../../../../components/page-transition";
import { SkeletonCard } from "../../../../components/skeleton";

interface Project {
  id: number;
  name: string;
}

interface Endpoint {
  id: number;
  method: string;
  path: string;
  status: "healthy" | "drifted" | "error";
  created_at: string;
}

interface EndpointStats {
  totalDrifts: number;
  driftsByType: Record<string, number>;
  driftsBySeverity: Record<string, number>;
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

interface SchemaData {
  responseSchema: Record<string, any> | null;
  requestBodySchema: Record<string, any> | null;
  statusCode: string | null;
  drifts: Drift[];
  driftsByField: Record<string, Drift[]>;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const methodColors: Record<string, string> = {
  GET: "text-green-400",
  POST: "text-blue-400",
  PUT: "text-yellow-400",
  PATCH: "text-purple-400",
  DELETE: "text-red-400",
};

const SeverityIcon = ({ severity }: { severity: string }) => {
  switch (severity) {
    case "breaking":
      return <XCircle className="w-4 h-4 text-red-400" />;
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    default:
      return <Info className="w-4 h-4 text-blue-400" />;
  }
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function EndpointDetail() {
  const params = useParams();
  const projectId = params.id as string;
  const endpointId = params.eid as string;
  const [activeTab, setActiveTab] = useState("overview");
  const [page, setPage] = useState(1);

  const { data: project } = usePolling<Project>(`/api/projects/${projectId}`);
  const { data: endpoint, loading } = usePolling<Endpoint>(
    `/api/projects/${projectId}/endpoints/${endpointId}`
  );
  const { data: driftsResponse } = usePolling<PaginatedResponse<Drift>>(
    `/api/projects/${projectId}/endpoints/${endpointId}/drifts?page=${page}&limit=50`
  );
  const { data: epStats } = usePolling<EndpointStats>(
    `/api/projects/${projectId}/endpoints/${endpointId}/stats`
  );
  const { data: schemaData, loading: schemaLoading } = usePolling<SchemaData>(
    `/api/projects/${projectId}/endpoints/${endpointId}/schema`,
    { interval: 30000, enabled: activeTab === "schema" }
  );

  if (loading) {
    return (
      <PageTransition>
        <div className="h-4 w-32 rounded bg-white/[0.04] mb-4" />
        <div className="h-8 w-64 rounded bg-white/[0.04] mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </PageTransition>
    );
  }

  if (!project || !endpoint) return <div>Not found</div>;

  const driftList = driftsResponse?.data || [];
  const pagination = driftsResponse?.pagination;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "schema", label: "Schema" },
    { id: "history", label: "History" },
  ];

  return (
    <PageTransition>
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/" },
          { label: project.name, href: `/projects/${projectId}` },
          { label: `${endpoint.method} ${endpoint.path}` },
        ]}
      />

      {/* Hero header */}
      <div className="flex items-center gap-3 mb-3">
        <StatusDot status={endpoint.status} />
        <span className={`text-sm font-mono font-bold ${methodColors[endpoint.method] || "text-[var(--accent)]"}`}>
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

      <div className="flex items-center gap-4 mb-4">
        {endpoint.created_at && (
          <RelativeTime date={endpoint.created_at} prefix="Tracked since" />
        )}
        {epStats && epStats.totalDrifts > 0 && (
          <span className="text-xs text-[var(--muted)]">{epStats.totalDrifts} total drifts</span>
        )}
      </div>

      {/* Tab navigation */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === "overview" && (
          <OverviewTab endpoint={endpoint} epStats={epStats} />
        )}
        {activeTab === "schema" && (
          <SchemaViewer data={schemaData || null} loading={schemaLoading} />
        )}
        {activeTab === "history" && (
          <HistoryTab
            driftList={driftList}
            pagination={pagination || null}
            page={page}
            setPage={setPage}
          />
        )}
      </div>
    </PageTransition>
  );
}

function OverviewTab({
  endpoint,
  epStats,
}: {
  endpoint: Endpoint;
  epStats: EndpointStats | null | undefined;
}) {
  const totalDrifts = epStats?.totalDrifts || 0;
  const breaking = epStats?.driftsBySeverity?.breaking || 0;
  const warning = epStats?.driftsBySeverity?.warning || 0;
  const info = epStats?.driftsBySeverity?.info || 0;

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <BentoGrid className="grid-cols-4">
        <GlowCard color="blue">
          <p className="text-xs text-[var(--muted)] mb-1">Total Drifts</p>
          <p className="text-4xl font-bold">
            <AnimatedNumber value={totalDrifts} />
          </p>
        </GlowCard>
        <GlowCard color="red">
          <p className="text-xs text-red-400 mb-1">Breaking</p>
          <p className="text-4xl font-bold text-red-400">
            <AnimatedNumber value={breaking} />
          </p>
        </GlowCard>
        <GlowCard color="yellow">
          <p className="text-xs text-yellow-400 mb-1">Warning</p>
          <p className="text-4xl font-bold text-yellow-400">
            <AnimatedNumber value={warning} />
          </p>
        </GlowCard>
        <GlowCard color="blue">
          <p className="text-xs text-blue-400 mb-1">Info</p>
          <p className="text-4xl font-bold text-blue-400">
            <AnimatedNumber value={info} />
          </p>
        </GlowCard>
      </BentoGrid>

      {/* Drift type distribution */}
      {epStats && totalDrifts > 0 && (
        <Card>
          <p className="text-sm font-medium mb-3">Drift Type Distribution</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(epStats.driftsByType).map(([type, count]) => (
              <span key={type} className="inline-flex items-center gap-1">
                <DriftTypeBadge type={type} />
                <span className="text-xs text-[var(--muted)]">{count}</span>
              </span>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)] mb-2">Severity Breakdown</p>
          <SegmentedBar
            className="h-3 rounded-lg"
            segments={[
              { value: breaking, color: "bg-red-500" },
              { value: warning, color: "bg-yellow-500" },
              { value: info, color: "bg-blue-500" },
            ]}
          />
          <div className="flex gap-4 mt-2 text-xs">
            {breaking > 0 && <span className="text-red-400">{breaking} breaking</span>}
            {warning > 0 && <span className="text-yellow-400">{warning} warning</span>}
            {info > 0 && <span className="text-blue-400">{info} info</span>}
          </div>
        </Card>
      )}

      {totalDrifts === 0 && (
        <Card>
          <p className="text-[var(--muted)] text-center py-8">
            No drift detected for this endpoint. Everything matches the spec.
          </p>
        </Card>
      )}
    </div>
  );
}

function HistoryTab({
  driftList,
  pagination,
  page,
  setPage,
}: {
  driftList: Drift[];
  pagination: { page: number; limit: number; total: number; totalPages: number } | null;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
}) {
  if (driftList.length === 0) {
    return (
      <Card>
        <p className="text-[var(--muted)] text-center py-8">
          No drift history for this endpoint.
        </p>
      </Card>
    );
  }

  // Group by field_path
  const grouped: Record<string, Drift[]> = {};
  for (const drift of driftList) {
    if (!grouped[drift.field_path]) grouped[drift.field_path] = [];
    grouped[drift.field_path].push(drift);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        Drifts ({pagination?.total ?? driftList.length})
      </h2>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {Object.entries(grouped).map(([fieldPath, drifts]) => (
          <motion.div key={fieldPath} variants={staggerItem}>
            <Card>
              <code className="text-sm font-mono text-[var(--foreground)] font-medium block mb-2">
                {fieldPath}
              </code>
              <div className="space-y-2">
                {drifts.map((drift) => (
                  <div
                    key={drift.id}
                    className="rounded-lg border border-[var(--border-color)] bg-black/20 p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <SeverityIcon severity={drift.severity} />
                        <Badge
                          color={
                            drift.severity === "breaking"
                              ? "red"
                              : drift.severity === "warning"
                                ? "yellow"
                                : "blue"
                          }
                        >
                          {drift.severity}
                        </Badge>
                        <DriftTypeBadge type={drift.drift_type} />
                      </div>
                      <span className="text-xs text-[var(--muted)]">
                        {new Date(drift.detected_at).toLocaleString()}
                      </span>
                    </div>
                    {(drift.expected || drift.actual) && (
                      <DiffDisplay
                        expected={drift.expected}
                        actual={drift.actual}
                        driftType={drift.drift_type}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button
            variant="secondary"
            onClick={() => setPage((p: number) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-[var(--muted)]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p: number) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

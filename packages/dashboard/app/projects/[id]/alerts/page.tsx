"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MessageSquare, Mail } from "lucide-react";
import { Card, Badge, Button } from "../../../components/ui";
import { Breadcrumbs } from "../../../components/breadcrumbs";
import { PageTransition } from "../../../components/page-transition";
import { SkeletonCard } from "../../../components/skeleton";
import { ProjectNav } from "../nav";
import { usePolling } from "../../../hooks/use-polling";

interface Project {
  id: number;
  name: string;
}

interface AlertConfig {
  id: number;
  type: "slack" | "email";
  config: string;
  min_severity: string;
  enabled: number;
}

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        enabled ? "bg-green-500/30" : "bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function AlertsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"slack" | "email">("slack");
  const [formUrl, setFormUrl] = useState("");
  const [formSeverity, setFormSeverity] = useState("breaking");

  const { data: project } = usePolling<Project>(`/api/projects/${projectId}`);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/alerts`)
      .then((r) => r.json())
      .then(setAlerts)
      .finally(() => setLoading(false));
  }, [projectId]);

  const fetchAlerts = () => {
    fetch(`/api/projects/${projectId}/alerts`)
      .then((r) => r.json())
      .then(setAlerts)
      .finally(() => setLoading(false));
  };

  const handleCreate = async () => {
    const config =
      formType === "slack"
        ? { webhook_url: formUrl }
        : { email: formUrl };

    await fetch(`/api/projects/${projectId}/alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: formType,
        config,
        min_severity: formSeverity,
      }),
    });

    setShowForm(false);
    setFormUrl("");
    fetchAlerts();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/projects/${projectId}/alerts?id=${id}`, {
      method: "DELETE",
    });
    fetchAlerts();
  };

  const handleToggle = async (alert: AlertConfig) => {
    await fetch(`/api/projects/${projectId}/alerts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: alert.id,
        enabled: alert.enabled ? 0 : 1,
      }),
    });
    fetchAlerts();
  };

  return (
    <PageTransition>
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/" },
          { label: project?.name || "...", href: `/projects/${projectId}` },
          { label: "Alerts" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-2">Alerts</h1>
      <p className="text-[var(--muted)] text-sm mb-4">
        Configure notifications for drift events
      </p>
      <ProjectNav projectId={projectId} active="alerts" />

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Alert Configurations ({alerts.length})
          </h3>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add Alert"}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  Type
                </label>
                <select
                  value={formType}
                  onChange={(e) =>
                    setFormType(e.target.value as "slack" | "email")
                  }
                  className="w-full bg-black/50 border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus-ring"
                >
                  <option value="slack">Slack Webhook</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  {formType === "slack" ? "Webhook URL" : "Email Address"}
                </label>
                <input
                  type="text"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder={
                    formType === "slack"
                      ? "https://hooks.slack.com/..."
                      : "alerts@example.com"
                  }
                  className="w-full bg-black/50 border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus-ring"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  Minimum Severity
                </label>
                <select
                  value={formSeverity}
                  onChange={(e) => setFormSeverity(e.target.value)}
                  className="w-full bg-black/50 border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus-ring"
                >
                  <option value="breaking">Breaking only</option>
                  <option value="warning">Warning and above</option>
                  <option value="info">All (including info)</option>
                </select>
              </div>
              <Button onClick={handleCreate}>Create Alert</Button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : alerts.length === 0 && !showForm ? (
          <Card>
            <p className="text-[var(--muted)] text-center py-8">
              No alerts configured. Add one to get notified when drifts are detected.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const config = JSON.parse(alert.config);
              return (
                <Card
                  key={alert.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {alert.type === "slack" ? (
                      <MessageSquare className="w-5 h-5 text-[var(--muted)]" />
                    ) : (
                      <Mail className="w-5 h-5 text-[var(--muted)]" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {alert.type === "slack"
                          ? config.webhook_url || "Slack"
                          : config.email || "Email"}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        Min severity:{" "}
                        <Badge
                          color={
                            alert.min_severity === "breaking"
                              ? "red"
                              : alert.min_severity === "warning"
                                ? "yellow"
                                : "blue"
                          }
                        >
                          {alert.min_severity}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ToggleSwitch
                      enabled={!!alert.enabled}
                      onToggle={() => handleToggle(alert)}
                    />
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(alert.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

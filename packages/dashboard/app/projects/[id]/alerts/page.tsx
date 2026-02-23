"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Badge, Button } from "../../../components/ui";
import { ProjectNav } from "../nav";

interface AlertConfig {
  id: number;
  type: "slack" | "email";
  config: string;
  min_severity: string;
  enabled: number;
}

export default function AlertsPage() {
  const params = useParams();
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"slack" | "email">("slack");
  const [formUrl, setFormUrl] = useState("");
  const [formSeverity, setFormSeverity] = useState("breaking");

  useEffect(() => {
    fetch(`/api/projects/${params.id}/alerts`)
      .then((r) => r.json())
      .then(setAlerts)
      .finally(() => setLoading(false));
  }, [params.id]);

  const fetchAlerts = () => {
    fetch(`/api/projects/${params.id}/alerts`)
      .then((r) => r.json())
      .then(setAlerts)
      .finally(() => setLoading(false));
  };

  const handleCreate = async () => {
    const config =
      formType === "slack"
        ? { webhook_url: formUrl }
        : { email: formUrl };

    await fetch(`/api/projects/${params.id}/alerts`, {
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
    await fetch(`/api/projects/${params.id}/alerts?id=${id}`, {
      method: "DELETE",
    });
    fetchAlerts();
  };

  const handleToggle = async (alert: AlertConfig) => {
    await fetch(`/api/projects/${params.id}/alerts`, {
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
    <div>
      <h1 className="text-2xl font-bold mb-2">Alerts</h1>
      <p className="text-[var(--muted)] text-sm mb-4">
        Configure notifications for drift events
      </p>
      <ProjectNav projectId={params.id as string} active="alerts" />

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
                  className="w-full bg-black border border-[var(--border-color)] rounded px-3 py-2 text-sm"
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
                  className="w-full bg-black border border-[var(--border-color)] rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  Minimum Severity
                </label>
                <select
                  value={formSeverity}
                  onChange={(e) => setFormSeverity(e.target.value)}
                  className="w-full bg-black border border-[var(--border-color)] rounded px-3 py-2 text-sm"
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
          <p className="text-[var(--muted)]">Loading...</p>
        ) : alerts.length === 0 && !showForm ? (
          <Card>
            <p className="text-[var(--muted)] text-center py-8">
              No alerts configured.
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
                    <span className="text-lg">
                      {alert.type === "slack" ? "💬" : "📧"}
                    </span>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(alert)}
                      className={`text-xs px-2 py-1 rounded ${
                        alert.enabled
                          ? "bg-green-500/10 text-green-400"
                          : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {alert.enabled ? "Enabled" : "Disabled"}
                    </button>
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
    </div>
  );
}

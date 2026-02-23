"use client";
import { useState } from "react";
import { Tabs, Badge, Card } from "./ui";
import { SchemaTree } from "./schema-tree";

interface Drift {
  id: number;
  field_path: string;
  drift_type: string;
  severity: "breaking" | "warning" | "info";
  expected: string | null;
  actual: string | null;
}

interface SchemaData {
  responseSchema: Record<string, any> | null;
  requestBodySchema: Record<string, any> | null;
  statusCode: string | null;
  drifts: Drift[];
  driftsByField: Record<string, Drift[]>;
}

const statusCodeColor: Record<string, "green" | "blue" | "yellow" | "red"> = {
  "200": "green",
  "201": "green",
  "204": "green",
  "301": "blue",
  "400": "yellow",
  "404": "yellow",
  "500": "red",
};

export function SchemaViewer({
  data,
  loading,
}: {
  data: SchemaData | null;
  loading: boolean;
}) {
  const [activeTab, setActiveTab] = useState("response");

  if (loading) {
    return (
      <Card>
        <div className="space-y-3 py-8">
          <div className="h-4 w-48 rounded bg-white/[0.04] mx-auto" />
          <div className="h-4 w-64 rounded bg-white/[0.04] mx-auto" />
          <div className="h-4 w-56 rounded bg-white/[0.04] mx-auto" />
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <p className="text-[var(--muted)] text-center py-8">
          Schema data unavailable. Make sure the spec file is accessible.
        </p>
      </Card>
    );
  }

  const hasResponse = !!data.responseSchema;
  const hasRequest = !!data.requestBodySchema;
  const driftCount = data.drifts.length;

  const tabs = [
    ...(hasResponse ? [{ id: "response", label: "Response Body" }] : []),
    ...(hasRequest ? [{ id: "request", label: "Request Body" }] : []),
  ];

  if (tabs.length === 0) {
    return (
      <Card>
        <p className="text-[var(--muted)] text-center py-8">
          No schema defined for this endpoint in the spec.
        </p>
      </Card>
    );
  }

  // Ensure active tab is valid
  if (!tabs.find((t) => t.id === activeTab) && tabs.length > 0) {
    setActiveTab(tabs[0].id);
  }

  return (
    <div className="space-y-4">
      {/* Header with status code and drift summary */}
      <div className="flex items-center gap-3">
        {data.statusCode && (
          <Badge color={statusCodeColor[data.statusCode] || "gray"}>
            {data.statusCode} {data.statusCode === "200" ? "OK" : data.statusCode === "201" ? "Created" : ""}
          </Badge>
        )}
        {driftCount > 0 && (
          <span className="text-xs text-[var(--muted)]">
            <span className="text-yellow-400 font-medium">{driftCount}</span> drift{driftCount !== 1 ? "s" : ""} detected in schema
          </span>
        )}
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      )}

      {/* Schema tree */}
      <Card className="!p-5">
        {activeTab === "response" && hasResponse && (
          <SchemaTree
            schema={data.responseSchema}
            driftsByField={data.driftsByField}
          />
        )}
        {activeTab === "request" && hasRequest && (
          <SchemaTree
            schema={data.requestBodySchema}
            driftsByField={data.driftsByField}
          />
        )}
      </Card>
    </div>
  );
}

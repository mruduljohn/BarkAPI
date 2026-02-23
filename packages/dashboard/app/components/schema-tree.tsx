"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Badge, DriftTypeBadge } from "./ui";

interface Drift {
  id: number;
  field_path: string;
  drift_type: string;
  severity: "breaking" | "warning" | "info";
  expected: string | null;
  actual: string | null;
}

interface SchemaTreeProps {
  schema: Record<string, any> | null;
  driftsByField: Record<string, Drift[]>;
  path?: string;
  depth?: number;
}

const severityBorder: Record<string, string> = {
  breaking: "border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
  warning: "border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]",
  info: "border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]",
};

const severityBg: Record<string, string> = {
  breaking: "bg-red-500/5",
  warning: "bg-yellow-500/5",
  info: "bg-blue-500/5",
};

const typeColors: Record<string, string> = {
  string: "text-green-400 bg-green-500/10 border-green-500/20",
  number: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  integer: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  boolean: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  object: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  array: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  null: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
};

function TypeBadge({ type, format }: { type: string; format?: string }) {
  const color = typeColors[type] || "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${color}`}>
      {type}{format ? `:${format}` : ""}
    </span>
  );
}

export function SchemaTree({ schema, driftsByField, path = "", depth = 0 }: SchemaTreeProps) {
  if (!schema) {
    return (
      <div className="text-sm text-[var(--muted)] py-4 text-center">
        No schema available
      </div>
    );
  }

  if (schema.type === "object" && schema.properties) {
    const required = new Set(schema.required || []);
    return (
      <div className={depth > 0 ? "ml-4 border-l border-[var(--border-color)] pl-3" : ""}>
        {Object.entries(schema.properties).map(([key, prop]: [string, any]) => {
          const fieldPath = path ? `${path}.${key}` : key;
          return (
            <SchemaField
              key={key}
              name={key}
              schema={prop}
              required={required.has(key)}
              driftsByField={driftsByField}
              path={fieldPath}
              depth={depth}
            />
          );
        })}
      </div>
    );
  }

  if (schema.type === "array" && schema.items) {
    const arrayPath = path ? `${path}[]` : "[]";
    return (
      <div className={depth > 0 ? "ml-4 border-l border-[var(--border-color)] pl-3" : ""}>
        <div className="flex items-center gap-2 py-1.5 text-sm">
          <TypeBadge type="array" />
          <span className="text-[var(--muted)] text-xs">of</span>
          <TypeBadge type={schema.items.type || "object"} />
        </div>
        <SchemaTree
          schema={schema.items}
          driftsByField={driftsByField}
          path={arrayPath}
          depth={depth + 1}
        />
      </div>
    );
  }

  // Primitive at root level
  return (
    <div className="flex items-center gap-2 py-1.5 text-sm">
      <TypeBadge type={schema.type || "unknown"} format={schema.format} />
      {schema.enum && (
        <span className="text-xs text-[var(--muted)]">
          enum: [{schema.enum.join(", ")}]
        </span>
      )}
    </div>
  );
}

function SchemaField({
  name,
  schema,
  required,
  driftsByField,
  path,
  depth,
}: {
  name: string;
  schema: Record<string, any>;
  required: boolean;
  driftsByField: Record<string, Drift[]>;
  path: string;
  depth: number;
}) {
  const isExpandable =
    (schema.type === "object" && schema.properties) ||
    (schema.type === "array" && schema.items);
  const [expanded, setExpanded] = useState(depth < 2);

  const fieldDrifts = driftsByField[path] || [];
  const hasDrift = fieldDrifts.length > 0;
  const worstSeverity = hasDrift
    ? fieldDrifts.some((d) => d.severity === "breaking")
      ? "breaking"
      : fieldDrifts.some((d) => d.severity === "warning")
        ? "warning"
        : "info"
    : null;

  return (
    <div
      className={`rounded-md transition-colors ${
        hasDrift && worstSeverity
          ? `${severityBg[worstSeverity]} border-l-2 ${severityBorder[worstSeverity]} pl-2 my-1`
          : ""
      }`}
    >
      {/* Field row */}
      <div
        className={`flex items-center gap-2 py-1.5 text-sm ${
          isExpandable ? "cursor-pointer hover:bg-white/[0.03] rounded px-1 -mx-1" : ""
        }`}
        onClick={isExpandable ? () => setExpanded(!expanded) : undefined}
      >
        {isExpandable && (
          <motion.span
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)]" />
          </motion.span>
        )}
        {!isExpandable && <span className="w-3.5" />}

        <code className="font-mono text-[var(--foreground)] font-medium">{name}</code>
        <TypeBadge
          type={schema.type === "array" ? `array<${schema.items?.type || "object"}>` : schema.type || "unknown"}
          format={schema.format}
        />
        {required ? (
          <span className="text-[10px] text-red-400 font-medium">required</span>
        ) : (
          <span className="text-[10px] text-[var(--muted)]">optional</span>
        )}
        {schema.enum && (
          <span className="text-[10px] text-[var(--muted)]">
            [{schema.enum.join(", ")}]
          </span>
        )}
      </div>

      {/* Drift annotations */}
      {hasDrift && (
        <div className="ml-7 mb-1.5 space-y-1">
          {fieldDrifts.map((drift) => (
            <div
              key={drift.id}
              className="flex items-center gap-2 text-xs rounded-md px-2 py-1 bg-black/30 border border-[var(--border-color)]"
            >
              <DriftTypeBadge type={drift.drift_type} />
              <Badge color={drift.severity === "breaking" ? "red" : drift.severity === "warning" ? "yellow" : "blue"}>
                {drift.severity}
              </Badge>
              {(drift.expected || drift.actual) && (
                <span className="font-mono text-[var(--muted)]">
                  <span className="text-green-400">{drift.expected || "\u2014"}</span>
                  {" \u2192 "}
                  <span className="text-red-400">{drift.actual || "\u2014"}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expandable children */}
      <AnimatePresence>
        {isExpandable && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {schema.type === "array" && schema.items ? (
              <SchemaTree
                schema={schema.items}
                driftsByField={driftsByField}
                path={`${path}[]`}
                depth={depth + 1}
              />
            ) : (
              <SchemaTree
                schema={schema}
                driftsByField={driftsByField}
                path={path}
                depth={depth + 1}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

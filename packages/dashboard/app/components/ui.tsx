import React from "react";

// Card
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-[var(--border-color)] bg-[var(--surface)] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

// Badge
const badgeColors = {
  green: "bg-green-500/10 text-green-400 border-green-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  gray: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export function Badge({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: keyof typeof badgeColors;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeColors[color]}`}
    >
      {children}
    </span>
  );
}

// Button
export function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const variants = {
    primary: "bg-[var(--accent)] hover:bg-blue-600 text-white",
    secondary:
      "bg-[var(--surface)] hover:bg-zinc-800 text-[var(--foreground)] border border-[var(--border-color)]",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

// Table
export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-color)]">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left py-3 px-4 text-[var(--muted)] font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// CodeBlock
export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-black rounded-md p-4 overflow-x-auto text-sm font-mono text-zinc-300 border border-[var(--border-color)]">
      {children}
    </pre>
  );
}

// Tabs
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-[var(--border-color)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            active === tab.id
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// StatusDot
export function StatusDot({ status }: { status: "healthy" | "drifted" | "error" }) {
  const colors = {
    healthy: "bg-green-400",
    drifted: "bg-yellow-400",
    error: "bg-red-400",
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />
  );
}

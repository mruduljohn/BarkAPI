"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Card — glass + hover lift
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`glass rounded-xl border border-[var(--border-color)] p-4 transition-shadow hover:shadow-[0_0_20px_rgba(59,130,246,0.05)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

// GlowCard — gradient top-border card for stats
export function GlowCard({
  children,
  className = "",
  color = "blue",
}: {
  children: React.ReactNode;
  className?: string;
  color?: "blue" | "green" | "yellow" | "red";
}) {
  const gradients = {
    blue: "from-blue-500/20 to-blue-600/0",
    green: "from-green-500/20 to-green-600/0",
    yellow: "from-yellow-500/20 to-yellow-600/0",
    red: "from-red-500/20 to-red-600/0",
  };
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative glass rounded-xl border border-[var(--border-color)] p-4 overflow-hidden transition-shadow hover:shadow-[0_0_20px_rgba(59,130,246,0.05)] ${className}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradients[color]}`} />
      {children}
    </motion.div>
  );
}

// AnimatedNumber — counter with easing
export function AnimatedNumber({ value, className = "" }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 500;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(step);
      }
    }

    ref.current = requestAnimationFrame(step);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{display}</span>;
}

// Badge — with mount animation
export function Badge({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: keyof typeof badgeColors;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeColors[color]}`}
    >
      {children}
    </motion.span>
  );
}

const badgeColors = {
  green: "bg-green-500/10 text-green-400 border-green-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  gray: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

// Button — with scale + glow
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
    primary: "bg-[var(--accent)] hover:bg-blue-600 text-white hover:shadow-[0_0_16px_rgba(59,130,246,0.2)]",
    secondary:
      "glass hover:bg-white/[0.06] text-[var(--foreground)] border border-[var(--border-color)]",
    danger: "bg-red-600 hover:bg-red-700 text-white hover:shadow-[0_0_16px_rgba(239,68,68,0.2)]",
  };
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${variants[variant]}`}
    >
      {children}
    </motion.button>
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
    <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto text-sm font-mono text-zinc-300 border border-[var(--border-color)]">
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

// DeltaIndicator — shows change between runs
export function DeltaIndicator({ value, label, invert = false }: { value: number; label?: string; invert?: boolean }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  const isGood = invert ? !isPositive : isPositive;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isGood ? "text-green-400" : "text-red-400"}`}>
      <span>{isPositive ? "\u25B2" : "\u25BC"}</span>
      <span>{Math.abs(value)}{label ? ` ${label}` : ""}</span>
    </span>
  );
}

// RelativeTime — converts ISO timestamp to "3 days ago"
export function RelativeTime({ date, prefix }: { date: string; prefix?: string }) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  let text: string;
  if (diffDay > 30) text = `${Math.floor(diffDay / 30)}mo ago`;
  else if (diffDay > 0) text = `${diffDay}d ago`;
  else if (diffHour > 0) text = `${diffHour}h ago`;
  else if (diffMin > 0) text = `${diffMin}m ago`;
  else text = "just now";

  return <span className="text-xs text-[var(--muted)]">{prefix ? `${prefix} ` : ""}{text}</span>;
}

// ProgressBar — thin horizontal bar
export function ProgressBar({
  value,
  max = 100,
  color = "green",
  className = "",
}: {
  value: number;
  max?: number;
  color?: "green" | "yellow" | "red" | "blue";
  className?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const colors = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
  };
  return (
    <div className={`w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`h-full rounded-full ${colors[color]}`}
      />
    </div>
  );
}

// SegmentedBar — multi-segment horizontal bar for distributions
export function SegmentedBar({
  segments,
  className = "",
}: {
  segments: { value: number; color: string }[];
  className?: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  return (
    <div className={`w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex ${className}`}>
      {segments.map((seg, i) => (
        <motion.div
          key={i}
          initial={{ width: 0 }}
          animate={{ width: `${(seg.value / total) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.05 }}
          className={`h-full ${seg.color}`}
        />
      ))}
    </div>
  );
}

// DriftTypeBadge — maps drift_type to human-readable label + color
const driftTypeMap: Record<string, { label: string; color: keyof typeof badgeColors }> = {
  removed: { label: "Removed", color: "red" },
  type_changed: { label: "Type Changed", color: "red" },
  nullability_changed: { label: "Nullability", color: "yellow" },
  required_changed: { label: "Required", color: "red" },
  added: { label: "Added", color: "blue" },
  enum_changed: { label: "Enum Changed", color: "yellow" },
  format_changed: { label: "Format", color: "yellow" },
};

export function DriftTypeBadge({ type }: { type: string }) {
  const info = driftTypeMap[type] || { label: type, color: "gray" as const };
  return <Badge color={info.color}>{info.label}</Badge>;
}

// GradientBlob — animated background decoration for hero cards
export function GradientBlob({
  className = "",
  colors = ["rgba(59,130,246,0.15)", "rgba(16,185,129,0.10)", "rgba(139,92,246,0.10)"],
}: {
  className?: string;
  colors?: string[];
}) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            background: color,
            width: "60%",
            height: "60%",
            top: `${20 + i * 15}%`,
            left: `${10 + i * 25}%`,
          }}
          animate={{
            x: [0, 20, -10, 0],
            y: [0, -15, 10, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// BentoGrid — CSS grid layout helper
export function BentoGrid({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-3 ${className}`}>
      {children}
    </div>
  );
}

// StatusDot — with pulse for unhealthy
export function StatusDot({ status }: { status: "healthy" | "drifted" | "error" }) {
  const colors = {
    healthy: "bg-green-400",
    drifted: "bg-yellow-400",
    error: "bg-red-400",
  };
  const isUnhealthy = status !== "healthy";
  return (
    <span className="relative inline-flex h-2 w-2">
      {isUnhealthy && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-75`} />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[status]}`} />
    </span>
  );
}

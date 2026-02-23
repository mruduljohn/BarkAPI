"use client";
import Link from "next/link";

const tabs = [
  { id: "endpoints", label: "Endpoints", href: "" },
  { id: "timeline", label: "Timeline", href: "/timeline" },
  { id: "alerts", label: "Alerts", href: "/alerts" },
];

export function ProjectNav({
  projectId,
  active,
}: {
  projectId: string;
  active: string;
}) {
  return (
    <div className="flex gap-1 border-b border-[var(--border-color)]">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={`/projects/${projectId}${tab.href}`}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            active === tab.id
              ? "border-[var(--accent)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

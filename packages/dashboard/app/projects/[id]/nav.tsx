"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Radio, Clock, Bell } from "lucide-react";

const tabs = [
  { id: "endpoints", label: "Endpoints", href: "", icon: Radio },
  { id: "timeline", label: "Timeline", href: "/timeline", icon: Clock },
  { id: "alerts", label: "Alerts", href: "/alerts", icon: Bell },
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
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={`/projects/${projectId}${tab.href}`}
            className={`relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors -mb-px ${
              isActive
                ? "text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, FolderOpen } from "lucide-react";
import { LiveIndicator } from "./live-indicator";

const navItems = [
  { href: "/", label: "Projects", icon: FolderOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-[var(--border-color)] glass flex flex-col relative">
      {/* Animated gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent animate-glow-pulse" />

      <div className="p-4 border-b border-[var(--border-color)]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-lg font-bold tracking-tight">BarkAPI</span>
        </Link>
        <p className="text-xs text-[var(--muted)] mt-1.5 ml-[42px]">Drift Detector</p>
      </div>
      <nav className="flex-1 p-2 relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-white/[0.06] border border-white/[0.06]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">v0.1.0</span>
        <LiveIndicator />
      </div>
    </aside>
  );
}

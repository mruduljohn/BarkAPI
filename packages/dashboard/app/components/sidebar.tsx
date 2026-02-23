"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LiveIndicator } from "./live-indicator";

const navItems = [
  { href: "/", label: "Projects", icon: "📦" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-[var(--border-color)] bg-[var(--surface)] flex flex-col">
      <div className="p-4 border-b border-[var(--border-color)]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">🐕 BarkAPI</span>
        </Link>
        <p className="text-xs text-[var(--muted)] mt-1">Drift Detector</p>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === item.href
                ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">v0.1.0</span>
        <LiveIndicator />
      </div>
    </aside>
  );
}

"use client";
import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { Card } from "./ui";

export function EmptyState({
  message = "No data yet.",
  command = "barkapi dev",
}: {
  message?: string;
  command?: string;
}) {
  return (
    <Card>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center py-8"
      >
        <Inbox className="w-10 h-10 text-[var(--muted)] mx-auto mb-4 opacity-50" />
        <p className="text-[var(--muted)] mb-4">{message}</p>
        <div className="inline-block bg-black/50 rounded-lg px-4 py-3 border border-[var(--border-color)]">
          <code className="text-sm font-mono text-green-400">
            $ {command}
          </code>
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">
          The dashboard will update automatically.
        </p>
      </motion.div>
    </Card>
  );
}

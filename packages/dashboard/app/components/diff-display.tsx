"use client";
import { motion } from "framer-motion";

export function DiffDisplay({
  expected,
  actual,
  driftType,
}: {
  expected: string | null;
  actual: string | null;
  driftType?: string;
}) {
  const isTypeChange = driftType === "type_changed";

  if (isTypeChange && expected && actual) {
    return (
      <div className="flex items-center gap-3 py-3">
        <span className="font-mono text-lg text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
          {expected}
        </span>
        <motion.span
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[var(--muted)] text-lg"
        >
          &rarr;
        </motion.span>
        <span className="font-mono text-lg text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
          {actual}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
        <p className="text-xs text-green-400 mb-1.5 font-medium">Expected / Spec</p>
        <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap break-all">
          {expected || "\u2014"}
        </pre>
      </div>
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
        <p className="text-xs text-red-400 mb-1.5 font-medium">Actual / Response</p>
        <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap break-all">
          {actual || "\u2014"}
        </pre>
      </div>
    </div>
  );
}

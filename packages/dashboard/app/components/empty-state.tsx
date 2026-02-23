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
      <div className="text-center py-8">
        <p className="text-[var(--muted)] mb-4">{message}</p>
        <div className="inline-block bg-black rounded-md px-4 py-3 border border-[var(--border-color)]">
          <code className="text-sm font-mono text-green-400">
            $ {command}
          </code>
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">
          The dashboard will update automatically.
        </p>
      </div>
    </Card>
  );
}

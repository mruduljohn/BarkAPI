"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";

interface CheckRun {
  id: number;
  started_at: string;
  finished_at: string | null;
  total_endpoints: number;
  passing: number;
  breaking: number;
  warning: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg border border-[var(--border-color)] px-3 py-2 shadow-xl">
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="text-xs" style={{ color: entry.stroke || entry.fill }}>
          {entry.name}: {entry.value}{entry.dataKey === "healthPct" ? "%" : entry.dataKey === "durationSec" ? "s" : ""}
        </p>
      ))}
    </div>
  );
}

export function TimelineChart({ runs }: { runs: CheckRun[] }) {
  const data = [...runs]
    .reverse()
    .map((run) => {
      const durationMs = run.finished_at
        ? new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()
        : null;
      return {
        time: new Date(run.started_at).toLocaleDateString(),
        passing: run.passing,
        warning: run.warning,
        breaking: run.breaking,
        healthPct: run.total_endpoints > 0 ? Math.round((run.passing / run.total_endpoints) * 100) : 0,
        durationSec: durationMs != null ? parseFloat((durationMs / 1000).toFixed(2)) : null,
      };
    });

  if (data.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="passingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="warningGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#eab308" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="breakingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.3)" />
            <XAxis
              dataKey="time"
              stroke="#52525b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#52525b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="passing"
              stackId="1"
              stroke="#22c55e"
              fill="url(#passingGrad)"
            />
            <Area
              type="monotone"
              dataKey="warning"
              stackId="1"
              stroke="#eab308"
              fill="url(#warningGrad)"
            />
            <Area
              type="monotone"
              dataKey="breaking"
              stackId="1"
              stroke="#ef4444"
              fill="url(#breakingGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Health % over time */}
        <div>
          <h4 className="text-xs font-medium text-[var(--muted)] mb-2">Health % Over Time</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.3)" />
                <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="healthPct"
                  name="Health %"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#22c55e" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Check run duration */}
        <div>
          <h4 className="text-xs font-medium text-[var(--muted)] mb-2">Run Duration (seconds)</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.3)" />
                <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="durationSec"
                  name="Duration"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  opacity={0.7}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

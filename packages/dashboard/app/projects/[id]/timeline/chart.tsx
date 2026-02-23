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
} from "recharts";

interface CheckRun {
  id: number;
  started_at: string;
  passing: number;
  breaking: number;
  warning: number;
}

export function TimelineChart({ runs }: { runs: CheckRun[] }) {
  const data = [...runs]
    .reverse()
    .map((run) => ({
      time: new Date(run.started_at).toLocaleDateString(),
      passing: run.passing,
      warning: run.warning,
      breaking: run.breaking,
    }));

  if (data.length === 0) return null;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="time"
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="passing"
            stackId="1"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.2}
          />
          <Area
            type="monotone"
            dataKey="warning"
            stackId="1"
            stroke="#eab308"
            fill="#eab308"
            fillOpacity={0.2}
          />
          <Area
            type="monotone"
            dataKey="breaking"
            stackId="1"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

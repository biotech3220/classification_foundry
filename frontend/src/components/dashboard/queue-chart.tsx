"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { QueueStatsResponse } from "@/lib/types";

const COLORS = {
  auto_approved: "#10b981",
  pending_review: "#f59e0b",
  curator_approved: "#34d399",
  rejected: "#ef4444",
};

const LABELS: Record<string, string> = {
  auto_approved: "Auto-approved",
  pending_review: "Pending",
  curator_approved: "Curator Approved",
  rejected: "Rejected",
};

export function QueueChart({ stats }: { stats: QueueStatsResponse }) {
  const data = [
    { name: "Auto-approved", value: stats.auto_approved, key: "auto_approved" },
    { name: "Pending", value: stats.pending_review, key: "pending_review" },
    { name: "Curator Approved", value: stats.curator_approved, key: "curator_approved" },
    { name: "Rejected", value: stats.rejected, key: "rejected" },
  ].filter((d) => d.value > 0);

  const total =
    stats.auto_approved +
    stats.pending_review +
    stats.curator_approved +
    stats.rejected;

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-40 w-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={COLORS[entry.key as keyof typeof COLORS]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono">{total}</span>
          <span className="text-[10px] text-muted-foreground">Total</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{
                backgroundColor: COLORS[entry.key as keyof typeof COLORS],
              }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
            <span className="font-mono text-xs font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { ClassificationQuality } from "@/lib/types";

export function ConfidenceChart({ quality }: { quality: ClassificationQuality }) {
  const bands = (quality.calibration ?? [])
    .map((c) => ({
      band: `${(c.confidence_band_lower * 100).toFixed(0)}–${(c.confidence_band_upper * 100).toFixed(0)}%`,
      count: c.sample_size ?? 0,
      approved: Math.round((c.approval_rate ?? 0) * (c.sample_size ?? 0)),
    }))
    .filter((b) => b.count > 0);

  if (!bands.length) {
    return (
      <p className="text-xs text-muted-foreground">
        No confidence calibration data available.
      </p>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bands} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="band"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#1e293b" }}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#1e293b" }}
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [isNaN(Number(value)) ? 0 : value]}
          />
          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

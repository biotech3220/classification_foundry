"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ConfidenceChart } from "@/components/dashboard/confidence-chart";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useClassificationQuality } from "@/lib/hooks/use-health";

export default function QualityPage() {
  const { data: quality, isLoading } = useClassificationQuality();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Classification Quality
          </h1>
          <p className="text-sm text-muted-foreground">
            Metrics and calibration data
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!quality) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Classification Quality
          </h1>
        </div>
        <EmptyState
          title="No quality data"
          description="Run the pipeline to generate quality metrics."
        />
      </div>
    );
  }

  const adapterData = (quality.adapter_quality ?? []).map((a) => ({
    name: a.primary_source,
    classified: a.total_classified,
    rejected: a.total_rejected,
    reingest_rate: Math.round(a.reingest_rate * 100),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Classification Quality
        </h1>
        <p className="text-sm text-muted-foreground">
          Metrics, calibration, and adapter performance
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Approval Rate</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">
              {`${(quality.overall_approval_rate * 100).toFixed(1)}%`}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Curated</p>
            <p className="text-2xl font-bold font-mono text-primary">
              {quality.total_curated}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Auto-approve Threshold</p>
            <p className="text-2xl font-bold font-mono text-muted-foreground">
              {`${(quality.auto_approve_threshold * 100).toFixed(0)}%`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Confidence calibration */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm">Confidence Calibration</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfidenceChart quality={quality} />
          </CardContent>
        </Card>

        {/* Adapter quality */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm">Adapter Quality</CardTitle>
          </CardHeader>
          <CardContent>
            {adapterData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={adapterData}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="name"
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
                    />
                    <Bar
                      dataKey="classified"
                      fill="#10b981"
                      name="Classified"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No adapter data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Code stats table — show codes with rejections */}
      {quality.code_stats && quality.code_stats.filter((c) => c.total_rejected > 0).length > 0 && (
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm">Difficult Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Code</TableHead>
                  <TableHead className="text-right text-muted-foreground">Assigned</TableHead>
                  <TableHead className="text-right text-muted-foreground">Rejected</TableHead>
                  <TableHead className="text-right text-muted-foreground">Avg Confidence</TableHead>
                  <TableHead className="text-right text-muted-foreground">Difficulty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quality.code_stats
                  .filter((c) => c.total_rejected > 0)
                  .sort((a, b) => b.difficulty_score - a.difficulty_score)
                  .map((code) => (
                    <TableRow key={code.standard_code} className="border-border">
                      <TableCell className="font-mono text-sm">{code.standard_code}</TableCell>
                      <TableCell className="text-right text-sm">{code.total_assigned}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-400">{code.total_rejected}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{(code.avg_machine_confidence * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-mono text-sm text-amber-400">{code.difficulty_score.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

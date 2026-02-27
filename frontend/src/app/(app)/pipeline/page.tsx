"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Play,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PipelineStepper } from "@/components/pipeline/pipeline-stepper";
import { StageSelector } from "@/components/pipeline/stage-selector";
import { usePipelineRunner } from "@/lib/hooks/use-pipeline";
import { ApiError } from "@/lib/api/client";
import type { PipelineStageName } from "@/lib/types";

const REQUIRED_COLUMNS = ["First Name", "Last Name", "Email"];

/**
 * Columns that dramatically improve classification accuracy.
 * Missing these won't block upload but triggers quality warnings.
 */
const RECOMMENDED_COLUMNS: { column: string; reason: string }[] = [
  { column: "ORCID URL", reason: "Primary identifier for Scopus, OpenAlex, and ORCID lookups. Without this, adapters cannot reliably match the researcher." },
  { column: "Organisation Name (from Organisation)", reason: "Used for affiliation disambiguation when matching external databases." },
  { column: "Google Scholar URL", reason: "Enables Google Scholar adapter for publications and citation metrics." },
  { column: "Web Profile URL", reason: "Enables university profile scraping for biography and research interests." },
  { column: "Researcher Position", reason: "Helps determine career stage for code range selection." },
  { column: "Department / Faculty", reason: "Provides domain context for classification." },
  { column: "Researcher Expertise", reason: "Fallback biography when no web profile is available." },
];

const ALL_SUPPORTED_COLUMNS = [
  { column: "First Name", required: true, example: "Colin" },
  { column: "Last Name", required: true, example: "Barrow" },
  { column: "Email", required: true, example: "colin.barrow@deakin.edu.au" },
  { column: "ORCID URL", required: false, example: "https://orcid.org/0000-0002-2153-7267" },
  { column: "Organisation Name (from Organisation)", required: false, example: "Deakin University" },
  { column: "Google Scholar URL", required: false, example: "https://scholar.google.com/citations?user=..." },
  { column: "Web Profile URL", required: false, example: "https://experts.deakin.edu.au/800-colin-barrow" },
  { column: "Researcher Position", required: false, example: "Professor" },
  { column: "Department / Faculty", required: false, example: "School of Life and Environmental Sciences" },
  { column: "School", required: false, example: "Faculty of Science" },
  { column: "Researcher Expertise", required: false, example: "Marine biotechnology, bioprocessing..." },
  { column: "Facilities", required: false, example: "NMR Lab, Mass Spec Facility" },
  { column: "Location Display Name (from Locations)", required: false, example: "Burwood Campus" },
  { column: "Work Location Latitude", required: false, example: "-37.8467" },
  { column: "Work Location Longitude", required: false, example: "145.1150" },
  { column: "Linkedin URL", required: false, example: "https://linkedin.com/in/..." },
];

interface CsvPreview {
  columns: string[];
  totalRows: number;
  sampleRows: Record<string, string>[];
  valid: boolean;
  missingColumns: string[];
  missingRecommended: { column: string; reason: string }[];
}

export default function PipelinePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [limit, setLimit] = useState<string>("");
  const [assetIds, setAssetIds] = useState<string>("");

  const pipeline = usePipelineRunner();

  const parsePreview = useCallback((csvFile: File) => {
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) {
          setParseError("CSV must have a header row and at least one data row.");
          return;
        }
        const header = parseCSVLine(lines[0]);
        const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
        const sampleRows: Record<string, string>[] = [];
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
          const values = parseCSVLine(lines[i]);
          const row: Record<string, string> = {};
          header.forEach((col, idx) => {
            row[col] = values[idx] || "";
          });
          sampleRows.push(row);
        }
        const missingRec = RECOMMENDED_COLUMNS.filter(
          (r) => !header.includes(r.column)
        );
        setPreview({
          columns: header,
          totalRows: lines.length - 1,
          sampleRows,
          valid: missing.length === 0,
          missingColumns: missing,
          missingRecommended: missingRec,
        });
      } catch {
        setParseError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(csvFile);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.endsWith(".csv")) {
      toast.error("Please select a .csv file");
      return;
    }
    setFile(selected);
    pipeline.reset();
    parsePreview(selected);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (!dropped?.name.endsWith(".csv")) {
      toast.error("Please drop a .csv file");
      return;
    }
    setFile(dropped);
    pipeline.reset();
    parsePreview(dropped);
  }

  async function handleRunFull() {
    if (!file || !preview?.valid) return;
    try {
      const limitNum = limit ? parseInt(limit, 10) : undefined;
      await pipeline.runWithUpload(
        file,
        ["ingest", "fabricate", "classify", "route", "sync"],
        limitNum
      );
      toast.success("Full pipeline started");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.detail);
      else toast.error("Failed to start pipeline");
    }
  }

  async function handleRunStages(stages: PipelineStageName[]) {
    const hasIngest = stages.includes("ingest");

    if (hasIngest && file && preview?.valid) {
      // Run with upload
      try {
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        await pipeline.runWithUpload(file, stages, limitNum);
        toast.success(`Pipeline started (${stages.length} stages)`);
      } catch (err) {
        if (err instanceof ApiError) toast.error(err.detail);
        else toast.error("Failed to start pipeline");
      }
    } else if (hasIngest && !file) {
      toast.error("Upload a CSV file first to run the ingest stage");
    } else {
      // Run without upload (stages 2-5 only)
      try {
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        const ids = assetIds.trim()
          ? assetIds.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined;
        await pipeline.runStages(stages, { limit: limitNum, asset_ids: ids });
        toast.success(`Pipeline started (${stages.length} stages)`);
      } catch (err) {
        if (err instanceof ApiError) toast.error(err.detail);
        else toast.error("Failed to start pipeline");
      }
    }
  }

  function resetAll() {
    setFile(null);
    setPreview(null);
    setParseError(null);
    setLimit("");
    setAssetIds("");
    pipeline.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const displayColumns = preview
    ? REQUIRED_COLUMNS.filter((c) => preview.columns.includes(c)).concat(
        preview.columns
          .filter((c) => !REQUIRED_COLUMNS.includes(c))
          .slice(0, 3)
      )
    : [];

  const isActive = pipeline.isRunning || pipeline.isStarting;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Upload researchers and run the full classification pipeline
        </p>
      </div>

      {/* CSV Format Guide */}
      {!file && (
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              CSV Format Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Classification accuracy depends heavily on the data provided.
              ORCID URL is the single most important column &mdash; without it,
              external adapters (Scopus, OpenAlex) cannot reliably identify the
              researcher, leading to wrong-person data contamination.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs w-64">Column Name</TableHead>
                    <TableHead className="text-xs w-16">Required</TableHead>
                    <TableHead className="text-xs">Example</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ALL_SUPPORTED_COLUMNS.map((col) => (
                    <TableRow key={col.column} className="border-border">
                      <TableCell className="text-xs font-mono">
                        {col.column}
                      </TableCell>
                      <TableCell className="text-xs">
                        {col.required ? (
                          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
                            Required
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                            Recommended
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-64">
                        {col.example}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drop zone */}
      {!file && (
        <Card
          className="cursor-pointer border-2 border-dashed border-border bg-card/30 transition-colors hover:border-primary/50 hover:bg-card/50"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Upload className="mb-4 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Drop a CSV file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Required: First Name, Last Name, Email &mdash; Strongly recommended: ORCID URL
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Parse error */}
      {parseError && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <XCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-400">{parseError}</p>
          </CardContent>
        </Card>
      )}

      {/* Preview + Controls */}
      {preview && file && (
        <Card className="border-border bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-sm">{file.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {preview.totalRows} rows, {preview.columns.length} columns
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetAll}>
                Remove
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Validation status */}
            {preview.valid ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">
                  All required columns present
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">
                  Missing columns:{" "}
                  {preview.missingColumns.map((c) => (
                    <Badge
                      key={c}
                      variant="outline"
                      className="ml-1 bg-red-500/10 text-red-400 border-red-500/20"
                    >
                      {c}
                    </Badge>
                  ))}
                </span>
              </div>
            )}

            {/* Recommended column warnings */}
            {preview.missingRecommended.length > 0 && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-medium text-amber-400">
                    Missing recommended columns &mdash; classification accuracy may be reduced
                  </span>
                </div>
                <ul className="space-y-1 ml-6">
                  {preview.missingRecommended.map((r) => (
                    <li key={r.column} className="text-xs text-muted-foreground">
                      <span className="font-mono text-amber-400/80">{r.column}</span>
                      {" "}&mdash; {r.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Column badges */}
            <div className="flex flex-wrap gap-1.5">
              {preview.columns.slice(0, 20).map((col) => {
                const isRequired = REQUIRED_COLUMNS.includes(col);
                const isRecommended = RECOMMENDED_COLUMNS.some((r) => r.column === col);
                return (
                <Badge
                  key={col}
                  variant="outline"
                  className={
                    isRequired
                      ? "bg-primary/10 text-primary border-primary/20 text-xs"
                      : isRecommended
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs"
                        : "text-xs"
                  }
                >
                  {col}
                </Badge>
                );
              })}
              {preview.columns.length > 20 && (
                <Badge variant="outline" className="text-xs">
                  +{preview.columns.length - 20} more
                </Badge>
              )}
            </div>

            {/* Sample data table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    {displayColumns.map((col) => (
                      <TableHead
                        key={col}
                        className="text-xs text-muted-foreground whitespace-nowrap"
                      >
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.sampleRows.map((row, i) => (
                    <TableRow key={i} className="border-border">
                      {displayColumns.map((col) => (
                        <TableCell
                          key={col}
                          className="max-w-48 truncate text-xs"
                        >
                          {row[col] || "\u2014"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Action buttons */}
            {!pipeline.status && (
              <div className="flex items-end gap-4 pt-2">
                <div className="w-32">
                  <Label className="text-xs text-muted-foreground">
                    Limit (optional)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={5000}
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="All"
                    className="mt-1 bg-background"
                  />
                </div>
                <Button
                  onClick={handleRunFull}
                  disabled={isActive || !preview.valid}
                  className="gap-2"
                >
                  {pipeline.isStarting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run Full Pipeline
                </Button>
                <StageSelector
                  onRun={handleRunStages}
                  disabled={isActive}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Run without upload — for stages 2-5 */}
      {!file && !pipeline.status && (
        <Card className="border-border bg-card/50">
          <CardContent className="pt-6 space-y-4">
            <div>
              <p className="text-sm font-medium">Run without upload</p>
              <p className="text-xs text-muted-foreground">
                Run stages 2-5 on already-ingested researchers
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-28">
                <Label className="text-xs text-muted-foreground">Limit</Label>
                <Input
                  type="number"
                  min={1}
                  max={5000}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="All"
                  className="mt-1 bg-background text-sm"
                />
              </div>
              <div className="flex-1 min-w-48">
                <Label className="text-xs text-muted-foreground">
                  Asset IDs (optional, comma-separated)
                </Label>
                <Input
                  value={assetIds}
                  onChange={(e) => setAssetIds(e.target.value)}
                  placeholder="researcher:jane_doe_at_uni_edu_au"
                  className="mt-1 bg-background text-sm font-mono"
                />
              </div>
              <StageSelector
                onRun={handleRunStages}
                disabled={isActive}
                skipIngest
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline stepper + stop button */}
      {pipeline.status && (
        <div className="space-y-3">
          <PipelineStepper pipeline={pipeline.status} />
          {pipeline.isRunning && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={async () => {
                await pipeline.cancel();
                toast.info("Pipeline will stop after the current stage completes");
              }}
            >
              <Square className="h-3 w-3" />
              Stop Pipeline
            </Button>
          )}
        </div>
      )}

      {/* Done actions */}
      {(pipeline.isComplete || pipeline.isFailed) && (
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={resetAll}>
            Run Another Pipeline
          </Button>
        </div>
      )}

      {/* Pipeline error */}
      {pipeline.error && !pipeline.status && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <XCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-400">{pipeline.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Simple CSV line parser that handles quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

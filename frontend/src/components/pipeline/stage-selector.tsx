"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PIPELINE_STAGES, type PipelineStageName } from "@/lib/types";

interface StageSelectorProps {
  onRun: (stages: PipelineStageName[]) => void;
  disabled?: boolean;
  /** If true, ingest is unchecked by default (data already ingested) */
  skipIngest?: boolean;
}

export function StageSelector({ onRun, disabled, skipIngest }: StageSelectorProps) {
  const [selected, setSelected] = useState<Set<PipelineStageName>>(() => {
    const defaults = new Set<PipelineStageName>(
      PIPELINE_STAGES.map((s) => s.name)
    );
    if (skipIngest) defaults.delete("ingest");
    return defaults;
  });
  const [open, setOpen] = useState(false);

  function toggle(name: PipelineStageName) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  function handleRun() {
    const ordered = PIPELINE_STAGES
      .filter((s) => selected.has(s.name))
      .map((s) => s.name);
    if (ordered.length > 0) {
      onRun(ordered);
      setOpen(false);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} className="gap-2">
          Run Stages
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3">
        <div className="space-y-2">
          {PIPELINE_STAGES.map((stage) => (
            <label
              key={stage.name}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={selected.has(stage.name)}
                onChange={() => toggle(stage.name)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{stage.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {stage.description}
                </p>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <Button
            size="sm"
            className="w-full"
            disabled={selected.size === 0}
            onClick={handleRun}
          >
            Run {selected.size} Stage{selected.size !== 1 ? "s" : ""}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

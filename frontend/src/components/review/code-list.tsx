"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCodeDescription } from "@/lib/data/anzsrc-codes";
import type { EnrichedCode } from "@/lib/utils/enriched-codes";

interface CodeListProps {
  title: string;
  codes: (string | Record<string, unknown>)[];
  confidences?: number[];
  variant?: "primary" | "secondary" | "crosswalk";
  reasoning?: Map<string, EnrichedCode>;
}

function extractCodeAndName(
  raw: string | Record<string, unknown>,
  variant: string
): { code: string; name: string | null } {
  if (typeof raw === "string") {
    // ANZSRC codes — look up description from static data
    if (variant !== "crosswalk" && raw.length >= 4) {
      const desc = getCodeDescription(raw);
      return { code: raw, name: desc !== `Code ${raw}` ? desc : null };
    }
    return { code: raw, name: null };
  }
  // OECD objects — extract code + name from the object
  if (raw && typeof raw === "object") {
    const code = String(raw.oecd_code ?? raw);
    const name = raw.oecd_name ? String(raw.oecd_name) : null;
    return { code, name };
  }
  return { code: String(raw), name: null };
}

function ExpandableReasoning({ enriched }: { enriched: EnrichedCode }) {
  const [open, setOpen] = useState(false);
  if (!enriched.reasoning) return null;

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
      >
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
        Why this code?
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-40 opacity-100 mt-1.5" : "max-h-0 opacity-0"}`}
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          {enriched.reasoning}
        </p>
        {enriched.evidence && enriched.evidence.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {enriched.evidence.map((e, i) => (
              <li
                key={i}
                className="text-[10px] italic text-muted-foreground/70 leading-snug pl-2 border-l border-muted-foreground/20"
              >
                {e}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function CodeList({
  title,
  codes,
  confidences,
  variant = "primary",
  reasoning,
}: CodeListProps) {
  const badgeClass =
    variant === "crosswalk"
      ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
      : variant === "secondary"
        ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
        : "bg-primary/10 text-primary border-primary/20";

  const showExpandable = variant === "primary" && reasoning;
  const showTooltip = variant === "secondary" && reasoning;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <div className={variant === "primary" && reasoning ? "space-y-2" : "flex flex-wrap gap-2"}>
        {codes.map((rawCode, i) => {
          const { code, name } = extractCodeAndName(rawCode, variant);
          const enriched = reasoning?.get(code);

          if (showExpandable) {
            return (
              <div key={`${code}-${i}`}>
                <Badge
                  variant="outline"
                  className={`font-mono text-xs ${badgeClass}`}
                >
                  {code}
                  {name && (
                    <span className="ml-1.5 font-sans opacity-80">{name}</span>
                  )}
                  {confidences?.[i] !== undefined && (
                    <span className="ml-1.5 opacity-60">
                      {(confidences[i] * 100).toFixed(0)}%
                    </span>
                  )}
                </Badge>
                {enriched && <ExpandableReasoning enriched={enriched} />}
              </div>
            );
          }

          if (showTooltip && enriched?.reasoning) {
            return (
              <TooltipProvider key={`${code}-${i}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs cursor-default ${badgeClass}`}
                    >
                      {code}
                      {name && (
                        <span className="ml-1.5 font-sans opacity-80">
                          {name}
                        </span>
                      )}
                      {confidences?.[i] !== undefined && (
                        <span className="ml-1.5 opacity-60">
                          {(confidences[i] * 100).toFixed(0)}%
                        </span>
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{enriched.reasoning}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return (
            <Badge
              key={`${code}-${i}`}
              variant="outline"
              className={`font-mono text-xs ${badgeClass}`}
            >
              {code}
              {name && (
                <span className="ml-1.5 font-sans opacity-80">{name}</span>
              )}
              {confidences?.[i] !== undefined && (
                <span className="ml-1.5 opacity-60">
                  {(confidences[i] * 100).toFixed(0)}%
                </span>
              )}
            </Badge>
          );
        })}
        {codes.length === 0 && (
          <span className="text-xs text-muted-foreground/50">None</span>
        )}
      </div>
    </div>
  );
}

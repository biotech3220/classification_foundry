"use client";

import { cn } from "@/lib/utils";
import type { HealthResponse } from "@/lib/types";

export function HealthIndicator({ health }: { health: HealthResponse | undefined }) {
  if (!health) return null;

  const services = Object.entries(health.checks);

  return (
    <div className="flex items-center gap-4">
      {services.map(([name, status]) => (
        <div key={name} className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              status === "ok" ? "bg-emerald-500" : "bg-red-500"
            )}
          />
          <span className="text-xs capitalize text-muted-foreground">{name}</span>
        </div>
      ))}
    </div>
  );
}

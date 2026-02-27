"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  colorClass?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  colorClass = "text-foreground",
}: StatCardProps) {
  const content = (
    <Card
      className={cn(
        "border-border bg-card/50 transition-colors duration-150",
        href && "cursor-pointer hover:bg-accent/50"
      )}
    >
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={cn("rounded-lg bg-muted p-2.5", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("text-2xl font-bold font-mono", colorClass)}>
            {formatNumber(value)}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info, Check } from "lucide-react";
import { useAcknowledgeAlert } from "@/lib/hooks/use-governance";
import { relativeTime } from "@/lib/utils/format";
import type { GovernanceAlert } from "@/lib/types";

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    border: "border-red-500/20",
  },
  warning: {
    icon: AlertCircle,
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    border: "border-amber-500/20",
  },
  info: {
    icon: Info,
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    border: "border-border",
  },
};

export function AlertCard({ alert }: { alert: GovernanceAlert }) {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;
  const ack = useAcknowledgeAlert();

  async function handleAcknowledge() {
    try {
      await ack.mutateAsync({
        alertId: alert.alert_id,
        acknowledgedBy: "curator:admin",
      });
      toast.success("Alert acknowledged");
    } catch {
      toast.error("Failed to acknowledge alert");
    }
  }

  return (
    <Card className={`border bg-card/50 ${config.border}`}>
      <CardContent className="flex items-start gap-4 pt-6">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${config.badge}`}>
              {alert.severity}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {alert.alert_type}
            </span>
            {alert.fire_count > 1 && (
              <span className="text-xs text-muted-foreground/70">
                ({alert.fire_count}x)
              </span>
            )}
          </div>
          <p className="text-sm">{alert.message}</p>
          <p className="text-xs text-muted-foreground">
            Last fired {relativeTime(alert.last_fired_at)}
          </p>
        </div>
        {!alert.acknowledged ? (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1"
            onClick={handleAcknowledge}
            disabled={ack.isPending}
          >
            <Check className="h-3 w-3" />
            Ack
          </Button>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">
            Acked by {alert.acknowledged_by}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

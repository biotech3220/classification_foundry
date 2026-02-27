"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApprove } from "@/lib/hooks/use-queue";
import { ApiError } from "@/lib/api/client";

interface ApprovalFormProps {
  assetId: string;
  curatorId: string;
  onSuccess: () => void;
}

export function ApprovalForm({ assetId, curatorId, onSuccess }: ApprovalFormProps) {
  const [notes, setNotes] = useState("");
  const [codeQuality, setCodeQuality] = useState<number>(0);
  const [dataQuality, setDataQuality] = useState<number>(0);
  const [curatorConfidence, setCuratorConfidence] = useState<number>(0);
  const approve = useApprove();

  async function handleApprove() {
    try {
      await approve.mutateAsync({
        assetId,
        body: {
          curator_id: curatorId,
          notes: notes || undefined,
          code_quality: codeQuality || undefined,
          data_quality: dataQuality || undefined,
          curator_confidence: curatorConfidence || undefined,
        },
      });
      toast.success("Classification approved");
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Already decided by another curator");
      } else if (err instanceof ApiError && err.status === 429) {
        toast.error("Please wait before trying again");
      } else {
        toast.error("Failed to approve");
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Code Quality (optional)</Label>
        <StarRating value={codeQuality} onChange={setCodeQuality} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Data Quality (optional)</Label>
        <StarRating value={dataQuality} onChange={setDataQuality} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Your Confidence (optional)
        </Label>
        <div className="flex gap-1">
          {[0.7, 0.8, 0.9, 0.95, 1.0].map((v) => (
            <Button
              key={v}
              variant={curatorConfidence === v ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setCuratorConfidence(curatorConfidence === v ? 0 : v)}
            >
              {(v * 100).toFixed(0)}%
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any observations about this classification..."
          className="h-20 resize-none bg-background"
        />
      </div>
      <Button
        onClick={handleApprove}
        disabled={approve.isPending}
        className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
      >
        {approve.isPending ? "Approving..." : "Approve Classification"}
      </Button>
    </div>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? 0 : star)}
          className={`text-lg transition-colors ${
            star <= value ? "text-amber-400" : "text-muted-foreground/30"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useReject } from "@/lib/hooks/use-queue";
import { ApiError } from "@/lib/api/client";
import type { RejectionType } from "@/lib/types";

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  curatorId: string;
  onSuccess: () => void;
}

const REJECTION_TYPES: { value: RejectionType; label: string; description: string }[] = [
  {
    value: "reclassify",
    label: "Reclassify",
    description: "Wrong codes — re-run OBJECT-3 classification",
  },
  {
    value: "refabricate",
    label: "Refabricate",
    description: "Bad data — re-run from OBJECT-2 enrichment",
  },
  {
    value: "reingest",
    label: "Reingest",
    description: "Source data wrong — start over from OBJECT-1",
  },
];

export function RejectionDialog({
  open,
  onOpenChange,
  assetId,
  curatorId,
  onSuccess,
}: RejectionDialogProps) {
  const [rejectionType, setRejectionType] = useState<RejectionType>("reclassify");
  const [notes, setNotes] = useState("");
  const [correctCodes, setCorrectCodes] = useState("");
  const [codeQuality, setCodeQuality] = useState<number>(0);
  const [dataQuality, setDataQuality] = useState<number>(0);
  const reject = useReject();

  async function handleReject() {
    if (!notes.trim()) {
      toast.error("Notes are required for rejection");
      return;
    }

    try {
      const codes = correctCodes
        .split(/[,\s]+/)
        .map((c) => c.trim())
        .filter(Boolean);

      await reject.mutateAsync({
        assetId,
        body: {
          curator_id: curatorId,
          rejection_type: rejectionType,
          notes: notes.trim(),
          correct_codes: codes.length > 0 ? codes : undefined,
          code_quality: codeQuality || undefined,
          data_quality: dataQuality || undefined,
        },
      });

      toast.success("Classification rejected");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Already decided by another curator");
      } else if (err instanceof ApiError && err.status === 429) {
        toast.error("Please wait before trying again");
      } else {
        toast.error("Failed to reject");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Classification</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Rejection Type</Label>
            <div className="space-y-2">
              {REJECTION_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    rejectionType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionType"
                    value={type.value}
                    checked={rejectionType === type.value}
                    onChange={() => setRejectionType(type.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Notes <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why is this classification incorrect?"
              className="h-20 resize-none bg-background"
            />
          </div>

          {rejectionType === "reclassify" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Correct Codes (comma-separated)
              </Label>
              <Input
                value={correctCodes}
                onChange={(e) => setCorrectCodes(e.target.value)}
                placeholder="310201, 310602"
                className="font-mono bg-background"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Code Quality</Label>
              <QualityStars value={codeQuality} onChange={setCodeQuality} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Data Quality</Label>
              <QualityStars value={dataQuality} onChange={setDataQuality} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={reject.isPending || !notes.trim()}
          >
            {reject.isPending ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QualityStars({
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
          className={`text-base transition-colors ${
            star <= value ? "text-amber-400" : "text-muted-foreground/30"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

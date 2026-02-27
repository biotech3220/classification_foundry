export function confidenceColor(confidence: number): string {
  if (confidence >= 0.85) return "text-emerald-400";
  if (confidence >= 0.65) return "text-amber-400";
  return "text-red-400";
}

export function confidenceBgColor(confidence: number): string {
  if (confidence >= 0.85) return "bg-emerald-500";
  if (confidence >= 0.65) return "bg-amber-500";
  return "bg-red-500";
}

export function confidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return "High";
  if (confidence >= 0.65) return "Medium";
  return "Low";
}

export function confidencePercent(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`;
}

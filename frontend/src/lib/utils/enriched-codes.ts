export type EnrichedCode = {
  code: string;
  tier?: string;
  confidence?: number;
  reasoning?: string;
  evidence?: string[];
};

/**
 * Parse primary_codes JSON that may be either:
 * - Old format: ["310101", "310199", ...]
 * - New format: [{ code: "310101", tier: "primary", reasoning: "...", evidence: [...] }, ...]
 */
export function parseEnrichedCodes(
  raw: string | unknown[] | null | undefined
): EnrichedCode[] {
  if (!raw) return [];
  let arr: unknown[];
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  } else {
    arr = raw;
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((item) =>
    typeof item === "string"
      ? { code: item }
      : {
          code: (item as Record<string, unknown>).code as string,
          tier: (item as Record<string, unknown>).tier as string | undefined,
          confidence: (item as Record<string, unknown>).confidence as
            | number
            | undefined,
          reasoning: (item as Record<string, unknown>).reasoning as
            | string
            | undefined,
          evidence: (item as Record<string, unknown>).evidence as
            | string[]
            | undefined,
        }
  );
}

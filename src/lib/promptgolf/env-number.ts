type NumberBounds = {
  min: number;
  max: number;
  integer?: boolean;
};

/**
 * Reads a numeric environment setting without allowing NaN, infinity, negative
 * durations, or operationally dangerous values to disable resource bounds.
 */
export function boundedEnvNumber(
  value: string | undefined,
  fallback: number,
  bounds: NumberBounds,
): number {
  const parsed = value === undefined || value.trim() === "" ? fallback : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (bounds.integer && !Number.isInteger(parsed)) return fallback;
  if (parsed < bounds.min || parsed > bounds.max) return fallback;
  return parsed;
}

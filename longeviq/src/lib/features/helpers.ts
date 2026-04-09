// ============================================================
// LongevIQ — Math helpers for feature engineering
// ============================================================

/** Arithmetic mean */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Standard deviation (population) */
export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Z-score: how many SDs a value deviates from the mean */
export function zscore(value: number, m: number, sd: number): number {
  if (sd === 0) return 0;
  return (value - m) / sd;
}

/**
 * Linear regression slope over an ordered series.
 * Returns the change-per-index (positive = increasing trend).
 */
export function slope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - xMean;
    num += dx * (values[i] - yMean);
    den += dx * dx;
  }
  return den === 0 ? 0 : num / den;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Normalize a value from [inMin, inMax] to [outMin, outMax] */
export function normalize(
  value: number,
  inMin: number,
  inMax: number,
  outMin = 0,
  outMax = 100,
): number {
  if (inMax === inMin) return outMin;
  const ratio = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + ratio * (outMax - outMin);
}

/** Percentage of items in an array that satisfy a predicate */
export function pctWhere(values: number[], predicate: (v: number) => boolean): number {
  if (values.length === 0) return 0;
  return (values.filter(predicate).length / values.length) * 100;
}

/** Rolling mean of the last N items */
export function rollingMean(values: number[], window: number): number {
  const slice = values.slice(-window);
  return mean(slice);
}

/** Count consecutive trailing items satisfying a predicate */
export function streak(values: number[], predicate: (v: number) => boolean): number {
  let count = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (predicate(values[i])) count++;
    else break;
  }
  return count;
}

/** Round to N decimal places */
export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

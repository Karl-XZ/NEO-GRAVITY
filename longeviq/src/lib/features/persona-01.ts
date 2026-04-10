// ============================================================
// LongevIQ — Persona 01: Dr. Thomas Berger (Preventive Performer)
// Data-dense, benchmark-driven, trend-sensitive
// ============================================================

import type { EhrRecord, WearableTelemetry, LifestyleSurvey } from "../types";
import { mean, slope, zscore, rollingMean, round, clamp } from "./helpers";
import { bioAgeEstimate } from "./universal";

// ------------------------------------------------------------------
// bio_age_delta — north-star metric
// ------------------------------------------------------------------
export function bioAgeDelta(
  ehr: EhrRecord,
  wearable: WearableTelemetry[],
): number {
  return bioAgeEstimate(ehr, wearable).delta;
}

// ------------------------------------------------------------------
// vo2max_proxy — Uth et al. formula: 15 × (HRmax / RHR)
// HRmax estimated as 220 − age (Tanaka: 208 − 0.7 × age also common)
// ------------------------------------------------------------------
export function vo2maxProxy(ehr: EhrRecord, wearable: WearableTelemetry[]): {
  vo2max: number;
  percentile: string;
} {
  const maxHr = 220 - ehr.age;
  const rhr30d = mean(wearable.slice(-30).map((d) => d.resting_hr_bpm));
  if (rhr30d === 0) return { vo2max: 0, percentile: "n/a" };
  const vo2max = round(15 * (maxHr / rhr30d), 1);

  // Age-group percentile (simplified ACSM reference)
  const percentile = vo2maxPercentile(vo2max, ehr.age, ehr.sex);
  return { vo2max, percentile };
}

function vo2maxPercentile(vo2max: number, age: number, sex: string): string {
  // Simplified reference table (male, female thresholds by decade)
  const isMale = sex.toLowerCase() !== "female";
  let p90: number, p75: number, p50: number;

  if (age < 40) {
    [p90, p75, p50] = isMale ? [51, 45, 40] : [45, 39, 34];
  } else if (age < 50) {
    [p90, p75, p50] = isMale ? [48, 42, 37] : [42, 36, 31];
  } else if (age < 60) {
    [p90, p75, p50] = isMale ? [45, 39, 34] : [39, 33, 28];
  } else {
    [p90, p75, p50] = isMale ? [42, 36, 31] : [36, 30, 25];
  }

  if (vo2max >= p90) return "Top 10%";
  if (vo2max >= p75) return "Top 25%";
  if (vo2max >= p50) return "Top 50%";
  return "Below 50%";
}

// ------------------------------------------------------------------
// hrv_30d_trend — slope of HRV over the last 30 days
// Positive = improving, negative = worsening / overtraining warning
// ------------------------------------------------------------------
export function hrv30dTrend(wearable: WearableTelemetry[]): {
  slope: number;
  interpretation: string;
} {
  const values = wearable.slice(-30).map((d) => d.hrv_rmssd_ms);
  const s = slope(values);
  const sRounded = round(s, 2);

  let interpretation: string;
  if (s > 0.3) interpretation = "Upward trend — good recovery";
  else if (s < -0.3) interpretation = "Downward trend — possible overtraining";
  else interpretation = "Stable";

  return { slope: sRounded, interpretation };
}

// ------------------------------------------------------------------
// rhr_7d_vs_90d_zscore — acute stress / infection flag
// High z-score = recent RHR significantly above 90d baseline
// ------------------------------------------------------------------
export function rhr7dVs90dZscore(wearable: WearableTelemetry[]): {
  zscore: number;
  flag: boolean;
  interpretation: string;
} {
  const all = wearable.map((d) => d.resting_hr_bpm);
  const rhr90d = mean(all);
  const rhr90dSd = (() => {
    if (all.length < 2) return 1;
    const m = rhr90d;
    return Math.sqrt(all.reduce((s, v) => s + (v - m) ** 2, 0) / all.length);
  })();

  const rhr7d = rollingMean(all, 7);
  const z = round(zscore(rhr7d, rhr90d, rhr90dSd), 2);
  const flag = z > 1.5;

  let interpretation: string;
  if (z > 2) interpretation = "Significantly elevated — infection or acute stress possible";
  else if (z > 1.5) interpretation = "Slightly elevated — monitor recovery";
  else interpretation = "Within normal range";

  return { zscore: z, flag, interpretation };
}

// ------------------------------------------------------------------
// cardio_load_index — active_min × (avg_hr / rhr)
// Proxy for training load (higher = more cardiovascular stimulus)
// ------------------------------------------------------------------
export function cardioLoadIndex(wearable: WearableTelemetry[]): {
  index: number;
  weeklyAvg: number;
} {
  const recent7 = wearable.slice(-7);
  const rhr = mean(recent7.map((d) => d.resting_hr_bpm));
  if (rhr === 0) return { index: 0, weeklyAvg: 0 };

  // Approximate avg exercise HR as rhr * 1.5 (moderate intensity proxy)
  const avgExerciseHr = rhr * 1.5;
  const indices = recent7.map((d) => d.active_minutes * (avgExerciseHr / rhr));
  const weeklyAvg = round(mean(indices), 1);
  const todayIdx = indices.length > 0 ? round(indices[indices.length - 1], 1) : 0;

  return { index: todayIdx, weeklyAvg };
}

// ------------------------------------------------------------------
// longevity_percentile — composite rank vs. age/sex peer group
// Uses bio_age_delta as primary, activity and sleep as secondary
// Output: estimated percentile 0–100 (higher = better)
// ------------------------------------------------------------------
export function longevityPercentile(
  ehr: EhrRecord,
  wearable: WearableTelemetry[],
  lifestyle: LifestyleSurvey,
): number {
  const delta = bioAgeDelta(ehr, wearable);
  // delta < 0 means younger → good. Map -10..+10 to 100..0
  const ageFactor = clamp(50 - delta * 5, 0, 100);

  const avgSteps = mean(wearable.slice(-30).map((d) => d.steps));
  const activityFactor = clamp((avgSteps / 10000) * 100, 0, 100);

  const avgSleep = mean(wearable.slice(-30).map((d) => d.sleep_quality_score));
  const sleepFactor = clamp(avgSleep, 0, 100);

  const stressFactor = clamp(100 - lifestyle.stress_level, 0, 100);

  const percentile = round(
    ageFactor * 0.4 + activityFactor * 0.25 + sleepFactor * 0.2 + stressFactor * 0.15,
    0,
  );
  return clamp(percentile, 0, 100);
}

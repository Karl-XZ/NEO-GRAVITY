// ============================================================
// LongevIQ — Persona 03: Max Hoffmann (Digital Optimizer)
// High-resolution biohacking, recovery & metabolic focus
// ============================================================

import type { EhrRecord, WearableTelemetry, LifestyleSurvey, TrafficLight } from "../types";
import { mean, stddev, round, clamp, slope } from "./helpers";

// ------------------------------------------------------------------
// recovery_score_daily
// Weighted: HRV 50% + RHR 25% + deep_sleep_pct 25%
// Each sub-score normalized to 0–100 against personal baselines
// ------------------------------------------------------------------
export function recoveryScoreDaily(
  wearable: WearableTelemetry[],
  dayIndex?: number,
): { score: number; hrvComponent: number; rhrComponent: number; deepComponent: number } {
  const idx = dayIndex ?? wearable.length - 1;
  if (idx < 0 || idx >= wearable.length)
    return { score: 0, hrvComponent: 0, rhrComponent: 0, deepComponent: 0 };

  const day = wearable[idx];
  const baseline = wearable.slice(0, idx + 1);

  const hrvMean = mean(baseline.map((d) => d.hrv_rmssd_ms));
  const hrvSd = stddev(baseline.map((d) => d.hrv_rmssd_ms));
  const rhrMean = mean(baseline.map((d) => d.resting_hr_bpm));
  const rhrSd = stddev(baseline.map((d) => d.resting_hr_bpm));
  const deepMean = mean(baseline.map((d) => d.deep_sleep_pct));
  const deepSd = stddev(baseline.map((d) => d.deep_sleep_pct));

  // HRV: higher is better → positive z = good
  const hrvZ = hrvSd > 0 ? (day.hrv_rmssd_ms - hrvMean) / hrvSd : 0;
  const hrvComponent = round(clamp(50 + hrvZ * 20, 0, 100), 0);

  // RHR: lower is better → negative z = good
  const rhrZ = rhrSd > 0 ? (day.resting_hr_bpm - rhrMean) / rhrSd : 0;
  const rhrComponent = round(clamp(50 - rhrZ * 20, 0, 100), 0);

  // Deep sleep: higher is better
  const deepZ = deepSd > 0 ? (day.deep_sleep_pct - deepMean) / deepSd : 0;
  const deepComponent = round(clamp(50 + deepZ * 20, 0, 100), 0);

  const score = round(hrvComponent * 0.5 + rhrComponent * 0.25 + deepComponent * 0.25, 0);

  return { score, hrvComponent, rhrComponent, deepComponent };
}

// ------------------------------------------------------------------
// strain_vs_recovery_ratio — overreach detection
// High strain (active minutes + intensity) vs. low recovery = risk
// ------------------------------------------------------------------
export function strainVsRecoveryRatio(wearable: WearableTelemetry[]): {
  ratio: number;
  flag: boolean;
  interpretation: string;
} {
  const recent7 = wearable.slice(-7);
  if (recent7.length === 0) return { ratio: 0, flag: false, interpretation: "No data" };

  // Strain: active minutes normalized (target ~60/day)
  const avgActiveMin = mean(recent7.map((d) => d.active_minutes));
  const strain = clamp(avgActiveMin / 60, 0, 2); // 0–2 scale

  // Recovery: HRV z-score relative to 30d baseline
  const hrv30 = mean(wearable.slice(-30).map((d) => d.hrv_rmssd_ms));
  const hrv7 = mean(recent7.map((d) => d.hrv_rmssd_ms));
  const recovery = hrv30 > 0 ? hrv7 / hrv30 : 1; // ratio, <1 = depleted

  const ratio = round(recovery > 0 ? strain / recovery : strain * 2, 2);
  const flag = ratio > 1.5;

  let interpretation: string;
  if (ratio > 2.0) interpretation = "High overload — recovery day recommended";
  else if (ratio > 1.5) interpretation = "Slight overload — reduce intensity";
  else if (ratio > 0.8) interpretation = "Good balance between strain and recovery";
  else interpretation = "Low strain — intensity can be increased";

  return { ratio, flag, interpretation };
}

// ------------------------------------------------------------------
// circadian_consistency — stddev of sleep onset time
// Requires sleep_duration as proxy (actual onset time not available)
// Lower stddev = more consistent = better
// ------------------------------------------------------------------
export function circadianConsistency(wearable: WearableTelemetry[]): {
  stddevHrs: number;
  score: number;
  interpretation: string;
} {
  const recent14 = wearable.slice(-14);
  // Use sleep duration variance as proxy for circadian disruption
  const durations = recent14.map((d) => d.sleep_duration_hrs);
  const sd = round(stddev(durations), 2);

  // Lower SD = more consistent. 0 = perfect (100), 2+ hrs SD = poor (0)
  const score = round(clamp((1 - sd / 2) * 100, 0, 100), 0);

  let interpretation: string;
  if (score >= 80) interpretation = "Very consistent sleep rhythm";
  else if (score >= 50) interpretation = "Slight variations — more regular sleep times recommended";
  else interpretation = "Irregular sleep rhythm — establish a circadian routine";

  return { stddevHrs: sd, score, interpretation };
}

// ------------------------------------------------------------------
// metabolic_flexibility — triglyceride/HDL ratio
// Lower ratio = better metabolic flexibility
// ------------------------------------------------------------------
export function metabolicFlexibility(ehr: EhrRecord): {
  ratio: number;
  level: TrafficLight;
  interpretation: string;
} {
  if (ehr.hdl_mmol === 0) return { ratio: 0, level: "red", interpretation: "HDL data missing" };
  const ratio = round(ehr.triglycerides_mmol / ehr.hdl_mmol, 2);

  let level: TrafficLight;
  let interpretation: string;
  if (ratio < 1.0) {
    level = "green";
    interpretation = "Excellent metabolic flexibility";
  } else if (ratio < 1.7) {
    level = "yellow";
    interpretation = "Moderate metabolic flexibility — room for optimization";
  } else {
    level = "red";
    interpretation = "Limited metabolic flexibility — adjust diet and exercise";
  }

  return { ratio, level, interpretation };
}

// ------------------------------------------------------------------
// inflammation_index — crp × stress × sleep × alcohol composite
// Higher = worse
// ------------------------------------------------------------------
export function inflammationIndex(
  ehr: EhrRecord,
  wearable: WearableTelemetry[],
  lifestyle: LifestyleSurvey,
): { score: number; level: TrafficLight } {
  // CRP risk (0–1)
  const crpNorm = clamp(ehr.crp_mg_l / 10, 0, 1);

  // Stress (0–1)
  const stressNorm = clamp(lifestyle.stress_level / 100, 0, 1);

  // Sleep deficit: low quality = more inflammation
  const avgSleepQ = mean(wearable.slice(-14).map((d) => d.sleep_quality_score));
  const sleepDeficitNorm = clamp(1 - avgSleepQ / 100, 0, 1);

  // Alcohol (units/week: 0 = best, 14+ = max risk)
  const alcoholNorm = clamp(lifestyle.alcohol_units_weekly / 14, 0, 1);

  const score = round((crpNorm * 0.35 + stressNorm * 0.25 + sleepDeficitNorm * 0.2 + alcoholNorm * 0.2) * 100, 0);
  const level: TrafficLight = score >= 50 ? "red" : score >= 25 ? "yellow" : "green";

  return { score, level };
}

// ------------------------------------------------------------------
// biomarker_drift_flag — quarter-vs-quarter deviation > 1 SD
// Simplified: compares first half vs. second half of wearable data
// ------------------------------------------------------------------
export function biomarkerDriftFlag(wearable: WearableTelemetry[]): {
  drifting: boolean;
  metrics: { name: string; drift: number; flagged: boolean }[];
} {
  const mid = Math.floor(wearable.length / 2);
  if (mid < 7) return { drifting: false, metrics: [] };

  const first = wearable.slice(0, mid);
  const second = wearable.slice(mid);

  function checkDrift(name: string, getter: (d: WearableTelemetry) => number) {
    const firstVals = first.map(getter);
    const secondVals = second.map(getter);
    const firstMean = mean(firstVals);
    const firstSd = stddev(firstVals);
    const secondMean = mean(secondVals);
    const drift = firstSd > 0 ? round(Math.abs(secondMean - firstMean) / firstSd, 2) : 0;
    return { name, drift, flagged: drift > 1.0 };
  }

  const metrics = [
    checkDrift("Resting HR", (d) => d.resting_hr_bpm),
    checkDrift("HRV", (d) => d.hrv_rmssd_ms),
    checkDrift("Sleep Quality", (d) => d.sleep_quality_score),
    checkDrift("Deep Sleep %", (d) => d.deep_sleep_pct),
    checkDrift("SpO2", (d) => d.spo2_avg_pct),
  ];

  return { drifting: metrics.some((m) => m.flagged), metrics };
}

// ============================================================
// LongevIQ — Persona 02: Sabine Kowalski (Concerned Preventer)
// Trust-first simplicity, menopause-aware, plain language
// ============================================================

import type { EhrRecord, WearableTelemetry, LifestyleSurvey, TrafficLight } from "../types";
import { mean, pctWhere, round, clamp } from "./helpers";
import { THRESHOLDS } from "../thresholds";

// ------------------------------------------------------------------
// bone_load_proxy — weekly weight-bearing activity minutes
// Approximated from active_minutes on days with significant steps
// ------------------------------------------------------------------
export function boneLoadProxy(wearable: WearableTelemetry[]): {
  weeklyMinutes: number;
  score: number;
  interpretation: string;
} {
  const recent7 = wearable.slice(-7);
  // Weight-bearing activity = days where steps > 3000 AND active_minutes > 15
  const weightBearingMinutes = recent7
    .filter((d) => d.steps > 3000)
    .reduce((sum, d) => sum + d.active_minutes, 0);

  // Target: 150 min/week (WHO) with weight-bearing emphasis
  const score = round(clamp((weightBearingMinutes / 150) * 100, 0, 100), 0);

  let interpretation: string;
  if (score >= 80) interpretation = "Very good — sufficient loading stimulus for bones";
  else if (score >= 50) interpretation = "Moderate — more walking or stair climbing recommended";
  else interpretation = "Too little — daily walks are important for your bone health";

  return { weeklyMinutes: round(weightBearingMinutes, 0), score, interpretation };
}

// ------------------------------------------------------------------
// cognitive_reserve_index — WHO-5 + sleep + activity composite
// Higher = better cognitive protection
// ------------------------------------------------------------------
export function cognitiveReserveIndex(
  wearable: WearableTelemetry[],
  lifestyle: LifestyleSurvey,
): {
  score: number;
  level: TrafficLight;
} {
  const recent30 = wearable.slice(-30);

  // WHO-5: 0–100 scale, higher = better wellbeing
  const who5Score = clamp(lifestyle.mental_wellbeing_who5, 0, 100);

  // Sleep quality average
  const sleepScore = clamp(mean(recent30.map((d) => d.sleep_quality_score)), 0, 100);

  // Activity: steps + active minutes combined
  const avgSteps = mean(recent30.map((d) => d.steps));
  const activityScore = clamp((avgSteps / 8000) * 100, 0, 100);

  // Weighted composite: mental 40%, sleep 30%, activity 30%
  const score = round(who5Score * 0.4 + sleepScore * 0.3 + activityScore * 0.3, 0);
  const level: TrafficLight = score >= 60 ? "green" : score >= 40 ? "yellow" : "red";

  return { score, level };
}

// ------------------------------------------------------------------
// movement_consistency_pct — % of days with >= 5000 steps
// ------------------------------------------------------------------
export function movementConsistencyPct(wearable: WearableTelemetry[]): {
  pct: number;
  level: TrafficLight;
} {
  const pct = round(
    pctWhere(
      wearable.map((d) => d.steps),
      (s) => s >= THRESHOLDS.activity.steps_daily_target,
    ),
    1,
  );
  const level: TrafficLight = pct >= 70 ? "green" : pct >= 40 ? "yellow" : "red";
  return { pct, level };
}

// ------------------------------------------------------------------
// sleep_fragmentation_flag — menopause-typical disruption
// Flagged when sleep quality variance is high + short sleep nights
// ------------------------------------------------------------------
export function sleepFragmentationFlag(wearable: WearableTelemetry[]): {
  flagged: boolean;
  shortNights: number;
  avgQuality: number;
  interpretation: string;
} {
  const recent14 = wearable.slice(-14);
  const shortNights = recent14.filter((d) => d.sleep_duration_hrs < 6).length;
  const avgQuality = round(mean(recent14.map((d) => d.sleep_quality_score)), 0);
  const qualityVariance = (() => {
    const vals = recent14.map((d) => d.sleep_quality_score);
    const m = mean(vals);
    return mean(vals.map((v) => (v - m) ** 2));
  })();

  // Flag if: >3 short nights in 14 days OR high quality variance + low average
  const flagged = shortNights > 3 || (qualityVariance > 200 && avgQuality < 65);

  let interpretation: string;
  if (flagged) interpretation = "Sleep shows signs of fragmentation — medical evaluation recommended";
  else interpretation = "Sleep pattern within acceptable range";

  return { flagged, shortNights, avgQuality, interpretation };
}

// ------------------------------------------------------------------
// wellbeing_trajectory — WHO-5 depression flag + trend
// WHO-5 raw score < 13 (out of 25) = depression screening positive
// We receive 0–100 scale in our data, so threshold = 52 (13/25*100)
// ------------------------------------------------------------------
export function wellbeingTrajectory(lifestyle: LifestyleSurvey): {
  who5: number;
  depressionFlag: boolean;
  level: TrafficLight;
  recommendation: string;
} {
  const who5 = lifestyle.mental_wellbeing_who5;
  // PDF says WHO-5 < 13 (raw 0-25 scale). Our data uses 0-100 scale, so threshold = 52
  const depressionFlag = who5 < 52;
  const level: TrafficLight = who5 >= 60 ? "green" : who5 >= 52 ? "yellow" : "red";

  let recommendation: string;
  if (depressionFlag)
    recommendation = "Your wellbeing is below the threshold — please schedule an appointment with your doctor";
  else if (who5 < 60)
    recommendation = "Wellbeing slightly limited — watch for stress factors";
  else
    recommendation = "Good mental wellbeing";

  return { who5, depressionFlag, level, recommendation };
}

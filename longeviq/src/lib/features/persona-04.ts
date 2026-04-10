// ============================================================
// LongevIQ — Persona 04: Jurgen Wolff (Clinic-Anchored Loyalist)
// Few, large, validated metrics — loops back to trusted doctor
// ============================================================

import type { EhrRecord, WearableTelemetry, LifestyleSurvey, TrafficLight } from "../types";
import { mean, slope, streak, round, clamp } from "./helpers";
import { THRESHOLDS } from "../thresholds";

// ------------------------------------------------------------------
// bp_control_status — rolling 7d average vs. ESC 140/90
// ------------------------------------------------------------------
export function bpControlStatus(
  ehr: EhrRecord,
  _wearable: WearableTelemetry[],
): {
  sbp: number;
  dbp: number;
  status: TrafficLight;
  label: string;
} {
  // In a real app, BP would come from daily wearable readings.
  // Current data only has single EHR values, so we use those directly.
  const sbp = ehr.sbp_mmhg;
  const dbp = ehr.dbp_mmhg;

  let status: TrafficLight;
  let label: string;

  if (sbp < THRESHOLDS.bp.optimal_sbp && dbp < THRESHOLDS.bp.optimal_dbp) {
    status = "green";
    label = "Optimal";
  } else if (sbp < THRESHOLDS.bp.hypertension_sbp && dbp < THRESHOLDS.bp.hypertension_dbp) {
    status = "yellow";
    label = "Borderline";
  } else {
    status = "red";
    label = "Too high — medical check-up recommended";
  }

  return { sbp, dbp, status, label };
}

// ------------------------------------------------------------------
// prediabetes_trajectory — HbA1c trend moderated by step activity
// Combines static HbA1c with activity as protective factor
// ------------------------------------------------------------------
export function prediabetesTrajectory(
  ehr: EhrRecord,
  wearable: WearableTelemetry[],
): {
  hba1c: number;
  status: TrafficLight;
  activityModifier: string;
  recommendation: string;
} {
  const hba1c = ehr.hba1c_pct;
  const avgSteps = mean(wearable.slice(-30).map((d) => d.steps));

  let baseStatus: TrafficLight;
  if (hba1c < THRESHOLDS.hba1c.normal) baseStatus = "green";
  else if (hba1c < THRESHOLDS.hba1c.prediabetes) baseStatus = "yellow";
  else baseStatus = "red";

  // Activity moderation: high activity can buffer borderline HbA1c
  const isActive = avgSteps >= THRESHOLDS.activity.steps_optimal;
  const activityModifier = isActive
    ? "Your activity level is protective"
    : "More exercise could improve this value";

  let recommendation: string;
  if (baseStatus === "red")
    recommendation = "Please discuss your HbA1c level with your doctor";
  else if (baseStatus === "yellow")
    recommendation = "Monitor this value — regular exercise and a balanced diet help";
  else
    recommendation = "Your blood sugar is within normal range";

  return { hba1c, status: baseStatus, activityModifier, recommendation };
}

// ------------------------------------------------------------------
// medication_burden_score — count × frequency weight
// Simple proxy: number of distinct medications
// ------------------------------------------------------------------
export function medicationBurdenScore(ehr: EhrRecord): {
  count: number;
  score: number;
  interpretation: string;
} {
  const meds = ehr.medications
    .split("|")
    .map((m) => m.trim())
    .filter(Boolean);
  const count = meds.length;

  // Score: 0 meds = 100 (no burden), 5+ = 0
  const score = round(clamp(((5 - count) / 5) * 100, 0, 100), 0);

  let interpretation: string;
  if (count === 0) interpretation = "No medications";
  else if (count <= 2) interpretation = "Low medication burden";
  else if (count <= 4) interpretation = "Moderate medication burden — watch for polypharmacy";
  else interpretation = "High medication burden — medication review recommended";

  return { count, score, interpretation };
}

// ------------------------------------------------------------------
// walk_streak_days — consecutive days with >= 5k steps
// ------------------------------------------------------------------
export function walkStreakDays(wearable: WearableTelemetry[]): {
  days: number;
  interpretation: string;
} {
  const steps = wearable.map((d) => d.steps);
  const days = streak(steps, (s) => s >= THRESHOLDS.activity.steps_daily_target);

  let interpretation: string;
  if (days >= 14) interpretation = "Excellent streak — keep it up!";
  else if (days >= 7) interpretation = "Good week — stay on track";
  else if (days >= 3) interpretation = "Good start — try for 7 days in a row";
  else interpretation = "Tip: A daily 20-minute walk is enough for 5,000 steps";

  return { days, interpretation };
}

// ------------------------------------------------------------------
// fall_risk_proxy — low activity + low HRV + age
// Higher score = higher risk
// ------------------------------------------------------------------
export function fallRiskProxy(
  ehr: EhrRecord,
  wearable: WearableTelemetry[],
): {
  score: number;
  level: TrafficLight;
  factors: string[];
} {
  const factors: string[] = [];
  let riskPoints = 0;

  // Age factor
  if (ehr.age >= 75) { riskPoints += 3; factors.push("Age >= 75"); }
  else if (ehr.age >= 65) { riskPoints += 2; factors.push("Age >= 65"); }
  else if (ehr.age >= 55) { riskPoints += 1; }

  // Activity: low steps
  const avgSteps = mean(wearable.slice(-14).map((d) => d.steps));
  if (avgSteps < 3000) { riskPoints += 2; factors.push("Very low activity"); }
  else if (avgSteps < 5000) { riskPoints += 1; factors.push("Low activity"); }

  // HRV: low autonomic function
  const avgHrv = mean(wearable.slice(-14).map((d) => d.hrv_rmssd_ms));
  if (avgHrv < 20) { riskPoints += 2; factors.push("Very low HRV"); }
  else if (avgHrv < 30) { riskPoints += 1; factors.push("Low HRV"); }

  // Multiple chronic conditions
  if (ehr.n_chronic_conditions >= 3) { riskPoints += 1; factors.push("Multimorbidity"); }

  const score = round(clamp((riskPoints / 8) * 100, 0, 100), 0);
  const level: TrafficLight = score >= 50 ? "red" : score >= 25 ? "yellow" : "green";

  return { score, level, factors };
}

// ------------------------------------------------------------------
// clinic_engagement_score — from visit_history
// Higher visits = more engaged with healthcare
// ------------------------------------------------------------------
export function clinicEngagementScore(ehr: EhrRecord): {
  score: number;
  visitsPerYear: number;
  interpretation: string;
} {
  const visits = ehr.n_visits_2yr;
  const visitsPerYear = round(visits / 2, 1);

  // Score: 2+ visits/year = good, <1 = disengaged
  const score = round(clamp((visitsPerYear / 3) * 100, 0, 100), 0);

  let interpretation: string;
  if (visitsPerYear >= 2) interpretation = "Regular doctor visits — good preventive care";
  else if (visitsPerYear >= 1) interpretation = "Annual check-up present";
  else interpretation = "Infrequent doctor visits — regular preventive care recommended";

  return { score, visitsPerYear, interpretation };
}

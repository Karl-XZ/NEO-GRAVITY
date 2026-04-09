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
    label = "Grenzwertig";
  } else {
    status = "red";
    label = "Zu hoch — arztliche Kontrolle empfohlen";
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
    ? "Ihre Aktivitat wirkt schützend"
    : "Mehr Bewegung konnte den Wert verbessern";

  let recommendation: string;
  if (baseStatus === "red")
    recommendation = "Bitte besprechen Sie Ihren HbA1c-Wert mit Ihrem Arzt";
  else if (baseStatus === "yellow")
    recommendation = "Wert beobachten — regelmassige Bewegung und ausgewogene Ernahrung helfen";
  else
    recommendation = "Ihr Blutzucker ist im Normalbereich";

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
  if (count === 0) interpretation = "Keine Medikamente";
  else if (count <= 2) interpretation = "Geringe Medikamentenlast";
  else if (count <= 4) interpretation = "Moderate Medikamentenlast — Polypharmazie beachten";
  else interpretation = "Hohe Medikamentenlast — Medikationsreview empfohlen";

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
  if (days >= 14) interpretation = "Ausgezeichnete Serie — weiter so!";
  else if (days >= 7) interpretation = "Gute Woche — bleiben Sie dran";
  else if (days >= 3) interpretation = "Guter Anfang — versuchen Sie 7 Tage am Stuck";
  else interpretation = "Tipp: Ein taglicher 20-Minuten-Spaziergang reicht fur 5.000 Schritte";

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
  if (ehr.age >= 75) { riskPoints += 3; factors.push("Alter >= 75"); }
  else if (ehr.age >= 65) { riskPoints += 2; factors.push("Alter >= 65"); }
  else if (ehr.age >= 55) { riskPoints += 1; }

  // Activity: low steps
  const avgSteps = mean(wearable.slice(-14).map((d) => d.steps));
  if (avgSteps < 3000) { riskPoints += 2; factors.push("Sehr geringe Aktivitat"); }
  else if (avgSteps < 5000) { riskPoints += 1; factors.push("Geringe Aktivitat"); }

  // HRV: low autonomic function
  const avgHrv = mean(wearable.slice(-14).map((d) => d.hrv_rmssd_ms));
  if (avgHrv < 20) { riskPoints += 2; factors.push("Sehr niedrige HRV"); }
  else if (avgHrv < 30) { riskPoints += 1; factors.push("Niedrige HRV"); }

  // Multiple chronic conditions
  if (ehr.n_chronic_conditions >= 3) { riskPoints += 1; factors.push("Multimorbiditat"); }

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
  if (visitsPerYear >= 2) interpretation = "Regelmasige Arztbesuche — gute Vorsorge";
  else if (visitsPerYear >= 1) interpretation = "Jahrliche Kontrolle vorhanden";
  else interpretation = "Seltene Arztbesuche — regelmasige Vorsorge empfohlen";

  return { score, visitsPerYear, interpretation };
}

// ============================================================
// LongevIQ — Universal derived features (all personas)
// ============================================================

import type { EhrRecord, WearableTelemetry, LifestyleSurvey, TrafficLight } from "../types";
import { THRESHOLDS } from "../thresholds";
import { mean, slope, zscore, clamp, pctWhere, round } from "./helpers";

// ------------------------------------------------------------------
// 1. bio_age_estimate
//    Simplified Klemera-Doubal model: chronological age + weighted
//    z-score deviations of 7 biomarkers from population reference.
// ------------------------------------------------------------------
export function bioAgeEstimate(
  ehr: EhrRecord,
  wearable: WearableTelemetry[],
): { bioAge: number; delta: number; drivers: string[] } {
  const w = THRESHOLDS.bio_age_weights;
  const rhr30 = mean(wearable.slice(-30).map((d) => d.resting_hr_bpm));
  const hrv30 = mean(wearable.slice(-30).map((d) => d.hrv_rmssd_ms));

  const deviations: { label: string; contribution: number }[] = [
    {
      label: "HbA1c",
      contribution: w.hba1c_pct.weight * zscore(ehr.hba1c_pct, w.hba1c_pct.ref_mean, w.hba1c_pct.ref_sd),
    },
    {
      label: "CRP",
      contribution: w.crp_mg_l.weight * zscore(ehr.crp_mg_l, w.crp_mg_l.ref_mean, w.crp_mg_l.ref_sd),
    },
    {
      label: "HRV",
      contribution: w.hrv_rmssd_ms.weight * zscore(hrv30, w.hrv_rmssd_ms.ref_mean, w.hrv_rmssd_ms.ref_sd),
    },
    {
      label: "Resting HR",
      contribution: w.resting_hr_bpm.weight * zscore(rhr30, w.resting_hr_bpm.ref_mean, w.resting_hr_bpm.ref_sd),
    },
    {
      label: "Blood pressure (sys)",
      contribution: w.sbp_mmhg.weight * zscore(ehr.sbp_mmhg, w.sbp_mmhg.ref_mean, w.sbp_mmhg.ref_sd),
    },
    {
      label: "LDL",
      contribution: w.ldl_mmol.weight * zscore(ehr.ldl_mmol, w.ldl_mmol.ref_mean, w.ldl_mmol.ref_sd),
    },
    {
      label: "eGFR",
      contribution: w.egfr_ml_min.weight * zscore(ehr.egfr_ml_min, w.egfr_ml_min.ref_mean, w.egfr_ml_min.ref_sd),
    },
  ];

  const totalShift = deviations.reduce((s, d) => s + d.contribution, 0);
  const bioAge = round(ehr.age + totalShift, 1);
  const delta = round(bioAge - ehr.age, 1);

  // Top 3 drivers sorted by absolute contribution
  const sorted = [...deviations].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const drivers = sorted.slice(0, 3).map((d) => {
    const direction = d.contribution > 0 ? "increases bio-age" : "decreases bio-age";
    return `${d.label} ${direction}`;
  });

  return { bioAge, delta, drivers };
}

// ------------------------------------------------------------------
// 2. cardio_risk_ampel
//    ESC-aligned traffic light based on SBP, LDL, HDL.
// ------------------------------------------------------------------
export function cardioRiskAmpel(ehr: EhrRecord): {
  status: TrafficLight;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0; // 0 = green, 1–2 = yellow, 3+ = red

  // SBP
  if (ehr.sbp_mmhg >= THRESHOLDS.bp.hypertension_sbp) {
    score += 2;
    reasons.push(`Blood pressure ${ehr.sbp_mmhg} mmHg >= ${THRESHOLDS.bp.hypertension_sbp}`);
  } else if (ehr.sbp_mmhg >= THRESHOLDS.bp.high_normal_sbp) {
    score += 1;
    reasons.push(`Blood pressure ${ehr.sbp_mmhg} mmHg in high-normal range`);
  }

  // LDL
  if (ehr.ldl_mmol >= THRESHOLDS.ldl.high) {
    score += 2;
    reasons.push(`LDL ${ehr.ldl_mmol} mmol/L significantly elevated`);
  } else if (ehr.ldl_mmol >= THRESHOLDS.ldl.moderate_risk_target) {
    score += 1;
    reasons.push(`LDL ${ehr.ldl_mmol} mmol/L above target`);
  }

  // HDL (low is bad)
  const hdlThreshold =
    ehr.sex.toLowerCase() === "female" ? THRESHOLDS.hdl.low_female : THRESHOLDS.hdl.low_male;
  if (ehr.hdl_mmol < hdlThreshold) {
    score += 1;
    reasons.push(`HDL ${ehr.hdl_mmol} mmol/L too low`);
  }

  const status: TrafficLight = score >= 3 ? "red" : score >= 1 ? "yellow" : "green";
  return { status, reasons };
}

// ------------------------------------------------------------------
// 3. metabolic_health_score
//    Count of MetS criteria met (0–5). Lower is better.
//    Score mapped to 0–100 where 100 = fully metabolically healthy.
// ------------------------------------------------------------------
export function metabolicHealthScore(ehr: EhrRecord): {
  score: number;
  criteriaCount: number;
  criteria: string[];
} {
  const met: string[] = [];

  if (ehr.bmi >= THRESHOLDS.mets.bmi_proxy) met.push("BMI >= 25");
  if (ehr.triglycerides_mmol >= THRESHOLDS.mets.triglycerides)
    met.push(`Triglycerides ${ehr.triglycerides_mmol} mmol/L`);

  const hdlThreshold =
    ehr.sex.toLowerCase() === "female" ? THRESHOLDS.mets.hdl_low_female : THRESHOLDS.mets.hdl_low_male;
  if (ehr.hdl_mmol < hdlThreshold) met.push(`HDL < ${hdlThreshold} mmol/L`);

  if (ehr.sbp_mmhg >= THRESHOLDS.mets.sbp || ehr.dbp_mmhg >= THRESHOLDS.mets.dbp)
    met.push("Blood pressure elevated");

  if (ehr.fasting_glucose_mmol >= THRESHOLDS.mets.fasting_glucose)
    met.push(`Fasting glucose ${ehr.fasting_glucose_mmol} mmol/L`);

  const criteriaCount = met.length;
  // 0 criteria = 100, 5 criteria = 0
  const score = round(((5 - criteriaCount) / 5) * 100, 0);

  return { score, criteriaCount, criteria: met };
}

// ------------------------------------------------------------------
// 4. activity_adherence_pct
//    % of days with >= 5000 steps over the observation period.
// ------------------------------------------------------------------
export function activityAdherencePct(wearable: WearableTelemetry[]): number {
  return round(
    pctWhere(
      wearable.map((d) => d.steps),
      (s) => s >= THRESHOLDS.activity.steps_daily_target,
    ),
    1,
  );
}

// ------------------------------------------------------------------
// 5. sleep_composite_score
//    Weighted composite: duration (40%) + quality (35%) + deep_sleep (25%)
//    Each sub-score is 0–100.
// ------------------------------------------------------------------
export function sleepCompositeScore(wearable: WearableTelemetry[]): {
  score: number;
  durationScore: number;
  qualityScore: number;
  deepSleepScore: number;
} {
  const recent = wearable.slice(-30);
  if (recent.length === 0) return { score: 0, durationScore: 0, qualityScore: 0, deepSleepScore: 0 };

  const avgDuration = mean(recent.map((d) => d.sleep_duration_hrs));
  const avgQuality = mean(recent.map((d) => d.sleep_quality_score));
  const avgDeep = mean(recent.map((d) => d.deep_sleep_pct));

  // Duration: 7–9 hrs optimal, <5 or >11 = 0
  let durationScore: number;
  if (avgDuration >= 7 && avgDuration <= 9) {
    durationScore = 100;
  } else if (avgDuration < 7) {
    durationScore = clamp((avgDuration / 7) * 100, 0, 100);
  } else {
    durationScore = clamp(((11 - avgDuration) / 2) * 100, 0, 100);
  }

  // Quality: already 0-100 scale
  const qualityScore = clamp(avgQuality, 0, 100);

  // Deep sleep: 20%+ = 100, <10% = 0
  const deepSleepScore = clamp(((avgDeep - 10) / 10) * 100, 0, 100);

  const score = round(durationScore * 0.4 + qualityScore * 0.35 + deepSleepScore * 0.25, 0);

  return {
    score,
    durationScore: round(durationScore, 0),
    qualityScore: round(qualityScore, 0),
    deepSleepScore: round(deepSleepScore, 0),
  };
}

// ------------------------------------------------------------------
// 6. stress_inflammation_link
//    Composite signal: stress_level × crp × inverse HRV trend.
//    Output: 0–100 risk score (higher = worse).
// ------------------------------------------------------------------
export function stressInflammationLink(
  ehr: EhrRecord,
  wearable: WearableTelemetry[],
  lifestyle: LifestyleSurvey,
): { score: number; level: TrafficLight } {
  // Normalize stress (1–10 scale in survey, mapped to 0–1)
  const stressNorm = clamp(lifestyle.stress_level / 100, 0, 1);

  // Normalize CRP (0 = perfect, 10+ = max risk)
  const crpNorm = clamp(ehr.crp_mg_l / THRESHOLDS.crp.high_risk, 0, 1);

  // HRV trend: negative slope = worsening = higher risk
  const hrvValues = wearable.slice(-30).map((d) => d.hrv_rmssd_ms);
  const hrvSlope = slope(hrvValues);
  // Normalize slope: -1 (worsening) to +1 (improving) → risk 1 to 0
  const hrvRiskNorm = clamp(0.5 - hrvSlope * 0.05, 0, 1);

  const rawScore = (stressNorm * 0.35 + crpNorm * 0.35 + hrvRiskNorm * 0.3) * 100;
  const score = round(clamp(rawScore, 0, 100), 0);

  const level: TrafficLight = score >= 60 ? "red" : score >= 30 ? "yellow" : "green";
  return { score, level };
}

// ============================================================
// LongevIQ — Feature Engineering barrel export + orchestrator
// ============================================================

import type { EhrRecord, WearableTelemetry, LifestyleSurvey } from "../types";
import type { ComputedFeatures } from "../types";

// Universal
export {
  bioAgeEstimate,
  cardioRiskAmpel,
  metabolicHealthScore,
  activityAdherencePct,
  sleepCompositeScore,
  stressInflammationLink,
} from "./universal";

// Persona 01 — Preventive Performer
export {
  bioAgeDelta,
  vo2maxProxy,
  hrv30dTrend,
  rhr7dVs90dZscore,
  cardioLoadIndex,
  longevityPercentile,
} from "./persona-01";

// Persona 02 — Concerned Preventer
export {
  boneLoadProxy,
  cognitiveReserveIndex,
  movementConsistencyPct,
  sleepFragmentationFlag,
  wellbeingTrajectory,
} from "./persona-02";

// Persona 03 — Digital Optimizer
export {
  recoveryScoreDaily,
  strainVsRecoveryRatio,
  circadianConsistency,
  metabolicFlexibility,
  inflammationIndex,
  biomarkerDriftFlag,
} from "./persona-03";

// Persona 04 — Clinic-Anchored Loyalist
export {
  bpControlStatus,
  prediabetesTrajectory,
  medicationBurdenScore,
  walkStreakDays,
  fallRiskProxy,
  clinicEngagementScore,
} from "./persona-04";

// Helpers
export { mean, stddev, zscore, slope, clamp, normalize, pctWhere, rollingMean, streak, round } from "./helpers";

// ------------------------------------------------------------------
// Orchestrator: compute all features in one call
// ------------------------------------------------------------------
import * as universal from "./universal";
import * as p01 from "./persona-01";
import * as p02 from "./persona-02";
import * as p03 from "./persona-03";
import * as p04 from "./persona-04";

export function computeAllFeatures(
  ehr: EhrRecord,
  wearable: WearableTelemetry[],
  lifestyle: LifestyleSurvey,
): ComputedFeatures {
  return {
    // Universal
    bioAge: universal.bioAgeEstimate(ehr, wearable),
    cardioRisk: universal.cardioRiskAmpel(ehr),
    metabolicHealth: universal.metabolicHealthScore(ehr),
    activityAdherence: universal.activityAdherencePct(wearable),
    sleepComposite: universal.sleepCompositeScore(wearable),
    stressInflammation: universal.stressInflammationLink(ehr, wearable, lifestyle),

    // Persona 01 — Preventive Performer
    vo2max: p01.vo2maxProxy(ehr, wearable),
    hrv30dTrend: p01.hrv30dTrend(wearable),
    rhrZscore: p01.rhr7dVs90dZscore(wearable),
    cardioLoad: p01.cardioLoadIndex(wearable),
    longevityPercentile: p01.longevityPercentile(ehr, wearable, lifestyle),

    // Persona 02 — Concerned Preventer
    boneLoad: p02.boneLoadProxy(wearable),
    cognitiveReserve: p02.cognitiveReserveIndex(wearable, lifestyle),
    movementConsistency: p02.movementConsistencyPct(wearable),
    sleepFragmentation: p02.sleepFragmentationFlag(wearable),
    wellbeing: p02.wellbeingTrajectory(lifestyle),

    // Persona 03 — Digital Optimizer
    recoveryScore: p03.recoveryScoreDaily(wearable),
    strainRecovery: p03.strainVsRecoveryRatio(wearable),
    circadianConsistency: p03.circadianConsistency(wearable),
    metabolicFlexibility: p03.metabolicFlexibility(ehr),
    inflammation: p03.inflammationIndex(ehr, wearable, lifestyle),
    biomarkerDrift: p03.biomarkerDriftFlag(wearable),

    // Persona 04 — Clinic-Anchored Loyalist
    bpControl: p04.bpControlStatus(ehr, wearable),
    prediabetes: p04.prediabetesTrajectory(ehr, wearable),
    medicationBurden: p04.medicationBurdenScore(ehr),
    walkStreak: p04.walkStreakDays(wearable),
    fallRisk: p04.fallRiskProxy(ehr, wearable),
    clinicEngagement: p04.clinicEngagementScore(ehr),
  };
}

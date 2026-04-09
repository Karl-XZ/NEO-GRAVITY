// ============================================================
// LongevIQ — Shared TypeScript types
// ============================================================

/** User-selectable detail level for the dashboard UI */
export type UiMode = "simple" | "standard" | "expert";

/** Persona hint derived from onboarding */
export type PersonaHint =
  | "preventive-performer"
  | "concerned-preventer"
  | "digital-optimizer"
  | "clinic-anchored-loyalist";

/** User profile linked to auth.users */
export interface Profile {
  id: string; // uuid, references auth.users
  patient_id: string;
  display_name: string | null;
  ui_mode: UiMode;
  persona_hint: PersonaHint | null;
  created_at: string;
}

/** Extended profile shape used by the current UI */
export interface UserProfile extends Profile {
  email: string;
  role_label: string;
  plan_label: string;
  city: string;
  country_code: string;
  timezone: string;
  primary_goal: string;
  focus_areas: string[];
}

/** EHR record — one row per patient (clinical baseline) */
export interface EhrRecord {
  patient_id: string;
  age: number;
  sex: string;
  country: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  smoking_status: string;
  alcohol_units_weekly: number;
  chronic_conditions: string; // pipe-separated, e.g. "type2_diabetes|dyslipidaemia"
  icd_codes: string; // pipe-separated, e.g. "E11|E78.5"
  n_chronic_conditions: number;
  medications: string; // pipe-separated, e.g. "Metformin 500mg bd|Atorvastatin 40mg od"
  n_visits_2yr: number;
  visit_history: string; // raw string "date:code|date:code|..."
  sbp_mmhg: number;
  dbp_mmhg: number;
  total_cholesterol_mmol: number;
  ldl_mmol: number;
  hdl_mmol: number;
  triglycerides_mmol: number;
  hba1c_pct: number;
  fasting_glucose_mmol: number;
  crp_mg_l: number;
  egfr_ml_min: number;
}

/** Wearable telemetry — one row per patient per day */
export interface WearableTelemetry {
  patient_id: string;
  date: string;
  resting_hr_bpm: number;
  hrv_rmssd_ms: number;
  steps: number;
  active_minutes: number;
  sleep_duration_hrs: number;
  sleep_quality_score: number;
  deep_sleep_pct: number;
  spo2_avg_pct: number;
  calories_burned_kcal: number;
}

/** Lifestyle survey — one row per patient per survey date */
export interface LifestyleSurvey {
  patient_id: string;
  survey_date: string;
  smoking_status: string;
  alcohol_units_weekly: number;
  diet_quality_score: number;
  fruit_veg_servings_daily: number;
  meal_frequency_daily: number;
  exercise_sessions_weekly: number;
  sedentary_hrs_day: number;
  stress_level: number;
  sleep_satisfaction: number;
  mental_wellbeing_who5: number;
  self_rated_health: number;
  water_glasses_daily: number;
}

/** Pre-computed derived features (stored as JSONB) */
export interface DerivedFeatures {
  patient_id: string;
  features: Record<string, unknown>;
  computed_at: string;
}

/** Daily readiness/recovery scores */
export interface DailyScore {
  patient_id: string;
  date: string;
  readiness_score: number;
  recovery_score: number;
}

/** Traffic-light status for clinical indicators */
export type TrafficLight = "green" | "yellow" | "red";

/** Bio-age estimate output */
export interface BioAgeEstimate {
  bioAge: number;
  delta: number;
  drivers: string[];
}

/** Coach suggestion card */
export interface CoachSuggestion {
  severity: TrafficLight;
  title: string;
  rationale: string;
  action: string;
}

export type PriorityDomain =
  | "clinical"
  | "sleep"
  | "recovery"
  | "mood"
  | "activity";

export interface DailyPriority {
  key: PriorityDomain;
  severity: TrafficLight;
  headline: string;
  reason: string;
  action: string;
  todayPlan: string[];
  priorityScore: number;
  suppresses: PriorityDomain[];
  supportingSignals: string[];
}

/** All computed features for a patient, returned by computeAllFeatures() */
export interface ComputedFeatures {
  // Universal
  bioAge: { bioAge: number; delta: number; drivers: string[] };
  cardioRisk: { status: TrafficLight; reasons: string[] };
  metabolicHealth: { score: number; criteriaCount: number; criteria: string[] };
  activityAdherence: number;
  sleepComposite: { score: number; durationScore: number; qualityScore: number; deepSleepScore: number };
  stressInflammation: { score: number; level: TrafficLight };

  // Persona 01 — Preventive Performer
  vo2max: { vo2max: number; percentile: string };
  hrv30dTrend: { slope: number; interpretation: string };
  rhrZscore: { zscore: number; flag: boolean; interpretation: string };
  cardioLoad: { index: number; weeklyAvg: number };
  longevityPercentile: number;

  // Persona 02 — Concerned Preventer
  boneLoad: { weeklyMinutes: number; score: number; interpretation: string };
  cognitiveReserve: { score: number; level: TrafficLight };
  movementConsistency: { pct: number; level: TrafficLight };
  sleepFragmentation: { flagged: boolean; shortNights: number; avgQuality: number; interpretation: string };
  wellbeing: { who5: number; depressionFlag: boolean; level: TrafficLight; recommendation: string };

  // Persona 03 — Digital Optimizer
  recoveryScore: { score: number; hrvComponent: number; rhrComponent: number; deepComponent: number };
  strainRecovery: { ratio: number; flag: boolean; interpretation: string };
  circadianConsistency: { stddevHrs: number; score: number; interpretation: string };
  metabolicFlexibility: { ratio: number; level: TrafficLight; interpretation: string };
  inflammation: { score: number; level: TrafficLight };
  biomarkerDrift: { drifting: boolean; metrics: { name: string; drift: number; flagged: boolean }[] };

  // Persona 04 — Clinic-Anchored Loyalist
  bpControl: { sbp: number; dbp: number; status: TrafficLight; label: string };
  prediabetes: { hba1c: number; status: TrafficLight; activityModifier: string; recommendation: string };
  medicationBurden: { count: number; score: number; interpretation: string };
  walkStreak: { days: number; interpretation: string };
  fallRisk: { score: number; level: TrafficLight; factors: string[] };
  clinicEngagement: { score: number; visitsPerYear: number; interpretation: string };

  // Insights — cross-metric analysis
  insights: ComputedInsights;
}

/** All computed insight features */
export interface ComputedInsights {
  sleepHrvCorrelation: {
    correlation: number;
    hrvAfterGoodSleep: number;
    hrvAfterPoorSleep: number;
    deltaMa: number;
    sensitivity: "high" | "moderate" | "low";
    interpretation: string;
  };
  energyBalance: {
    avgCaloriesBurned: number;
    estimatedIntakeProxy: number;
    balanceRatio: number;
    direction: "surplus" | "balanced" | "deficit";
    flag: boolean;
    interpretation: string;
  };
  hydration: {
    waterGlasses: number;
    adjustedNeed: number;
    hydrationRatio: number;
    rhrElevationFlag: boolean;
    status: TrafficLight;
    interpretation: string;
  };
  spo2Profile: {
    avgSpo2: number;
    minSpo2: number;
    lowNights: number;
    trend: number;
    apneaRiskFlag: boolean;
    compoundFlag: boolean;
    status: TrafficLight;
    interpretation: string;
  };
  sedentaryScore: {
    sedentaryHrs: number;
    activeMinAvg: number;
    ratio: number;
    offsetsRisk: boolean;
    score: number;
    status: TrafficLight;
    interpretation: string;
  };
  circadianWeekday: {
    dayProfiles: { dayName: string; avgSleepQuality: number; avgHRV: number; avgSteps: number }[];
    bestDay: { name: string; avgHRV: number };
    worstDay: { name: string; avgHRV: number };
    socialJetLagFlag: boolean;
    weekdaySleep: number;
    weekendSleep: number;
    interpretation: string;
  };
  weekOverWeek: {
    metrics: {
      name: string;
      thisWeekAvg: number;
      lastWeekAvg: number;
      changePct: number;
      improved: boolean;
      significant: boolean;
    }[];
    overallTrend: "improving" | "stable" | "declining";
    topImprovement: string;
    topDecline: string;
  };
  lifestyleImpact: {
    overallScore: number;
    factors: { name: string; value: number; score: number; gap: number }[];
    topOpportunity: string;
    topStrength: string;
    interpretation: string;
  };
  recoveryPrediction: {
    predictedRecovery: number;
    confidence: "high" | "moderate" | "low";
    topDrivers: string[];
    recommendation: string;
  };
  longevityTrend: {
    dimensions: { name: string; firstHalfScore: number; secondHalfScore: number; change: number; improving: boolean; declining: boolean }[];
    overallChange: number;
    trendDirection: "improving" | "stable" | "declining";
    momentum: number;
    interpretation: string;
  };
  visitHistory: {
    totalVisits: number;
    daysSinceLastVisit: number;
    visitReasons: { date: string; code: string; category: string }[];
    frequencyTrend: "increasing" | "stable" | "decreasing";
    preventiveOverdue: boolean;
    interpretation: string;
  };
  medicationMapping: {
    mappings: { medication: string; condition: string; matched: boolean }[];
    medicationCount: number;
    conditionCount: number;
    coherenceScore: number;
    polypharmacyFlag: boolean;
    interpretation: string;
  };
}

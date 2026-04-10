// ============================================================
// Mock data for UI development — based on real CSV schema
// ============================================================

import type {
  EhrRecord,
  WearableTelemetry,
  LifestyleSurvey,
  BioAgeEstimate,
  CoachSuggestion,
  DailyScore,
  UserProfile,
} from "./types";

export const MOCK_PATIENT_ID = "PAT-2024-0042";

export const mockUserProfile: UserProfile = {
  id: "00000000-0000-4000-8000-000000000042",
  patient_id: MOCK_PATIENT_ID,
  display_name: "Thomas M.",
  ui_mode: "standard",
  persona_hint: "digital-optimizer",
  created_at: "2026-01-14T09:00:00.000Z",
  email: "thomas.m@longeviq.demo",
  role_label: "Patient",
  plan_label: "LongevIQ Plus",
  city: "Berlin",
  country_code: "DE",
  timezone: "Europe/Berlin",
  alert_mode: "simple",
  primary_goal: "More energy in daily life and better recovery after intense weeks.",
  focus_areas: [
    "Sleep optimization",
    "Cardiometabolic prevention",
    "Stress regulation",
  ],
};

export const mockEhr: EhrRecord = {
  patient_id: MOCK_PATIENT_ID,
  age: 47,
  sex: "Male",
  country: "DE",
  height_cm: 181,
  weight_kg: 84,
  bmi: 25.6,
  smoking_status: "never",
  alcohol_units_weekly: 6,
  chronic_conditions: "dyslipidaemia",
  icd_codes: "E78.5",
  n_chronic_conditions: 1,
  medications: "Atorvastatin 20mg od",
  n_visits_2yr: 4,
  visit_history: "2025-09-12:E78.5|2025-03-20:Z00.0|2024-10-05:E78.5|2024-04-15:Z00.0",
  sbp_mmhg: 128,
  dbp_mmhg: 82,
  total_cholesterol_mmol: 5.4,
  ldl_mmol: 3.2,
  hdl_mmol: 1.4,
  triglycerides_mmol: 1.8,
  hba1c_pct: 5.6,
  fasting_glucose_mmol: 5.2,
  crp_mg_l: 1.8,
  egfr_ml_min: 92,
};

/** 30 days of wearable data */
export const mockWearable: WearableTelemetry[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 3, 9 - (29 - i));
  const dayVariance = Math.sin(i * 0.4) * 0.15;
  return {
    patient_id: MOCK_PATIENT_ID,
    date: date.toISOString().split("T")[0],
    resting_hr_bpm: Math.round(62 + dayVariance * 10 + Math.random() * 4),
    hrv_rmssd_ms: Math.round(42 + dayVariance * 15 + Math.random() * 8),
    steps: Math.round(8200 + dayVariance * 3000 + Math.random() * 2000),
    active_minutes: Math.round(45 + dayVariance * 20 + Math.random() * 15),
    sleep_duration_hrs: +(7.2 + dayVariance * 0.8 + Math.random() * 0.5).toFixed(1),
    sleep_quality_score: Math.round(72 + dayVariance * 12 + Math.random() * 8),
    deep_sleep_pct: +(18 + dayVariance * 5 + Math.random() * 3).toFixed(1),
    spo2_avg_pct: +(96.5 + Math.random() * 1.5).toFixed(1),
    calories_burned_kcal: Math.round(2200 + dayVariance * 400 + Math.random() * 200),
  };
});

export const mockLifestyle: LifestyleSurvey = {
  patient_id: MOCK_PATIENT_ID,
  survey_date: "2026-04-01",
  smoking_status: "never",
  alcohol_units_weekly: 6,
  diet_quality_score: 68,
  fruit_veg_servings_daily: 4,
  meal_frequency_daily: 3,
  exercise_sessions_weekly: 4,
  sedentary_hrs_day: 7,
  stress_level: 42,
  sleep_satisfaction: 72,
  mental_wellbeing_who5: 64,
  self_rated_health: 75,
  water_glasses_daily: 7,
};

export const mockBioAge: BioAgeEstimate = {
  bioAge: 44.2,
  delta: -2.8,
  drivers: ["HRV above average", "Good sleep consistency", "Elevated LDL"],
};

export const mockDailyScores: DailyScore[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 3, 9 - (29 - i));
  const wave = Math.sin(i * 0.3) * 0.1;
  return {
    patient_id: MOCK_PATIENT_ID,
    date: date.toISOString().split("T")[0],
    readiness_score: Math.round(74 + wave * 20 + Math.random() * 10),
    recovery_score: Math.round(70 + wave * 18 + Math.random() * 12),
  };
});

export const mockCoachSuggestions: CoachSuggestion[] = [
  {
    severity: "red",
    title: "LDL cholesterol elevated",
    rationale:
      "Your LDL level of 3.2 mmol/L is above the target range of <2.6 mmol/L. Combined with existing dyslipidaemia, this should be monitored.",
    action:
      "Discuss with your doctor whether the atorvastatin dose should be adjusted. Increase the proportion of omega-3 fatty acids in your diet.",
  },
  {
    severity: "yellow",
    title: "Blood pressure borderline",
    rationale:
      "Your systolic blood pressure of 128 mmHg is in the high-normal range. With regular elevation, cardiovascular risk increases.",
    action:
      "Reduce your sodium intake and increase aerobic activity to at least 150 minutes per week.",
  },
  {
    severity: "green",
    title: "Excellent sleep consistency",
    rationale:
      "Your sleep duration is consistently 7+ hours with an average quality of 74/100. This supports your recovery scores.",
    action: "Keep it up! Consistent sleep schedules are one of the strongest longevity factors.",
  },
  {
    severity: "green",
    title: "Bio-age below chronological age",
    rationale:
      "Your biological age is estimated at 44.2 years — 2.8 years below your chronological age of 47.",
    action:
      "Keep going. Focus on improving the yellow and red areas to extend your advantage.",
  },
];

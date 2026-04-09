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
  primary_goal: "Mehr Energie im Alltag und bessere Erholung nach intensiven Wochen.",
  focus_areas: [
    "Schlafoptimierung",
    "Kardiometabolische Prävention",
    "Stressregulation",
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
    title: "LDL-Cholesterin erhöht",
    rationale:
      "Ihr LDL-Wert von 3.2 mmol/L liegt über dem Zielbereich von <2.6 mmol/L. In Kombination mit der bestehenden Dyslipidämie sollte dies beobachtet werden.",
    action:
      "Besprechen Sie mit Ihrem Arzt, ob die Atorvastatin-Dosis angepasst werden sollte. Erhöhen Sie den Anteil an Omega-3-Fettsäuren in Ihrer Ernährung.",
  },
  {
    severity: "yellow",
    title: "Blutdruck im Grenzbereich",
    rationale:
      "Ihr systolischer Blutdruck von 128 mmHg liegt im hochnormalen Bereich. Bei regelmäßiger Erhöhung steigt das kardiovaskuläre Risiko.",
    action:
      "Reduzieren Sie die Natriumzufuhr und steigern Sie die aerobe Aktivität auf mindestens 150 Minuten pro Woche.",
  },
  {
    severity: "green",
    title: "Hervorragende Schlafkonsistenz",
    rationale:
      "Ihre Schlafdauer liegt konsistent bei 7+ Stunden mit einer Qualität von durchschnittlich 74/100. Das unterstützt Ihre Erholungswerte.",
    action: "Beibehalten! Konsistente Schlafzeiten sind einer der stärksten Longevity-Faktoren.",
  },
  {
    severity: "green",
    title: "Bio-Age unter chronologischem Alter",
    rationale:
      "Ihr biologisches Alter wird auf 44.2 Jahre geschätzt — 2.8 Jahre unter Ihrem chronologischen Alter von 47.",
    action:
      "Weiter so. Fokussieren Sie sich auf die Verbesserung der gelben und roten Bereiche, um den Vorsprung auszubauen.",
  },
];

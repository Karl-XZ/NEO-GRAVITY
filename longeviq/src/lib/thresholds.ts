// ============================================================
// LongevIQ — Clinical thresholds
// Sources: ESC 2023 Guidelines, IDF MetS Criteria, WHO
// ============================================================

export const THRESHOLDS = {
  /** Blood pressure — ESC 2023 */
  bp: {
    optimal_sbp: 120,
    optimal_dbp: 80,
    high_normal_sbp: 130,
    high_normal_dbp: 85,
    hypertension_sbp: 140,
    hypertension_dbp: 90,
  },

  /** LDL cholesterol (mmol/L) — ESC risk-stratified */
  ldl: {
    very_high_risk_target: 1.4,
    high_risk_target: 1.8,
    moderate_risk_target: 2.6,
    borderline_high: 3.0,
    high: 4.1,
  },

  /** HDL cholesterol (mmol/L) */
  hdl: {
    low_male: 1.03,
    low_female: 1.29,
    optimal: 1.5,
  },

  /** Triglycerides (mmol/L) */
  triglycerides: {
    normal: 1.7,
    borderline: 2.3,
    high: 5.6,
  },

  /** HbA1c (%) — ADA */
  hba1c: {
    normal: 5.7,
    prediabetes: 6.5,
  },

  /** Fasting glucose (mmol/L) */
  glucose: {
    normal: 5.6,
    prediabetes: 7.0,
  },

  /** CRP (mg/L) — cardiovascular risk stratification */
  crp: {
    low_risk: 1.0,
    moderate_risk: 3.0,
    high_risk: 10.0,
  },

  /** eGFR (mL/min) — KDIGO */
  egfr: {
    normal: 90,
    mild_decrease: 60,
    moderate_decrease: 30,
  },

  /** BMI (kg/m²) */
  bmi: {
    underweight: 18.5,
    normal: 25,
    overweight: 30,
  },

  /** Activity — WHO 2020 */
  activity: {
    steps_daily_target: 5000,
    steps_optimal: 8000,
    who_active_min_weekly: 150,
  },

  /** Sleep — AASM / NSF */
  sleep: {
    min_hrs: 7,
    max_hrs: 9,
    deep_pct_min: 15,
    deep_pct_optimal: 20,
    quality_good: 70,
  },

  /** WHO-5 Wellbeing Index (0–100 scale mapped from 0–25 raw) */
  who5: {
    depression_screening: 13,
    low_wellbeing: 50,
  },

  /** Metabolic Syndrome — IDF + AHA/NHLBI harmonized (2009) */
  mets: {
    bmi_proxy: 25,
    triglycerides: 1.7,
    hdl_low_male: 1.03,
    hdl_low_female: 1.29,
    sbp: 130,
    dbp: 85,
    fasting_glucose: 5.6,
  },

  /** SpO2 — apnea screening */
  spo2: {
    normal: 95,
    low: 92,
  },

  /** Hydration (glasses of water per day) */
  hydration: {
    base_need: 8,
    active_bonus_high: 2, // active_minutes > 45
    active_bonus_moderate: 1, // active_minutes > 20
    bmi_bonus: 1, // BMI > 30
    good_ratio: 0.85,
    adequate_ratio: 0.7,
  },

  /** Sedentary behaviour (hours per day) */
  sedentary: {
    optimal_max_hrs: 6,
    high_risk_hrs: 10,
    who_offset_min_weekly: 150,
  },

  /** Energy balance proxy */
  energy: {
    base_kcal_per_meal: 500,
    surplus_ratio: 0.8,
    deficit_ratio: 1.2,
  },

  /**
   * Bio-age model weights — simplified Klemera-Doubal-inspired
   * Each weight represents the biomarker's contribution to aging deviation.
   * Positive weight = higher value ages you; negative = higher value is protective.
   */
  bio_age_weights: {
    hba1c_pct: { weight: 1.5, ref_mean: 5.4, ref_sd: 0.5 },
    crp_mg_l: { weight: 1.2, ref_mean: 1.5, ref_sd: 1.8 },
    hrv_rmssd_ms: { weight: -1.8, ref_mean: 42, ref_sd: 15 },
    resting_hr_bpm: { weight: 1.0, ref_mean: 65, ref_sd: 8 },
    sbp_mmhg: { weight: 1.3, ref_mean: 125, ref_sd: 12 },
    ldl_mmol: { weight: 0.8, ref_mean: 3.0, ref_sd: 0.8 },
    egfr_ml_min: { weight: -0.6, ref_mean: 90, ref_sd: 15 },
  },
} as const;

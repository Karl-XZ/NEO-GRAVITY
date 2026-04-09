/**
 * Load CSV data into Supabase tables.
 *
 * Usage:  npx tsx scripts/load-data.ts
 *
 * Expects these env vars (reads from .env.local automatically):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * CSV files are expected at the repo root:
 *   ../ehr_records.csv
 *   ../lifestyle_survey.csv
 *   ../wearable_telemetry_1.csv
 */

import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";

// --------------- env ---------------
// Load .env.local manually (no dotenv dependency needed)
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --------------- helpers ---------------
function readCsv<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const { data, errors } = Papa.parse<T>(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  if (errors.length > 0) {
    console.warn(`Parse warnings for ${filePath}:`, errors);
  }
  return data;
}

// --------------- loaders ---------------
async function loadEhrRecords() {
  const csvPath = path.resolve(__dirname, "../../ehr_records.csv");
  const raw = readCsv<Record<string, unknown>>(csvPath);

  const rows = raw.map((r) => ({
    patient_id: r.patient_id,
    age: r.age,
    sex: r.sex,
    country: r.country,
    height_cm: r.height_cm,
    weight_kg: r.weight_kg,
    bmi: r.bmi,
    smoking_status: r.smoking_status,
    alcohol_units_weekly: r.alcohol_units_weekly,
    chronic_conditions: r.chronic_conditions ?? "",
    icd_codes: r.icd_codes ?? "",
    n_chronic_conditions: r.n_chronic_conditions,
    medications: r.medications ?? "",
    n_visits_2yr: r.n_visits_2yr,
    visit_history: r.visit_history ?? null,
    sbp_mmhg: r.sbp_mmhg,
    dbp_mmhg: r.dbp_mmhg,
    total_cholesterol_mmol: r.total_cholesterol_mmol,
    ldl_mmol: r.ldl_mmol,
    hdl_mmol: r.hdl_mmol,
    triglycerides_mmol: r.triglycerides_mmol,
    hba1c_pct: r.hba1c_pct,
    fasting_glucose_mmol: r.fasting_glucose_mmol,
    crp_mg_l: r.crp_mg_l,
    egfr_ml_min: r.egfr_ml_min,
  }));

  const { error } = await supabase.from("ehr_records").upsert(rows, {
    onConflict: "patient_id",
  });
  if (error) throw new Error(`ehr_records: ${error.message}`);
  console.log(`✓ ehr_records: ${rows.length} rows loaded`);
}

async function loadWearableTelemetry() {
  const csvPath = path.resolve(__dirname, "../../wearable_telemetry_1.csv");
  const raw = readCsv<Record<string, unknown>>(csvPath);

  const rows = raw.map((r) => ({
    patient_id: r.patient_id,
    date: r.date,
    resting_hr_bpm: r.resting_hr_bpm,
    hrv_rmssd_ms: r.hrv_rmssd_ms,
    steps: r.steps,
    active_minutes: r.active_minutes,
    sleep_duration_hrs: r.sleep_duration_hrs,
    sleep_quality_score: r.sleep_quality_score,
    deep_sleep_pct: r.deep_sleep_pct,
    spo2_avg_pct: r.spo2_avg_pct,
    calories_burned_kcal: r.calories_burned_kcal,
  }));

  // Batch in chunks of 500 (wearable data can be large)
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("wearable_telemetry").upsert(batch, {
      onConflict: "patient_id,date",
    });
    if (error) throw new Error(`wearable_telemetry batch ${i}: ${error.message}`);
  }
  console.log(`✓ wearable_telemetry: ${rows.length} rows loaded`);
}

async function loadLifestyleSurvey() {
  const csvPath = path.resolve(__dirname, "../../lifestyle_survey.csv");
  const raw = readCsv<Record<string, unknown>>(csvPath);

  const rows = raw.map((r) => ({
    patient_id: r.patient_id,
    survey_date: r.survey_date,
    smoking_status: r.smoking_status,
    alcohol_units_weekly: r.alcohol_units_weekly,
    diet_quality_score: r.diet_quality_score,
    fruit_veg_servings_daily: r.fruit_veg_servings_daily,
    meal_frequency_daily: r.meal_frequency_daily,
    exercise_sessions_weekly: r.exercise_sessions_weekly,
    sedentary_hrs_day: r.sedentary_hrs_day,
    stress_level: r.stress_level,
    sleep_satisfaction: r.sleep_satisfaction,
    mental_wellbeing_who5: r.mental_wellbeing_who5,
    self_rated_health: r.self_rated_health,
    water_glasses_daily: r.water_glasses_daily,
  }));

  const { error } = await supabase.from("lifestyle_survey").upsert(rows, {
    onConflict: "patient_id,survey_date",
  });
  if (error) throw new Error(`lifestyle_survey: ${error.message}`);
  console.log(`✓ lifestyle_survey: ${rows.length} rows loaded`);
}

// --------------- main ---------------
async function main() {
  console.log("Loading data into Supabase...\n");

  // EHR must go first (other tables have FK to it)
  await loadEhrRecords();
  await loadWearableTelemetry();
  await loadLifestyleSurvey();

  console.log("\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

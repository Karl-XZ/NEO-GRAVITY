import { createAdminClient } from "./supabase/admin";
import type {
  EhrRecord,
  WearableTelemetry,
  LifestyleSurvey,
  DailyScore,
} from "./types";

// Simulated logged-in patient — replace with auth later
const CURRENT_PATIENT_ID = "PT0001";

export function getPatientId() {
  return CURRENT_PATIENT_ID;
}

const supabase = createAdminClient();

export async function getEhrRecord(): Promise<EhrRecord> {
  const { data, error } = await supabase
    .from("ehr_records")
    .select("*")
    .eq("patient_id", CURRENT_PATIENT_ID)
    .single();

  if (error) throw new Error(`Failed to fetch EHR: ${error.message}`);
  return data as EhrRecord;
}

export async function getWearable(limit = 30): Promise<WearableTelemetry[]> {
  const { data, error } = await supabase
    .from("wearable_telemetry")
    .select("*")
    .eq("patient_id", CURRENT_PATIENT_ID)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch wearable: ${error.message}`);
  // Reverse so oldest is first (chronological order for charts)
  return (data as WearableTelemetry[]).reverse();
}

export async function getDailyScores(limit = 30): Promise<DailyScore[]> {
  const { data, error } = await supabase
    .from("daily_scores")
    .select("*")
    .eq("patient_id", CURRENT_PATIENT_ID)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch daily scores: ${error.message}`);
  return (data as DailyScore[]).reverse();
}

export async function getLifestyle(): Promise<LifestyleSurvey> {
  const { data, error } = await supabase
    .from("lifestyle_survey")
    .select("*")
    .eq("patient_id", CURRENT_PATIENT_ID)
    .order("survey_date", { ascending: false })
    .limit(1)
    .single();

  if (error) throw new Error(`Failed to fetch lifestyle: ${error.message}`);
  return data as LifestyleSurvey;
}

import { createAdminClient } from "./supabase/admin";
import {
  MOCK_PATIENT_ID,
  mockDailyScores,
  mockEhr,
  mockLifestyle,
  mockUserProfile,
  mockWearable,
} from "./mock-data";
import type {
  EhrRecord,
  WearableTelemetry,
  LifestyleSurvey,
  DailyScore,
  UserProfile,
} from "./types";

// Simulated logged-in patient — replace with auth later
const CURRENT_PATIENT_ID = "PT0001";
const hasSupabaseAdminConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export function getPatientId() {
  return hasSupabaseAdminConfig ? CURRENT_PATIENT_ID : MOCK_PATIENT_ID;
}

export async function getUserProfile(): Promise<UserProfile> {
  if (!hasSupabaseAdminConfig) {
    return mockUserProfile;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("patient_id", CURRENT_PATIENT_ID)
    .maybeSingle();

  if (error || !data) {
    return mockUserProfile;
  }

  return {
    ...mockUserProfile,
    ...data,
    display_name: data.display_name ?? mockUserProfile.display_name,
    ui_mode: data.ui_mode ?? mockUserProfile.ui_mode,
    persona_hint: data.persona_hint ?? mockUserProfile.persona_hint,
    patient_id: data.patient_id ?? mockUserProfile.patient_id,
  } satisfies UserProfile;
}

export async function getEhrRecord(): Promise<EhrRecord> {
  if (!hasSupabaseAdminConfig) {
    return mockEhr;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ehr_records")
    .select("*")
    .eq("patient_id", CURRENT_PATIENT_ID)
    .single();

  if (error) throw new Error(`Failed to fetch EHR: ${error.message}`);
  return data as EhrRecord;
}

export async function getWearable(limit = 30): Promise<WearableTelemetry[]> {
  if (!hasSupabaseAdminConfig) {
    return mockWearable.slice(-limit);
  }

  const supabase = createAdminClient();
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
  if (!hasSupabaseAdminConfig) {
    return mockDailyScores.slice(-limit);
  }

  const supabase = createAdminClient();
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
  if (!hasSupabaseAdminConfig) {
    return mockLifestyle;
  }

  const supabase = createAdminClient();
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

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPatientId } from "@/lib/data";
import type { EhrRecord, WearableTelemetry, LifestyleSurvey } from "@/lib/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3.1-flash-lite-preview";

async function fetchPatientContext() {
  const supabase = createAdminClient();
  const patientId = getPatientId();

  const [ehrRes, wearableRes, lifestyleRes] = await Promise.all([
    supabase
      .from("ehr_records")
      .select("*")
      .eq("patient_id", patientId)
      .single(),
    supabase
      .from("wearable_telemetry")
      .select("*")
      .eq("patient_id", patientId)
      .order("date", { ascending: false })
      .limit(30),
    supabase
      .from("lifestyle_survey")
      .select("*")
      .eq("patient_id", patientId)
      .order("survey_date", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const ehr = ehrRes.data as EhrRecord | null;
  const wearable = (wearableRes.data as WearableTelemetry[] | null)?.reverse() ?? [];
  const lifestyle = lifestyleRes.data as LifestyleSurvey | null;

  return { ehr, wearable, lifestyle };
}

function buildSystemPrompt(
  ehr: EhrRecord | null,
  wearable: WearableTelemetry[],
  lifestyle: LifestyleSurvey | null,
) {
  const latest = wearable[wearable.length - 1];

  return `You are the AI Health Companion by LongevIQ. You help users understand their health data and provide personalized, evidence-based recommendations. Always respond in English.

STYLE RULES:
- Keep answers SHORT and CONCISE — maximum 2-3 short sentences per response.
- Only use bullet points when explicitly asked.
- No long introductions or summaries.
- Get straight to the point.
- Happy to give more details on follow-up questions, but always keep the first answer brief.

IMPORTANT: You are NOT a doctor. For serious findings, briefly advise the user to consult a physician.

=== PATIENT DATA ===

${ehr ? `**Clinical Baseline (EHR):**
- Age: ${ehr.age} years, Sex: ${ehr.sex}, Country: ${ehr.country}
- Height: ${ehr.height_cm} cm, Weight: ${ehr.weight_kg} kg, BMI: ${ehr.bmi}
- Smoking status: ${ehr.smoking_status}, Alcohol: ${ehr.alcohol_units_weekly} units/week
- Chronic conditions: ${ehr.chronic_conditions.replace(/\|/g, ", ")}
- ICD codes: ${ehr.icd_codes.replace(/\|/g, ", ")}
- Medications: ${ehr.medications.replace(/\|/g, ", ")}
- Blood pressure: ${ehr.sbp_mmhg}/${ehr.dbp_mmhg} mmHg
- Total cholesterol: ${ehr.total_cholesterol_mmol} mmol/L, LDL: ${ehr.ldl_mmol}, HDL: ${ehr.hdl_mmol}
- Triglycerides: ${ehr.triglycerides_mmol} mmol/L
- HbA1c: ${ehr.hba1c_pct}%, Fasting glucose: ${ehr.fasting_glucose_mmol} mmol/L
- CRP: ${ehr.crp_mg_l} mg/L, eGFR: ${ehr.egfr_ml_min} mL/min
- Doctor visits (2 years): ${ehr.n_visits_2yr}` : "No EHR data available."}

${latest ? `**Current Wearable Data (latest day: ${latest.date}):**
- Resting heart rate: ${latest.resting_hr_bpm} bpm
- HRV (RMSSD): ${latest.hrv_rmssd_ms} ms
- Steps: ${latest.steps}
- Active minutes: ${latest.active_minutes}
- Sleep duration: ${latest.sleep_duration_hrs} hrs
- Sleep quality: ${latest.sleep_quality_score}/100
- Deep sleep ratio: ${latest.deep_sleep_pct}%
- SpO2: ${latest.spo2_avg_pct}%
- Calories burned: ${latest.calories_burned_kcal} kcal

**Wearable Trend (last ${wearable.length} days):**
- Avg. resting HR: ${(wearable.reduce((s, d) => s + d.resting_hr_bpm, 0) / wearable.length).toFixed(1)} bpm
- Avg. HRV: ${(wearable.reduce((s, d) => s + d.hrv_rmssd_ms, 0) / wearable.length).toFixed(1)} ms
- Avg. steps: ${Math.round(wearable.reduce((s, d) => s + d.steps, 0) / wearable.length)}
- Avg. sleep: ${(wearable.reduce((s, d) => s + d.sleep_duration_hrs, 0) / wearable.length).toFixed(1)} hrs` : "No wearable data available."}

${lifestyle ? `**Lifestyle Survey (${lifestyle.survey_date}):**
- Smoking status: ${lifestyle.smoking_status}
- Alcohol: ${lifestyle.alcohol_units_weekly} units/week
- Diet quality: ${lifestyle.diet_quality_score}/10
- Fruit/vegetables: ${lifestyle.fruit_veg_servings_daily} servings/day
- Exercise: ${lifestyle.exercise_sessions_weekly}x/week
- Sedentary time: ${lifestyle.sedentary_hrs_day} hrs/day
- Stress level: ${lifestyle.stress_level}/10
- Sleep satisfaction: ${lifestyle.sleep_satisfaction}/10
- WHO-5 well-being: ${lifestyle.mental_wellbeing_who5}/25
- Self-rated health: ${lifestyle.self_rated_health}/10
- Water intake: ${lifestyle.water_glasses_daily} glasses/day` : "No lifestyle data available."}`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENROUTER_API_KEY not configured" },
      { status: 500 },
    );
  }

  const { messages } = (await req.json()) as {
    messages: { role: string; content: string }[];
  };

  const { ehr, wearable, lifestyle } = await fetchPatientContext();
  const systemPrompt = buildSystemPrompt(ehr, wearable, lifestyle);

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      max_tokens: 200,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json(
      { error: `OpenRouter error: ${res.status} ${text}` },
      { status: 502 },
    );
  }

  // Stream the SSE response through to the client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop()!;

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
                );
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

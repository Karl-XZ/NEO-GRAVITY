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

  return `Du bist der AI Health Companion von LongevIQ. Du hilfst dem Nutzer, seine Gesundheitsdaten zu verstehen und gibst personalisierte, evidenzbasierte Empfehlungen. Antworte immer auf Deutsch.

STIL-REGELN:
- Antworte KURZ und PRÄGNANT — maximal 2-3 kurze Sätze pro Antwort.
- Verwende Aufzählungen nur wenn explizit danach gefragt wird.
- Keine langen Einleitungen oder Zusammenfassungen.
- Direkt auf den Punkt kommen.
- Bei Nachfragen gerne mehr Details geben, aber die erste Antwort immer knapp halten.

WICHTIG: Du bist KEIN Arzt. Weise bei ernsten Befunden kurz darauf hin, dass ein Arzt konsultiert werden sollte.

=== PATIENTENDATEN ===

${ehr ? `**Klinische Basisdaten (EHR):**
- Alter: ${ehr.age} Jahre, Geschlecht: ${ehr.sex}, Land: ${ehr.country}
- Größe: ${ehr.height_cm} cm, Gewicht: ${ehr.weight_kg} kg, BMI: ${ehr.bmi}
- Rauchstatus: ${ehr.smoking_status}, Alkohol: ${ehr.alcohol_units_weekly} Einheiten/Woche
- Chronische Erkrankungen: ${ehr.chronic_conditions.replace(/\|/g, ", ")}
- ICD-Codes: ${ehr.icd_codes.replace(/\|/g, ", ")}
- Medikamente: ${ehr.medications.replace(/\|/g, ", ")}
- Blutdruck: ${ehr.sbp_mmhg}/${ehr.dbp_mmhg} mmHg
- Gesamtcholesterin: ${ehr.total_cholesterol_mmol} mmol/L, LDL: ${ehr.ldl_mmol}, HDL: ${ehr.hdl_mmol}
- Triglyceride: ${ehr.triglycerides_mmol} mmol/L
- HbA1c: ${ehr.hba1c_pct}%, Nüchternglukose: ${ehr.fasting_glucose_mmol} mmol/L
- CRP: ${ehr.crp_mg_l} mg/L, eGFR: ${ehr.egfr_ml_min} mL/min
- Arztbesuche (2 Jahre): ${ehr.n_visits_2yr}` : "Keine EHR-Daten verfügbar."}

${latest ? `**Aktuelle Wearable-Daten (letzter Tag: ${latest.date}):**
- Ruhe-Herzfrequenz: ${latest.resting_hr_bpm} bpm
- HRV (RMSSD): ${latest.hrv_rmssd_ms} ms
- Schritte: ${latest.steps}
- Aktive Minuten: ${latest.active_minutes}
- Schlafdauer: ${latest.sleep_duration_hrs} Std.
- Schlafqualität: ${latest.sleep_quality_score}/100
- Tiefschlaf-Anteil: ${latest.deep_sleep_pct}%
- SpO2: ${latest.spo2_avg_pct}%
- Kalorienverbrauch: ${latest.calories_burned_kcal} kcal

**Wearable-Trend (letzte ${wearable.length} Tage):**
- Durchschnittl. Ruhe-HF: ${(wearable.reduce((s, d) => s + d.resting_hr_bpm, 0) / wearable.length).toFixed(1)} bpm
- Durchschnittl. HRV: ${(wearable.reduce((s, d) => s + d.hrv_rmssd_ms, 0) / wearable.length).toFixed(1)} ms
- Durchschnittl. Schritte: ${Math.round(wearable.reduce((s, d) => s + d.steps, 0) / wearable.length)}
- Durchschnittl. Schlaf: ${(wearable.reduce((s, d) => s + d.sleep_duration_hrs, 0) / wearable.length).toFixed(1)} Std.` : "Keine Wearable-Daten verfügbar."}

${lifestyle ? `**Lifestyle-Umfrage (${lifestyle.survey_date}):**
- Rauchstatus: ${lifestyle.smoking_status}
- Alkohol: ${lifestyle.alcohol_units_weekly} Einheiten/Woche
- Ernährungsqualität: ${lifestyle.diet_quality_score}/10
- Obst/Gemüse: ${lifestyle.fruit_veg_servings_daily} Portionen/Tag
- Sport: ${lifestyle.exercise_sessions_weekly}x/Woche
- Sitzzeit: ${lifestyle.sedentary_hrs_day} Std./Tag
- Stresslevel: ${lifestyle.stress_level}/10
- Schlafzufriedenheit: ${lifestyle.sleep_satisfaction}/10
- WHO-5 Wohlbefinden: ${lifestyle.mental_wellbeing_who5}/25
- Selbsteingeschätzte Gesundheit: ${lifestyle.self_rated_health}/10
- Wasserzufuhr: ${lifestyle.water_glasses_daily} Gläser/Tag` : "Keine Lifestyle-Daten verfügbar."}`;
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

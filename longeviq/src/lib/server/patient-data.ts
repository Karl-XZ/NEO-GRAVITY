import "server-only";

import { cache } from "react";
import { computeAllFeatures } from "@/lib/features";
import { fetchRestJson } from "@/lib/server/supabase-rest";
import type {
  AssessmentResult,
  BodyComparisonRegion,
  HealthTwin,
  OpportunityItem,
  PatientBundle,
  PatientLifestyle,
  PatientRecord,
  PatientSummary,
  PredictionTrend,
  QuestionnaireAssessmentInput,
  Recommendation,
  RiskItem,
  RiskLevel,
  RiskScore,
  Sex,
  TrajectoryPoint,
} from "@/types";

interface EhrRow {
  patient_id: string;
  age: number;
  sex: "M" | "F" | "O";
  country: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  smoking_status: string;
  alcohol_units_weekly: number;
  chronic_conditions: string;
  icd_codes: string;
  n_chronic_conditions: number;
  medications: string;
  n_visits_2yr: number;
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

interface LifestyleRow {
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

interface TelemetryRow {
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

interface PatientIdRow {
  patient_id: string;
}

const FEATURED_PATIENT_COUNT = 4;
const FEATURED_PATIENT_CANDIDATE_LIMIT = 32;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function splitPipe(value: string) {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function titleCase(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function mapSex(sex: EhrRow["sex"]): Sex {
  if (sex === "M") return "male";
  if (sex === "F") return "female";
  return "other";
}

function encodeIdList(ids: string[]) {
  return ids.map((id) => `"${id}"`).join(",");
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function stableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function buildCaseAlias(patientId: string) {
  const numericPart = patientId.replace(/\D+/g, "").slice(-3).padStart(3, "0");
  return `Case ${numericPart}`;
}

function summarizeTelemetry(rows: TelemetryRow[]) {
  const recent = [...rows].reverse().slice(-30);

  return {
    startDate: recent[0]?.date ?? "",
    endDate: recent[recent.length - 1]?.date ?? "",
    avgRestingHr: round(average(recent.map((row) => row.resting_hr_bpm))),
    avgHrv: round(average(recent.map((row) => row.hrv_rmssd_ms))),
    avgSteps: Math.round(average(recent.map((row) => row.steps))),
    avgActiveMinutes: Math.round(average(recent.map((row) => row.active_minutes))),
    avgSleepHours: round(average(recent.map((row) => row.sleep_duration_hrs))),
    avgSleepQuality: Math.round(average(recent.map((row) => row.sleep_quality_score))),
    avgDeepSleepPct: round(average(recent.map((row) => row.deep_sleep_pct))),
    avgSpo2: round(average(recent.map((row) => row.spo2_avg_pct))),
  };
}

function buildLifestyle(row: LifestyleRow): PatientLifestyle {
  return {
    surveyDate: row.survey_date,
    smokingStatus: row.smoking_status,
    alcoholUnitsWeekly: row.alcohol_units_weekly,
    dietQualityScore: row.diet_quality_score,
    fruitVegServingsDaily: row.fruit_veg_servings_daily,
    mealFrequencyDaily: row.meal_frequency_daily,
    exerciseSessionsWeekly: row.exercise_sessions_weekly,
    sedentaryHoursDay: row.sedentary_hrs_day,
    stressLevel: row.stress_level,
    sleepSatisfaction: row.sleep_satisfaction,
    mentalWellbeingWho5: row.mental_wellbeing_who5,
    selfRatedHealth: row.self_rated_health,
    waterGlassesDaily: row.water_glasses_daily,
  };
}

function buildKeyRisks(
  row: Pick<
    EhrRow,
    | "hba1c_pct"
    | "fasting_glucose_mmol"
    | "sbp_mmhg"
    | "dbp_mmhg"
    | "ldl_mmol"
    | "crp_mg_l"
  >,
  lifestyle: Pick<LifestyleRow, "exercise_sessions_weekly">,
  telemetry: ReturnType<typeof summarizeTelemetry>,
) {
  const risks: string[] = [];

  if (row.hba1c_pct >= 6.5 || row.fasting_glucose_mmol >= 7) risks.push("Glycemic Control");
  if (row.sbp_mmhg >= 140 || row.dbp_mmhg >= 90 || row.ldl_mmol >= 4) risks.push("Cardiovascular Load");
  if (telemetry.avgSleepHours < 6.8 || telemetry.avgSleepQuality < 65) risks.push("Sleep Deficit");
  if (lifestyle.exercise_sessions_weekly < 3 || telemetry.avgSteps < 7000) risks.push("Movement Deficit");
  if (row.crp_mg_l >= 3) risks.push("Inflammation");

  return risks.slice(0, 3);
}

function buildSummary(
  row: EhrRow,
  lifestyle: LifestyleRow,
  telemetry: ReturnType<typeof summarizeTelemetry>,
): PatientSummary {
  const chronicConditions = splitPipe(row.chronic_conditions);
  const keyRisks = buildKeyRisks(row, lifestyle, telemetry);
  const primaryConcern = keyRisks[0] ?? "Prevention Check";

  return {
    patientId: row.patient_id,
    displayName: buildCaseAlias(row.patient_id),
    source: "supabase",
    sourceLabel: "Active Cohort Case",
    tag: "De-identified Case",
    age: row.age,
    sex: mapSex(row.sex),
    country: row.country,
    chronicConditions,
    keyRisks,
    primaryConcern,
    shortSummary:
      chronicConditions.length > 0
        ? `Case from ${row.country} with ${chronicConditions.slice(0, 2).map((item) => titleCase(item).toLowerCase()).join(", ")} and a clear need for preventive follow-up.`
        : `Case from ${row.country} with no documented chronic condition, but with relevant prevention opportunities.`,
  };
}

function buildPatientRecord(
  row: EhrRow,
  lifestyleRow: LifestyleRow,
  telemetryRows: TelemetryRow[],
): PatientRecord {
  const lifestyle = buildLifestyle(lifestyleRow);
  const telemetry = summarizeTelemetry(telemetryRows);
  const summary = buildSummary(row, lifestyleRow, telemetry);

  return {
    ...summary,
    bmi: row.bmi,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    systolicBp: row.sbp_mmhg,
    diastolicBp: row.dbp_mmhg,
    totalCholesterolMmol: row.total_cholesterol_mmol,
    ldlMmol: row.ldl_mmol,
    hba1cPct: row.hba1c_pct,
    fastingGlucoseMmol: row.fasting_glucose_mmol,
    crpMgL: row.crp_mg_l,
    egfrMlMin: row.egfr_ml_min,
    medications: splitPipe(row.medications),
    visitCount2yr: row.n_visits_2yr,
    lifestyle,
    telemetry,
  };
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return "low";
  if (score >= 60) return "moderate";
  if (score >= 40) return "high";
  return "critical";
}

function getDimensionLabel(dimension: string, score: number) {
  switch (dimension) {
    case "Cardiovascular":
      return score >= 80 ? "Stable" : score >= 60 ? "Monitor" : "Follow Up";
    case "Metabolic":
      return score >= 80 ? "Stable Metabolism" : score >= 60 ? "Early Drift" : "High Glycemic Load";
    case "Sleep & Recovery":
      return score >= 80 ? "Recovering Well" : score >= 60 ? "Partially Recovered" : "Recovery Deficit";
    case "Activity":
      return score >= 80 ? "Consistent Movement" : score >= 60 ? "Some Movement Deficit" : "Insufficient Movement";
    case "Stress & Wellbeing":
      return score >= 80 ? "Resilient" : score >= 60 ? "Mixed Resilience" : "Stress Burden";
    default:
      return score >= 80 ? "Supportive" : score >= 60 ? "Mixed Quality" : "Improvement Needed";
  }
}

function buildRiskScores(patient: PatientRecord, telemetryRows: TelemetryRow[]) {
  const ehrLike = {
    patient_id: patient.patientId,
    age: patient.age,
    sex: patient.sex,
    country: patient.country,
    height_cm: patient.heightCm,
    weight_kg: patient.weightKg,
    bmi: patient.bmi,
    smoking_status: patient.lifestyle.smokingStatus,
    alcohol_units_weekly: patient.lifestyle.alcoholUnitsWeekly,
    chronic_conditions: patient.chronicConditions.join("|"),
    icd_codes: "",
    n_chronic_conditions: patient.chronicConditions.length,
    medications: patient.medications.join("|"),
    n_visits_2yr: patient.visitCount2yr,
    visit_history: "",
    sbp_mmhg: patient.systolicBp,
    dbp_mmhg: patient.diastolicBp,
    total_cholesterol_mmol: patient.totalCholesterolMmol,
    ldl_mmol: patient.ldlMmol,
    hdl_mmol: 1.2,
    triglycerides_mmol: 1.7,
    hba1c_pct: patient.hba1cPct,
    fasting_glucose_mmol: patient.fastingGlucoseMmol,
    crp_mg_l: patient.crpMgL,
    egfr_ml_min: patient.egfrMlMin,
  };

  const lifestyleLike = {
    patient_id: patient.patientId,
    survey_date: patient.lifestyle.surveyDate,
    smoking_status: patient.lifestyle.smokingStatus,
    alcohol_units_weekly: patient.lifestyle.alcoholUnitsWeekly,
    diet_quality_score: patient.lifestyle.dietQualityScore,
    fruit_veg_servings_daily: patient.lifestyle.fruitVegServingsDaily,
    meal_frequency_daily: patient.lifestyle.mealFrequencyDaily,
    exercise_sessions_weekly: patient.lifestyle.exerciseSessionsWeekly,
    sedentary_hrs_day: patient.lifestyle.sedentaryHoursDay,
    stress_level: patient.lifestyle.stressLevel,
    sleep_satisfaction: patient.lifestyle.sleepSatisfaction,
    mental_wellbeing_who5: patient.lifestyle.mentalWellbeingWho5,
    self_rated_health: patient.lifestyle.selfRatedHealth,
    water_glasses_daily: patient.lifestyle.waterGlassesDaily,
  };

  const features = computeAllFeatures(ehrLike, telemetryRows, lifestyleLike);
  const stressScore = clamp(
    Math.round(
      (features.wellbeing.who5 / 25) * 55 +
        (100 - patient.lifestyle.stressLevel * 8) * 0.45,
    ),
    20,
    96,
  );
  const nutritionScore = clamp(
    Math.round(
      patient.lifestyle.dietQualityScore * 7 +
        patient.lifestyle.fruitVegServingsDaily * 6 +
        patient.lifestyle.waterGlassesDaily * 1.8,
    ),
    18,
    95,
  );

  const cardioScore =
    features.cardioRisk.status === "green"
      ? 84
      : features.cardioRisk.status === "yellow"
        ? 60
        : 34;

  const scores: RiskScore[] = [
    {
      dimension: "Cardiovascular",
      score: cardioScore,
      level:
        features.cardioRisk.status === "green"
          ? "low"
          : features.cardioRisk.status === "yellow"
            ? "moderate"
            : "high",
      label: getDimensionLabel("Cardiovascular", cardioScore),
      trend: "stable",
    },
    {
      dimension: "Metabolic",
      score: features.metabolicHealth.score,
      level: riskLevelFromScore(features.metabolicHealth.score),
      label: getDimensionLabel("Metabolic", features.metabolicHealth.score),
      trend: features.biomarkerDrift.drifting ? "declining" : "stable",
    },
    {
      dimension: "Sleep & Recovery",
      score: features.sleepComposite.score,
      level: riskLevelFromScore(features.sleepComposite.score),
      label: getDimensionLabel("Sleep & Recovery", features.sleepComposite.score),
      trend: features.sleepFragmentation.flagged ? "declining" : "stable",
    },
    {
      dimension: "Activity",
      score: features.activityAdherence,
      level: riskLevelFromScore(features.activityAdherence),
      label: getDimensionLabel("Activity", features.activityAdherence),
      trend: features.walkStreak.days > 4 ? "improving" : "stable",
    },
    {
      dimension: "Stress & Wellbeing",
      score: stressScore,
      level: riskLevelFromScore(stressScore),
      label: getDimensionLabel("Stress & Wellbeing", stressScore),
      trend: features.wellbeing.depressionFlag ? "declining" : "stable",
    },
    {
      dimension: "Nutrition",
      score: nutritionScore,
      level: riskLevelFromScore(nutritionScore),
      label: getDimensionLabel("Nutrition", nutritionScore),
      trend: "stable",
    },
  ];

  return { features, scores };
}

function buildRisks(patient: PatientRecord, riskScores: RiskScore[]): RiskItem[] {
  const risks: RiskItem[] = [];
  const pushRisk = (
    id: string,
    dimension: string,
    title: string,
    description: string,
    severity: RiskLevel,
    nextAction?: string,
  ) => {
    risks.push({
      id,
      dimension,
      title,
      description,
      severity,
      actionable: true,
      nextAction,
    });
  };

  if (patient.ldlMmol >= 3.4 || patient.systolicBp >= 140 || patient.diastolicBp >= 90) {
    pushRisk(
      "cardio-load",
      "Cardiovascular",
      "Elevated Cardiovascular Load",
      `Blood pressure ${patient.systolicBp}/${patient.diastolicBp} mmHg and LDL ${patient.ldlMmol} mmol/L suggest a preventive cardiovascular follow-up.`,
      patient.systolicBp >= 150 || patient.ldlMmol >= 4.5 ? "critical" : "high",
      "Confirm the trend with a physician-guided blood pressure and lipid check.",
    );
  }

  if (patient.hba1cPct >= 6 || patient.fastingGlucoseMmol >= 6.1) {
    pushRisk(
      "metabolic-drift",
      "Metabolic",
      "Metabolic Drift Detected",
      `HbA1c ${patient.hba1cPct}% and fasting glucose ${patient.fastingGlucoseMmol} mmol/L indicate glycemic load that may still be modifiable.`,
      patient.hba1cPct >= 6.5 ? "critical" : "high",
      "Prioritize a structured metabolic check and a practical meal plan.",
    );
  }

  if (patient.telemetry.avgSleepHours < 6.8 || patient.telemetry.avgSleepQuality < 65) {
    pushRisk(
      "sleep-debt",
      "Sleep & Recovery",
      "Recovery Deficit Slowing Progress",
      `Average sleep is ${patient.telemetry.avgSleepHours} h with a quality of ${patient.telemetry.avgSleepQuality}/100. This can amplify stress and reduce adherence.`,
      patient.telemetry.avgSleepHours < 6 ? "high" : "moderate",
      "Stabilize bedtime this week and reduce late-evening variability.",
    );
  }

  if (
    patient.lifestyle.exerciseSessionsWeekly < 3 ||
    patient.telemetry.avgSteps < 7000 ||
    patient.lifestyle.sedentaryHoursDay >= 8
  ) {
    pushRisk(
      "movement-deficit",
      "Activity",
      "Insufficient Daily Movement",
      `${patient.telemetry.avgSteps} steps per day and ${patient.lifestyle.sedentaryHoursDay} sedentary hours daily indicate a significant movement deficit.`,
      patient.telemetry.avgSteps < 5000 ? "high" : "moderate",
      "Anchor a realistic activity habit into daily life and break up prolonged sitting every hour.",
    );
  }

  if (patient.crpMgL >= 3 || patient.lifestyle.stressLevel >= 7) {
    pushRisk(
      "stress-inflammation",
      "Stress & Wellbeing",
      "Elevated Stress and Inflammation Load",
      `CRP ${patient.crpMgL} mg/L combined with a stress score of ${patient.lifestyle.stressLevel}/10 suggests a strained recovery system.`,
      patient.crpMgL >= 5 ? "high" : "moderate",
      "Reduce overload and add a structured recovery check-in.",
    );
  }

  return risks;
}

function buildOpportunities(
  patient: PatientRecord,
  riskScores: RiskScore[],
): OpportunityItem[] {
  return [...riskScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((risk, index) => {
      const baseTitle =
        risk.dimension === "Activity"
          ? "Build a Weekly Movement Routine"
          : risk.dimension === "Sleep & Recovery"
            ? "Regain Recovery Consistency"
            : risk.dimension === "Cardiovascular"
              ? "Stabilize Cardiovascular Baseline"
              : risk.dimension === "Metabolic"
                ? "Lower Glycemic Load"
                : risk.dimension === "Stress & Wellbeing"
                  ? "Reduce Stress Spillover"
                  : "Improve Nutrition and Hydration Baseline";

      const description =
        risk.dimension === "Activity"
          ? `Currently at ${patient.lifestyle.exerciseSessionsWeekly} exercise sessions per week and ${patient.telemetry.avgSteps} steps per day. A clear activity anchor can quickly improve adherence.`
          : risk.dimension === "Sleep & Recovery"
            ? `Sleep quality is at ${patient.telemetry.avgSleepQuality}/100. Early recovery gains can improve multiple downstream metrics simultaneously.`
            : risk.dimension === "Cardiovascular"
              ? "A follow-up on blood pressure and lipids reduces uncertainty and clarifies the safest next step."
              : risk.dimension === "Metabolic"
                ? "Meal timing, movement, and a medical review can still noticeably improve the metabolic picture."
                : risk.dimension === "Stress & Wellbeing"
                  ? "A lower stress burden can improve both adherence and recovery resilience."
                  : `Diet quality is at ${patient.lifestyle.dietQualityScore}/10 with ${patient.lifestyle.fruitVegServingsDaily} servings per day. There is practical room for improvement here.`;

      return {
        id: `opportunity-${index + 1}`,
        dimension: risk.dimension,
        title: baseTitle,
        description,
        impactScore: clamp(Math.round((100 - risk.score) * 1.1), 38, 92),
        effortLevel:
          risk.dimension === "Cardiovascular"
            ? "medium"
            : index === 0
              ? "low"
              : "medium",
        timelineWeeks: index === 0 ? 4 : index === 1 ? 8 : 12,
      };
    });
}

function buildAssessmentResult(
  patient: PatientRecord,
  telemetryRows: TelemetryRow[],
): AssessmentResult {
  const { scores } = buildRiskScores(patient, telemetryRows);
  const risks = buildRisks(patient, scores);
  const opportunities = buildOpportunities(patient, scores);
  const overallScore = Math.round(
    scores.reduce((sum, item) => sum + item.score, 0) / scores.length,
  );
  const bioAgeEstimate = round(
    patient.age + (patient.bmi - 24) * 0.35 + (100 - overallScore) * 0.08,
    1,
  );

  return {
    overallScore,
    bioAgeEstimate,
    riskScores: scores,
    risks,
    opportunities,
    northStarMetric:
      "Share of loaded cases with at least one saved next action",
    aiSummary:
      overallScore >= 75
        ? "The preventive baseline is overall stable. Keep the plan simple and consistent."
        : overallScore >= 55
          ? "This profile shows a mixed prevention landscape with one or two particularly impactful opportunities."
          : "Multiple prevention dimensions need attention. Start with the most burdened signal and a clear next action.",
    timestamp: new Date().toISOString(),
  };
}

function urgencyFromSeverity(
  severity: RiskLevel,
): "routine" | "suggested" | "priority" {
  if (severity === "critical" || severity === "high") return "priority";
  if (severity === "moderate") return "suggested";
  return "routine";
}

function buildRecommendations(
  patient: PatientRecord,
  result: AssessmentResult,
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const risk of result.risks.slice(0, 4)) {
    if (risk.dimension === "Cardiovascular") {
      recommendations.push({
        id: "cardio-review",
        category: "checkup",
        title: "Cardiovascular Review",
        description:
          "Confirm blood pressure, lipid pattern, and follow-up schedule in a physician-guided review.",
        reason: risk.description,
        urgency: urgencyFromSeverity(risk.severity),
        price: "EUR 120",
        provider: "Primary Care or Cardiology",
      });
    } else if (risk.dimension === "Metabolic") {
      recommendations.push({
        id: "metabolic-diagnostics",
        category: "diagnostic",
        title: "Metabolic Blood Panel",
        description:
          "Repeat HbA1c, fasting glucose, and lipids with a structured follow-up plan.",
        reason: risk.description,
        urgency: urgencyFromSeverity(risk.severity),
        price: "EUR 85",
        provider: "Metabolic Diagnostics Lab",
      });
    } else if (risk.dimension === "Sleep & Recovery") {
      recommendations.push({
        id: "sleep-reset",
        category: "lifestyle",
        title: "Sleep Reset Plan",
        description:
          "A practical sleep protocol with recovery check-ins and a clear evening routine.",
        reason: risk.description,
        urgency: urgencyFromSeverity(risk.severity),
        price: "EUR 49",
        provider: "Sleep Coaching Program",
      });
    } else if (risk.dimension === "Activity") {
      recommendations.push({
        id: "movement-plan",
        category: "lifestyle",
        title: "Movement Activation Plan",
        description:
          "Break up sitting time, anchor weekly sessions, and rebuild movement without overload.",
        reason: risk.description,
        urgency: urgencyFromSeverity(risk.severity),
        price: "EUR 35",
        provider: "Prevention Coaching",
      });
    } else if (risk.dimension === "Stress & Wellbeing") {
      recommendations.push({
        id: "recovery-review",
        category: "specialist",
        title: "Recovery and Wellbeing Review",
        description:
          "A physician-guided review to better assess stress spillover and recovery burden.",
        reason: risk.description,
        urgency: urgencyFromSeverity(risk.severity),
        price: "EUR 95",
        provider: "Preventive Medicine Clinic",
      });
    }
  }

  recommendations.push({
    id: "nutrition-review",
    category: "nutrition",
    title: "Nutrition Review",
    description:
      "Translate diet quality, fruit and vegetable intake, and hydration into a practical weekly plan.",
    reason: `Diet quality ${patient.lifestyle.dietQualityScore}/10 with ${patient.lifestyle.fruitVegServingsDaily} servings per day.`,
    urgency: "routine",
    price: "EUR 59",
    provider: "Nutrition Counseling",
  });

  recommendations.push({
    id: "prevention-checkin",
    category: "checkup",
    title: "Prevention Check-in",
    description:
      "A compact physician appointment to prioritize the key risk signals and determine the safest next step.",
    reason:
      result.aiSummary,
    urgency: result.overallScore < 55 ? "priority" : "suggested",
    price: "EUR 75",
    provider: "Prevention Consultation",
  });

  recommendations.push({
    id: "lab-followup",
    category: "diagnostic",
    title: "Follow-up Lab in 8 to 12 Weeks",
    description:
      "Repeat the flagged core values to check whether the initial actions are already showing effect.",
    reason:
      `Current focus areas: ${result.risks.slice(0, 2).map((risk) => risk.dimension).join(", ") || "preventive progress check"}.`,
    urgency: result.risks.some((risk) => risk.severity === "critical")
      ? "priority"
      : "suggested",
    price: "EUR 69",
    provider: "Partner Lab",
  });

  recommendations.push({
    id: "coach-followup",
    category: "lifestyle",
    title: "Weekly Prevention Coaching Call",
    description:
      "A short, recurring appointment to implement sleep, movement, or stress actions in daily life.",
    reason:
      result.opportunities[0]?.description ??
      "Regular guidance increases the likelihood that new routines are actually maintained.",
    urgency: "routine",
    price: "EUR 29",
    provider: "Health Coaching Team",
  });

  if (patient.visitCount2yr >= 4 || patient.chronicConditions.length > 0) {
    recommendations.push({
      id: "specialist-routing",
      category: "specialist",
      title: "Prepare Specialist Referral",
      description:
        "Route the case to a suitable specialty so that follow-up questions, diagnostics, and progress monitoring are properly coordinated.",
      reason:
        `History of ${patient.visitCount2yr} visits in 2 years and ${patient.chronicConditions.length} documented pre-existing conditions.`,
      urgency: patient.chronicConditions.length >= 2 ? "priority" : "suggested",
      price: "EUR 0",
      provider: "Care Coordination",
    });
  }

  if (patient.crpMgL >= 3 || patient.lifestyle.stressLevel >= 7) {
    recommendations.push({
      id: "recovery-programme",
      category: "lifestyle",
      title: "4-Week Recovery Program",
      description:
        "A structured plan for sleep, load management, and stress reduction with short weekly check-ins.",
      reason:
        "Elevated stress or inflammation signals suggest stabilizing the recovery baseline first.",
      urgency: "suggested",
      price: "EUR 89",
      provider: "Recovery Coaching",
    });
  }

  const seen = new Set<string>();
  return recommendations.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function interpolate(current: number, target: number, progress: number) {
  return round(current + (target - current) * progress, 1);
}

function buildTrajectory(
  result: AssessmentResult,
  patient: PatientRecord,
  scenario: "adherence" | "non-adherence",
): TrajectoryPoint[] {
  const cardio =
    result.riskScores.find((item) => item.dimension === "Cardiovascular")
      ?.score ?? result.overallScore;
  const metabolic =
    result.riskScores.find((item) => item.dimension === "Metabolic")?.score ??
    result.overallScore;
  const recovery =
    result.riskScores.find((item) => item.dimension === "Sleep & Recovery")
      ?.score ?? result.overallScore;
  const scoreDelta = scenario === "adherence" ? 15 : -12;
  const bioAgeDelta = scenario === "adherence" ? -2.4 : 1.8;

  return Array.from({ length: 13 }, (_, index) => {
    const progress = index / 12;
    return {
      week: index * 4,
      bioAge: interpolate(
        result.bioAgeEstimate,
        result.bioAgeEstimate + bioAgeDelta,
        progress,
      ),
      healthScore: Math.round(
        interpolate(
          result.overallScore,
          clamp(result.overallScore + scoreDelta, 20, 95),
          progress,
        ),
      ),
      cardioScore: Math.round(
        interpolate(
          cardio,
          clamp(cardio + (scenario === "adherence" ? 18 : -12), 20, 95),
          progress,
        ),
      ),
      metabolicScore: Math.round(
        interpolate(
          metabolic,
          clamp(metabolic + (scenario === "adherence" ? 14 : -10), 20, 95),
          progress,
        ),
      ),
      recoveryScore: Math.round(
        interpolate(
          recovery,
          clamp(recovery + (scenario === "adherence" ? 16 : -11), 20, 95),
          progress,
        ),
      ),
    };
  });
}

function scoreDeltaDirection(current: number, next: number): PredictionTrend {
  if (next > current + 2) return "improving";
  if (next < current - 2) return "declining";
  return "stable";
}

function buildBodyComparison(
  patient: PatientRecord,
  result: AssessmentResult,
  adherencePoint: TrajectoryPoint,
  nonAdherencePoint: TrajectoryPoint,
): BodyComparisonRegion[] {
  const currentCardio =
    result.riskScores.find((item) => item.dimension === "Cardiovascular")
      ?.score ?? 0;
  const currentMetabolic =
    result.riskScores.find((item) => item.dimension === "Metabolic")?.score ??
    0;
  const currentRecovery =
    result.riskScores.find((item) => item.dimension === "Sleep & Recovery")
      ?.score ?? 0;

  return [
    {
      id: "brain",
      label: "Brain & Mood",
      bodyPart: "Head",
      currentValue: `WHO-5 ${patient.lifestyle.mentalWellbeingWho5}/25`,
      adherenceValue: `Projected ${Math.min(
        25,
        patient.lifestyle.mentalWellbeingWho5 + 3,
      )}/25`,
      nonAdherenceValue: `Projected ${Math.max(
        5,
        patient.lifestyle.mentalWellbeingWho5 - 2,
      )}/25`,
      adherenceChange: "+ more clarity and more stable mood",
      nonAdherenceChange: "More fatigue and lower follow-through",
      adherenceTrend: "improving",
      nonAdherenceTrend: "declining",
      explanation:
        "Sleep, stress, hydration, and movement consistency together form a simple resilience signal.",
    },
    {
      id: "heart",
      label: "Heart & Vessels",
      bodyPart: "Chest",
      currentValue: `${patient.systolicBp}/${patient.diastolicBp} mmHg`,
      adherenceValue: `Score ${adherencePoint.cardioScore} by month 12`,
      nonAdherenceValue: `Score ${nonAdherencePoint.cardioScore} by month 12`,
      adherenceChange: "Lower pressure load and more stable recovery",
      nonAdherenceChange: "Cardiovascular load remains elevated",
      adherenceTrend: scoreDeltaDirection(
        currentCardio,
        adherencePoint.cardioScore,
      ),
      nonAdherenceTrend: scoreDeltaDirection(
        currentCardio,
        nonAdherencePoint.cardioScore,
      ),
      explanation:
        "This region reflects the combined pressure and lipid load across both projected futures.",
    },
    {
      id: "metabolic",
      label: "Metabolic Core",
      bodyPart: "Abdomen",
      currentValue: `HbA1c ${patient.hba1cPct}%, Glukose ${patient.fastingGlucoseMmol} mmol/L`,
      adherenceValue: `Score ${adherencePoint.metabolicScore} with more stable routine`,
      nonAdherenceValue: `Score ${nonAdherencePoint.metabolicScore} with declining habits`,
      adherenceChange: "Better glucose control and more stable meal routine",
      nonAdherenceChange: "Higher glycemic load persists",
      adherenceTrend: scoreDeltaDirection(
        currentMetabolic,
        adherencePoint.metabolicScore,
      ),
      nonAdherenceTrend: scoreDeltaDirection(
        currentMetabolic,
        nonAdherencePoint.metabolicScore,
      ),
      explanation:
        "Meal quality, movement, and weight trend determine the likely metabolic direction over the next 12 months.",
    },
    {
      id: "recovery",
      label: "Recovery Capacity",
      bodyPart: "Upper Body",
      currentValue: `${patient.telemetry.avgSteps} steps, HRV ${patient.telemetry.avgHrv} ms`,
      adherenceValue: `Score ${adherencePoint.recoveryScore} with better sleep and more movement`,
      nonAdherenceValue: `Score ${nonAdherencePoint.recoveryScore} with continued sleep deficit`,
      adherenceChange: "Higher readiness and deeper recovery",
      nonAdherenceChange: "Recovery remains flat and inconsistent",
      adherenceTrend: scoreDeltaDirection(
        currentRecovery,
        adherencePoint.recoveryScore,
      ),
      nonAdherenceTrend: scoreDeltaDirection(
        currentRecovery,
        nonAdherencePoint.recoveryScore,
      ),
      explanation:
        "The recovery region shows how sleep quality, HRV, and movement regularity interact.",
    },
    {
      id: "inflammation",
      label: "Inflammation Load",
      bodyPart: "Whole Body",
      currentValue: `CRP ${patient.crpMgL} mg/L`,
      adherenceValue: "Lower systemic load becomes more likely",
      nonAdherenceValue: "Inflammation remains harder to influence",
      adherenceChange: "Less inflammatory baseline load",
      nonAdherenceChange: "Persistent background stress",
      adherenceTrend: patient.crpMgL >= 3 ? "improving" : "stable",
      nonAdherenceTrend: patient.crpMgL >= 3 ? "declining" : "stable",
      explanation:
        "Inflammation follows the combined effect of sleep, nutrition, weight, and movement adherence.",
    },
  ];
}

function buildTwin(
  patient: PatientRecord,
  result: AssessmentResult,
  recommendations: Recommendation[],
): HealthTwin {
  const adherencePath = buildTrajectory(result, patient, "adherence");
  const nonAdherencePath = buildTrajectory(result, patient, "non-adherence");
  const adherenceFinal = adherencePath[adherencePath.length - 1];
  const nonAdherenceFinal = nonAdherencePath[nonAdherencePath.length - 1];

  return {
    currentBioAge: result.bioAgeEstimate,
    chronologicalAge: patient.age,
    currentScore: result.overallScore,
    adherencePath: {
      id: "adherence",
      label: "If the Plan Is Followed",
      description:
        "Projected trajectory if the recommended actions are consistently implemented over the next 12 months.",
      color: "#0F766E",
      points: adherencePath,
    },
    nonAdherencePath: {
      id: "non_adherence",
      label: "If the Plan Is Not Followed",
      description:
        "Projected trajectory if the current pattern remains unchanged and adherence declines.",
      color: "#B91C1C",
      points: nonAdherencePath,
    },
    nextBestAction:
      recommendations[0]?.title ??
      "Start the first physician-guided prevention step",
    nextBestActionReason:
      recommendations[0]?.reason ??
      "This action is expected to have the strongest effect on the most burdened risk dimension.",
    nextBestActionDays: 84,
    bodyComparison: buildBodyComparison(
      patient,
      result,
      adherenceFinal,
      nonAdherenceFinal,
    ),
    predictionMeta: {
      modelType: "Feature-based scenario model",
      cohortSize: 1000,
      featureCount: 14,
      targetWindow: "12 months in 4-week intervals",
    },
  };
}

function buildBundle(
  patient: PatientRecord,
  telemetryRows: TelemetryRow[],
): PatientBundle {
  const result = buildAssessmentResult(patient, telemetryRows);
  const recommendations = buildRecommendations(patient, result);
  const twin = buildTwin(patient, result, recommendations);

  return {
    patient,
    result,
    recommendations,
    twin,
  };
}

const getFeaturedEhrRows = cache(async () => {
  const featuredPatientIds = await getFeaturedPatientIds();
  if (featuredPatientIds.length === 0) return [];

  const query =
    "select=patient_id,age,sex,country,height_cm,weight_kg,bmi,smoking_status,alcohol_units_weekly,chronic_conditions,icd_codes,n_chronic_conditions,medications,n_visits_2yr,sbp_mmhg,dbp_mmhg,total_cholesterol_mmol,ldl_mmol,hdl_mmol,triglycerides_mmol,hba1c_pct,fasting_glucose_mmol,crp_mg_l,egfr_ml_min" +
    `&patient_id=in.(${encodeIdList(featuredPatientIds)})&order=patient_id.asc`;
  return fetchRestJson<EhrRow[]>("ehr_records", query);
});

const getFeaturedLifestyleRows = cache(async () => {
  const featuredPatientIds = await getFeaturedPatientIds();
  if (featuredPatientIds.length === 0) return [];

  const query =
    "select=patient_id,survey_date,smoking_status,alcohol_units_weekly,diet_quality_score,fruit_veg_servings_daily,meal_frequency_daily,exercise_sessions_weekly,sedentary_hrs_day,stress_level,sleep_satisfaction,mental_wellbeing_who5,self_rated_health,water_glasses_daily" +
    `&patient_id=in.(${encodeIdList(featuredPatientIds)})&order=patient_id.asc,survey_date.desc`;
  return fetchRestJson<LifestyleRow[]>("lifestyle_survey", query);
});

const getTelemetryForPatient = cache(async (patientId: string) => {
  const query =
    "select=patient_id,date,resting_hr_bpm,hrv_rmssd_ms,steps,active_minutes,sleep_duration_hrs,sleep_quality_score,deep_sleep_pct,spo2_avg_pct,calories_burned_kcal" +
    `&patient_id=eq.${patientId}&order=date.desc&limit=90`;
  return fetchRestJson<TelemetryRow[]>("wearable_telemetry", query);
});

const getTelemetryForPatients = cache(async (patientIdsKey: string) => {
  const patientIds = patientIdsKey.split(",").filter(Boolean);
  if (patientIds.length === 0) return [];
  const query =
    "select=patient_id,date,resting_hr_bpm,hrv_rmssd_ms,steps,active_minutes,sleep_duration_hrs,sleep_quality_score,deep_sleep_pct,spo2_avg_pct,calories_burned_kcal" +
    `&patient_id=in.(${encodeIdList(patientIds)})&order=patient_id.asc,date.desc`;
  return fetchRestJson<TelemetryRow[]>("wearable_telemetry", query);
});

const getFeaturedPatientIds = cache(async () => {
  const candidateRows = await fetchRestJson<PatientIdRow[]>(
    "ehr_records",
    `select=patient_id&order=age.desc&limit=${FEATURED_PATIENT_CANDIDATE_LIMIT}`,
  );
  const candidateIds = uniqueStrings(
    candidateRows.map((row) => row.patient_id).filter(Boolean),
  );

  if (candidateIds.length <= FEATURED_PATIENT_COUNT) {
    return candidateIds;
  }

  const [lifestyleRows, telemetryRows] = await Promise.all([
    fetchRestJson<Array<Pick<LifestyleRow, "patient_id" | "survey_date">>>(
      "lifestyle_survey",
      `select=patient_id,survey_date&patient_id=in.(${encodeIdList(candidateIds)})&order=survey_date.desc`,
    ),
    fetchRestJson<Array<Pick<TelemetryRow, "patient_id" | "date">>>(
      "wearable_telemetry",
      `select=patient_id,date&patient_id=in.(${encodeIdList(candidateIds)})&order=date.desc&limit=5000`,
    ),
  ]);

  const lifestyleIds = new Set(lifestyleRows.map((row) => row.patient_id));
  const telemetryIds = new Set(telemetryRows.map((row) => row.patient_id));

  const validIds = candidateIds.filter(
    (patientId) => lifestyleIds.has(patientId) && telemetryIds.has(patientId),
  );
  const pool =
    validIds.length >= FEATURED_PATIENT_COUNT ? validIds : candidateIds;

  return [...pool]
    .sort(
      (left, right) =>
        stableHash(left) - stableHash(right) || left.localeCompare(right),
    )
    .slice(0, FEATURED_PATIENT_COUNT);
});

function groupTelemetryRows(rows: TelemetryRow[]) {
  const telemetryByPatient = new Map<string, TelemetryRow[]>();

  for (const row of rows) {
    const bucket = telemetryByPatient.get(row.patient_id) ?? [];
    if (bucket.length < 90) bucket.push(row);
    telemetryByPatient.set(row.patient_id, bucket);
  }

  return telemetryByPatient;
}

async function findPatientRow(patientId: string) {
  const rows = await fetchRestJson<EhrRow[]>(
    "ehr_records",
    "select=patient_id,age,sex,country,height_cm,weight_kg,bmi,smoking_status,alcohol_units_weekly,chronic_conditions,icd_codes,n_chronic_conditions,medications,n_visits_2yr,sbp_mmhg,dbp_mmhg,total_cholesterol_mmol,ldl_mmol,hdl_mmol,triglycerides_mmol,hba1c_pct,fasting_glucose_mmol,crp_mg_l,egfr_ml_min" +
      `&patient_id=eq.${patientId}&limit=1`,
  );
  return rows[0] ?? null;
}

async function findLifestyleRow(patientId: string) {
  const rows = await fetchRestJson<LifestyleRow[]>(
    "lifestyle_survey",
    "select=patient_id,survey_date,smoking_status,alcohol_units_weekly,diet_quality_score,fruit_veg_servings_daily,meal_frequency_daily,exercise_sessions_weekly,sedentary_hrs_day,stress_level,sleep_satisfaction,mental_wellbeing_who5,self_rated_health,water_glasses_daily" +
      `&patient_id=eq.${patientId}&order=survey_date.desc&limit=1`,
  );
  return rows[0] ?? null;
}

export const getFeaturedPatients = cache(async (): Promise<PatientSummary[]> => {
  const featuredPatientIds = await getFeaturedPatientIds();
  if (featuredPatientIds.length === 0) return [];

  const [ehrRows, lifestyleRows, telemetryRows] = await Promise.all([
    getFeaturedEhrRows(),
    getFeaturedLifestyleRows(),
    getTelemetryForPatients(featuredPatientIds.join(",")),
  ]);

  const lifestyleByPatient = new Map<string, LifestyleRow>();
  for (const row of lifestyleRows) {
    if (!lifestyleByPatient.has(row.patient_id)) {
      lifestyleByPatient.set(row.patient_id, row);
    }
  }

  const telemetryByPatient = groupTelemetryRows(telemetryRows);
  return ehrRows
    .map((row) => {
      const lifestyle = lifestyleByPatient.get(row.patient_id);
      if (!lifestyle) return null;
      const telemetry = summarizeTelemetry(
        telemetryByPatient.get(row.patient_id) ?? [],
      );
      return buildSummary(row, lifestyle, telemetry);
    })
    .filter((item): item is PatientSummary => Boolean(item));
});

export const getPatientBundle = cache(
  async (patientId: string): Promise<PatientBundle | null> => {
    const [ehrRow, lifestyleRow, telemetryRows] = await Promise.all([
      findPatientRow(patientId),
      findLifestyleRow(patientId),
      getTelemetryForPatient(patientId),
    ]);

    if (!ehrRow || !lifestyleRow || telemetryRows.length === 0) {
      return null;
    }

    const patient = buildPatientRecord(ehrRow, lifestyleRow, telemetryRows);
    return buildBundle(patient, telemetryRows);
  },
);

function buildQuestionnaireTelemetry(
  input: QuestionnaireAssessmentInput,
  bmi: number,
  smokingPenalty: number,
): TelemetryRow[] {
  const avgSteps = clamp(
    Math.round(
      2800 +
        input.exerciseSessionsWeekly * 1050 +
        (8 - input.sedentaryHoursDay) * 380 +
        input.dietQualityScore * 110 -
        smokingPenalty * 400,
    ),
    2500,
    16000,
  );
  const avgActiveMinutes = clamp(
    Math.round(input.exerciseSessionsWeekly * 28 + (avgSteps - 3000) / 180),
    10,
    120,
  );
  const avgSleepQuality = clamp(
    Math.round(
      input.sleepSatisfaction * 9 +
        (10 - input.stressLevel) * 3 +
        input.dietQualityScore,
    ),
    45,
    92,
  );
  const avgRestingHr = round(
    clamp(
      81 +
        (bmi - 24) * 0.9 +
        input.stressLevel * 1.4 +
        smokingPenalty * 4 -
        input.exerciseSessionsWeekly * 1.8 -
        input.sleepHours * 1.1,
      52,
      92,
    ),
  );
  const avgHrv = round(
    clamp(
      63 -
        input.age * 0.35 -
        (bmi - 24) * 0.6 -
        input.stressLevel * 2.4 +
        input.exerciseSessionsWeekly * 3.1 +
        input.sleepSatisfaction * 1.6 -
        smokingPenalty * 6,
      16,
      78,
    ),
  );
  const avgDeepSleepPct = round(
    clamp(
      13 +
        input.sleepHours * 2.1 +
        input.sleepSatisfaction * 1.2 -
        input.stressLevel * 0.9,
      8,
      27,
    ),
  );
  const avgSpo2 = round(
    clamp(
      98.2 - smokingPenalty * 0.8 - Math.max(0, bmi - 30) * 0.07,
      93.5,
      99.2,
    ),
  );

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    return {
      patient_id: "Q-SELF-BASELINE",
      date: date.toISOString().slice(0, 10),
      resting_hr_bpm: Math.round(avgRestingHr + Math.sin(index / 4) * 2),
      hrv_rmssd_ms: Math.round(avgHrv + Math.cos(index / 5) * 4),
      steps: Math.max(2500, Math.round(avgSteps + Math.sin(index / 3) * 900)),
      active_minutes: Math.max(
        5,
        Math.round(avgActiveMinutes + Math.cos(index / 5) * 6),
      ),
      sleep_duration_hrs: round(
        clamp(input.sleepHours + Math.sin(index / 6) * 0.3, 4.5, 9.5),
      ),
      sleep_quality_score: Math.round(
        clamp(avgSleepQuality + Math.cos(index / 4) * 5, 40, 95),
      ),
      deep_sleep_pct: round(
        clamp(avgDeepSleepPct + Math.sin(index / 4) * 1.2, 8, 28),
      ),
      spo2_avg_pct: round(clamp(avgSpo2 + Math.cos(index / 6) * 0.2, 93, 99.5)),
      calories_burned_kcal: Math.round(
        1800 + avgActiveMinutes * 8 + Math.sin(index / 4) * 90,
      ),
    };
  });
}

function buildQuestionnaireBundleRecord(
  input: QuestionnaireAssessmentInput,
): PatientRecord {
  const bmi = round(input.weightKg / (input.heightCm / 100) ** 2, 1);
  const smokingPenalty =
    input.smokingStatus === "current"
      ? 1.2
      : input.smokingStatus === "former"
        ? 0.55
        : 0;
  const telemetryRows = buildQuestionnaireTelemetry(input, bmi, smokingPenalty);
  const telemetry = summarizeTelemetry(telemetryRows);
  const systolicBp = Math.round(
    clamp(
      108 +
        input.age * 0.42 +
        Math.max(0, bmi - 22) * 1.25 +
        input.stressLevel * 1.6 +
        smokingPenalty * 7 +
        input.chronicConditions.length * 3 -
        input.exerciseSessionsWeekly * 1.3 -
        input.sleepHours * 0.7,
      96,
      182,
    ),
  );
  const diastolicBp = Math.round(
    clamp(
      66 +
        input.age * 0.16 +
        Math.max(0, bmi - 22) * 0.75 +
        input.stressLevel * 0.85 +
        smokingPenalty * 3 +
        input.chronicConditions.length * 2 -
        input.exerciseSessionsWeekly * 0.65,
      58,
      110,
    ),
  );
  const hba1cPct = round(
    clamp(
      4.8 +
        Math.max(0, bmi - 23) * 0.09 +
        input.sedentaryHoursDay * 0.05 +
        (input.chronicConditions.includes("type2_diabetes") ? 0.85 : 0) +
        smokingPenalty * 0.25 +
        input.stressLevel * 0.04 -
        input.exerciseSessionsWeekly * 0.05 -
        input.fruitVegServingsDaily * 0.03,
      4.7,
      8.9,
    ),
  );
  const fastingGlucoseMmol = round(
    clamp(
      4.7 +
        Math.max(0, bmi - 23) * 0.12 +
        input.sedentaryHoursDay * 0.1 +
        (input.chronicConditions.includes("type2_diabetes") ? 1.1 : 0) +
        smokingPenalty * 0.2 +
        input.alcoholUnitsWeekly * 0.012 -
        input.exerciseSessionsWeekly * 0.07 -
        input.fruitVegServingsDaily * 0.05,
      4.4,
      11.2,
    ),
  );
  const ldlMmol = round(
    clamp(
      2 +
        Math.max(0, bmi - 23) * 0.08 +
        input.alcoholUnitsWeekly * 0.01 +
        smokingPenalty * 0.55 +
        (input.chronicConditions.includes("dyslipidaemia") ? 0.85 : 0) -
        input.exerciseSessionsWeekly * 0.04 -
        input.dietQualityScore * 0.06,
      1.6,
      5.8,
    ),
  );
  const totalCholesterolMmol = round(
    clamp(ldlMmol + 1.55 + Math.max(0, bmi - 25) * 0.03, 3.6, 8.4),
  );
  const crpMgL = round(
    clamp(
      0.8 +
        Math.max(0, bmi - 23) * 0.18 +
        smokingPenalty * 0.7 +
        input.stressLevel * 0.12 +
        input.chronicConditions.length * 0.35 -
        input.exerciseSessionsWeekly * 0.08,
      0.2,
      9.5,
    ),
  );
  const egfrMlMin = Math.round(
    clamp(
      110 -
        input.age * 0.7 -
        input.chronicConditions.length * 2 -
        Math.max(0, bmi - 30) * 0.5,
      58,
      118,
    ),
  );
  const wellbeing = clamp(
    Math.round(
      20 -
        input.stressLevel * 1.3 +
        input.sleepSatisfaction * 0.8 +
        input.selfRatedHealth * 1.2 +
        input.exerciseSessionsWeekly * 0.4 -
        smokingPenalty * 2,
    ),
    4,
    25,
  );
  const lifestyle: PatientLifestyle = {
    surveyDate: new Date().toISOString().slice(0, 10),
    smokingStatus: input.smokingStatus,
    alcoholUnitsWeekly: input.alcoholUnitsWeekly,
    dietQualityScore: input.dietQualityScore,
    fruitVegServingsDaily: input.fruitVegServingsDaily,
    mealFrequencyDaily: 3,
    exerciseSessionsWeekly: input.exerciseSessionsWeekly,
    sedentaryHoursDay: input.sedentaryHoursDay,
    stressLevel: input.stressLevel,
    sleepSatisfaction: input.sleepSatisfaction,
    mentalWellbeingWho5: wellbeing,
    selfRatedHealth: input.selfRatedHealth,
    waterGlassesDaily: input.waterGlassesDaily,
  };
  const ehrLike: EhrRow = {
    patient_id: "Q-SELF-BASELINE",
    age: input.age,
    sex: input.sex === "male" ? "M" : input.sex === "female" ? "F" : "O",
    country: input.country,
    height_cm: input.heightCm,
    weight_kg: input.weightKg,
    bmi,
    smoking_status: input.smokingStatus,
    alcohol_units_weekly: input.alcoholUnitsWeekly,
    chronic_conditions: input.chronicConditions.join("|"),
    icd_codes: "",
    n_chronic_conditions: input.chronicConditions.length,
    medications: "",
    n_visits_2yr: 0,
    sbp_mmhg: systolicBp,
    dbp_mmhg: diastolicBp,
    total_cholesterol_mmol: totalCholesterolMmol,
    ldl_mmol: ldlMmol,
    hdl_mmol: 1.2,
    triglycerides_mmol: 1.6,
    hba1c_pct: hba1cPct,
    fasting_glucose_mmol: fastingGlucoseMmol,
    crp_mg_l: crpMgL,
    egfr_ml_min: egfrMlMin,
  };
  const lifestyleRow: LifestyleRow = {
    patient_id: "Q-SELF-BASELINE",
    survey_date: lifestyle.surveyDate,
    smoking_status: lifestyle.smokingStatus,
    alcohol_units_weekly: lifestyle.alcoholUnitsWeekly,
    diet_quality_score: lifestyle.dietQualityScore,
    fruit_veg_servings_daily: lifestyle.fruitVegServingsDaily,
    meal_frequency_daily: lifestyle.mealFrequencyDaily,
    exercise_sessions_weekly: lifestyle.exerciseSessionsWeekly,
    sedentary_hrs_day: lifestyle.sedentaryHoursDay,
    stress_level: lifestyle.stressLevel,
    sleep_satisfaction: lifestyle.sleepSatisfaction,
    mental_wellbeing_who5: lifestyle.mentalWellbeingWho5,
    self_rated_health: lifestyle.selfRatedHealth,
    water_glasses_daily: lifestyle.waterGlassesDaily,
  };

  const summary = buildSummary(ehrLike, lifestyleRow, telemetry);
  return {
    ...summary,
    source: "questionnaire",
    sourceLabel: "Questionnaire Baseline",
    tag: "Self-reported Baseline",
    bmi,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    systolicBp,
    diastolicBp,
    totalCholesterolMmol,
    ldlMmol,
    hba1cPct,
    fastingGlucoseMmol,
    crpMgL,
    egfrMlMin,
    medications: [],
    visitCount2yr: 0,
    lifestyle,
    telemetry,
  };
}

export async function createQuestionnaireBundle(
  input: QuestionnaireAssessmentInput,
): Promise<PatientBundle> {
  const patient = buildQuestionnaireBundleRecord(input);
  const smokingPenalty =
    input.smokingStatus === "current"
      ? 1.2
      : input.smokingStatus === "former"
        ? 0.55
        : 0;
  const telemetryRows = buildQuestionnaireTelemetry(
    input,
    patient.bmi,
    smokingPenalty,
  );
  return buildBundle(patient, telemetryRows);
}

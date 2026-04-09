import type {
  AssessmentResult,
  PatientRecord,
  Recommendation,
  RiskScore,
} from "@/types";

export type TrafficLightStatus = "green" | "yellow" | "red";

export interface DashboardExperience {
  plainLanguageEnabled: boolean;
  statusLabel: string;
  statusTone: TrafficLightStatus;
  summary: string;
  myHeartToday: {
    status: TrafficLightStatus;
    headline: string;
    body: string;
    note: string;
  };
  oneThingThisWeek: {
    title: string;
    body: string;
    cta: string;
  };
  explainItSimply: {
    title: string;
    bullets: string[];
  };
  memoryMood: {
    status: TrafficLightStatus;
    headline: string;
    body: string;
    cta: string;
  };
  trustedCarePath: {
    title: string;
    body: string;
    steps: string[];
    cta: string;
  };
}

const STATUS_LABELS: Record<TrafficLightStatus, string> = {
  green: "On track",
  yellow: "Worth attention",
  red: "Please follow up",
};

function getRiskByDimension(
  result: AssessmentResult,
  dimension: string,
): RiskScore | undefined {
  return result.riskScores.find((risk) => risk.dimension === dimension);
}

function mapScoreToStatus(score: number): TrafficLightStatus {
  if (score >= 75) return "green";
  if (score >= 50) return "yellow";
  return "red";
}

function buildSimpleBullets(
  patient: PatientRecord,
  result: AssessmentResult,
): string[] {
  const topRisk = [...result.riskScores].sort((a, b) => a.score - b.score)[0];
  const topOpportunity = result.opportunities[0];
  const sourceIntro =
    patient.source === "supabase"
      ? "This case combines blood pressure, glucose, inflammation, sleep, movement, and wearable recovery into one prevention view."
      : "This assessment combines your questionnaire answers with estimated blood pressure, glucose, inflammation, sleep, movement, and recovery signals into one prevention view.";

  return [
    sourceIntro,
    topRisk
      ? `${topRisk.dimension} is the weakest area right now, so that is where the care plan should start.`
      : "No single area stands out as urgent today.",
    topOpportunity
      ? `The strongest near-term lever for ${patient.displayName} is ${topOpportunity.title.toLowerCase()}.`
      : "The next step is to review a clinician-approved prevention plan.",
  ];
}

export function getDashboardExperience(
  patient: PatientRecord,
  result: AssessmentResult,
  recommendations: Recommendation[],
): DashboardExperience {
  const cardioScore = getRiskByDimension(result, "Cardiovascular")?.score ?? 65;
  const sleepScore =
    getRiskByDimension(result, "Sleep & Recovery")?.score ?? 65;
  const moodScore = patient.lifestyle.mentalWellbeingWho5;
  const heartStatus = mapScoreToStatus(cardioScore);
  const memoryStatus =
    moodScore >= 18 && sleepScore >= 70
      ? "green"
      : moodScore >= 13
        ? "yellow"
        : "red";
  const topRecommendation =
    recommendations.find((item) => item.category === "specialist") ??
    recommendations.find((item) => item.category === "checkup") ??
    recommendations[0];
  const topOpportunity = result.opportunities[0];
  const simpleBullets = buildSimpleBullets(patient, result);

  return {
    plainLanguageEnabled: true,
    statusLabel: STATUS_LABELS[heartStatus],
    statusTone: heartStatus,
    summary:
      heartStatus === "green"
        ? "The cardiovascular signal looks steady. Keep the plan consistent and avoid unnecessary complexity."
        : heartStatus === "yellow"
          ? "The cardiovascular signal deserves active attention this week. One steady action matters more than many small ones."
          : "The cardiovascular signal needs clinician-backed follow-up. Keep the next step simple and formal.",
    myHeartToday: {
      status: heartStatus,
      headline:
        heartStatus === "green"
          ? "Cardiovascular load is currently stable"
          : heartStatus === "yellow"
            ? "Cardiovascular load needs closer follow-up"
            : "Cardiovascular load is high enough to escalate",
      body:
        heartStatus === "green"
          ? "The current blood pressure and wearable pattern do not show an urgent red flag."
          : heartStatus === "yellow"
            ? "Blood pressure, lipids, or recovery patterns suggest the plan should be tightened this week."
            : "The latest cardiovascular pattern should be confirmed with a clinician rather than watched passively.",
      note: "This is preventive guidance only, not a medical diagnosis.",
    },
    oneThingThisWeek: {
      title: topOpportunity?.title ?? "Book a clinician-backed review",
      body:
        topOpportunity?.description ??
        "Choose one realistic action that changes the next 7 days, not ten actions that do not stick.",
      cta: "Start this action",
    },
    explainItSimply: {
      title: "Explain It Simply",
      bullets: [
        ...simpleBullets,
        patient.source === "supabase"
          ? "Every major metric on this page comes from the connected Supabase tables rather than demo copy."
          : "This page is grounded in your self-reported intake, then translated into estimated baseline metrics for planning.",
      ],
    },
    memoryMood: {
      status: memoryStatus,
      headline:
        memoryStatus === "green"
          ? "Mood and resilience are holding up"
          : memoryStatus === "yellow"
            ? "Mood and resilience are mixed"
            : "Mood and resilience need extra support",
      body:
        memoryStatus === "green"
          ? "Sleep satisfaction and wellbeing do not suggest a strong resilience concern right now."
          : memoryStatus === "yellow"
            ? "Stress, sleep quality, or mental wellbeing may be reducing adherence quality."
            : "This patient profile would benefit from lighter load and a more supportive plan.",
      cta: "Review recovery and stress",
    },
    trustedCarePath: {
      title: "Trusted Care Path",
      body:
        "This path keeps the experience low-noise: understand the signal, confirm it with care when necessary, then focus on one weekly action.",
      steps: [
        "Review the highest-risk signal in plain language.",
        "Choose one high-impact adherence action for this week.",
        `Continue with ${topRecommendation?.title ?? "a clinician-backed follow-up"} if the signal stays elevated.`,
      ],
      cta: "Open recommendations",
    },
  };
}

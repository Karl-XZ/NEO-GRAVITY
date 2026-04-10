import type {
  CoachSuggestion,
  ComputedFeatures,
  DailyPriority,
  EhrRecord,
  PriorityDomain,
} from "../types";

function makePriority(input: DailyPriority): DailyPriority {
  return input;
}

function scoreFromSeverity(level: "green" | "yellow" | "red") {
  if (level === "red") return 92;
  if (level === "yellow") return 72;
  return 32;
}

function normalizeText(text: string) {
  return text.toLowerCase();
}

export function inferSuggestionPriorityDomain(
  suggestion: CoachSuggestion,
): PriorityDomain {
  const text = normalizeText(
    `${suggestion.title} ${suggestion.rationale} ${suggestion.action}`,
  );

  if (
    text.includes("schlaf") ||
    text.includes("sleep hygiene") ||
    text.includes("bedtime") ||
    text.includes("caffeine")
  ) {
    return "sleep";
  }

  if (
    text.includes("hrv") ||
    text.includes("ruhepuls") ||
    text.includes("restoration") ||
    text.includes("uberbelast") ||
    text.includes("recovery") ||
    text.includes("regeneration")
  ) {
    return "recovery";
  }

  if (
    text.includes("mood") ||
    text.includes("wellbeing") ||
    text.includes("wohlbefinden") ||
    text.includes("depression") ||
    text.includes("resilien")
  ) {
    return "mood";
  }

  if (
    text.includes("blutdruck") ||
    text.includes("ldl") ||
    text.includes("spo2") ||
    text.includes("kardiovask") ||
    text.includes("metabol") ||
    text.includes("arzt") ||
    text.includes("aerzt")
  ) {
    return "clinical";
  }

  return "activity";
}

export function formatMainFocusText(input: {
  suggestion?: CoachSuggestion | null;
  fallback: DailyPriority;
}) {
  const { suggestion, fallback } = input;

  if (suggestion) {
    const domain = inferSuggestionPriorityDomain(suggestion);

    if (domain === "clinical") {
      return "Ärztliches Follow-up anstoßen und die Belastung heute niedrig halten.";
    }

    if (domain === "sleep") {
      return "Schlaf heute priorisieren und Bewegung bewusst leicht halten.";
    }

    if (domain === "recovery") {
      return "Training heute locker halten und Regeneration vorziehen.";
    }

    if (domain === "mood") {
      return "Belastung heute senken und Zeit für ein kurzes Check-in reservieren.";
    }

    return "Heute einen einfachen Bewegungsblock fest einplanen und bei der Routine bleiben.";
  }

  return fallback.action;
}

export function buildDailyPriority(
  features: ComputedFeatures,
  ehr: EhrRecord,
): DailyPriority {
  const candidates: DailyPriority[] = [];

  const clinicalSignals: string[] = [];
  let clinicalScore = 0;

  if (features.cardioRisk.status !== "green") {
    clinicalScore = Math.max(clinicalScore, scoreFromSeverity(features.cardioRisk.status));
    clinicalSignals.push(features.cardioRisk.reasons[0] ?? "Cardiovascular risk signal");
  }
  if (features.bpControl.status !== "green") {
    clinicalScore = Math.max(clinicalScore, scoreFromSeverity(features.bpControl.status) - 4);
    clinicalSignals.push(`Blood pressure ${features.bpControl.sbp}/${features.bpControl.dbp}`);
  }
  if (ehr.ldl_mmol >= 2.6) {
    clinicalScore = Math.max(clinicalScore, ehr.ldl_mmol >= 4.1 ? 88 : 70);
    clinicalSignals.push(`LDL ${ehr.ldl_mmol} mmol/L`);
  }
  if (features.metabolicHealth.criteriaCount >= 2) {
    clinicalScore = Math.max(
      clinicalScore,
      features.metabolicHealth.criteriaCount >= 3 ? 90 : 74,
    );
    clinicalSignals.push(
      `${features.metabolicHealth.criteriaCount} metabolic criteria outside target`,
    );
  }

  if (clinicalScore > 0) {
    candidates.push(
      makePriority({
        key: "clinical",
        severity: clinicalScore >= 85 ? "red" : "yellow",
        headline: "Clinical clarification is the priority today.",
        reason:
          "At least one medical risk signal outweighs lifestyle fine-tuning and training optimization today.",
        action:
          "Focus on follow-up, repeat measurement, or medical consultation rather than adding more strain.",
        todayPlan: [
          "Re-measure blood pressure or the flagged value calmly today.",
          "Schedule a doctor appointment or a short follow-up for this week.",
          "Do not use extra training intensity as compensation today.",
        ],
        priorityScore: clinicalScore,
        suppresses: ["activity"],
        supportingSignals: clinicalSignals,
      }),
    );
  }

  const sleepSignals: string[] = [];
  let sleepScore = 0;

  if (features.sleepComposite.score < 70) {
    sleepScore = Math.max(
      sleepScore,
      features.sleepComposite.score < 50 ? 86 : 74,
    );
    sleepSignals.push(`Sleep score ${features.sleepComposite.score}/100`);
  }
  if (features.sleepFragmentation.flagged) {
    sleepScore = Math.max(
      sleepScore,
      78 + Math.min(features.sleepFragmentation.shortNights * 2, 8),
    );
    sleepSignals.push(
      `${features.sleepFragmentation.shortNights} short nights in the last 14 days`,
    );
  }
  if (features.strainRecovery.flag) {
    sleepScore += 10;
    sleepSignals.push("Recovery is lagging behind recent strain");
  }
  if (features.rhrZscore.flag) {
    sleepScore += 4;
    sleepSignals.push("Resting heart rate is acutely elevated");
  }

  if (sleepScore > 0) {
    candidates.push(
      makePriority({
        key: "sleep",
        severity: sleepScore >= 85 ? "red" : "yellow",
        headline: "Sleep is the priority today.",
        reason:
          "Your sleep and recovery signals suggest that additional strain today would hurt more than help.",
        action:
          "No hard training today. Earlier bedtime, less late-night screen time, and only light movement.",
        todayPlan: [
          "Only light movement today such as a walk or easy zone 2.",
          "Cut caffeine after early afternoon and stop screens earlier in the evening.",
          "Plan to go to sleep 30 to 60 minutes earlier today.",
        ],
        priorityScore: Math.min(sleepScore, 95),
        suppresses: ["activity", "recovery"],
        supportingSignals: sleepSignals,
      }),
    );
  }

  const moodSignals: string[] = [];
  let moodScore = 0;

  if (features.wellbeing.depressionFlag) {
    moodScore = Math.max(moodScore, 88);
    moodSignals.push(`WHO-5 ${features.wellbeing.who5}/100`);
  } else if (features.wellbeing.level === "yellow") {
    moodScore = Math.max(moodScore, 70);
    moodSignals.push(`WHO-5 ${features.wellbeing.who5}/100`);
  }
  if (features.cognitiveReserve.level === "red") {
    moodScore = Math.max(moodScore, 84);
    moodSignals.push(`Cognitive reserve ${features.cognitiveReserve.score}/100`);
  }

  if (moodScore > 0) {
    candidates.push(
      makePriority({
        key: "mood",
        severity: moodScore >= 85 ? "red" : "yellow",
        headline: "Stabilization is the priority today.",
        reason:
          "Well-being and mental resilience appear more fragile today than your other prevention signals.",
        action:
          "Short check-in, reduce strain, and activate support early rather than continuing to optimize.",
        todayPlan: [
          "Initiate a short check-in with a doctor, coach, or trusted person today.",
          "Consciously reduce expectations and training load for today.",
          "Reserve a calm block for a walk, daylight, or a breathing exercise.",
        ],
        priorityScore: moodScore,
        suppresses: ["activity"],
        supportingSignals: moodSignals,
      }),
    );
  }

  const recoverySignals: string[] = [];
  let recoveryScore = 0;

  if (features.strainRecovery.flag) {
    recoveryScore = Math.max(
      recoveryScore,
      features.strainRecovery.ratio > 2 ? 86 : 76,
    );
    recoverySignals.push(`Strain ratio ${features.strainRecovery.ratio}`);
  }
  if (features.hrv30dTrend.slope < -0.3) {
    recoveryScore = Math.max(recoveryScore, 74);
    recoverySignals.push("HRV trend is falling");
  }
  if (features.rhrZscore.flag) {
    recoveryScore = Math.max(recoveryScore, 72);
    recoverySignals.push("Resting heart rate is above baseline");
  }

  if (recoveryScore > 0) {
    candidates.push(
      makePriority({
        key: "recovery",
        severity: recoveryScore >= 85 ? "red" : "yellow",
        headline: "Recovery is the priority today.",
        reason:
          "Your system is showing signs of overload. More intensity today would delay recovery rather than help.",
        action:
          "Active recovery, zone 2, or rest are more beneficial today than peak performance efforts.",
        todayPlan: [
          "No interval or maximal training today.",
          "If you train, keep it easy and shorter than usual.",
          "Actively support recovery today: eat early, hydrate, and plan for more sleep.",
        ],
        priorityScore: recoveryScore,
        suppresses: ["activity"],
        supportingSignals: recoverySignals,
      }),
    );
  }

  const activitySignals: string[] = [];
  let activityScore = 0;

  if (features.activityAdherence < 60) {
    activityScore = Math.max(
      activityScore,
      features.activityAdherence < 40 ? 76 : 66,
    );
    activitySignals.push(`${features.activityAdherence}% of days hit the step target`);
  }
  if (features.movementConsistency.level !== "green") {
    activityScore = Math.max(activityScore, features.movementConsistency.level === "red" ? 78 : 68);
    activitySignals.push(
      `Movement consistency ${Math.round(features.movementConsistency.pct)}%`,
    );
  }
  if (features.boneLoad.score < 70) {
    activityScore = Math.max(activityScore, 64);
    activitySignals.push(`Bone-loading score ${features.boneLoad.score}/100`);
  }

  if (activityScore > 0) {
    candidates.push(
      makePriority({
        key: "activity",
        severity: activityScore >= 80 ? "yellow" : "green",
        headline: "Movement is the priority today.",
        reason:
          "Right now the issue is less about fine-tuning analysis and more about lacking consistency in daily movement and a training base.",
        action:
          "Get moving today instead of planning more: a simple walk or an easy cardio session is enough.",
        todayPlan: [
          "Schedule a dedicated 20- to 30-minute walk on your calendar today.",
          "Break up long sitting blocks with short movement breaks.",
          "Complete the simple movement first before optimizing further.",
        ],
        priorityScore: activityScore,
        suppresses: [],
        supportingSignals: activitySignals,
      }),
    );
  }

  const order: PriorityDomain[] = [
    "clinical",
    "mood",
    "sleep",
    "recovery",
    "activity",
  ];

  const sorted = candidates.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return order.indexOf(a.key) - order.indexOf(b.key);
  });

  return (
    sorted[0] ??
    makePriority({
      key: "activity",
      severity: "green",
      headline: "Consistency is the priority today.",
      reason:
        "No single signal is dominant enough to override everything else.",
      action:
        "Maintain your routine, avoid over-optimizing, and choose only small, repeatable steps.",
      todayPlan: [
        "Consciously keep your normal routine simple today.",
        "Check off one small health action early in the day.",
        "Do not add anything new unless it is truly necessary.",
      ],
      priorityScore: 40,
      suppresses: [],
      supportingSignals: ["No dominant red flag today"],
    })
  );
}

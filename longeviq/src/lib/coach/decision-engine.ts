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
        headline: "Heute ist klinische Klärung wichtig.",
        reason:
          "Mindestens ein medizinisches Risikosignal steht heute über Lifestyle-Feintuning und Trainingsoptimierung.",
        action:
          "Fokus auf Follow-up, Messwiederholung oder ärztliche Rücksprache statt auf zusätzliche Belastung.",
        todayPlan: [
          "Blutdruck oder den auffälligen Wert heute noch einmal ruhig nachmessen.",
          "Einen Arzttermin oder ein kurzes Follow-up für diese Woche anstoßen.",
          "Heute keine zusätzliche Trainingsintensität als Ausgleich nutzen.",
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
        headline: "Heute ist Schlaf wichtig.",
        reason:
          "Ihre Schlaf- und Erholungssignale deuten darauf hin, dass zusätzliche Belastung heute eher stört als hilft.",
        action:
          "Kein hartes Training heute. Frühere Schlafenszeit, weniger spätes Licht und nur leichte Bewegung.",
        todayPlan: [
          "Heute nur lockere Bewegung wie Spaziergang oder leichtes Zone 2.",
          "Koffein nach dem frühen Nachmittag streichen und abends Bildschirme früher beenden.",
          "Schlaf heute 30 bis 60 Minuten früher einplanen.",
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
        headline: "Heute ist Stabilisierung wichtig.",
        reason:
          "Wohlbefinden und mentale Belastbarkeit wirken heute fragiler als Ihre anderen Präventionssignale.",
        action:
          "Kurzes Check-in, Belastung reduzieren und Support früh aktivieren statt nur weiter zu optimieren.",
        todayPlan: [
          "Heute einen kurzen Check-in mit Arzt, Coach oder vertrauter Person anstoßen.",
          "Anspruch und Trainingslast für heute bewusst reduzieren.",
          "Einen ruhigen Block für Spaziergang, Tageslicht oder Atemübung reservieren.",
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
        headline: "Heute ist Regeneration wichtig.",
        reason:
          "Ihr System zeigt Zeichen von Überlastung. Mehr Intensität würde heute eher die Erholung verzögern.",
        action:
          "Aktive Erholung, Zone 2 oder Pause sind heute sinnvoller als Leistungsspitzen.",
        todayPlan: [
          "Kein Intervall- oder Maximaltraining heute.",
          "Wenn Sie trainieren, dann nur locker und kürzer als üblich.",
          "Erholung heute aktiv unterstützen: früh essen, trinken und mehr Schlaf einplanen.",
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
        headline: "Heute ist Bewegung wichtig.",
        reason:
          "Im Moment ist weniger die Feinanalyse das Problem, sondern die fehlende Konsistenz bei Alltagsbewegung und Trainingsbasis.",
        action:
          "Heute zuerst gehen, nicht weiter planen: ein einfacher Walk oder eine lockere Cardio-Einheit reicht.",
        todayPlan: [
          "Heute einen festen 20- bis 30-Minuten-Walk in den Kalender setzen.",
          "Längere Sitzblöcke mit kurzen Bewegungsbreaks unterbrechen.",
          "Die einfache Bewegung zuerst erledigen, bevor Sie weiter optimieren.",
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
      headline: "Heute ist Konstanz wichtig.",
      reason:
        "Kein einzelnes Signal dominiert stark genug, um alles andere zu verdrängen.",
      action:
        "Routine beibehalten, nicht überoptimieren und nur kleine, wiederholbare Schritte wählen.",
      todayPlan: [
        "Ihre normale Routine heute bewusst einfach halten.",
        "Eine kleine Gesundheitsaktion früh am Tag abhaken.",
        "Nichts Neues hinzufügen, wenn es nicht nötig ist.",
      ],
      priorityScore: 40,
      suppresses: [],
      supportingSignals: ["No dominant red flag today"],
    })
  );
}

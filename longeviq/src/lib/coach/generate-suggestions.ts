// ============================================================
// LongevIQ — Rule-based coach suggestion generator
// Produces CoachSuggestion[] from computed features
// ============================================================

import type { ComputedFeatures, CoachSuggestion, EhrRecord } from "../types";

export function generateCoachSuggestions(
  features: ComputedFeatures,
  ehr: EhrRecord,
): CoachSuggestion[] {
  const suggestions: CoachSuggestion[] = [];

  // --- Cardio risk ---
  if (features.cardioRisk.status === "red") {
    suggestions.push({
      severity: "red",
      title: "Kardiovaskulares Risiko erhoht",
      rationale: `Mehrere Risikofaktoren zusammen: ${features.cardioRisk.reasons.join(", ")}.`,
      action: "Dringend arztliche Abklarung empfohlen. Lebensstilanpassungen bei Ernahrung und Bewegung konnen das Risiko senken.",
    });
  } else if (features.cardioRisk.status === "yellow") {
    suggestions.push({
      severity: "yellow",
      title: "Kardiovaskulares Risiko beobachten",
      rationale: `Einzelne Werte im Grenzbereich: ${features.cardioRisk.reasons.join(", ")}.`,
      action: "Regelmasige Kontrollen beibehalten. Natriumzufuhr reduzieren und aerobe Aktivitat steigern.",
    });
  }

  // --- LDL specific ---
  if (ehr.ldl_mmol >= 2.6) {
    suggestions.push({
      severity: ehr.ldl_mmol >= 4.1 ? "red" : "yellow",
      title: "LDL-Cholesterin erhoht",
      rationale: `Ihr LDL-Wert von ${ehr.ldl_mmol} mmol/L liegt uber dem Zielbereich von <2.6 mmol/L.`,
      action: "Besprechen Sie mit Ihrem Arzt die aktuelle Medikation. Erhohen Sie den Anteil an Omega-3-Fettsauren in Ihrer Ernahrung.",
    });
  }

  // --- Blood pressure ---
  if (features.bpControl.status !== "green") {
    suggestions.push({
      severity: features.bpControl.status,
      title: `Blutdruck ${features.bpControl.label}`,
      rationale: `Ihr Blutdruck liegt bei ${features.bpControl.sbp}/${features.bpControl.dbp} mmHg.`,
      action: "Natriumzufuhr reduzieren und mindestens 150 Minuten aerobe Aktivitat pro Woche anstreben.",
    });
  }

  // --- Metabolic health ---
  if (features.metabolicHealth.criteriaCount >= 3) {
    suggestions.push({
      severity: "red",
      title: "Metabolisches Syndrom — Kriterien erfullt",
      rationale: `${features.metabolicHealth.criteriaCount} von 5 MetS-Kriterien sind erfullt: ${features.metabolicHealth.criteria.join(", ")}.`,
      action: "Arztliche Beratung empfohlen. Gewichtsreduktion, Bewegung und Ernahrungsumstellung sind die wichtigsten Massnahmen.",
    });
  } else if (features.metabolicHealth.criteriaCount >= 2) {
    suggestions.push({
      severity: "yellow",
      title: "Metabolische Gesundheit beobachten",
      rationale: `${features.metabolicHealth.criteriaCount} MetS-Kriterien im Grenzbereich: ${features.metabolicHealth.criteria.join(", ")}.`,
      action: "Regelmasige Kontrollen. Fokus auf ausgewogene Ernahrung und tagliche Bewegung.",
    });
  }

  // --- HRV trend ---
  if (features.hrv30dTrend.slope < -0.3) {
    suggestions.push({
      severity: "yellow",
      title: "HRV-Trend rucklaufig",
      rationale: `Ihre Herzratenvariabilitat zeigt einen Abwartstrend uber die letzten 30 Tage. ${features.hrv30dTrend.interpretation}.`,
      action: "Heute Zone-2-Training statt Intervalle. Auf ausreichend Schlaf und Erholung achten.",
    });
  }

  // --- RHR acute flag ---
  if (features.rhrZscore.flag) {
    suggestions.push({
      severity: "yellow",
      title: "Ruhepuls akut erhoht",
      rationale: features.rhrZscore.interpretation,
      action: "Intensitat reduzieren und Erholung priorisieren. Bei anhaltender Erhohung arztliche Abklarung.",
    });
  }

  // --- Stress-inflammation ---
  if (features.stressInflammation.level === "red") {
    suggestions.push({
      severity: "red",
      title: "Stress-Entzundungs-Achse aktiviert",
      rationale: `Hoher Stress (${features.stressInflammation.score}/100) in Kombination mit erhohten Entzundungswerten.`,
      action: "Stressreduktion priorisieren: Atemubungen, Schlafhygiene, und arztliche Abklarung der CRP-Werte.",
    });
  } else if (features.stressInflammation.level === "yellow") {
    suggestions.push({
      severity: "yellow",
      title: "Stress-Entzundungs-Signal beobachten",
      rationale: `Moderates Signal (${features.stressInflammation.score}/100). Stress und Entzundungswerte sollten im Auge behalten werden.`,
      action: "Regelmasige Entspannung und anti-entzundliche Ernahrung (Omega-3, Gemuse, wenig Alkohol).",
    });
  }

  // --- Sleep ---
  if (features.sleepComposite.score < 50) {
    suggestions.push({
      severity: "red",
      title: "Schlafqualitat unzureichend",
      rationale: `Ihr Schlaf-Score liegt bei ${features.sleepComposite.score}/100.`,
      action: "Schlafhygiene verbessern: feste Schlafzeiten, kein Bildschirm 1h vor dem Schlafen, kuhlere Raumtemperatur.",
    });
  } else if (features.sleepComposite.score < 70) {
    suggestions.push({
      severity: "yellow",
      title: "Schlaf optimierbar",
      rationale: `Schlaf-Score ${features.sleepComposite.score}/100 — Tiefschlafanteil und Dauer haben Verbesserungspotenzial.`,
      action: "Konsistente Schlafzeiten einhalten. Koffein nach 14 Uhr vermeiden.",
    });
  }

  // --- Activity ---
  if (features.activityAdherence < 50) {
    suggestions.push({
      severity: "yellow",
      title: "Bewegungsziel nicht erreicht",
      rationale: `Nur an ${features.activityAdherence}% der Tage wurden 5.000 Schritte erreicht.`,
      action: "Tipp: Ein 20-Minuten-Spaziergang morgens und abends genugt fur 5.000+ Schritte.",
    });
  }

  // --- Strain/recovery (biohacker) ---
  if (features.strainRecovery.flag) {
    suggestions.push({
      severity: "yellow",
      title: "Uberbelastung erkannt",
      rationale: features.strainRecovery.interpretation,
      action: "Heute leichtes Zone-2-Training oder aktive Erholung. Schlaf und Ernahrung priorisieren.",
    });
  }

  // --- Inflammation index (biohacker) ---
  if (features.inflammation.level === "red") {
    suggestions.push({
      severity: "red",
      title: "Entzundungsindex erhoht",
      rationale: `Ihr Entzundungs-Score liegt bei ${features.inflammation.score}/100.`,
      action: "Alkohol reduzieren, anti-entzundliche Ernahrung, Stressmanagement. Bei CRP > 3 mg/L arztliche Abklarung.",
    });
  }

  // --- Positive feedback: bio-age ---
  if (features.bioAge.delta < 0) {
    suggestions.push({
      severity: "green",
      title: "Bio-Age unter chronologischem Alter",
      rationale: `Ihr biologisches Alter wird auf ${features.bioAge.bioAge} Jahre geschatzt — ${Math.abs(features.bioAge.delta)} Jahre unter Ihrem chronologischen Alter.`,
      action: "Weiter so. Fokussieren Sie sich auf die Verbesserung der gelben und roten Bereiche.",
    });
  }

  // --- Positive feedback: good sleep ---
  if (features.sleepComposite.score >= 75) {
    suggestions.push({
      severity: "green",
      title: "Hervorragende Schlafqualitat",
      rationale: `Ihr Schlaf-Score liegt bei ${features.sleepComposite.score}/100 — uberdurchschnittlich gut.`,
      action: "Beibehalten! Konsistente Schlafzeiten sind einer der starksten Longevity-Faktoren.",
    });
  }

  // --- Positive feedback: good activity ---
  if (features.activityAdherence >= 80) {
    suggestions.push({
      severity: "green",
      title: "Vorbildliche Bewegungsroutine",
      rationale: `An ${features.activityAdherence}% der Tage wurde das Bewegungsziel erreicht.`,
      action: "Exzellent. Variieren Sie die Intensitat — Zone 2 als Basis, 1–2x/Woche hohere Intensitat.",
    });
  }

  // --- Insights: Hydration ---
  if (features.insights.hydration.status === "red") {
    suggestions.push({
      severity: "red",
      title: "Hydration unzureichend",
      rationale: features.insights.hydration.interpretation,
      action: "Wasserzufuhr auf mindestens 8 Glaeser/Tag erhoehen. Bei Sport zusaetzlich 1-2 Glaeser.",
    });
  } else if (features.insights.hydration.status === "yellow") {
    suggestions.push({
      severity: "yellow",
      title: "Hydration verbessern",
      rationale: features.insights.hydration.interpretation,
      action: "Versuchen Sie, ueber den Tag verteilt regelmaessig zu trinken.",
    });
  }

  // --- Insights: SpO2 ---
  if (features.insights.spo2Profile.status === "red") {
    suggestions.push({
      severity: "red",
      title: "SpO2-Werte auffaellig",
      rationale: features.insights.spo2Profile.interpretation,
      action: "Aerztliche Abklaerung empfohlen — Schlafapnoe-Screening in Betracht ziehen.",
    });
  } else if (features.insights.spo2Profile.status === "yellow") {
    suggestions.push({
      severity: "yellow",
      title: "SpO2-Werte beobachten",
      rationale: features.insights.spo2Profile.interpretation,
      action: "SpO2-Trend weiter verfolgen. Bei Verschlechterung aerztlich abklaeren.",
    });
  }

  // --- Insights: Sedentary ---
  if (features.insights.sedentaryScore.status === "red") {
    suggestions.push({
      severity: "red",
      title: "Zu viel Sitzzeit",
      rationale: features.insights.sedentaryScore.interpretation,
      action: "Alle 45 Minuten 3-5 Minuten aufstehen und bewegen. Stehschreibtisch in Betracht ziehen.",
    });
  } else if (features.insights.sedentaryScore.status === "yellow") {
    suggestions.push({
      severity: "yellow",
      title: "Sitzzeit reduzieren",
      rationale: features.insights.sedentaryScore.interpretation,
      action: "Regelmaessige Bewegungspausen einplanen. Walking-Meetings nutzen.",
    });
  }

  // --- Insights: Energy balance flag ---
  if (features.insights.energyBalance.flag) {
    suggestions.push({
      severity: "yellow",
      title: "Energiebilanz beachten",
      rationale: features.insights.energyBalance.interpretation,
      action: "Portionsgroessen bewusst waehlen. Ernaehrungsberatung kann helfen.",
    });
  }

  // --- Insights: Social Jet Lag ---
  if (features.insights.circadianWeekday.socialJetLagFlag) {
    suggestions.push({
      severity: "yellow",
      title: "Social Jet Lag erkannt",
      rationale: features.insights.circadianWeekday.interpretation,
      action: "Versuchen Sie, auch am Wochenende aehnliche Schlafzeiten einzuhalten.",
    });
  }

  // --- Insights: Visit history ---
  if (features.insights.visitHistory.preventiveOverdue) {
    suggestions.push({
      severity: "yellow",
      title: "Vorsorgeuntersuchung ueberfaellig",
      rationale: features.insights.visitHistory.interpretation,
      action: "Vereinbaren Sie einen Termin fuer eine Vorsorgeuntersuchung.",
    });
  }

  // --- Insights: Positive — longevity trend ---
  if (features.insights.longevityTrend.trendDirection === "improving") {
    suggestions.push({
      severity: "green",
      title: "Positiver Gesundheitstrend",
      rationale: features.insights.longevityTrend.interpretation,
      action: "Ausgezeichnete Entwicklung. Aktuelle Gewohnheiten beibehalten.",
    });
  }

  // Sort: red first, then yellow, then green
  const order: Record<string, number> = { red: 0, yellow: 1, green: 2 };
  suggestions.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));

  return suggestions;
}

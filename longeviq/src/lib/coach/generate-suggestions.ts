// ============================================================
// LongevIQ — Rule-based coach suggestion generator
// Produces a single top-priority CoachSuggestion from computed features
// ============================================================

import type { ComputedFeatures, CoachSuggestion, EhrRecord } from "../types";

interface GenerateCoachSuggestionsOptions {
  includeGreen?: boolean;
  limit?: number;
}

export function generateCoachSuggestions(
  features: ComputedFeatures,
  ehr: EhrRecord,
  options: GenerateCoachSuggestionsOptions = {},
): CoachSuggestion[] {
  const { includeGreen = true, limit = 1 } = options;
  const suggestions: CoachSuggestion[] = [];

  // --- Cardio risk ---
  if (features.cardioRisk.status === "red") {
    suggestions.push({
      severity: "red",
      title: "Cardiovascular risk elevated",
      rationale: `Multiple risk factors combined: ${features.cardioRisk.reasons.join(", ")}.`,
      action: "Urgent medical evaluation recommended. Lifestyle changes in diet and exercise can reduce the risk.",
    });
  } else if (features.cardioRisk.status === "yellow") {
    suggestions.push({
      severity: "yellow",
      title: "Monitor cardiovascular risk",
      rationale: `Some values in the borderline range: ${features.cardioRisk.reasons.join(", ")}.`,
      action: "Continue regular check-ups. Reduce sodium intake and increase aerobic activity.",
    });
  }

  // --- LDL specific ---
  if (ehr.ldl_mmol >= 2.6) {
    suggestions.push({
      severity: ehr.ldl_mmol >= 4.1 ? "red" : "yellow",
      title: "LDL cholesterol elevated",
      rationale: `Your LDL value of ${ehr.ldl_mmol} mmol/L is above the target range of <2.6 mmol/L.`,
      action: "Discuss your current medication with your doctor. Increase omega-3 fatty acids in your diet.",
    });
  }

  // --- Blood pressure ---
  if (features.bpControl.status !== "green") {
    suggestions.push({
      severity: features.bpControl.status,
      title: `Blood pressure ${features.bpControl.label}`,
      rationale: `Your blood pressure is ${features.bpControl.sbp}/${features.bpControl.dbp} mmHg.`,
      action: "Reduce sodium intake and aim for at least 150 minutes of aerobic activity per week.",
    });
  }

  // --- Metabolic health ---
  if (features.metabolicHealth.criteriaCount >= 3) {
    suggestions.push({
      severity: "red",
      title: "Metabolic syndrome — criteria met",
      rationale: `${features.metabolicHealth.criteriaCount} of 5 MetS criteria are met: ${features.metabolicHealth.criteria.join(", ")}.`,
      action: "Medical consultation recommended. Weight loss, exercise, and dietary changes are the most important measures.",
    });
  } else if (features.metabolicHealth.criteriaCount >= 2) {
    suggestions.push({
      severity: "yellow",
      title: "Monitor metabolic health",
      rationale: `${features.metabolicHealth.criteriaCount} MetS criteria in the borderline range: ${features.metabolicHealth.criteria.join(", ")}.`,
      action: "Regular check-ups. Focus on a balanced diet and daily exercise.",
    });
  }

  // --- HRV trend ---
  if (features.hrv30dTrend.slope < -0.3) {
    suggestions.push({
      severity: "yellow",
      title: "HRV trend declining",
      rationale: `Your heart rate variability shows a downward trend over the last 30 days. ${features.hrv30dTrend.interpretation}.`,
      action: "Do zone-2 training today instead of intervals. Ensure adequate sleep and recovery.",
    });
  }

  // --- RHR acute flag ---
  if (features.rhrZscore.flag) {
    suggestions.push({
      severity: "yellow",
      title: "Resting heart rate acutely elevated",
      rationale: features.rhrZscore.interpretation,
      action: "Reduce intensity and prioritize recovery. Seek medical evaluation if the elevation persists.",
    });
  }

  // --- Stress-inflammation ---
  if (features.stressInflammation.level === "red") {
    suggestions.push({
      severity: "red",
      title: "Stress-inflammation axis activated",
      rationale: `High stress (${features.stressInflammation.score}/100) combined with elevated inflammation markers.`,
      action: "Prioritize stress reduction: breathing exercises, sleep hygiene, and medical evaluation of CRP levels.",
    });
  } else if (features.stressInflammation.level === "yellow") {
    suggestions.push({
      severity: "yellow",
      title: "Monitor stress-inflammation signal",
      rationale: `Moderate signal (${features.stressInflammation.score}/100). Stress and inflammation levels should be monitored.`,
      action: "Regular relaxation and anti-inflammatory diet (omega-3, vegetables, low alcohol).",
    });
  }

  // --- Sleep ---
  if (features.sleepComposite.score < 50) {
    suggestions.push({
      severity: "red",
      title: "Sleep quality insufficient",
      rationale: `Your sleep score is ${features.sleepComposite.score}/100.`,
      action: "Improve sleep hygiene: consistent bedtimes, no screens 1 hour before bed, cooler room temperature.",
    });
  } else if (features.sleepComposite.score < 70) {
    suggestions.push({
      severity: "yellow",
      title: "Sleep can be optimized",
      rationale: `Sleep score ${features.sleepComposite.score}/100 — deep sleep proportion and duration have room for improvement.`,
      action: "Maintain consistent sleep times. Avoid caffeine after 2 PM.",
    });
  }

  // --- Activity ---
  if (features.activityAdherence < 50) {
    suggestions.push({
      severity: "yellow",
      title: "Activity goal not reached",
      rationale: `Only ${features.activityAdherence}% of days reached 5,000 steps.`,
      action: "Tip: A 20-minute walk in the morning and evening is enough for 5,000+ steps.",
    });
  }

  // --- Strain/recovery (biohacker) ---
  if (features.strainRecovery.flag) {
    suggestions.push({
      severity: "yellow",
      title: "Overtraining detected",
      rationale: features.strainRecovery.interpretation,
      action: "Do light zone-2 training or active recovery today. Prioritize sleep and nutrition.",
    });
  }

  // --- Inflammation index (biohacker) ---
  if (features.inflammation.level === "red") {
    suggestions.push({
      severity: "red",
      title: "Inflammation index elevated",
      rationale: `Your inflammation score is ${features.inflammation.score}/100.`,
      action: "Reduce alcohol, adopt an anti-inflammatory diet, manage stress. Seek medical evaluation if CRP > 3 mg/L.",
    });
  }

  // --- Positive feedback: bio-age ---
  if (features.bioAge.delta < 0) {
    suggestions.push({
      severity: "green",
      title: "Bio-age below chronological age",
      rationale: `Your biological age is estimated at ${features.bioAge.bioAge} years — ${Math.abs(features.bioAge.delta)} years below your chronological age.`,
      action: "Keep it up. Focus on improving the yellow and red areas.",
    });
  }

  // --- Positive feedback: good sleep ---
  if (features.sleepComposite.score >= 75) {
    suggestions.push({
      severity: "green",
      title: "Excellent sleep quality",
      rationale: `Your sleep score is ${features.sleepComposite.score}/100 — above average.`,
      action: "Keep it up! Consistent sleep times are one of the strongest longevity factors.",
    });
  }

  // --- Positive feedback: good activity ---
  if (features.activityAdherence >= 80) {
    suggestions.push({
      severity: "green",
      title: "Exemplary activity routine",
      rationale: `The activity goal was reached on ${features.activityAdherence}% of days.`,
      action: "Excellent. Vary the intensity — zone 2 as a baseline, higher intensity 1-2x per week.",
    });
  }

  // --- Insights: Hydration ---
  if (features.insights.hydration.status === "red") {
    suggestions.push({
      severity: "red",
      title: "Hydration insufficient",
      rationale: features.insights.hydration.interpretation,
      action: "Increase water intake to at least 8 glasses per day. Add 1-2 extra glasses when exercising.",
    });
  } else if (features.insights.hydration.status === "yellow") {
    suggestions.push({
      severity: "yellow",
      title: "Improve hydration",
      rationale: features.insights.hydration.interpretation,
      action: "Try to drink regularly throughout the day.",
    });
  }

  // --- Insights: SpO2 ---
  if (features.insights.spo2Profile.status === "red") {
    suggestions.push({
      severity: "red",
      title: "SpO2 values abnormal",
      rationale: features.insights.spo2Profile.interpretation,
      action: "Medical evaluation recommended — consider sleep apnea screening.",
    });
  } else if (features.insights.spo2Profile.status === "yellow") {
    suggestions.push({
      severity: "yellow",
      title: "Monitor SpO2 values",
      rationale: features.insights.spo2Profile.interpretation,
      action: "Continue tracking SpO2 trend. Seek medical evaluation if it worsens.",
    });
  }

  // --- Insights: Sedentary ---
  if (features.insights.sedentaryScore.status === "red") {
    suggestions.push({
      severity: "red",
      title: "Too much sedentary time",
      rationale: features.insights.sedentaryScore.interpretation,
      action: "Stand up and move for 3-5 minutes every 45 minutes. Consider a standing desk.",
    });
  } else if (features.insights.sedentaryScore.status === "yellow") {
    suggestions.push({
      severity: "yellow",
      title: "Reduce sedentary time",
      rationale: features.insights.sedentaryScore.interpretation,
      action: "Schedule regular movement breaks. Use walking meetings.",
    });
  }

  // --- Insights: Energy balance flag ---
  if (features.insights.energyBalance.flag) {
    suggestions.push({
      severity: "yellow",
      title: "Mind your energy balance",
      rationale: features.insights.energyBalance.interpretation,
      action: "Be mindful of portion sizes. Nutritional counseling can help.",
    });
  }

  // --- Insights: Social Jet Lag ---
  if (features.insights.circadianWeekday.socialJetLagFlag) {
    suggestions.push({
      severity: "yellow",
      title: "Social jet lag detected",
      rationale: features.insights.circadianWeekday.interpretation,
      action: "Try to maintain similar sleep times on weekends as well.",
    });
  }

  // --- Insights: Visit history ---
  if (features.insights.visitHistory.preventiveOverdue) {
    suggestions.push({
      severity: "yellow",
      title: "Preventive check-up overdue",
      rationale: features.insights.visitHistory.interpretation,
      action: "Schedule an appointment for a preventive check-up.",
    });
  }

  // --- Insights: Positive — longevity trend ---
  if (features.insights.longevityTrend.trendDirection === "improving") {
    suggestions.push({
      severity: "green",
      title: "Positive health trend",
      rationale: features.insights.longevityTrend.interpretation,
      action: "Excellent progress. Keep up your current habits.",
    });
  }

  // Sort: red first, then yellow, then green
  const order: Record<string, number> = { red: 0, yellow: 1, green: 2 };
  suggestions.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
  const filtered = includeGreen
    ? suggestions
    : suggestions.filter((suggestion) => suggestion.severity !== "green");

  return filtered.slice(0, limit);
}

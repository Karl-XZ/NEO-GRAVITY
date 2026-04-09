// ============================================================
// LongevIQ — Cross-metric insight features
// Extracts actionable patterns from underutilised data fields
// ============================================================

import type {
  EhrRecord,
  WearableTelemetry,
  LifestyleSurvey,
  TrafficLight,
  ComputedInsights,
} from "../types";
import { THRESHOLDS } from "../thresholds";
import { splitPipe } from "../utils";
import {
  mean,
  slope,
  clamp,
  normalize,
  round,
  pearsonR,
  groupBy,
  sum,
} from "./helpers";

// ------------------------------------------------------------------
// 1. Sleep → HRV Correlation
// ------------------------------------------------------------------
export function sleepHrvCorrelation(
  wearable: WearableTelemetry[],
): ComputedInsights["sleepHrvCorrelation"] {
  if (wearable.length < 3) {
    return { correlation: 0, hrvAfterGoodSleep: 0, hrvAfterPoorSleep: 0, deltaMa: 0, sensitivity: "low", interpretation: "Nicht genug Daten" };
  }

  const sleepScores: number[] = [];
  const nextDayHrv: number[] = [];
  for (let i = 0; i < wearable.length - 1; i++) {
    sleepScores.push(wearable[i].sleep_quality_score);
    nextDayHrv.push(wearable[i + 1].hrv_rmssd_ms);
  }

  const r = pearsonR(sleepScores, nextDayHrv);

  const goodSleepHrv = nextDayHrv.filter((_, i) => sleepScores[i] >= 70);
  const poorSleepHrv = nextDayHrv.filter((_, i) => sleepScores[i] < 55);
  const hrvAfterGoodSleep = goodSleepHrv.length > 0 ? round(mean(goodSleepHrv)) : 0;
  const hrvAfterPoorSleep = poorSleepHrv.length > 0 ? round(mean(poorSleepHrv)) : 0;
  const deltaMa = round(hrvAfterGoodSleep - hrvAfterPoorSleep);

  const absR = Math.abs(r);
  const sensitivity = absR >= 0.5 ? "high" : absR >= 0.3 ? "moderate" : "low";

  const interpretation =
    sensitivity === "high"
      ? `Ihre HRV ist im Schnitt ${deltaMa} ms hoeher nach guten Schlafnaechten. Schlaf ist Ihr staerkster Erholungshebel.`
      : sensitivity === "moderate"
        ? `Moderater Zusammenhang: HRV-Delta von ${deltaMa} ms zwischen guten und schlechten Naechten.`
        : `Geringer Zusammenhang zwischen Schlafqualitaet und naechster-Tag-HRV.`;

  return { correlation: round(r, 2), hrvAfterGoodSleep, hrvAfterPoorSleep, deltaMa, sensitivity, interpretation };
}

// ------------------------------------------------------------------
// 2. Energy Balance Proxy
// ------------------------------------------------------------------
export function energyBalanceProxy(
  ehr: EhrRecord,
  wearable: WearableTelemetry[],
  lifestyle: LifestyleSurvey,
): ComputedInsights["energyBalance"] {
  const recent = wearable.slice(-7);
  const avgCaloriesBurned = round(mean(recent.map((d) => d.calories_burned_kcal)), 0);

  const estimatedIntakeProxy = round(
    lifestyle.meal_frequency_daily * THRESHOLDS.energy.base_kcal_per_meal,
    0,
  );

  const balanceRatio =
    estimatedIntakeProxy > 0
      ? round(avgCaloriesBurned / estimatedIntakeProxy, 2)
      : 1;

  const direction: ComputedInsights["energyBalance"]["direction"] =
    balanceRatio < THRESHOLDS.energy.surplus_ratio
      ? "surplus"
      : balanceRatio > THRESHOLDS.energy.deficit_ratio
        ? "deficit"
        : "balanced";

  const bmiCategory =
    ehr.bmi < 18.5
      ? "underweight"
      : ehr.bmi < 25
        ? "normal"
        : ehr.bmi < 30
          ? "overweight"
          : "obese";

  const flag =
    direction === "surplus" &&
    (bmiCategory === "overweight" || bmiCategory === "obese");

  const interpretation =
    flag
      ? `Ihr Verbrauch (~${avgCaloriesBurned} kcal/Tag) liegt unter der geschaetzten Aufnahme (~${estimatedIntakeProxy} kcal). Bei erhoehtem BMI sollte die Portionsgroesse beachtet werden.`
      : direction === "deficit"
        ? `Ihr Verbrauch (~${avgCaloriesBurned} kcal/Tag) uebersteigt die geschaetzte Aufnahme. Achten Sie auf ausreichende Naehrstoffzufuhr.`
        : `Ihre Energiebilanz erscheint ausgeglichen (~${avgCaloriesBurned} kcal Verbrauch/Tag).`;

  return { avgCaloriesBurned, estimatedIntakeProxy, balanceRatio, direction, flag, interpretation };
}

// ------------------------------------------------------------------
// 3. Hydration Assessment
// ------------------------------------------------------------------
export function hydrationAssessment(
  ehr: EhrRecord,
  wearable: WearableTelemetry[],
  lifestyle: LifestyleSurvey,
): ComputedInsights["hydration"] {
  const avgActiveMin = mean(wearable.slice(-7).map((d) => d.active_minutes));
  const activityBonus =
    avgActiveMin > 45
      ? THRESHOLDS.hydration.active_bonus_high
      : avgActiveMin > 20
        ? THRESHOLDS.hydration.active_bonus_moderate
        : 0;
  const bmiBonus = ehr.bmi > 30 ? THRESHOLDS.hydration.bmi_bonus : 0;
  const adjustedNeed = THRESHOLDS.hydration.base_need + activityBonus + bmiBonus;

  const waterGlasses = lifestyle.water_glasses_daily;
  const hydrationRatio = round(waterGlasses / adjustedNeed, 2);

  const rhrRecent = mean(wearable.slice(-7).map((d) => d.resting_hr_bpm));
  const rhrBaseline = mean(wearable.map((d) => d.resting_hr_bpm));
  const rhrElevationFlag = rhrRecent - rhrBaseline > 3;

  const status: TrafficLight =
    hydrationRatio >= THRESHOLDS.hydration.good_ratio
      ? "green"
      : hydrationRatio >= THRESHOLDS.hydration.adequate_ratio
        ? "yellow"
        : "red";

  const interpretation =
    status === "red"
      ? `Sie trinken ${waterGlasses} Glaeser/Tag, benoetigen aber ca. ${adjustedNeed} bei Ihrem Aktivitaetsniveau.${rhrElevationFlag ? " Ihr erhoehter Ruhepuls koennte auf Dehydration hinweisen." : ""}`
      : status === "yellow"
        ? `Hydration knapp ausreichend (${waterGlasses}/${adjustedNeed} Glaeser).${rhrElevationFlag ? " Ruhepuls leicht erhoeht." : ""}`
        : `Gute Hydration (${waterGlasses}/${adjustedNeed} Glaeser).`;

  return { waterGlasses, adjustedNeed, hydrationRatio, rhrElevationFlag, status, interpretation };
}

// ------------------------------------------------------------------
// 4. SpO2 Night Profile
// ------------------------------------------------------------------
export function spo2NightProfile(
  wearable: WearableTelemetry[],
): ComputedInsights["spo2Profile"] {
  const recent = wearable.slice(-14);
  const spo2Values = recent.map((d) => d.spo2_avg_pct);

  const avgSpo2 = round(mean(spo2Values));
  const minSpo2 = Math.min(...spo2Values);
  const lowNights = spo2Values.filter((v) => v < THRESHOLDS.spo2.normal).length;
  const veryLowNights = spo2Values.filter((v) => v < THRESHOLDS.spo2.low).length;
  const spo2Slope = round(slope(spo2Values), 3);

  const apneaRiskFlag = lowNights >= 3 || veryLowNights >= 1 || avgSpo2 < 94;

  const avgSleepQ = mean(recent.map((d) => d.sleep_quality_score));
  const compoundFlag = apneaRiskFlag && avgSleepQ < 65;

  const status: TrafficLight =
    compoundFlag || veryLowNights >= 1
      ? "red"
      : apneaRiskFlag
        ? "yellow"
        : "green";

  const interpretation =
    status === "red"
      ? `SpO2 an ${lowNights} von ${recent.length} Naechten unter 95%. Min: ${minSpo2}%. Aerztliche Abklaerung empfohlen (Schlafapnoe-Screening).`
      : status === "yellow"
        ? `SpO2 gelegentlich unter 95% (${lowNights} Naechte). Trend beobachten.`
        : `SpO2-Werte im Normalbereich (Ø ${avgSpo2}%).`;

  return { avgSpo2, minSpo2, lowNights, trend: spo2Slope, apneaRiskFlag, compoundFlag, status, interpretation };
}

// ------------------------------------------------------------------
// 5. Sedentary Behavior Score
// ------------------------------------------------------------------
export function sedentaryBehaviorScore(
  wearable: WearableTelemetry[],
  lifestyle: LifestyleSurvey,
): ComputedInsights["sedentaryScore"] {
  const sedentaryHrs = lifestyle.sedentary_hrs_day;
  const activeMinAvg = round(mean(wearable.slice(-7).map((d) => d.active_minutes)));
  const stepsAvg = mean(wearable.slice(-7).map((d) => d.steps));

  const ratio = round(activeMinAvg / (sedentaryHrs * 60), 3);
  const weeklyActiveMin = activeMinAvg * 7;
  const offsetsRisk = weeklyActiveMin >= THRESHOLDS.sedentary.who_offset_min_weekly;

  const sedentaryPenalty = clamp(
    ((sedentaryHrs - THRESHOLDS.sedentary.optimal_max_hrs) /
      (THRESHOLDS.sedentary.high_risk_hrs - THRESHOLDS.sedentary.optimal_max_hrs)) *
      50,
    0,
    50,
  );
  const activityCredit = clamp((activeMinAvg / 60) * 30, 0, 30);
  const stepCredit = clamp((stepsAvg / 8000) * 20, 0, 20);
  const score = round(clamp(100 - sedentaryPenalty + activityCredit + stepCredit - 50, 0, 100), 0);

  const status: TrafficLight =
    score >= 60 ? "green" : score >= 35 ? "yellow" : "red";

  const interpretation =
    status === "red"
      ? `${sedentaryHrs}h Sitzzeit/Tag bei nur ${activeMinAvg} Min Aktivitaet. Deutlich erhoehtes Gesundheitsrisiko.`
      : status === "yellow"
        ? `${sedentaryHrs}h Sitzzeit/Tag. ${offsetsRisk ? "WHO-Aktivitaetsziel erreicht, dennoch" : "WHO-Aktivitaetsziel nicht erreicht,"} Pausen empfohlen.`
        : `Gutes Bewegungsprofil: ${activeMinAvg} Min aktiv bei ${sedentaryHrs}h Sitzzeit.`;

  return { sedentaryHrs, activeMinAvg, ratio, offsetsRisk, score, status, interpretation };
}

// ------------------------------------------------------------------
// 6. Circadian / Day-of-Week Pattern
// ------------------------------------------------------------------
const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export function circadianWeekdayPattern(
  wearable: WearableTelemetry[],
): ComputedInsights["circadianWeekday"] {
  const byDow = groupBy(wearable, (d) => new Date(d.date).getDay());

  const dayProfiles = [0, 1, 2, 3, 4, 5, 6].map((dow) => {
    const days = byDow.get(dow) ?? [];
    return {
      dayName: DAY_NAMES[dow],
      avgSleepQuality: days.length > 0 ? round(mean(days.map((d) => d.sleep_quality_score))) : 0,
      avgHRV: days.length > 0 ? round(mean(days.map((d) => d.hrv_rmssd_ms))) : 0,
      avgSteps: days.length > 0 ? round(mean(days.map((d) => d.steps)), 0) : 0,
    };
  });

  const validProfiles = dayProfiles.filter((d) => d.avgHRV > 0);
  const sorted = [...validProfiles].sort((a, b) => b.avgHRV - a.avgHRV);
  const bestDay = sorted[0] ?? { dayName: "-", avgHRV: 0 };
  const worstDay = sorted[sorted.length - 1] ?? { dayName: "-", avgHRV: 0 };

  // Weekend = Sun(0), Sat(6); Weekday = Mon-Fri(1-5)
  const weekdayProfiles = dayProfiles.filter((_, i) => i >= 1 && i <= 5);
  const weekendProfiles = dayProfiles.filter((_, i) => i === 0 || i === 6);
  const weekdaySleep = round(mean(weekdayProfiles.map((d) => d.avgSleepQuality)));
  const weekendSleep = round(mean(weekendProfiles.map((d) => d.avgSleepQuality)));
  const socialJetLagFlag =
    weekdaySleep > 0 && weekendSleep > 0 && (weekendSleep - weekdaySleep) / weekdaySleep > 0.15;

  const interpretation = socialJetLagFlag
    ? `Social Jet Lag erkannt: Wochenend-Schlafqualitaet ${weekendSleep} vs. Werktag ${weekdaySleep}. Konsistentere Schlafzeiten empfohlen.`
    : `Beste Erholung: ${bestDay.dayName} (HRV ${bestDay.avgHRV} ms). Schlechteste: ${worstDay.dayName} (HRV ${worstDay.avgHRV} ms).`;

  return {
    dayProfiles,
    bestDay: { name: bestDay.dayName, avgHRV: bestDay.avgHRV },
    worstDay: { name: worstDay.dayName, avgHRV: worstDay.avgHRV },
    socialJetLagFlag,
    weekdaySleep,
    weekendSleep,
    interpretation,
  };
}

// ------------------------------------------------------------------
// 7. Week-over-Week Comparison
// ------------------------------------------------------------------
interface MetricDef {
  key: keyof WearableTelemetry;
  name: string;
  invertPolarity?: boolean; // true = lower is better (e.g. RHR)
}

const WOW_METRICS: MetricDef[] = [
  { key: "steps", name: "Schritte" },
  { key: "active_minutes", name: "Aktive Minuten" },
  { key: "calories_burned_kcal", name: "Kalorienverbrauch" },
  { key: "resting_hr_bpm", name: "Ruhepuls", invertPolarity: true },
  { key: "hrv_rmssd_ms", name: "HRV" },
  { key: "sleep_duration_hrs", name: "Schlafdauer" },
  { key: "sleep_quality_score", name: "Schlafqualitaet" },
  { key: "deep_sleep_pct", name: "Tiefschlaf" },
  { key: "spo2_avg_pct", name: "SpO2" },
];

export function weekOverWeekComparison(
  wearable: WearableTelemetry[],
): ComputedInsights["weekOverWeek"] {
  const thisWeek = wearable.slice(-7);
  const lastWeek = wearable.slice(-14, -7);

  if (thisWeek.length < 3 || lastWeek.length < 3) {
    return {
      metrics: [],
      overallTrend: "stable",
      topImprovement: "-",
      topDecline: "-",
    };
  }

  const metrics = WOW_METRICS.map((m) => {
    const thisAvg = mean(thisWeek.map((d) => d[m.key] as number));
    const lastAvg = mean(lastWeek.map((d) => d[m.key] as number));
    const changePct = lastAvg !== 0 ? round(((thisAvg - lastAvg) / lastAvg) * 100) : 0;
    const improved = m.invertPolarity ? changePct < 0 : changePct > 0;
    const significant = Math.abs(changePct) > 10;
    return {
      name: m.name,
      thisWeekAvg: round(thisAvg, 1),
      lastWeekAvg: round(lastAvg, 1),
      changePct,
      improved,
      significant,
    };
  });

  const significantImproved = metrics.filter((m) => m.significant && m.improved).length;
  const significantDeclined = metrics.filter((m) => m.significant && !m.improved).length;
  const overallTrend: ComputedInsights["weekOverWeek"]["overallTrend"] =
    significantImproved > significantDeclined
      ? "improving"
      : significantDeclined > significantImproved
        ? "declining"
        : "stable";

  const bestMetric = [...metrics].sort((a, b) => {
    const aVal = a.improved ? Math.abs(a.changePct) : -Math.abs(a.changePct);
    const bVal = b.improved ? Math.abs(b.changePct) : -Math.abs(b.changePct);
    return bVal - aVal;
  });

  return {
    metrics,
    overallTrend,
    topImprovement: bestMetric.find((m) => m.improved)?.name ?? "-",
    topDecline: bestMetric.find((m) => !m.improved)?.name ?? "-",
  };
}

// ------------------------------------------------------------------
// 8. Lifestyle Impact Analysis
// ------------------------------------------------------------------
export function lifestyleImpactAnalysis(
  lifestyle: LifestyleSurvey,
): ComputedInsights["lifestyleImpact"] {
  const factors = [
    {
      name: "Ernaehrungsqualitaet",
      value: lifestyle.diet_quality_score,
      weight: 0.2,
      score: normalize(lifestyle.diet_quality_score, 0, 100),
    },
    {
      name: "Obst & Gemuese",
      value: lifestyle.fruit_veg_servings_daily,
      weight: 0.15,
      score: normalize(lifestyle.fruit_veg_servings_daily, 0, 7),
    },
    {
      name: "Bewegung",
      value: lifestyle.exercise_sessions_weekly,
      weight: 0.2,
      score: normalize(lifestyle.exercise_sessions_weekly, 0, 7),
    },
    {
      name: "Sitzzeit",
      value: lifestyle.sedentary_hrs_day,
      weight: 0.15,
      score: normalize(14 - lifestyle.sedentary_hrs_day, 0, 14),
    },
    {
      name: "Stresslevel",
      value: lifestyle.stress_level,
      weight: 0.15,
      score: normalize(100 - lifestyle.stress_level, 0, 100),
    },
    {
      name: "Hydration",
      value: lifestyle.water_glasses_daily,
      weight: 0.1,
      score: normalize(lifestyle.water_glasses_daily, 0, 12),
    },
    {
      name: "Alkohol",
      value: lifestyle.alcohol_units_weekly,
      weight: 0.05,
      score: normalize(14 - lifestyle.alcohol_units_weekly, 0, 14),
    },
  ].map((f) => ({
    ...f,
    gap: round(f.weight * (100 - f.score), 1),
  }));

  factors.sort((a, b) => b.gap - a.gap);

  const overallScore = round(
    sum(factors.map((f) => f.weight * f.score)),
    0,
  );

  const topOpportunity = factors[0]?.name ?? "-";
  const topStrength = factors[factors.length - 1]?.name ?? "-";

  const interpretation = `Lifestyle-Score: ${overallScore}/100. Groesster Hebel: ${topOpportunity}. Staerkste Gewohnheit: ${topStrength}.`;

  return { overallScore, factors, topOpportunity, topStrength, interpretation };
}

// ------------------------------------------------------------------
// 9. Recovery Prediction
// ------------------------------------------------------------------
export function recoveryPrediction(
  wearable: WearableTelemetry[],
): ComputedInsights["recoveryPrediction"] {
  if (wearable.length < 2) {
    return { predictedRecovery: 50, confidence: "low", topDrivers: [], recommendation: "Nicht genug Daten." };
  }

  const latest = wearable[wearable.length - 1];
  const baselineRhr = mean(wearable.map((d) => d.resting_hr_bpm));

  const sleepQNorm = normalize(latest.sleep_quality_score, 30, 100);
  const deepNorm = normalize(latest.deep_sleep_pct, 5, 30);
  const durNorm =
    latest.sleep_duration_hrs >= 7 && latest.sleep_duration_hrs <= 9
      ? 100
      : normalize(latest.sleep_duration_hrs, 4, 9);
  const rhrDelta = baselineRhr - latest.resting_hr_bpm;
  const rhrNorm = normalize(rhrDelta, -10, 10);
  const activeNorm =
    normalize(latest.active_minutes, 0, 90) *
    (latest.active_minutes > 120 ? 0.7 : 1.0);

  const predicted = round(
    clamp(
      sleepQNorm * 0.3 + deepNorm * 0.25 + durNorm * 0.15 + rhrNorm * 0.15 + activeNorm * 0.15,
      0,
      100,
    ),
    0,
  );

  // Identify top drivers
  const driverScores = [
    { name: "Schlafqualitaet", contribution: sleepQNorm * 0.3 },
    { name: "Tiefschlaf", contribution: deepNorm * 0.25 },
    { name: "Schlafdauer", contribution: durNorm * 0.15 },
    { name: "Ruhepuls", contribution: rhrNorm * 0.15 },
    { name: "Aktivitaet", contribution: activeNorm * 0.15 },
  ].sort((a, b) => b.contribution - a.contribution);

  const topDrivers = driverScores.slice(0, 2).map((d) => d.name);

  const confidence: ComputedInsights["recoveryPrediction"]["confidence"] =
    wearable.length >= 14 ? "high" : wearable.length >= 7 ? "moderate" : "low";

  const lowestDriver = driverScores[driverScores.length - 1];
  const recommendation =
    lowestDriver.name === "Schlafqualitaet"
      ? "Schlafhygiene verbessern koennte Ihre Erholung morgen steigern."
      : lowestDriver.name === "Tiefschlaf"
        ? "Frueheres Zubettgehen koennte den Tiefschlafanteil erhoehen."
        : lowestDriver.name === "Schlafdauer"
          ? "30 Minuten frueheres Zubettgehen empfohlen."
          : lowestDriver.name === "Ruhepuls"
            ? "Erhoehter Ruhepuls — Stress reduzieren und gut hydrieren."
            : "Training heute moderat halten fuer bessere Erholung morgen.";

  return { predictedRecovery: predicted, confidence, topDrivers, recommendation };
}

// ------------------------------------------------------------------
// 10. Longevity Trend Index
// ------------------------------------------------------------------
export function longevityTrendIndex(
  wearable: WearableTelemetry[],
): ComputedInsights["longevityTrend"] {
  const mid = Math.floor(wearable.length / 2);
  const firstHalf = wearable.slice(0, mid);
  const secondHalf = wearable.slice(mid);

  if (firstHalf.length < 3 || secondHalf.length < 3) {
    return {
      dimensions: [],
      overallChange: 0,
      trendDirection: "stable",
      momentum: 0,
      interpretation: "Nicht genug Daten fuer Trendanalyse.",
    };
  }

  function computeDim(
    name: string,
    fn: (days: WearableTelemetry[]) => number,
  ) {
    const first = fn(firstHalf);
    const second = fn(secondHalf);
    const change = round(second - first, 1);
    return {
      name,
      firstHalfScore: round(first, 1),
      secondHalfScore: round(second, 1),
      change,
      improving: change > 2,
      declining: change < -2,
    };
  }

  const dimensions = [
    computeDim("Kardio-Fitness", (days) => {
      const rhr = mean(days.map((d) => d.resting_hr_bpm));
      const hrv = mean(days.map((d) => d.hrv_rmssd_ms));
      return normalize(hrv, 15, 80) * 0.6 + normalize(80 - rhr, 0, 30) * 0.4;
    }),
    computeDim("Schlafgesundheit", (days) => {
      const quality = mean(days.map((d) => d.sleep_quality_score));
      const deep = mean(days.map((d) => d.deep_sleep_pct));
      return quality * 0.6 + normalize(deep, 10, 25) * 0.4;
    }),
    computeDim("Bewegung", (days) => {
      const steps = mean(days.map((d) => d.steps));
      const active = mean(days.map((d) => d.active_minutes));
      return normalize(steps, 2000, 10000) * 0.5 + normalize(active, 0, 60) * 0.5;
    }),
    computeDim("Autonome Gesundheit", (days) => {
      const spo2 = mean(days.map((d) => d.spo2_avg_pct));
      const hrv = mean(days.map((d) => d.hrv_rmssd_ms));
      return normalize(spo2, 90, 100) * 0.4 + normalize(hrv, 15, 80) * 0.6;
    }),
  ];

  const weights = [0.25, 0.25, 0.25, 0.25];
  const overallChange = round(
    sum(dimensions.map((d, i) => weights[i] * d.change)),
    1,
  );
  const trendDirection: ComputedInsights["longevityTrend"]["trendDirection"] =
    overallChange > 2 ? "improving" : overallChange < -2 ? "declining" : "stable";
  const momentum = round(clamp(overallChange * 5, -100, 100), 0);

  const improving = dimensions.filter((d) => d.improving).map((d) => d.name);
  const declining = dimensions.filter((d) => d.declining).map((d) => d.name);

  const interpretation =
    trendDirection === "improving"
      ? `Positiver Trend${improving.length > 0 ? ` in ${improving.join(", ")}` : ""}. Weiter so!`
      : trendDirection === "declining"
        ? `Ruecklaeufiger Trend${declining.length > 0 ? ` bei ${declining.join(", ")}` : ""}. Aufmerksamkeit erforderlich.`
        : "Stabile Werte ueber die letzten 30 Tage.";

  return { dimensions, overallChange, trendDirection, momentum, interpretation };
}

// ------------------------------------------------------------------
// 11. Visit History Analysis
// ------------------------------------------------------------------
const ICD_CATEGORIES: Record<string, string> = {
  Z00: "Allgemeinuntersuchung",
  Z12: "Krebsvorsorge",
  E11: "Diabetes-Kontrolle",
  E13: "Diabetes-Kontrolle",
  E78: "Cholesterin-Kontrolle",
  I10: "Blutdruck-Kontrolle",
  I20: "Herz-Kontrolle",
  I25: "Herz-Kontrolle",
  K21: "Magen-Kontrolle",
  J45: "Asthma-Kontrolle",
  M54: "Rueckenschmerzen",
};

export function visitHistoryAnalysis(
  ehr: EhrRecord,
): ComputedInsights["visitHistory"] {
  const raw = ehr.visit_history;
  if (!raw || raw === "none" || raw === "None") {
    return {
      totalVisits: 0,
      daysSinceLastVisit: 999,
      visitReasons: [],
      frequencyTrend: "stable",
      preventiveOverdue: true,
      interpretation: "Keine Besuchshistorie vorhanden.",
    };
  }

  const visits = raw
    .split("|")
    .map((v) => {
      const parts = v.split(":");
      if (parts.length < 2) return null;
      return { date: parts[0], code: parts[1] };
    })
    .filter((v): v is { date: string; code: string } => v !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (visits.length === 0) {
    return {
      totalVisits: 0,
      daysSinceLastVisit: 999,
      visitReasons: [],
      frequencyTrend: "stable",
      preventiveOverdue: true,
      interpretation: "Keine Besuchshistorie vorhanden.",
    };
  }

  const lastVisitDate = new Date(visits[visits.length - 1].date);
  const daysSinceLastVisit = round(
    (Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24),
    0,
  );

  const visitReasons = visits.map((v) => ({
    date: v.date,
    code: v.code,
    category: ICD_CATEGORIES[v.code.substring(0, 3)] ?? v.code,
  }));

  // Check preventive visit overdue (> 365 days since last Z-code)
  const preventiveVisits = visits.filter((v) => v.code.startsWith("Z"));
  const lastPreventive = preventiveVisits.length > 0
    ? new Date(preventiveVisits[preventiveVisits.length - 1].date)
    : null;
  const preventiveOverdue =
    !lastPreventive || (Date.now() - lastPreventive.getTime()) / (1000 * 60 * 60 * 24) > 365;

  // Simple frequency trend based on visit count in first half vs second half
  const midIdx = Math.floor(visits.length / 2);
  const firstHalfCount = midIdx;
  const secondHalfCount = visits.length - midIdx;
  const frequencyTrend: ComputedInsights["visitHistory"]["frequencyTrend"] =
    secondHalfCount > firstHalfCount + 1
      ? "increasing"
      : firstHalfCount > secondHalfCount + 1
        ? "decreasing"
        : "stable";

  const interpretation =
    `${visits.length} Arztbesuche erfasst. Letzter Besuch vor ${daysSinceLastVisit} Tagen.${preventiveOverdue ? " Vorsorgeuntersuchung ueberfaellig." : ""}`;

  return {
    totalVisits: visits.length,
    daysSinceLastVisit,
    visitReasons,
    frequencyTrend,
    preventiveOverdue,
    interpretation,
  };
}

// ------------------------------------------------------------------
// 12. Medication-Condition Mapping
// ------------------------------------------------------------------
const MED_CONDITION_MAP: Record<string, string[]> = {
  Metformin: ["E11", "E13", "type2_diabetes"],
  Atorvastatin: ["E78", "dyslipidaemia", "dyslipidemia"],
  Simvastatin: ["E78", "dyslipidaemia"],
  Rosuvastatin: ["E78", "dyslipidaemia"],
  Lisinopril: ["I10", "hypertension"],
  Ramipril: ["I10", "hypertension"],
  Amlodipine: ["I10", "hypertension"],
  Bisoprolol: ["I10", "hypertension"],
  Aspirin: ["I25", "I20"],
  Omeprazole: ["K21"],
  Pantoprazole: ["K21"],
  Salbutamol: ["J45"],
  Insulin: ["E11", "E13", "type2_diabetes"],
};

export function medicationConditionMapping(
  ehr: EhrRecord,
): ComputedInsights["medicationMapping"] {
  const medications = splitPipe(ehr.medications);
  const icdCodes = splitPipe(ehr.icd_codes);
  const conditions = splitPipe(ehr.chronic_conditions);

  const mappings = medications.map((med) => {
    const baseName = med.split(/\s+/)[0];
    const expectedConditions = MED_CONDITION_MAP[baseName] ?? [];
    const matched =
      expectedConditions.length > 0 &&
      expectedConditions.some(
        (ec) =>
          icdCodes.some((icd) => icd.startsWith(ec)) ||
          conditions.some((c) => c.toLowerCase().includes(ec.toLowerCase())),
      );
    const conditionLabel = expectedConditions.length > 0
      ? (ICD_CATEGORIES[expectedConditions[0]?.substring(0, 3)] ?? expectedConditions[0])
      : "Unbekannt";
    return { medication: med, condition: conditionLabel, matched };
  });

  const knownMappings = mappings.filter(
    (m) => MED_CONDITION_MAP[m.medication.split(/\s+/)[0]],
  );
  const coherenceScore =
    knownMappings.length > 0
      ? round((knownMappings.filter((m) => m.matched).length / knownMappings.length) * 100, 0)
      : 100;
  const polypharmacyFlag = medications.length >= 5;

  const interpretation =
    `${medications.length} Medikament${medications.length !== 1 ? "e" : ""}, ${conditions.length} Diagnose${conditions.length !== 1 ? "n" : ""}.${polypharmacyFlag ? " Polypharmazie-Hinweis." : ""} Kohaerenz: ${coherenceScore}%.`;

  return {
    mappings,
    medicationCount: medications.length,
    conditionCount: conditions.length,
    coherenceScore,
    polypharmacyFlag,
    interpretation,
  };
}

// ------------------------------------------------------------------
// Orchestrator: compute all insights
// ------------------------------------------------------------------
export function computeAllInsights(
  ehr: EhrRecord,
  wearable: WearableTelemetry[],
  lifestyle: LifestyleSurvey,
): ComputedInsights {
  return {
    sleepHrvCorrelation: sleepHrvCorrelation(wearable),
    energyBalance: energyBalanceProxy(ehr, wearable, lifestyle),
    hydration: hydrationAssessment(ehr, wearable, lifestyle),
    spo2Profile: spo2NightProfile(wearable),
    sedentaryScore: sedentaryBehaviorScore(wearable, lifestyle),
    circadianWeekday: circadianWeekdayPattern(wearable),
    weekOverWeek: weekOverWeekComparison(wearable),
    lifestyleImpact: lifestyleImpactAnalysis(lifestyle),
    recoveryPrediction: recoveryPrediction(wearable),
    longevityTrend: longevityTrendIndex(wearable),
    visitHistory: visitHistoryAnalysis(ehr),
    medicationMapping: medicationConditionMapping(ehr),
  };
}

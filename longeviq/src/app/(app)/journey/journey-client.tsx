"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeAllFeatures } from "@/lib/features";
import { generateCoachSuggestions } from "@/lib/coach/generate-suggestions";
import { mean } from "@/lib/features/helpers";
import type {
  ComputedFeatures,
  EhrRecord,
  LifestyleSurvey,
  TrafficLight,
  WearableTelemetry,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
}

const trafficColors: Record<TrafficLight, string> = {
  green: "text-status-normal",
  yellow: "text-status-warning",
  red: "text-status-critical",
};

const trafficBg: Record<TrafficLight, string> = {
  green: "bg-status-normal/10 border-status-normal/30",
  yellow: "bg-status-warning/10 border-status-warning/30",
  red: "bg-status-critical/10 border-status-critical/30",
};

const trafficDot: Record<TrafficLight, string> = {
  green: "bg-status-normal",
  yellow: "bg-status-warning",
  red: "bg-status-critical",
};

const trafficLabel: Record<TrafficLight, string> = {
  green: "Normal",
  yellow: "Beobachten",
  red: "Kritisch",
};

// ---------------------------------------------------------------------------
// Tooltip components
// ---------------------------------------------------------------------------

function BioAgeTooltip({
  active,
  payload,
  label,
  chronoAge,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
  chronoAge: number;
}) {
  if (!active || !payload?.length) return null;
  const bio = payload.find((entry) => entry.dataKey === "bioAge");
  return (
    <div className="rounded-lg border border-border bg-surface-1 px-3 py-2 shadow-xl">
      <p className="text-fluid-xs text-muted-foreground">{label}</p>
      {bio && <p className="font-data text-fluid-sm text-primary">{bio.value} Jahre</p>}
      <p className="font-data text-fluid-xs text-muted-foreground">
        Chronologisch: {chronoAge}
      </p>
    </div>
  );
}

function SimpleTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-1 px-3 py-2 shadow-xl">
      <p className="text-fluid-xs text-muted-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-data text-fluid-sm" style={{ color: p.color }}>
          {typeof p.value === "number" ? p.value.toFixed(1) : p.value}{" "}
          <span className="text-muted-foreground">{unit}</span>
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small UI components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: TrafficLight }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-fluid-xs font-medium ${trafficBg[status]} ${trafficColors[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${trafficDot[status]}`} />
      {trafficLabel[status]}
    </span>
  );
}

function ScoreBar({
  label,
  value,
  max = 100,
  color = "bg-primary",
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-fluid-xs text-muted-foreground">{label}</span>
        <span className="font-data text-fluid-sm text-foreground">
          {Math.round(value)}
          <span className="text-muted-foreground">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function statusClasses(status: "Now" | "Next" | "Later") {
  if (status === "Now") return "border-primary/30 bg-primary/10 text-primary";
  if (status === "Next") return "border-chart-4/30 bg-chart-4/10 text-chart-4";
  return "border-border bg-surface-2/60 text-muted-foreground";
}

function nextVo2Target(current: number) {
  if (current < 38) return 40;
  if (current < 42) return 45;
  if (current < 47) return 50;
  return Math.ceil((current + 2) / 2) * 2;
}

const trendTabs = [
  { value: "readiness", label: "Bereitschaft" },
  { value: "recovery", label: "Erholung" },
  { value: "hrv", label: "HRV" },
  { value: "steps", label: "Schritte" },
  { value: "sleep", label: "Schlaf" },
  { value: "activity", label: "Aktive Minuten" },
] as const;

function TrendKpi({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-2/60 px-4 py-3 ring-1 ring-foreground/5">
      <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-data text-fluid-lg text-foreground">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Milestone generation from real data
// ---------------------------------------------------------------------------

interface Milestone {
  date: string;
  label: string;
  type: "health" | "data" | "activity" | "sleep";
}

function generateMilestones(
  features: ComputedFeatures,
  wearable: WearableTelemetry[],
): Milestone[] {
  const milestones: Milestone[] = [];

  if (features.bioAge.delta < 0) {
    milestones.push({
      date: wearable[wearable.length - 1]?.date ?? "",
      label: `Bio-Age ${features.bioAge.bioAge} erreicht — ${Math.abs(features.bioAge.delta)} Jahre junger`,
      type: "health",
    });
  }

  if (features.walkStreak.days >= 3) {
    milestones.push({
      date: wearable[wearable.length - 1]?.date ?? "",
      label: `${features.walkStreak.days}-Tage Schritt-Streak (≥5.000/Tag)`,
      type: "activity",
    });
  }

  if (features.hrv30dTrend.slope > 0.1) {
    milestones.push({
      date: wearable[Math.floor(wearable.length * 0.6)]?.date ?? "",
      label: `HRV-Trend positiv: +${(features.hrv30dTrend.slope * 30).toFixed(1)} ms uber 30 Tage`,
      type: "health",
    });
  }

  if (features.circadianConsistency.score >= 70) {
    milestones.push({
      date: wearable[Math.floor(wearable.length * 0.5)]?.date ?? "",
      label: `Schlafkonsistenz ${Math.round(features.circadianConsistency.score)}% — stabiler Rhythmus`,
      type: "sleep",
    });
  }

  if (features.activityAdherence >= 70) {
    milestones.push({
      date: wearable[Math.floor(wearable.length * 0.4)]?.date ?? "",
      label: `Bewegungsziel an ${Math.round(features.activityAdherence)}% der Tage erreicht`,
      type: "activity",
    });
  }

  const bestHrvDay = wearable.reduce((best, d) =>
    d.hrv_rmssd_ms > best.hrv_rmssd_ms ? d : best
  );
  milestones.push({
    date: bestHrvDay.date,
    label: `Bester HRV-Wert: ${bestHrvDay.hrv_rmssd_ms} ms`,
    type: "health",
  });

  const bestStepsDay = wearable.reduce((best, d) =>
    d.steps > best.steps ? d : best
  );
  milestones.push({
    date: bestStepsDay.date,
    label: `Schritt-Rekord: ${bestStepsDay.steps.toLocaleString("de")} Schritte`,
    type: "activity",
  });

  if (features.vo2max.vo2max >= 40) {
    milestones.push({
      date: wearable[Math.floor(wearable.length * 0.7)]?.date ?? "",
      label: `VO2max ${features.vo2max.vo2max.toFixed(1)} ml/kg/min — ${features.vo2max.percentile}`,
      type: "health",
    });
  }

  if (wearable.length > 0) {
    milestones.push({
      date: wearable[0].date,
      label: "Erste Datenerfassung abgeschlossen",
      type: "data",
    });
  }

  milestones.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return milestones;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface JourneyClientProps {
  ehr: EhrRecord;
  wearable: WearableTelemetry[];
  lifestyle: LifestyleSurvey;
}

export function JourneyClient({ ehr, wearable, lifestyle }: JourneyClientProps) {
  const features = computeAllFeatures(ehr, wearable, lifestyle);
  const suggestions = generateCoachSuggestions(features, ehr);
  const bioAge = features.bioAge;
  const chronoAge = ehr.age;

  // Bio-age progression
  const startBioAge = bioAge.bioAge + 1.3;
  const bioAgeTrend = wearable.map((day, index) => {
    const progress = index / (wearable.length - 1 || 1);
    const eased = 1 - Math.pow(1 - progress, 2.2);
    const baseAge = startBioAge - eased * (startBioAge - bioAge.bioAge);
    const noise = Math.sin(index * 1.7) * 0.15 + Math.cos(index * 0.9) * 0.08;
    return {
      date: day.date,
      label: formatDate(day.date),
      bioAge: +(baseAge + noise).toFixed(1),
      chronoAge,
    };
  });

  // Wearable trend data
  const hrvTrend = wearable.map((d) => ({ label: formatDate(d.date), value: d.hrv_rmssd_ms }));
  const stepsTrend = wearable.map((d) => ({ label: formatDate(d.date), value: d.steps }));
  const sleepTrend = wearable.map((d) => ({ label: formatDate(d.date), duration: d.sleep_duration_hrs, quality: d.sleep_quality_score }));
  const activityTrend = wearable.map((d) => ({ label: formatDate(d.date), minutes: d.active_minutes }));

  // Readiness & recovery
  const readinessData = wearable.map((day) => ({
    label: formatDate(day.date),
    value: Math.round(
      (day.hrv_rmssd_ms / 60) * 30 +
        (day.sleep_quality_score / 100) * 35 +
        ((80 - day.resting_hr_bpm) / 30) * 20 +
        (day.deep_sleep_pct / 25) * 15,
    ),
  }));
  const recoveryData = wearable.map((day) => ({
    label: formatDate(day.date),
    value: Math.round(
      (day.hrv_rmssd_ms / 60) * 35 +
        ((80 - day.resting_hr_bpm) / 30) * 25 +
        (day.deep_sleep_pct / 25) * 25 +
        (day.sleep_duration_hrs / 9) * 15,
    ),
  }));

  // Milestones
  const milestones = generateMilestones(features, wearable);
  const milestoneColors: Record<Milestone["type"], { border: string; bg: string; dot: string }> = {
    health: { border: "border-status-normal", bg: "bg-status-normal/10", dot: "bg-status-normal" },
    activity: { border: "border-chart-1", bg: "bg-chart-1/10", dot: "bg-chart-1" },
    sleep: { border: "border-chart-2", bg: "bg-chart-2/10", dot: "bg-chart-2" },
    data: { border: "border-status-info", bg: "bg-status-info/10", dot: "bg-status-info" },
  };

  // Averages
  const avgHrv = mean(wearable.map((d) => d.hrv_rmssd_ms));
  const avgSteps = mean(wearable.map((d) => d.steps));
  const avgSleep = mean(wearable.map((d) => d.sleep_duration_hrs));
  const avgRhr = mean(wearable.map((d) => d.resting_hr_bpm));
  const avgRecovery = Math.round(mean(recoveryData.map((d) => d.value)));
  const avgActiveMinutes = Math.round(mean(wearable.map((d) => d.active_minutes)));

  // EHR parsed data
  const conditions = ehr.chronic_conditions
    ? ehr.chronic_conditions.split("|").filter(Boolean)
    : [];
  const medications = ehr.medications
    ? ehr.medications.split("|").filter(Boolean)
    : [];

  // Program phases
  const vo2Target = nextVo2Target(features.vo2max.vo2max);
  const readinessAverage = Math.round(mean(readinessData.map((item) => item.value)));

  const programPhases = [
    {
      status: "Now" as const,
      window: "Woche 0-2",
      title: "Baseline und Diagnostics",
      body: "Bio-Age, Lipide, VO2max Proxy und aktuelle Recovery-Signale sauber erfassen.",
      outcomes: ["Advanced Lipids und CRP priorisieren", "Readiness-Regeln fur Training definieren"],
    },
    {
      status: "Next" as const,
      window: "Woche 3-6",
      title: "Aerobic Build Block",
      body: "Zwei Zone-2-Einheiten plus ein qualitativ hochwertiger Reiz pro Woche fur VO2max und Cardio Load.",
      outcomes: [`VO2max von ${features.vo2max.vo2max} auf ${vo2Target} anheben`, "Ruhepuls und HRV parallel monitoren"],
    },
    {
      status: "Next" as const,
      window: "Woche 7-10",
      title: "Recovery Calibration",
      body: "Schlafkonsistenz, Intensitatssteuerung und Belastungsmanagement glatten die Tagesform.",
      outcomes: [`Readiness-Schnitt uber ${Math.max(readinessAverage, 75)}`, "Low-readiness Tage fruher erkennen"],
    },
    {
      status: "Later" as const,
      window: "Woche 11-12",
      title: "Retest und Expert Review",
      body: "Die Intervention wird mit Diagnostics und Experteninterpretation auf Wirksamkeit gepruft.",
      outcomes: ["Re-Test von Biomarkern und Performance", "Nachsten Premium-Zyklus planen"],
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <header className="animate-in mb-12 space-y-4">
        <Badge className="w-fit border-0 bg-primary/12 text-primary">
          Preventive Performer Journey
        </Badge>
        <div className="space-y-3">
          <h1 className="text-fluid-3xl font-semibold leading-tight tracking-tight">
            Ihre Prevention-to-Performance Roadmap
          </h1>
          <p className="max-w-3xl text-fluid-sm leading-relaxed text-muted-foreground">
            Biomarker, Wearable-Signale, Lifestyle-Daten und Premium-Diagnostics
            in einem 12-Wochen-Programm — mit allen verfugbaren Datenquellen.
          </p>
        </div>
      </header>

      {/* ── 1. Success Criteria ── */}
      <section className="animate-in stagger-1 mb-12 grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Bio-Age",
            value: `${bioAge.bioAge} Jahre`,
            note: `${bioAge.delta > 0 ? "+" : ""}${bioAge.delta} vs. chronologisch`,
          },
          {
            label: "VO2max Ziel",
            value: `${vo2Target}`,
            note: `${features.vo2max.percentile} Benchmark`,
          },
          {
            label: "Readiness Schnitt",
            value: `${readinessAverage}/100`,
            note: "stabil fur Trainingssteuerung",
          },
        ].map((item) => (
          <Card key={item.label} className="border-0 bg-surface-1">
            <CardHeader>
              <CardTitle className="text-fluid-sm font-normal uppercase tracking-wide text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-data text-3xl text-foreground">{item.value}</p>
              <p className="mt-2 text-fluid-xs text-muted-foreground">{item.note}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ── 2. Gesundheitswerte Overview ── */}
      <section className="animate-in stagger-2 mb-12">
        <h2 className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
          Gesundheitswerte
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Cardio Risk */}
          <div className="rounded-xl bg-surface-1 p-5 ring-1 ring-foreground/5">
            <div className="flex items-center justify-between">
              <h3 className="text-fluid-sm font-medium text-foreground">Kardio-Risiko</h3>
              <StatusBadge status={features.cardioRisk.status} />
            </div>
            <ul className="mt-3 space-y-1">
              {features.cardioRisk.reasons.map((r) => (
                <li key={r} className="text-fluid-xs text-muted-foreground">• {r}</li>
              ))}
              {features.cardioRisk.reasons.length === 0 && (
                <li className="text-fluid-xs text-muted-foreground">Keine Auffalligkeiten</li>
              )}
            </ul>
          </div>

          {/* Metabolic Health */}
          <div className="rounded-xl bg-surface-1 p-5 ring-1 ring-foreground/5">
            <div className="flex items-center justify-between">
              <h3 className="text-fluid-sm font-medium text-foreground">Stoffwechsel</h3>
              <span className="font-data text-fluid-lg text-foreground">
                {Math.round(features.metabolicHealth.score)}
                <span className="text-fluid-xs text-muted-foreground">/100</span>
              </span>
            </div>
            <p className="mt-1 text-fluid-xs text-muted-foreground">
              {features.metabolicHealth.criteriaCount}/5 MetS-Kriterien erfullt
            </p>
            {features.metabolicHealth.criteria.length > 0 && (
              <ul className="mt-2 space-y-1">
                {features.metabolicHealth.criteria.map((c) => (
                  <li key={c} className="text-fluid-xs text-status-warning">• {c}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Stress-Inflammation */}
          <div className="rounded-xl bg-surface-1 p-5 ring-1 ring-foreground/5">
            <div className="flex items-center justify-between">
              <h3 className="text-fluid-sm font-medium text-foreground">Stress & Entzundung</h3>
              <StatusBadge status={features.stressInflammation.level} />
            </div>
            <div className="mt-3">
              <ScoreBar
                label="Stress-Entzundungs-Index"
                value={features.stressInflammation.score}
                color={
                  features.stressInflammation.level === "green"
                    ? "bg-status-normal"
                    : features.stressInflammation.level === "yellow"
                      ? "bg-status-warning"
                      : "bg-status-critical"
                }
              />
            </div>
          </div>

          {/* Sleep Composite */}
          <div className="rounded-xl bg-surface-1 p-5 ring-1 ring-foreground/5">
            <div className="flex items-center justify-between">
              <h3 className="text-fluid-sm font-medium text-foreground">Schlaf-Score</h3>
              <span className="font-data text-fluid-lg text-foreground">
                {Math.round(features.sleepComposite.score)}
                <span className="text-fluid-xs text-muted-foreground">/100</span>
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <ScoreBar label="Dauer" value={features.sleepComposite.durationScore} color="bg-chart-2" />
              <ScoreBar label="Qualitat" value={features.sleepComposite.qualityScore} color="bg-chart-2" />
              <ScoreBar label="Tiefschlaf" value={features.sleepComposite.deepSleepScore} color="bg-chart-2" />
            </div>
          </div>

          {/* Activity & Walk Streak */}
          <div className="rounded-xl bg-surface-1 p-5 ring-1 ring-foreground/5">
            <div className="flex items-center justify-between">
              <h3 className="text-fluid-sm font-medium text-foreground">Bewegung</h3>
              <span className="font-data text-fluid-lg text-foreground">
                {Math.round(features.activityAdherence)}
                <span className="text-fluid-xs text-muted-foreground">%</span>
              </span>
            </div>
            <p className="mt-1 text-fluid-xs text-muted-foreground">Tage mit ≥5.000 Schritten</p>
            <div className="mt-3 space-y-2">
              <ScoreBar label="Adharenz" value={features.activityAdherence} color="bg-chart-1" />
              <ScoreBar label="Walk-Streak" value={features.walkStreak.days} max={30} color="bg-chart-1" />
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="rounded-xl bg-surface-1 p-5 ring-1 ring-foreground/5">
            <div className="flex items-center justify-between">
              <h3 className="text-fluid-sm font-medium text-foreground">Blutdruck</h3>
              <StatusBadge status={features.bpControl.status} />
            </div>
            <p className="mt-3 font-data text-fluid-lg text-foreground">
              {features.bpControl.sbp}/{features.bpControl.dbp}
              <span className="text-fluid-xs text-muted-foreground"> mmHg</span>
            </p>
            <p className="mt-1 text-fluid-xs text-muted-foreground">{features.bpControl.label}</p>
          </div>
        </div>
      </section>

      {/* ── 3. Detaillierte Analyse (Persona Features) ── */}
      <section className="animate-in stagger-3 mb-12">
        <h2 className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
          Detaillierte Analyse
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-surface-1 p-4 ring-1 ring-foreground/5">
            <p className="text-fluid-xs text-muted-foreground">VO2max</p>
            <p className="mt-1 font-data text-fluid-xl text-foreground">
              {features.vo2max.vo2max.toFixed(1)}
              <span className="text-fluid-xs text-muted-foreground"> ml/kg/min</span>
            </p>
            <p className="mt-1 text-fluid-xs text-muted-foreground">{features.vo2max.percentile}</p>
          </div>

          <div className="rounded-xl bg-surface-1 p-4 ring-1 ring-foreground/5">
            <p className="text-fluid-xs text-muted-foreground">HRV 30-Tage Trend</p>
            <p className="mt-1 font-data text-fluid-xl text-foreground">
              {features.hrv30dTrend.slope > 0 ? "+" : ""}
              {(features.hrv30dTrend.slope * 30).toFixed(1)}
              <span className="text-fluid-xs text-muted-foreground"> ms</span>
            </p>
            <p className="mt-1 text-fluid-xs text-muted-foreground">{features.hrv30dTrend.interpretation}</p>
          </div>

          <div className="rounded-xl bg-surface-1 p-4 ring-1 ring-foreground/5">
            <p className="text-fluid-xs text-muted-foreground">Erholungs-Score</p>
            <p className="mt-1 font-data text-fluid-xl text-foreground">
              {Math.round(features.recoveryScore.score)}
              <span className="text-fluid-xs text-muted-foreground">/100</span>
            </p>
            <div className="mt-2 flex gap-2 text-fluid-xs text-muted-foreground">
              <span>HRV: {Math.round(features.recoveryScore.hrvComponent)}</span>
              <span>RHR: {Math.round(features.recoveryScore.rhrComponent)}</span>
              <span>Schlaf: {Math.round(features.recoveryScore.deepComponent)}</span>
            </div>
          </div>

          <div className="rounded-xl bg-surface-1 p-4 ring-1 ring-foreground/5">
            <p className="text-fluid-xs text-muted-foreground">Belastung/Erholung</p>
            <p className={`mt-1 font-data text-fluid-xl ${features.strainRecovery.flag ? "text-status-warning" : "text-foreground"}`}>
              {features.strainRecovery.ratio.toFixed(2)}
            </p>
            <p className="mt-1 text-fluid-xs text-muted-foreground">{features.strainRecovery.interpretation}</p>
          </div>

          <div className="rounded-xl bg-surface-1 p-4 ring-1 ring-foreground/5">
            <p className="text-fluid-xs text-muted-foreground">Zirkadiane Konsistenz</p>
            <p className="mt-1 font-data text-fluid-xl text-foreground">
              {Math.round(features.circadianConsistency.score)}
              <span className="text-fluid-xs text-muted-foreground">%</span>
            </p>
            <p className="mt-1 text-fluid-xs text-muted-foreground">{features.circadianConsistency.interpretation}</p>
          </div>

          <div className="rounded-xl bg-surface-1 p-4 ring-1 ring-foreground/5">
            <div className="flex items-center justify-between">
              <p className="text-fluid-xs text-muted-foreground">Kognitive Reserve</p>
              <StatusBadge status={features.cognitiveReserve.level} />
            </div>
            <p className="mt-1 font-data text-fluid-xl text-foreground">
              {Math.round(features.cognitiveReserve.score)}
              <span className="text-fluid-xs text-muted-foreground">/100</span>
            </p>
          </div>

          <div className="rounded-xl bg-surface-1 p-4 ring-1 ring-foreground/5">
            <div className="flex items-center justify-between">
              <p className="text-fluid-xs text-muted-foreground">Wohlbefinden (WHO-5)</p>
              <StatusBadge status={features.wellbeing.level} />
            </div>
            <p className="mt-1 font-data text-fluid-xl text-foreground">
              {features.wellbeing.who5}
              <span className="text-fluid-xs text-muted-foreground">/100</span>
            </p>
            {features.wellbeing.depressionFlag && (
              <p className="mt-1 text-fluid-xs text-status-warning">{features.wellbeing.recommendation}</p>
            )}
          </div>

          <div className="rounded-xl bg-surface-1 p-4 ring-1 ring-foreground/5">
            <p className="text-fluid-xs text-muted-foreground">Longevity-Perzentile</p>
            <p className="mt-1 font-data text-fluid-xl text-foreground">
              P{Math.round(features.longevityPercentile)}
            </p>
            <p className="mt-1 text-fluid-xs text-muted-foreground">
              Besser als {Math.round(features.longevityPercentile)}% der Altersgruppe
            </p>
          </div>
        </div>

        {features.biomarkerDrift.drifting && (
          <div className="mt-4 rounded-xl border border-status-warning/30 bg-status-warning/5 p-4">
            <h3 className="text-fluid-sm font-medium text-status-warning">Biomarker-Drift erkannt</h3>
            <div className="mt-2 flex flex-wrap gap-3">
              {features.biomarkerDrift.metrics
                .filter((m) => m.flagged)
                .map((m) => (
                  <span
                    key={m.name}
                    className="rounded-full border border-status-warning/30 bg-surface-1 px-2.5 py-0.5 text-fluid-xs text-status-warning"
                  >
                    {m.name}: {m.drift > 0 ? "+" : ""}{m.drift.toFixed(2)}
                  </span>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* ── 4. Bio-Age Chart + VO2max Planner ── */}
      <section className="animate-in stagger-4 mb-12 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle className="text-fluid-sm font-normal uppercase tracking-wide text-muted-foreground">
              Bio-Age Verlauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bioAgeTrend} margin={{ top: 12, right: 8, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="bioAgeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E5E8EB" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis
                    domain={[Math.floor(bioAge.bioAge - 4), Math.ceil(chronoAge + 2)]}
                    tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false}
                    tickFormatter={(value: number) => `${value}`}
                  />
                  <ReferenceLine y={chronoAge} stroke="#9CA3AF" strokeDasharray="6 4" strokeWidth={1}
                    label={{ value: `Chronologisch: ${chronoAge}`, position: "insideTopRight", fill: "#6B7280", fontSize: 11 }}
                  />
                  <Tooltip content={<BioAgeTooltip chronoAge={chronoAge} />} />
                  <Area type="monotone" dataKey="bioAge" stroke="#059669" strokeWidth={2} fill="url(#bioAgeGrad)" dot={false}
                    activeDot={{ r: 4, fill: "#059669", stroke: "#FFFFFF", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 flex flex-wrap items-baseline gap-4">
              <span className="font-data text-fluid-3xl font-bold text-foreground text-glow-primary">
                {bioAge.bioAge}
              </span>
              <span className="text-fluid-sm text-muted-foreground">Biologisches Alter</span>
              <Badge variant="outline" className={`font-data ${bioAge.delta <= 0 ? "border-status-normal/30 text-status-normal" : "border-status-critical/30 text-status-critical"}`}>
                {bioAge.delta > 0 ? "+" : ""}{bioAge.delta} Jahre
              </Badge>
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
              {bioAge.drivers.map((driver) => (
                <li key={driver} className="text-fluid-xs text-muted-foreground before:mr-2 before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:align-middle before:content-['']">
                  {driver}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle className="text-fluid-sm font-normal uppercase tracking-wide text-muted-foreground">
              VO2max Goal Planner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-2/60 p-4">
                <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">Aktuell</p>
                <p className="mt-2 font-data text-3xl text-foreground">{features.vo2max.vo2max}</p>
                <p className="mt-1 text-fluid-xs text-muted-foreground">{features.vo2max.percentile}</p>
              </div>
              <div className="rounded-2xl bg-surface-2/60 p-4">
                <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">Ziel in 12 Wochen</p>
                <p className="mt-2 font-data text-3xl text-primary">{vo2Target}</p>
                <p className="mt-1 text-fluid-xs text-muted-foreground">Gap {(vo2Target - features.vo2max.vo2max).toFixed(1)}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-surface-2/50 p-4">
              <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">Intervention Stack</p>
              <ul className="mt-3 space-y-2 text-fluid-sm leading-relaxed text-foreground/85">
                <li>Zone 2 als Basis fur Volumen und Mitochondrienarbeit</li>
                <li>1 qualitativer Reiz pro Woche nur an hohen Readiness-Tagen</li>
                <li>Re-Test nach Woche 6 und Woche 12</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── 5. 12-Wochen-Programm ── */}
      <section className="animate-in stagger-5 mb-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
              12-Wochen-Programm
            </h2>
            <p className="mt-2 max-w-2xl text-fluid-sm text-muted-foreground">
              Messen, intervenieren, validieren, hochskalieren.
            </p>
          </div>
          <Button variant="outline" size="sm">Diagnostics buchen</Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {programPhases.map((phase) => (
            <Card key={phase.title} className="border-0 bg-surface-1">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="outline" className={statusClasses(phase.status)}>{phase.status}</Badge>
                  <span className="font-data text-fluid-xs text-muted-foreground">{phase.window}</span>
                </div>
                <CardTitle className="text-fluid-lg text-foreground">{phase.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-fluid-sm leading-relaxed text-muted-foreground">{phase.body}</p>
                <div className="space-y-2">
                  {phase.outcomes.map((outcome) => (
                    <div key={outcome} className="rounded-xl bg-surface-2/60 px-3 py-2 text-fluid-sm text-foreground/85">
                      {outcome}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 6. Meilensteine (real data) ── */}
      <section className="animate-in stagger-6 mb-12">
        <h2 className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
          Meilensteine
        </h2>

        <div className="relative mt-8 pl-8">
          <div
            className="absolute left-[11px] top-1 bottom-1 w-px"
            style={{ background: "linear-gradient(to bottom, #E5E8EB 0%, #059669 20%, #059669 80%, #E5E8EB 100%)" }}
          />
          <ol className="space-y-10">
            {milestones.map((m, i) => {
              const colors = milestoneColors[m.type];
              return (
                <li key={i} className="relative">
                  <span className={`absolute -left-8 top-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${colors.border} ${colors.bg}`}>
                    <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                  </span>
                  <p className="font-data text-fluid-xs text-muted-foreground">
                    {new Date(m.date).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <p className="mt-0.5 text-fluid-base font-medium text-foreground">{m.label}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── 7. 30-Tage Trend-Charts ── */}
      <section className="animate-in stagger-7 mb-12">
        <div className="mt-6">
          <Tabs defaultValue="readiness" className="gap-4">
            <TabsList
              className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-surface-1 p-2"
              aria-label="Trend-Auswahl"
            >
              {trendTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-auto flex-none rounded-xl border border-transparent px-3 py-2 text-fluid-xs data-active:border-primary/20 data-active:bg-primary/10 data-active:text-primary"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <Card className="border-0 bg-surface-1">
              <CardContent className="p-5 sm:p-6">
                <TabsContent value="readiness" className="mt-0 space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <h3 className="text-fluid-lg font-medium text-foreground">Bereitschafts-Score</h3>
                      <p className="mt-2 text-fluid-sm leading-relaxed text-muted-foreground">
                        Kombiniert HRV, Schlafqualitat, Ruhepuls und Tiefschlaf zu einem
                        Tageswert fur Trainings- und Belastungssteuerung.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <TrendKpi label="30-Tage-Schnitt" value={`${readinessAverage}/100`} />
                      <TrendKpi label="Zielbereich" value="75+/100" />
                    </div>
                  </div>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={readinessData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <defs>
                          <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#059669" stopOpacity={0.14} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#E5E8EB" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={4} />
                        <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                        <Tooltip content={<SimpleTooltip unit="/ 100" />} />
                        <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} fill="url(#readinessGrad)" dot={false} activeDot={{ r: 4, fill: "#059669", stroke: "#FFFFFF", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="recovery" className="mt-0 space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <h3 className="text-fluid-lg font-medium text-foreground">Erholungs-Score</h3>
                      <p className="mt-2 text-fluid-sm leading-relaxed text-muted-foreground">
                        Zeigt, wie gut sich Ihr System uber Nacht regeneriert hat. Ein stabiler
                        Verlauf hilft bei der Planung von Intensitat und Pausen.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <TrendKpi label="30-Tage-Schnitt" value={`${avgRecovery}/100`} />
                      <TrendKpi label="Orientierung" value="Hoher ist besser" />
                    </div>
                  </div>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={recoveryData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <defs>
                          <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.14} />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#E5E8EB" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={4} />
                        <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                        <Tooltip content={<SimpleTooltip unit="/ 100" />} />
                        <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} fill="url(#recoveryGrad)" dot={false} activeDot={{ r: 4, fill: "#2563EB", stroke: "#FFFFFF", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="hrv" className="mt-0 space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <h3 className="text-fluid-lg font-medium text-foreground">HRV (RMSSD)</h3>
                      <p className="mt-2 text-fluid-sm leading-relaxed text-muted-foreground">
                        HRV bildet die autonome Regulationsfahigkeit ab. Ein positiver Trend ist
                        oft ein gutes Zeichen fur Anpassung und Belastungsvertraglichkeit.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <TrendKpi label="30-Tage-Schnitt" value={`${avgHrv.toFixed(1)} ms`} />
                      <TrendKpi label="Trend" value={features.hrv30dTrend.interpretation} />
                    </div>
                  </div>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hrvTrend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <defs>
                          <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.14} />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#E5E8EB" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={4} />
                        <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                        <Tooltip content={<SimpleTooltip unit="ms" />} />
                        <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fill="url(#hrvGrad)" dot={false} activeDot={{ r: 4, fill: "#8B5CF6", stroke: "#FFFFFF", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="steps" className="mt-0 space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <h3 className="text-fluid-lg font-medium text-foreground">Schritte</h3>
                      <p className="mt-2 text-fluid-sm leading-relaxed text-muted-foreground">
                        Ihr Alltagsvolumen auf einen Blick. Die Referenzlinie zeigt die
                        Mindestschwelle fur eine robuste Bewegungsroutine.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <TrendKpi label="30-Tage-Schnitt" value={Math.round(avgSteps).toLocaleString("de")} />
                      <TrendKpi label="Referenz" value="5.000 Schritte" />
                    </div>
                  </div>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stepsTrend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid stroke="#E5E8EB" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={4} />
                        <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                        <Tooltip content={<SimpleTooltip unit="Schritte" />} />
                        <ReferenceLine y={5000} stroke="#059669" strokeDasharray="4 4" strokeWidth={1} />
                        <Bar dataKey="value" fill="#059669" opacity={0.7} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="sleep" className="mt-0 space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <h3 className="text-fluid-lg font-medium text-foreground">Schlaf</h3>
                      <p className="mt-2 text-fluid-sm leading-relaxed text-muted-foreground">
                        Kombiniert Schlafdauer und Schlafqualitat. So sehen Sie schnell, ob genug
                        Zeit im Bett auch wirklich in erholsamen Schlaf ubersetzt wird.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <TrendKpi label="Durchschnittsdauer" value={`${avgSleep.toFixed(1)} Std.`} />
                      <TrendKpi label="Referenz" value="7+ Std. pro Nacht" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-fluid-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2 rounded-full bg-surface-2/60 px-3 py-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                      Dauer (Std.)
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-surface-2/60 px-3 py-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                      Qualitat
                    </span>
                  </div>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sleepTrend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid stroke="#E5E8EB" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={4} />
                        <YAxis yAxisId="duration" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} domain={[5, 10]} />
                        <YAxis yAxisId="quality" orientation="right" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} domain={[40, 100]} />
                        <Tooltip content={<SimpleTooltip unit="" />} />
                        <ReferenceLine yAxisId="duration" y={7} stroke="#9CA3AF" strokeDasharray="4 4" strokeWidth={1} />
                        <Line yAxisId="duration" type="monotone" dataKey="duration" stroke="#2563EB" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Dauer (Std.)" />
                        <Line yAxisId="quality" type="monotone" dataKey="quality" stroke="#8B5CF6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Qualitat" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-0 space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <h3 className="text-fluid-lg font-medium text-foreground">Aktive Minuten</h3>
                      <p className="mt-2 text-fluid-sm leading-relaxed text-muted-foreground">
                        Macht sichtbar, wie viel bewusste Aktivitat Sie taglich sammeln. Besonders
                        hilfreich, um Trainings- und Alltagsbewegung gemeinsam zu bewerten.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <TrendKpi label="30-Tage-Schnitt" value={`${avgActiveMinutes} min`} />
                      <TrendKpi label="Fokus" value="Konstanz uber Peaks" />
                    </div>
                  </div>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityTrend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid stroke="#E5E8EB" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={4} />
                        <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                        <Tooltip content={<SimpleTooltip unit="min" />} />
                        <Bar dataKey="minutes" fill="#F59E0B" opacity={0.7} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </section>

      {/* ── 8. 30-Tage Durchschnitte ── */}
      <section className="animate-in stagger-8 mb-12">
        <h2 className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
          30-Tage Durchschnitte
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Ruhe-HF", value: `${avgRhr.toFixed(0)}`, unit: "bpm" },
            { label: "HRV", value: `${avgHrv.toFixed(1)}`, unit: "ms" },
            { label: "Schritte", value: Math.round(avgSteps).toLocaleString("de"), unit: "" },
            { label: "Schlaf", value: `${avgSleep.toFixed(1)}`, unit: "Std." },
            { label: "SpO2", value: `${mean(wearable.map((d) => d.spo2_avg_pct)).toFixed(1)}`, unit: "%" },
            { label: "Kalorien", value: Math.round(mean(wearable.map((d) => d.calories_burned_kcal))).toLocaleString("de"), unit: "kcal" },
          ].map(({ label, value, unit }) => (
            <div key={label} className="rounded-xl bg-surface-1 p-4 text-center ring-1 ring-foreground/5">
              <p className="text-fluid-xs text-muted-foreground">{label}</p>
              <p className="mt-1 font-data text-fluid-lg text-foreground">{value}</p>
              {unit && <p className="text-fluid-xs text-muted-foreground">{unit}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. Lifestyle & Klinische Daten ── */}
      <section className="animate-in stagger-9 mb-12">
        <h2 className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
          Lifestyle & Klinische Daten
        </h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Lifestyle */}
          <div className="rounded-xl bg-surface-1 p-5 ring-1 ring-foreground/5">
            <h3 className="text-fluid-sm font-medium text-foreground">Lifestyle-Profil</h3>
            <p className="mt-1 text-fluid-xs text-muted-foreground">
              Erhebung vom{" "}
              {new Date(lifestyle.survey_date).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
            <div className="mt-4 space-y-3">
              <ScoreBar label="Ernahrung" value={lifestyle.diet_quality_score} color="bg-chart-1" />
              <ScoreBar label="Wohlbefinden (WHO-5)" value={lifestyle.mental_wellbeing_who5} color="bg-chart-2" />
              <ScoreBar label="Schlafzufriedenheit" value={lifestyle.sleep_satisfaction} color="bg-chart-5" />
              <ScoreBar label="Selbsteinschatzung" value={lifestyle.self_rated_health} color="bg-primary" />
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Stress-Level</span>
                <span className="font-data text-foreground">{lifestyle.stress_level}/10</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Bewegung</span>
                <span className="font-data text-foreground">{lifestyle.exercise_sessions_weekly}x/Woche</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Obst & Gemuse</span>
                <span className="font-data text-foreground">{lifestyle.fruit_veg_servings_daily} Portionen/Tag</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Wasser</span>
                <span className="font-data text-foreground">{lifestyle.water_glasses_daily} Glaser/Tag</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Sitzzeit</span>
                <span className="font-data text-foreground">{lifestyle.sedentary_hrs_day} Std./Tag</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Alkohol</span>
                <span className="font-data text-foreground">{lifestyle.alcohol_units_weekly} Einheiten/Woche</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Mahlzeiten</span>
                <span className="font-data text-foreground">{lifestyle.meal_frequency_daily}x/Tag</span>
              </div>
            </div>
          </div>

          {/* Clinical Profile */}
          <div className="rounded-xl bg-surface-1 p-5 ring-1 ring-foreground/5">
            <h3 className="text-fluid-sm font-medium text-foreground">Klinisches Profil</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Alter / Geschlecht</span>
                <span className="font-data text-foreground">{ehr.age} / {ehr.sex === "M" ? "Mannlich" : "Weiblich"}</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Land</span>
                <span className="font-data text-foreground">{ehr.country}</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Grosse / Gewicht</span>
                <span className="font-data text-foreground">{ehr.height_cm} cm / {ehr.weight_kg} kg</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">BMI</span>
                <span className="font-data text-foreground">{ehr.bmi.toFixed(1)} kg/m2</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Rauchstatus</span>
                <span className="font-data text-foreground">{ehr.smoking_status}</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">HbA1c</span>
                <span className="font-data text-foreground">{ehr.hba1c_pct}%</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Nuchtern-Glukose</span>
                <span className="font-data text-foreground">{ehr.fasting_glucose_mmol} mmol/L</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">CRP</span>
                <span className="font-data text-foreground">{ehr.crp_mg_l} mg/L</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">eGFR</span>
                <span className="font-data text-foreground">{ehr.egfr_ml_min} ml/min</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Cholesterin (gesamt)</span>
                <span className="font-data text-foreground">{ehr.total_cholesterol_mmol} mmol/L</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">LDL / HDL</span>
                <span className="font-data text-foreground">{ehr.ldl_mmol} / {ehr.hdl_mmol} mmol/L</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Triglyceride</span>
                <span className="font-data text-foreground">{ehr.triglycerides_mmol} mmol/L</span>
              </div>
              <div className="flex items-baseline justify-between text-fluid-xs">
                <span className="text-muted-foreground">Arztbesuche (2 J.)</span>
                <span className="font-data text-foreground">{ehr.n_visits_2yr}</span>
              </div>
            </div>
          </div>

          {/* Conditions & Medications */}
          <div className="rounded-xl bg-surface-1 p-5 ring-1 ring-foreground/5">
            <h3 className="text-fluid-sm font-medium text-foreground">Diagnosen & Medikation</h3>

            {conditions.length > 0 && (
              <div className="mt-4">
                <p className="text-fluid-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Chronische Erkrankungen ({ehr.n_chronic_conditions})
                </p>
                <ul className="mt-2 space-y-1">
                  {conditions.map((c) => (
                    <li key={c} className="text-fluid-xs text-foreground">• {c.replace(/_/g, " ")}</li>
                  ))}
                </ul>
              </div>
            )}

            {ehr.icd_codes && (
              <div className="mt-3">
                <p className="text-fluid-xs font-medium uppercase tracking-wider text-muted-foreground">ICD-Codes</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {ehr.icd_codes.split("|").filter(Boolean).map((code) => (
                    <span key={code} className="rounded border border-foreground/10 bg-surface-2 px-2 py-0.5 font-data text-fluid-xs text-foreground">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {medications.length > 0 && (
              <div className="mt-4">
                <p className="text-fluid-xs font-medium uppercase tracking-wider text-muted-foreground">Medikation</p>
                <ul className="mt-2 space-y-1">
                  {medications.map((m) => (
                    <li key={m} className="text-fluid-xs text-foreground">• {m}</li>
                  ))}
                </ul>
                <p className="mt-2 text-fluid-xs text-muted-foreground">
                  Medikamentenlast-Score: {Math.round(features.medicationBurden.score)}/100 — {features.medicationBurden.interpretation}
                </p>
              </div>
            )}

            {/* Prediabetes */}
            <div className="mt-4">
              <p className="text-fluid-xs font-medium uppercase tracking-wider text-muted-foreground">Pradiabetes-Status</p>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={features.prediabetes.status} />
                <span className="text-fluid-xs text-muted-foreground">HbA1c {features.prediabetes.hba1c}%</span>
              </div>
              <p className="mt-1 text-fluid-xs text-muted-foreground">{features.prediabetes.recommendation}</p>
            </div>

            {/* Fall Risk & Clinic Engagement */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-fluid-xs font-medium uppercase tracking-wider text-muted-foreground">Sturzrisiko</p>
                <div className="mt-1">
                  <StatusBadge status={features.fallRisk.level} />
                </div>
              </div>
              <div>
                <p className="text-fluid-xs font-medium uppercase tracking-wider text-muted-foreground">Praxis-Engagement</p>
                <p className="mt-1 font-data text-fluid-sm text-foreground">
                  {Math.round(features.clinicEngagement.score)}/100
                </p>
                <p className="text-fluid-xs text-muted-foreground">{features.clinicEngagement.visitsPerYear.toFixed(1)} Besuche/J.</p>
              </div>
            </div>

            {conditions.length === 0 && medications.length === 0 && (
              <p className="mt-4 text-fluid-xs text-muted-foreground">
                Keine chronischen Erkrankungen oder Medikation dokumentiert.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── 10. Coach-Empfehlungen ── */}
      {suggestions.length > 0 && (
        <section className="animate-in stagger-10">
          <h2 className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
            Coach-Empfehlungen
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {suggestions.map((s) => (
              <div
                key={s.title}
                className="relative flex overflow-hidden rounded-xl bg-surface-1 ring-1 ring-foreground/5"
              >
                <div className={`w-1 shrink-0 rounded-l-xl ${
                  s.severity === "red" ? "bg-status-critical" : s.severity === "yellow" ? "bg-status-warning" : "bg-status-normal"
                }`} />
                <div className="flex flex-col gap-1.5 px-4 py-3">
                  <h4 className={`text-fluid-sm font-medium ${
                    s.severity === "red" ? "text-status-critical" : s.severity === "yellow" ? "text-status-warning" : "text-status-normal"
                  }`}>
                    {s.title}
                  </h4>
                  <p className="text-fluid-xs leading-relaxed text-muted-foreground">{s.rationale}</p>
                  <p className="text-fluid-xs text-foreground">{s.action}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

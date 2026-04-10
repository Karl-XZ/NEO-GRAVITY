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
  return new Date(date).toLocaleDateString("en-US", {
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
  yellow: "Monitor",
  red: "Critical",
};

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
  { value: "readiness", label: "Readiness" },
  { value: "recovery", label: "Recovery" },
  { value: "hrv", label: "HRV" },
  { value: "steps", label: "Steps" },
  { value: "sleep", label: "Sleep" },
  { value: "activity", label: "Active Minutes" },
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

  if (features.walkStreak.days >= 3) {
    milestones.push({
      date: wearable[wearable.length - 1]?.date ?? "",
      label: `${features.walkStreak.days}-day step streak (≥5,000/day)`,
      type: "activity",
    });
  }

  if (features.hrv30dTrend.slope > 0.1) {
    milestones.push({
      date: wearable[Math.floor(wearable.length * 0.6)]?.date ?? "",
      label: `HRV trend positive: +${(features.hrv30dTrend.slope * 30).toFixed(1)} ms over 30 days`,
      type: "health",
    });
  }

  if (features.circadianConsistency.score >= 70) {
    milestones.push({
      date: wearable[Math.floor(wearable.length * 0.5)]?.date ?? "",
      label: `Sleep consistency ${Math.round(features.circadianConsistency.score)}% — stable rhythm`,
      type: "sleep",
    });
  }

  if (features.activityAdherence >= 70) {
    milestones.push({
      date: wearable[Math.floor(wearable.length * 0.4)]?.date ?? "",
      label: `Activity goal met on ${Math.round(features.activityAdherence)}% of days`,
      type: "activity",
    });
  }

  const bestHrvDay = wearable.reduce((best, d) =>
    d.hrv_rmssd_ms > best.hrv_rmssd_ms ? d : best
  );
  milestones.push({
    date: bestHrvDay.date,
    label: `Best HRV reading: ${bestHrvDay.hrv_rmssd_ms} ms`,
    type: "health",
  });

  const bestStepsDay = wearable.reduce((best, d) =>
    d.steps > best.steps ? d : best
  );
  milestones.push({
    date: bestStepsDay.date,
    label: `Step record: ${bestStepsDay.steps.toLocaleString("en")} steps`,
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
      label: "First data collection completed",
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
  const avgRecovery = Math.round(mean(recoveryData.map((d) => d.value)));
  const avgActiveMinutes = Math.round(mean(wearable.map((d) => d.active_minutes)));

  // Program phases
  const vo2Target = nextVo2Target(features.vo2max.vo2max);
  const readinessAverage = Math.round(mean(readinessData.map((item) => item.value)));

  const programPhases = [
    {
      status: "Now" as const,
      window: "Week 0-2",
      title: "Baseline and Diagnostics",
      body: "Accurately capture bio-age, lipids, VO2max proxy, and current recovery signals.",
      outcomes: ["Prioritize advanced lipids and CRP", "Define readiness rules for training"],
    },
    {
      status: "Next" as const,
      window: "Week 3-6",
      title: "Aerobic Build Block",
      body: "Two Zone 2 sessions plus one high-quality stimulus per week for VO2max and cardio load.",
      outcomes: [`Raise VO2max from ${features.vo2max.vo2max} to ${vo2Target}`, "Monitor resting heart rate and HRV in parallel"],
    },
    {
      status: "Next" as const,
      window: "Week 7-10",
      title: "Recovery Calibration",
      body: "Sleep consistency, intensity control, and load management smooth out daily form.",
      outcomes: [`Readiness average above ${Math.max(readinessAverage, 75)}`, "Detect low-readiness days earlier"],
    },
    {
      status: "Later" as const,
      window: "Week 11-12",
      title: "Retest and Expert Review",
      body: "The intervention is evaluated for effectiveness through diagnostics and expert interpretation.",
      outcomes: ["Re-test biomarkers and performance", "Plan next premium cycle"],
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
            Your Prevention-to-Performance Roadmap
          </h1>
          <p className="max-w-3xl text-fluid-sm leading-relaxed text-muted-foreground">
            Biomarkers, wearable signals, lifestyle data, and premium diagnostics
            in a 12-week program — leveraging all available data sources.
          </p>
        </div>
      </header>

      <section className="animate-in stagger-1 mb-12">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle className="text-fluid-sm font-normal uppercase tracking-wide text-muted-foreground">
              Current Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-2/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-fluid-sm font-medium text-foreground">Cardio Risk</p>
                <StatusBadge status={features.cardioRisk.status} />
              </div>
              <p className="mt-3 text-fluid-xs leading-relaxed text-muted-foreground">
                {features.cardioRisk.reasons[0] ?? "Currently no dominant abnormality."}
              </p>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-fluid-sm font-medium text-foreground">Sleep</p>
                <span className="font-data text-fluid-lg text-foreground">
                  {Math.round(features.sleepComposite.score)}/100
                </span>
              </div>
              <p className="mt-3 text-fluid-xs leading-relaxed text-muted-foreground">
                Consistency {Math.round(features.circadianConsistency.score)}% and average of {avgSleep.toFixed(1)} hrs.
              </p>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-fluid-sm font-medium text-foreground">Stress & Recovery</p>
                <StatusBadge status={features.stressInflammation.level} />
              </div>
              <p className="mt-3 text-fluid-xs leading-relaxed text-muted-foreground">
                Recovery {Math.round(features.recoveryScore.score)}/100 with strain ratio {features.strainRecovery.ratio.toFixed(2)}.
              </p>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-fluid-sm font-medium text-foreground">Well-being</p>
                <StatusBadge status={features.wellbeing.level} />
              </div>
              <p className="mt-3 text-fluid-xs leading-relaxed text-muted-foreground">
                WHO-5 {features.wellbeing.who5}/100, cognitive reserve {Math.round(features.cognitiveReserve.score)}/100.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── 4. VO2max Planner ── */}
      <section className="animate-in stagger-4 mb-12">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle className="text-fluid-sm font-normal uppercase tracking-wide text-muted-foreground">
              VO2max Goal Planner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-2/60 p-4">
                <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">Current</p>
                <p className="mt-2 font-data text-3xl text-foreground">{features.vo2max.vo2max}</p>
                <p className="mt-1 text-fluid-xs text-muted-foreground">{features.vo2max.percentile}</p>
              </div>
              <div className="rounded-2xl bg-surface-2/60 p-4">
                <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">Goal in 12 Weeks</p>
                <p className="mt-2 font-data text-3xl text-primary">{vo2Target}</p>
                <p className="mt-1 text-fluid-xs text-muted-foreground">Gap {(vo2Target - features.vo2max.vo2max).toFixed(1)}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-surface-2/50 p-4">
              <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">Intervention Stack</p>
              <ul className="mt-3 space-y-2 text-fluid-sm leading-relaxed text-foreground/85">
                <li>Zone 2 as the foundation for volume and mitochondrial work</li>
                <li>1 high-quality stimulus per week only on high-readiness days</li>
                <li>Re-test after week 6 and week 12</li>
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
              12-Week Program
            </h2>
            <p className="mt-2 max-w-2xl text-fluid-sm text-muted-foreground">
              Measure, intervene, validate, scale up.
            </p>
          </div>
          <Button variant="outline" size="sm">Book Diagnostics</Button>
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
          Milestones
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
                    {new Date(m.date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
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
              aria-label="Trend selection"
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
                      <h3 className="text-fluid-lg font-medium text-foreground">Readiness Score</h3>
                      <p className="mt-2 text-fluid-sm leading-relaxed text-muted-foreground">
                        Combines HRV, sleep quality, resting heart rate, and deep sleep into a
                        daily score for training and load management.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <TrendKpi label="30-day average" value={`${readinessAverage}/100`} />
                      <TrendKpi label="Target range" value="75+/100" />
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
                      <h3 className="text-fluid-lg font-medium text-foreground">Recovery Score</h3>
                      <p className="mt-2 text-fluid-sm leading-relaxed text-muted-foreground">
                        Shows how well your system recovered overnight. A stable trend
                        helps with planning intensity and rest periods.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <TrendKpi label="30-day average" value={`${avgRecovery}/100`} />
                      <TrendKpi label="Guidance" value="Higher is better" />
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
                        HRV reflects autonomic regulation capacity. A positive trend is
                        often a good sign of adaptation and load tolerance.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <TrendKpi label="30-day average" value={`${avgHrv.toFixed(1)} ms`} />
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
                      <h3 className="text-fluid-lg font-medium text-foreground">Steps</h3>
                      <p className="mt-2 text-fluid-sm leading-relaxed text-muted-foreground">
                        Your daily volume at a glance. The reference line shows the
                        minimum threshold for a robust movement routine.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <TrendKpi label="30-day average" value={Math.round(avgSteps).toLocaleString("en")} />
                      <TrendKpi label="Reference" value="5,000 steps" />
                    </div>
                  </div>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stepsTrend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid stroke="#E5E8EB" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={4} />
                        <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                        <Tooltip content={<SimpleTooltip unit="steps" />} />
                        <ReferenceLine y={5000} stroke="#059669" strokeDasharray="4 4" strokeWidth={1} />
                        <Bar dataKey="value" fill="#059669" opacity={0.7} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="sleep" className="mt-0 space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <h3 className="text-fluid-lg font-medium text-foreground">Sleep</h3>
                      <p className="mt-2 text-fluid-sm leading-relaxed text-muted-foreground">
                        Combines sleep duration and sleep quality. This lets you quickly see whether
                        enough time in bed actually translates into restorative sleep.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <TrendKpi label="Average duration" value={`${avgSleep.toFixed(1)} hrs`} />
                      <TrendKpi label="Reference" value="7+ hrs per night" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-fluid-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2 rounded-full bg-surface-2/60 px-3 py-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                      Duration (hrs)
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-surface-2/60 px-3 py-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                      Quality
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
                        <Line yAxisId="duration" type="monotone" dataKey="duration" stroke="#2563EB" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Duration (hrs)" />
                        <Line yAxisId="quality" type="monotone" dataKey="quality" stroke="#8B5CF6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Quality" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-0 space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <h3 className="text-fluid-lg font-medium text-foreground">Active Minutes</h3>
                      <p className="mt-2 text-fluid-sm leading-relaxed text-muted-foreground">
                        Shows how much intentional activity you accumulate daily. Especially
                        helpful for evaluating training and everyday movement together.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                      <TrendKpi label="30-day average" value={`${avgActiveMinutes} min`} />
                      <TrendKpi label="Focus" value="Consistency over peaks" />
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

    </div>
  );
}

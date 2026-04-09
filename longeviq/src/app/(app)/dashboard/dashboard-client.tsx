"use client";

import { generateCoachSuggestions } from "@/lib/coach/generate-suggestions";
import { computeAllFeatures, recoveryScoreDaily } from "@/lib/features";
import type { EhrRecord, WearableTelemetry, LifestyleSurvey } from "@/lib/types";
import {
  BioAgeCard,
  CoachCard,
  ScoreCard,
  TrendChart,
  VitalTile,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 0 1 8 4.5 3.5 3.5 0 0 1 13.5 7C13.5 10.5 8 14 8 14Z" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 8h-2.5l-2 4-3-8-2 4H2" />
    </svg>
  );
}

function FootprintsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10c1.5 0 2-1.5 2-3S5.5 4 4 4 2 5.5 2 7s.5 3 2 3ZM12 12c1.5 0 2-1.5 2-3s-.5-3-2-3-2 1.5-2 3 .5 3 2 3ZM4 10v2M12 12v2" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 8.5a5.5 5.5 0 1 1-6-6 4.5 4.5 0 0 0 6 6Z" />
    </svg>
  );
}

function signed(value: number, digits = 1) {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function trendPct(current: number, baseline: number) {
  if (baseline === 0) return 0;
  return ((current - baseline) / baseline) * 100;
}

function readinessMode(score: number, overreaching: boolean) {
  if (score >= 80 && !overreaching) {
    return {
      label: "Push day",
      description: "Sie sind bereit fur intensive Intervalle oder einen Benchmark-Test.",
    };
  }

  if (score >= 65) {
    return {
      label: "Build day",
      description: "Heute ist ein guter Tag fur Zone-2-Training und saubere Volumenarbeit.",
    };
  }

  return {
    label: "Recovery day",
    description: "Erholung priorisieren, Schlaf konsistent halten und Trainingsintensitat reduzieren.",
  };
}

function nextVo2Target(current: number) {
  if (current < 38) return 40;
  if (current < 42) return 45;
  if (current < 47) return 50;
  return Math.ceil((current + 2) / 2) * 2;
}

interface DashboardClientProps {
  ehr: EhrRecord;
  wearable: WearableTelemetry[];
  lifestyle: LifestyleSurvey;
}

export function DashboardClient({
  ehr,
  wearable,
  lifestyle,
}: DashboardClientProps) {
  const features = computeAllFeatures(ehr, wearable, lifestyle);
  const coachSuggestions = generateCoachSuggestions(features, ehr);

  const latest = wearable[wearable.length - 1];
  const previousWeek = wearable.slice(-8, -1);
  const currentReadiness = features.recoveryScore;
  const readinessDecision = readinessMode(
    currentReadiness.score,
    features.strainRecovery.flag,
  );

  const hrAvg7 = avg(previousWeek.map((day) => day.resting_hr_bpm));
  const hrvAvg7 = avg(previousWeek.map((day) => day.hrv_rmssd_ms));
  const stepsAvg7 = avg(previousWeek.map((day) => day.steps));
  const sleepAvg7 = avg(previousWeek.map((day) => day.sleep_duration_hrs));

  const dailyScoreData = wearable.map((_, index) => {
    const recovery = recoveryScoreDaily(wearable, index);
    return {
      date: wearable[index].date,
      readiness: recovery.score,
      recovery: recovery.score,
    };
  });

  const vitalChartData = wearable.map((day) => ({
    date: day.date,
    resting_hr: day.resting_hr_bpm,
    hrv: day.hrv_rmssd_ms,
  }));

  const vo2Target = nextVo2Target(features.vo2max.vo2max);
  const diagnostics = [
    {
      title: "Advanced lipid panel",
      priority: ehr.ldl_mmol >= 2.6 ? "Hoch" : "Mittel",
      description:
        ehr.ldl_mmol >= 2.6
          ? "ApoB und Lp(a) helfen, das Residualrisiko hinter dem LDL-Wert sauber zu trennen."
          : "Ein erweiterter Lipidcheck schafft eine starke Baseline fur langfristige Prevention.",
    },
    {
      title: "Formal VO2max test",
      priority: features.vo2max.vo2max < 45 ? "Hoch" : "Mittel",
      description:
        "Ein Labortest kalibriert Trainingszonen, validiert den Proxy und macht den Goal Planner belastbarer.",
    },
    {
      title: "Body composition scan",
      priority: ehr.bmi >= 25 ? "Mittel" : "Basis",
      description:
        "DEXA oder eine hochwertige Korperanalyse zeigen Lean Mass, Fettverteilung und Fortschritt der Interventionen.",
    },
  ];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
      <section className="animate-in overflow-hidden rounded-[28px] border border-primary/15 bg-[radial-gradient(circle_at_top_left,_rgba(0,210,106,0.14),_transparent_34%),linear-gradient(135deg,_rgba(255,255,255,0.02),_rgba(255,255,255,0.01))] p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.9fr]">
          <div className="space-y-4">
            <Badge className="w-fit border-0 bg-primary/12 text-primary">
              Preventive Performer
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-fluid-3xl font-semibold tracking-tight text-foreground">
                Prevention, gesteuert wie ein Performance-Programm.
              </h1>
              <p className="max-w-2xl text-fluid-sm leading-relaxed text-muted-foreground">
                Wir kombinieren biologisches Alter, VO2max, Readiness und
                Premium-Diagnostics zu einer klaren Optimierungsroutine statt
                zu einzelnen Einzeldatenpunkten.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Diagnostics Concierge</Button>
              <Button variant="outline">12-Wochen-Plan ansehen</Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl bg-surface-1/80 p-4 ring-1 ring-white/5">
              <p className="text-fluid-xs uppercase tracking-[0.18em] text-muted-foreground">
                Bio-Age Delta
              </p>
              <p className="mt-3 font-data text-2xl text-primary">
                {signed(features.bioAge.delta)}
              </p>
              <p className="mt-1 text-fluid-xs text-muted-foreground">
                Jahre vs. chronologisches Alter
              </p>
            </div>
            <div className="rounded-2xl bg-surface-1/80 p-4 ring-1 ring-white/5">
              <p className="text-fluid-xs uppercase tracking-[0.18em] text-muted-foreground">
                VO2max
              </p>
              <p className="mt-3 font-data text-2xl text-foreground">
                {features.vo2max.vo2max}
              </p>
              <p className="mt-1 text-fluid-xs text-muted-foreground">
                {features.vo2max.percentile}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-1/80 p-4 ring-1 ring-white/5">
              <p className="text-fluid-xs uppercase tracking-[0.18em] text-muted-foreground">
                Heute
              </p>
              <p className="mt-3 font-data text-2xl text-foreground">
                {currentReadiness.score}/100
              </p>
              <p className="mt-1 text-fluid-xs text-muted-foreground">
                {readinessDecision.label}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-in stagger-1 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BioAgeCard data={features.bioAge} chronologicalAge={ehr.age} />
        <ScoreCard
          label="VO2max Proxy"
          value={features.vo2max.vo2max}
          maxValue={60}
          colorClass="text-chart-4"
          barColorClass="bg-chart-4"
        />
        <ScoreCard
          label="Longevity Percentile"
          value={features.longevityPercentile}
          colorClass="text-chart-2"
          barColorClass="bg-chart-2"
        />
      </section>

      <section className="animate-in stagger-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <VitalTile
          label="Ruhe-HF"
          value={String(latest.resting_hr_bpm)}
          unit="bpm"
          trend={trendPct(latest.resting_hr_bpm, hrAvg7)}
          icon={<HeartIcon />}
        />
        <VitalTile
          label="HRV"
          value={String(latest.hrv_rmssd_ms)}
          unit="ms"
          trend={trendPct(latest.hrv_rmssd_ms, hrvAvg7)}
          icon={<ActivityIcon />}
        />
        <VitalTile
          label="Schritte"
          value={latest.steps.toLocaleString("de")}
          unit=""
          trend={trendPct(latest.steps, stepsAvg7)}
          icon={<FootprintsIcon />}
        />
        <VitalTile
          label="Schlaf"
          value={latest.sleep_duration_hrs.toFixed(1)}
          unit="Std."
          trend={trendPct(latest.sleep_duration_hrs, sleepAvg7)}
          icon={<MoonIcon />}
        />
      </section>

      <section className="animate-in stagger-3 grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle className="text-fluid-sm font-normal uppercase tracking-wide text-muted-foreground">
              Readiness Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-data text-4xl leading-none text-primary">
                  {currentReadiness.score}
                </p>
                <p className="mt-2 text-fluid-sm text-foreground">
                  {readinessDecision.label}
                </p>
              </div>
              <div className="max-w-sm rounded-2xl bg-surface-2/70 px-4 py-3">
                <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                  Decision
                </p>
                <p className="mt-1 text-fluid-sm leading-relaxed text-foreground/85">
                  {readinessDecision.description}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "HRV",
                  value: currentReadiness.hrvComponent,
                },
                {
                  label: "Resting HR",
                  value: currentReadiness.rhrComponent,
                },
                {
                  label: "Deep Sleep",
                  value: currentReadiness.deepComponent,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-surface-2/50 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="font-data text-fluid-lg text-foreground">
                      {item.value}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-0">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 text-fluid-xs text-muted-foreground">
              <span>Strain / Recovery: {features.strainRecovery.ratio}</span>
              <span>Schlafkonsistenz: {features.circadianConsistency.score}/100</span>
              <span>HRV Trend: {signed(features.hrv30dTrend.slope, 2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle className="text-fluid-sm font-normal uppercase tracking-wide text-muted-foreground">
              VO2max Goal Planner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-surface-2/60 p-4">
                <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                  Aktuell
                </p>
                <p className="mt-2 font-data text-3xl text-foreground">
                  {features.vo2max.vo2max}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-2/60 p-4">
                <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                  Nächstes Ziel
                </p>
                <p className="mt-2 font-data text-3xl text-primary">{vo2Target}</p>
              </div>
              <div className="rounded-2xl bg-surface-2/60 p-4">
                <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                  Gap
                </p>
                <p className="mt-2 font-data text-3xl text-foreground">
                  {(vo2Target - features.vo2max.vo2max).toFixed(1)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-2/50 p-4">
              <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                4-Wochen-Protocol
              </p>
              <ul className="mt-3 space-y-2 text-fluid-sm leading-relaxed text-foreground/85">
                <li>2x pro Woche Zone 2 fur 40-50 Minuten</li>
                <li>1x pro Woche Threshold- oder Hill-Session nur an Push Days</li>
                <li>2 Recovery Days mit Schlaf-Fokus und niedriger Last</li>
              </ul>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-2/30 px-4 py-3">
              <div>
                <p className="text-fluid-sm text-foreground">
                  Zielbenchmark: {features.vo2max.percentile}
                </p>
                <p className="text-fluid-xs text-muted-foreground">
                  Re-Test nach 28 Tagen mit formalem VO2max Test oder Intervall-Benchmark.
                </p>
              </div>
              <Button variant="outline" size="sm">
                Performance Lab
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="animate-in stagger-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrendChart
          title="Readiness Engine - 30 Tage"
          data={dailyScoreData}
          series={[
            {
              dataKey: "readiness",
              label: "Bereitschaft",
              color: "var(--chart-1)",
            },
            {
              dataKey: "recovery",
              label: "Erholung",
              color: "var(--chart-2)",
            },
          ]}
          yDomain={[50, 100]}
        />
        <TrendChart
          title="Recovery Inputs - 30 Tage"
          data={vitalChartData}
          series={[
            {
              dataKey: "resting_hr",
              label: "Ruhe-HF",
              color: "var(--chart-4)",
            },
            {
              dataKey: "hrv",
              label: "HRV",
              color: "var(--chart-5)",
            },
          ]}
        />
      </section>

      <section className="animate-in stagger-5 flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-fluid-lg text-foreground">
              Diagnostics Concierge
            </h3>
            <p className="text-fluid-sm text-muted-foreground">
              High-LTV Empfehlungen fur den nachsten Optimierungszyklus.
            </p>
          </div>
          <Button variant="outline" size="sm">
            Alle Empfehlungen
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {diagnostics.map((item) => (
            <Card key={item.title} className="border-0 bg-surface-1">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-fluid-base text-foreground">
                    {item.title}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="border-primary/20 text-primary"
                  >
                    {item.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-fluid-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                <Button variant="ghost" size="sm" className="px-0 text-primary">
                  In Plan aufnehmen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="animate-in stagger-6 flex flex-col gap-4 pb-8">
        <h3 className="text-fluid-lg text-foreground">
          Performance Prompts
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {coachSuggestions.slice(0, 4).map((suggestion) => (
            <CoachCard key={suggestion.title} suggestion={suggestion} />
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
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
import { computeAllFeatures } from "@/lib/features";
import type {
  BioAgeEstimate,
  EhrRecord,
  LifestyleSurvey,
  WearableTelemetry,
} from "@/lib/types";

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

function TrendTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  metric: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-surface-1 px-3 py-2 shadow-xl">
      <p className="text-fluid-xs text-muted-foreground">{label}</p>
      <p className="font-data text-fluid-sm text-foreground">
        {payload[0].value} <span className="text-muted-foreground">{metric}</span>
      </p>
    </div>
  );
}

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function nextVo2Target(current: number) {
  if (current < 38) return 40;
  if (current < 42) return 45;
  if (current < 47) return 50;
  return Math.ceil((current + 2) / 2) * 2;
}

function statusClasses(status: "Now" | "Next" | "Later") {
  if (status === "Now") return "border-primary/30 bg-primary/10 text-primary";
  if (status === "Next") return "border-chart-4/30 bg-chart-4/10 text-chart-4";
  return "border-border bg-surface-2/60 text-muted-foreground";
}

interface JourneyClientProps {
  ehr: EhrRecord;
  wearable: WearableTelemetry[];
  lifestyle: LifestyleSurvey;
}

export function JourneyClient({
  ehr,
  wearable,
  lifestyle,
}: JourneyClientProps) {
  const features = computeAllFeatures(ehr, wearable, lifestyle);
  const bioAge: BioAgeEstimate = features.bioAge;
  const chronoAge = ehr.age;

  const startBioAge = bioAge.bioAge + 1.3;
  const bioAgeTrend = wearable.map((day, index) => {
    const progress = index / (wearable.length - 1 || 1);
    const eased = 1 - Math.pow(1 - progress, 2.2);
    const baseAge = startBioAge - eased * (startBioAge - bioAge.bioAge);
    const noise = Math.sin(index * 1.7) * 0.15 + Math.cos(index * 0.9) * 0.08;

    return {
      date: day.date,
      label: new Date(day.date).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
      }),
      bioAge: +(baseAge + noise).toFixed(1),
      chronoAge,
    };
  });

  const readinessData = wearable.map((day) => ({
    date: day.date,
    label: new Date(day.date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    }),
    value: Math.round(
      (day.hrv_rmssd_ms / 60) * 30 +
        (day.sleep_quality_score / 100) * 35 +
        ((80 - day.resting_hr_bpm) / 30) * 20 +
        (day.deep_sleep_pct / 25) * 15,
    ),
  }));

  const recoveryData = wearable.map((day) => ({
    date: day.date,
    label: new Date(day.date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    }),
    value: Math.round(
      (day.hrv_rmssd_ms / 60) * 35 +
        ((80 - day.resting_hr_bpm) / 30) * 25 +
        (day.deep_sleep_pct / 25) * 25 +
        (day.sleep_duration_hrs / 9) * 15,
    ),
  }));

  const vo2Target = nextVo2Target(features.vo2max.vo2max);
  const readinessAverage = Math.round(avg(readinessData.map((item) => item.value)));
  const programPhases = [
    {
      status: "Now" as const,
      window: "Woche 0-2",
      title: "Baseline und Diagnostics",
      body: "Bio-Age, Lipide, VO2max Proxy und aktuelle Recovery-Signale sauber erfassen.",
      outcomes: [
        "Advanced Lipids und CRP priorisieren",
        "Readiness-Regeln fur Training definieren",
      ],
    },
    {
      status: "Next" as const,
      window: "Woche 3-6",
      title: "Aerobic Build Block",
      body: "Zwei Zone-2-Einheiten plus ein qualitativ hochwertiger Reiz pro Woche fur VO2max und Cardio Load.",
      outcomes: [
        `VO2max von ${features.vo2max.vo2max} auf ${vo2Target} anheben`,
        "Ruhepuls und HRV parallel monitoren",
      ],
    },
    {
      status: "Next" as const,
      window: "Woche 7-10",
      title: "Recovery Calibration",
      body: "Schlafkonsistenz, Intensitatssteuerung und Belastungsmanagement glatten die Tagesform.",
      outcomes: [
        `Readiness-Schnitt uber ${Math.max(readinessAverage, 75)}`,
        "Low-readiness Tage fruher erkennen",
      ],
    },
    {
      status: "Later" as const,
      window: "Woche 11-12",
      title: "Retest und Expert Review",
      body: "Die Intervention wird mit Diagnostics und Experteninterpretation auf Wirksamkeit gepruft.",
      outcomes: [
        "Re-Test von Biomarkern und Performance",
        "Nächsten Premium-Zyklus planen",
      ],
    },
  ];

  const successCriteria = [
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
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <header className="animate-in mb-12 space-y-4">
        <Badge className="w-fit border-0 bg-primary/12 text-primary">
          Preventive Performer Journey
        </Badge>
        <div className="space-y-3">
          <h1 className="text-fluid-3xl font-semibold leading-tight tracking-tight">
            Ihre Prevention-to-Performance Roadmap
          </h1>
          <p className="max-w-3xl text-fluid-sm leading-relaxed text-muted-foreground">
            Diese Journey verwandelt Biomarker, Wearable-Signale und
            Premium-Diagnostics in ein 12-Wochen-Programm mit klaren
            Re-Test-Punkten, statt nur einen statischen Health Snapshot zu
            zeigen.
          </p>
        </div>
      </header>

      <section className="animate-in stagger-1 mb-12 grid gap-4 md:grid-cols-3">
        {successCriteria.map((item) => (
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

      <section className="animate-in stagger-2 mb-16">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
              12-Wochen-Programm
            </h2>
            <p className="mt-2 max-w-2xl text-fluid-sm text-muted-foreground">
              Die Customer Journey wird als wiederholbarer Optimierungszyklus
              angelegt: messen, intervenieren, validieren, hochskalieren.
            </p>
          </div>
          <Button variant="outline" size="sm">
            Diagnostics buchen
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {programPhases.map((phase) => (
            <Card key={phase.title} className="border-0 bg-surface-1">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge
                    variant="outline"
                    className={statusClasses(phase.status)}
                  >
                    {phase.status}
                  </Badge>
                  <span className="font-data text-fluid-xs text-muted-foreground">
                    {phase.window}
                  </span>
                </div>
                <CardTitle className="text-fluid-lg text-foreground">
                  {phase.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-fluid-sm leading-relaxed text-muted-foreground">
                  {phase.body}
                </p>
                <div className="space-y-2">
                  {phase.outcomes.map((outcome) => (
                    <div
                      key={outcome}
                      className="rounded-xl bg-surface-2/60 px-3 py-2 text-fluid-sm text-foreground/85"
                    >
                      {outcome}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="animate-in stagger-3 mb-16 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle className="text-fluid-sm font-normal uppercase tracking-wide text-muted-foreground">
              Bio-Age Verlauf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={bioAgeTrend}
                  margin={{ top: 12, right: 8, bottom: 0, left: -12 }}
                >
                  <defs>
                    <linearGradient id="bioAgeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E5E8EB" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    domain={[Math.floor(bioAge.bioAge - 4), Math.ceil(chronoAge + 2)]}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => `${value}`}
                  />
                  <ReferenceLine
                    y={chronoAge}
                    stroke="#9CA3AF"
                    strokeDasharray="6 4"
                    strokeWidth={1}
                    label={{
                      value: `Chronologisch: ${chronoAge}`,
                      position: "insideTopRight",
                      fill: "#6B7280",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip content={<BioAgeTooltip chronoAge={chronoAge} />} />
                  <Area
                    type="monotone"
                    dataKey="bioAge"
                    stroke="#059669"
                    strokeWidth={2}
                    fill="url(#bioAgeGrad)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "#059669",
                      stroke: "#FFFFFF",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 flex flex-wrap items-baseline gap-4">
              <span className="font-data text-fluid-3xl font-bold text-foreground text-glow-primary">
                {bioAge.bioAge}
              </span>
              <span className="text-fluid-sm text-muted-foreground">
                Biologisches Alter
              </span>
              <Badge
                variant="outline"
                className="border-status-normal/30 font-data text-status-normal"
              >
                {bioAge.delta > 0 ? "+" : ""}
                {bioAge.delta} Jahre
              </Badge>
            </div>

            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
              {bioAge.drivers.map((driver) => (
                <li
                  key={driver}
                  className="text-fluid-xs text-muted-foreground before:mr-2 before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:align-middle before:content-['']"
                >
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
                <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                  Aktuell
                </p>
                <p className="mt-2 font-data text-3xl text-foreground">
                  {features.vo2max.vo2max}
                </p>
                <p className="mt-1 text-fluid-xs text-muted-foreground">
                  {features.vo2max.percentile}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-2/60 p-4">
                <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                  Ziel in 12 Wochen
                </p>
                <p className="mt-2 font-data text-3xl text-primary">{vo2Target}</p>
                <p className="mt-1 text-fluid-xs text-muted-foreground">
                  Gap {(vo2Target - features.vo2max.vo2max).toFixed(1)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-2/50 p-4">
              <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                Intervention Stack
              </p>
              <ul className="mt-3 space-y-2 text-fluid-sm leading-relaxed text-foreground/85">
                <li>Zone 2 als Basisfur Volumen und Mitochondrienarbeit</li>
                <li>1 qualitativer Reiz pro Woche nur an hohen Readiness-Tagen</li>
                <li>Re-Test nach Woche 6 und Woche 12</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface-2/30 p-4">
              <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                Erfolgskriterium
              </p>
              <p className="mt-2 text-fluid-sm leading-relaxed text-foreground/85">
                VO2max verbessern, ohne dass HRV-Trend und Ruhepuls ins Negative
                kippen. Performance und Prevention sollen gemeinsam steigen.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="animate-in stagger-4">
        <div className="mb-6">
          <h2 className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
            Readiness und Recovery Trends
          </h2>
          <p className="mt-2 text-fluid-sm text-muted-foreground">
            Diese Kurven steuern, wann ein Interventionstest skaliert oder
            gedrosselt wird.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="mb-4 flex items-baseline justify-between">
              <h3 className="text-fluid-sm font-medium text-foreground">
                Bereitschafts-Score
              </h3>
              <span className="font-data text-fluid-xs text-muted-foreground">30T</span>
            </div>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={readinessData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E5E8EB" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<TrendTooltip metric="/ 100" />} />
                  <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={1.5} fill="url(#readinessGrad)" dot={false} activeDot={{ r: 3, fill: "#059669", stroke: "#FFFFFF", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-baseline justify-between">
              <h3 className="text-fluid-sm font-medium text-foreground">
                Erholungs-Score
              </h3>
              <span className="font-data text-fluid-xs text-muted-foreground">30T</span>
            </div>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recoveryData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E5E8EB" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<TrendTooltip metric="/ 100" />} />
                  <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={1.5} fill="url(#recoveryGrad)" dot={false} activeDot={{ r: 3, fill: "#2563EB", stroke: "#FFFFFF", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

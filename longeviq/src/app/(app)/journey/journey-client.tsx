"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { computeAllFeatures } from "@/lib/features";
import type { EhrRecord, WearableTelemetry, LifestyleSurvey, BioAgeEstimate } from "@/lib/types";

// ---------------------------------------------------------------------------
// Custom recharts tooltip
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
  const bio = payload.find((p) => p.dataKey === "bioAge");
  return (
    <div className="rounded-lg border border-border bg-surface-1 px-3 py-2 shadow-xl">
      <p className="text-fluid-xs text-muted-foreground">{label}</p>
      {bio && (
        <p className="font-data text-fluid-sm text-primary">
          {bio.value} Jahre
        </p>
      )}
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

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------
type MilestoneType = "health" | "data";

interface Milestone {
  date: string;
  label: string;
  type: MilestoneType;
}

const milestones: Milestone[] = [
  { date: "Apr 2026", label: "Bio-Age unter 45 erreicht", type: "health" },
  { date: "Mrz 2026", label: "30-Tage Schlafkonsistenz > 70%", type: "health" },
  { date: "Feb 2026", label: "HRV-Durchschnitt um 8% gestiegen", type: "health" },
  { date: "Jan 2026", label: "Erste Datenerfassung abgeschlossen", type: "data" },
  { date: "Dez 2025", label: "LongevIQ Journey gestartet", type: "data" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface JourneyClientProps {
  ehr: EhrRecord;
  wearable: WearableTelemetry[];
  lifestyle: LifestyleSurvey;
}

export function JourneyClient({ ehr, wearable, lifestyle }: JourneyClientProps) {
  const features = computeAllFeatures(ehr, wearable, lifestyle);
  const bioAge: BioAgeEstimate = features.bioAge;
  const chronoAge = ehr.age;

  // Bio-age progression — synthetic trend from computed bio-age
  const startBioAge = bioAge.bioAge + 1.3;
  const bioAgeTrend = wearable.map((w, i) => {
    const progress = i / (wearable.length - 1 || 1);
    const eased = 1 - Math.pow(1 - progress, 2.2);
    const baseAge = startBioAge - eased * (startBioAge - bioAge.bioAge);
    const noise = Math.sin(i * 1.7) * 0.15 + Math.cos(i * 0.9) * 0.08;
    return {
      date: w.date,
      label: new Date(w.date).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
      }),
      bioAge: +(baseAge + noise).toFixed(1),
      chronoAge,
    };
  });

  // Daily scores from wearable recovery
  const readinessData = wearable.map((d) => ({
    date: d.date,
    label: new Date(d.date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    }),
    value: Math.round(
      (d.hrv_rmssd_ms / 60) * 30 +
        (d.sleep_quality_score / 100) * 35 +
        ((80 - d.resting_hr_bpm) / 30) * 20 +
        (d.deep_sleep_pct / 25) * 15
    ),
  }));

  const recoveryData = wearable.map((d) => ({
    date: d.date,
    label: new Date(d.date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    }),
    value: Math.round(
      (d.hrv_rmssd_ms / 60) * 35 +
        ((80 - d.resting_hr_bpm) / 30) * 25 +
        (d.deep_sleep_pct / 25) * 25 +
        (d.sleep_duration_hrs / 9) * 15
    ),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      {/* ── Page header ── */}
      <header className="animate-in mb-16">
        <p className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
          Longevity
        </p>
        <h1 className="mt-1 text-fluid-3xl font-semibold leading-tight tracking-tight">
          Ihre Journey
        </h1>
        <p className="mt-3 max-w-xl text-fluid-sm text-muted-foreground">
          Biologisches Alter, Meilensteine und Tagestrends -- Ihre
          Gesundheitsreise auf einen Blick.
        </p>
      </header>

      {/* ── 1. Bio-Age Timeline ── */}
      <section className="animate-in stagger-1 mb-20">
        <h2 className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
          Bio-Age Verlauf
        </h2>

        <div className="mt-6 h-[320px] w-full">
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
                tickFormatter={(v: number) => `${v}`}
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

        {/* Current bio-age readout */}
        <div className="mt-8 flex items-baseline gap-4">
          <span className="font-data text-fluid-3xl font-bold text-foreground text-glow-primary">
            {bioAge.bioAge}
          </span>
          <span className="text-fluid-sm text-muted-foreground">
            Biologisches Alter
          </span>
          <Badge
            variant="outline"
            className="ml-2 border-status-normal/30 font-data text-status-normal"
          >
            {bioAge.delta > 0 ? "+" : ""}
            {bioAge.delta} Jahre
          </Badge>
        </div>

        {/* Drivers */}
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
          {bioAge.drivers.map((d) => (
            <li
              key={d}
              className="text-fluid-xs text-muted-foreground before:mr-2 before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary before:align-middle before:content-['']"
            >
              {d}
            </li>
          ))}
        </ul>
      </section>

      {/* ── 2. Milestones Timeline ── */}
      <section className="animate-in stagger-2 mb-20">
        <h2 className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
          Meilensteine
        </h2>

        <div className="relative mt-8 pl-8">
          <div
            className="absolute left-[11px] top-1 bottom-1 w-px"
            style={{
              background:
                "linear-gradient(to bottom, #E5E8EB 0%, #059669 20%, #059669 80%, #E5E8EB 100%)",
            }}
          />

          <ol className="space-y-10">
            {milestones.map((m, i) => (
              <li key={i} className="relative">
                <span
                  className={`absolute -left-8 top-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
                    m.type === "health"
                      ? "border-status-normal bg-status-normal/10"
                      : "border-status-info bg-status-info/10"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      m.type === "health" ? "bg-status-normal" : "bg-status-info"
                    }`}
                  />
                </span>

                <p className="font-data text-fluid-xs text-muted-foreground">
                  {m.date}
                </p>
                <p className="mt-0.5 text-fluid-base font-medium text-foreground">
                  {m.label}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 3. 30-Day Trend Grid ── */}
      <section className="animate-in stagger-3">
        <h2 className="text-fluid-xs uppercase tracking-widest text-muted-foreground">
          30-Tage Trends
        </h2>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Readiness */}
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

          {/* Recovery */}
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

"use client";

import { computeAllFeatures } from "@/lib/features";
import type {
  EhrRecord,
  WearableTelemetry,
  LifestyleSurvey,
  TrafficLight,
  ComputedInsights,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  Moon,
  Flame,
  Armchair,
  CalendarClock,
  Heart,
  Wind,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Pill,
  Stethoscope,
  BarChart3,
  Activity,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ------------------------------------------------------------------
// Shared helpers
// ------------------------------------------------------------------

const statusColor: Record<TrafficLight, string> = {
  green: "text-status-normal",
  yellow: "text-status-warning",
  red: "text-status-critical",
};

const statusBg: Record<TrafficLight, string> = {
  green: "bg-status-normal/10",
  yellow: "bg-status-warning/10",
  red: "bg-status-critical/10",
};

const statusBorder: Record<TrafficLight, string> = {
  green: "ring-status-normal/20",
  yellow: "ring-status-warning/20",
  red: "ring-status-critical/20",
};

const statusDot: Record<TrafficLight, string> = {
  green: "bg-status-normal",
  yellow: "bg-status-warning",
  red: "bg-status-critical",
};

function StatusBadge({ status, label }: { status: TrafficLight; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-fluid-xs font-medium ring-1", statusBg[status], statusColor[status], statusBorder[status])}>
      <span className={cn("size-1.5 rounded-full", statusDot[status])} />
      {label}
    </span>
  );
}

function TrendArrow({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (Math.abs(value) < 0.5) return <span className="text-muted-foreground text-fluid-xs">--</span>;
  const positive = value > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-fluid-xs font-medium font-data", positive ? "text-status-normal" : "text-status-critical")}>
      {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {positive ? "+" : ""}{value.toFixed(1)}{suffix}
    </span>
  );
}

function InsightCard({ title, icon, children, className }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("border-0 bg-surface-1 ring-1 ring-foreground/10", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-fluid-sm font-medium text-foreground">
          <span className="flex items-center justify-center rounded-lg bg-surface-2 p-1.5 text-muted-foreground">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------
// Section components
// ------------------------------------------------------------------

function LongevityTrendSection({ data }: { data: ComputedInsights["longevityTrend"] }) {
  const trendIcon = data.trendDirection === "improving" ? <TrendingUp className="size-5" /> : data.trendDirection === "declining" ? <TrendingDown className="size-5" /> : <Minus className="size-5" />;
  const trendColor = data.trendDirection === "improving" ? "text-status-normal" : data.trendDirection === "declining" ? "text-status-critical" : "text-muted-foreground";

  return (
    <div className="rounded-2xl bg-surface-1 p-6 ring-1 ring-foreground/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-fluid-xs uppercase tracking-wider text-muted-foreground">Longevity Trend</p>
          <div className={cn("mt-2 flex items-center gap-3", trendColor)}>
            {trendIcon}
            <span className="font-data text-fluid-2xl leading-none">
              {data.momentum > 0 ? "+" : ""}{data.momentum}
            </span>
            <span className="text-fluid-sm text-muted-foreground">momentum</span>
          </div>
        </div>
        <StatusBadge
          status={data.trendDirection === "improving" ? "green" : data.trendDirection === "declining" ? "red" : "yellow"}
          label={data.trendDirection === "improving" ? "Upward" : data.trendDirection === "declining" ? "Downward" : "Stable"}
        />
      </div>

      <p className="mt-4 text-fluid-xs text-muted-foreground leading-relaxed">{data.interpretation}</p>

      {data.dimensions.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data.dimensions.map((dim) => (
            <div key={dim.name} className="rounded-lg bg-surface-2 px-3 py-2.5">
              <p className="text-fluid-xs text-muted-foreground">{dim.name}</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-data text-fluid-base text-foreground">{dim.secondHalfScore}</span>
                <TrendArrow value={dim.change} suffix="" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WeekOverWeekSection({ data }: { data: ComputedInsights["weekOverWeek"] }) {
  return (
    <InsightCard title="Week over Week" icon={<BarChart3 className="size-4" />}>
      {data.metrics.length === 0 ? (
        <p className="text-fluid-xs text-muted-foreground">Not enough data.</p>
      ) : (
        <div className="space-y-2">
          {data.metrics.map((m) => (
            <div key={m.name} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
              <span className="text-fluid-xs text-muted-foreground">{m.name}</span>
              <div className="flex items-center gap-3">
                <span className="font-data text-fluid-xs text-foreground">{m.thisWeekAvg}</span>
                <TrendArrow value={m.changePct} />
              </div>
            </div>
          ))}
        </div>
      )}
    </InsightCard>
  );
}

function SleepHrvSection({ data }: { data: ComputedInsights["sleepHrvCorrelation"] }) {
  const sensitivityLabel = data.sensitivity === "high" ? "Strong" : data.sensitivity === "moderate" ? "Moderate" : "Low";
  const sensitivityStatus: TrafficLight = data.sensitivity === "high" ? "green" : data.sensitivity === "moderate" ? "yellow" : "red";

  return (
    <InsightCard title="Sleep-HRV Correlation" icon={<Moon className="size-4" />}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-fluid-xs text-muted-foreground">Correlation</p>
          <span className="font-data text-fluid-xl text-foreground">{data.correlation}</span>
        </div>
        <StatusBadge status={sensitivityStatus} label={sensitivityLabel} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-2 px-3 py-2.5">
          <p className="text-fluid-xs text-muted-foreground">HRV after good sleep</p>
          <span className="font-data text-fluid-base text-status-normal">{data.hrvAfterGoodSleep} ms</span>
        </div>
        <div className="rounded-lg bg-surface-2 px-3 py-2.5">
          <p className="text-fluid-xs text-muted-foreground">HRV after poor sleep</p>
          <span className="font-data text-fluid-base text-status-critical">{data.hrvAfterPoorSleep} ms</span>
        </div>
      </div>
      <p className="mt-3 text-fluid-xs text-muted-foreground leading-relaxed">{data.interpretation}</p>
    </InsightCard>
  );
}

function RecoveryPredictionSection({ data }: { data: ComputedInsights["recoveryPrediction"] }) {
  const confidenceStatus: TrafficLight = data.confidence === "high" ? "green" : data.confidence === "moderate" ? "yellow" : "red";
  const pct = Math.min(data.predictedRecovery, 100);

  return (
    <InsightCard title="Recovery Prediction" icon={<Zap className="size-4" />}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-fluid-xs text-muted-foreground">Tomorrow predicted</p>
          <span className="font-data text-fluid-2xl text-foreground">{data.predictedRecovery}</span>
          <span className="text-fluid-sm text-muted-foreground"> /100</span>
        </div>
        <StatusBadge status={confidenceStatus} label={data.confidence === "high" ? "Confident" : data.confidence === "moderate" ? "Moderate" : "Uncertain"} />
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", pct >= 70 ? "bg-status-normal" : pct >= 45 ? "bg-status-warning" : "bg-status-critical")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {data.topDrivers.map((d) => (
          <span key={d} className="rounded-md bg-surface-2 px-2 py-0.5 text-fluid-xs text-muted-foreground">{d}</span>
        ))}
      </div>
      <p className="mt-3 text-fluid-xs text-muted-foreground leading-relaxed">{data.recommendation}</p>
    </InsightCard>
  );
}

function EnergyBalanceSection({ data }: { data: ComputedInsights["energyBalance"] }) {
  const directionLabel = data.direction === "surplus" ? "Surplus" : data.direction === "deficit" ? "Deficit" : "Balanced";
  const directionStatus: TrafficLight = data.flag ? "red" : data.direction === "balanced" ? "green" : "yellow";

  return (
    <InsightCard title="Energy Balance" icon={<Flame className="size-4" />}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-fluid-xs text-muted-foreground">Burn (7-day avg)</p>
          <span className="font-data text-fluid-xl text-foreground">{data.avgCaloriesBurned}</span>
          <span className="text-fluid-xs text-muted-foreground"> kcal/day</span>
        </div>
        <StatusBadge status={directionStatus} label={directionLabel} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-2 px-3 py-2.5">
          <p className="text-fluid-xs text-muted-foreground">Est. Intake</p>
          <span className="font-data text-fluid-base text-foreground">{data.estimatedIntakeProxy} kcal</span>
        </div>
        <div className="rounded-lg bg-surface-2 px-3 py-2.5">
          <p className="text-fluid-xs text-muted-foreground">Balance-Ratio</p>
          <span className="font-data text-fluid-base text-foreground">{data.balanceRatio}</span>
        </div>
      </div>
      <p className="mt-3 text-fluid-xs text-muted-foreground leading-relaxed">{data.interpretation}</p>
    </InsightCard>
  );
}

function HydrationSection({ data }: { data: ComputedInsights["hydration"] }) {
  return (
    <InsightCard title="Hydration" icon={<Droplets className="size-4" />}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-fluid-xs text-muted-foreground">Glasses per day</p>
          <div className="flex items-baseline gap-1">
            <span className="font-data text-fluid-xl text-foreground">{data.waterGlasses}</span>
            <span className="text-fluid-sm text-muted-foreground">/ {data.adjustedNeed}</span>
          </div>
        </div>
        <StatusBadge status={data.status} label={data.status === "green" ? "Good" : data.status === "yellow" ? "Low" : "Very Low"} />
      </div>
      {data.rhrElevationFlag && (
        <div className="mt-3 rounded-lg bg-status-warning/10 px-3 py-2 text-fluid-xs text-status-warning">
          Resting heart rate elevated — possible dehydration signal
        </div>
      )}
      <p className="mt-3 text-fluid-xs text-muted-foreground leading-relaxed">{data.interpretation}</p>
    </InsightCard>
  );
}

function Spo2Section({ data }: { data: ComputedInsights["spo2Profile"] }) {
  return (
    <InsightCard title="SpO2 Night Profile" icon={<Wind className="size-4" />}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-fluid-xs text-muted-foreground">Average (14 days)</p>
          <span className="font-data text-fluid-xl text-foreground">{data.avgSpo2}%</span>
        </div>
        <StatusBadge status={data.status} label={data.status === "green" ? "Normal" : data.status === "yellow" ? "Monitor" : "Abnormal"} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-surface-2 px-3 py-2.5">
          <p className="text-fluid-xs text-muted-foreground">Min</p>
          <span className="font-data text-fluid-base text-foreground">{data.minSpo2}%</span>
        </div>
        <div className="rounded-lg bg-surface-2 px-3 py-2.5">
          <p className="text-fluid-xs text-muted-foreground">Low Nights</p>
          <span className="font-data text-fluid-base text-foreground">{data.lowNights}</span>
        </div>
        <div className="rounded-lg bg-surface-2 px-3 py-2.5">
          <p className="text-fluid-xs text-muted-foreground">Trend</p>
          <TrendArrow value={data.trend * 100} />
        </div>
      </div>
      {data.apneaRiskFlag && (
        <div className={cn("mt-3 rounded-lg px-3 py-2 text-fluid-xs", data.compoundFlag ? "bg-status-critical/10 text-status-critical" : "bg-status-warning/10 text-status-warning")}>
          {data.compoundFlag ? "Sleep apnea screening urgently recommended" : "Elevated apnea risk — continue monitoring values"}
        </div>
      )}
      <p className="mt-3 text-fluid-xs text-muted-foreground leading-relaxed">{data.interpretation}</p>
    </InsightCard>
  );
}

function SedentarySection({ data }: { data: ComputedInsights["sedentaryScore"] }) {
  const pct = Math.min(data.score, 100);

  return (
    <InsightCard title="Sedentary Score" icon={<Armchair className="size-4" />}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-fluid-xs text-muted-foreground">Activity Profile</p>
          <span className="font-data text-fluid-xl text-foreground">{data.score}</span>
          <span className="text-fluid-sm text-muted-foreground"> /100</span>
        </div>
        <StatusBadge status={data.status} label={data.status === "green" ? "Good" : data.status === "yellow" ? "Improvable" : "Critical"} />
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
        <div className={cn("h-full rounded-full", data.status === "green" ? "bg-status-normal" : data.status === "yellow" ? "bg-status-warning" : "bg-status-critical")} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-2 px-3 py-2.5">
          <p className="text-fluid-xs text-muted-foreground">Sitting Time</p>
          <span className="font-data text-fluid-base text-foreground">{data.sedentaryHrs}h/day</span>
        </div>
        <div className="rounded-lg bg-surface-2 px-3 py-2.5">
          <p className="text-fluid-xs text-muted-foreground">Active Minutes</p>
          <span className="font-data text-fluid-base text-foreground">{data.activeMinAvg} min</span>
        </div>
      </div>
      <p className="mt-3 text-fluid-xs text-muted-foreground leading-relaxed">{data.interpretation}</p>
    </InsightCard>
  );
}

function CircadianSection({ data }: { data: ComputedInsights["circadianWeekday"] }) {
  return (
    <InsightCard title="Weekly Recovery Pattern" icon={<CalendarClock className="size-4" />}>
      <div className="flex items-center gap-1.5">
        {data.dayProfiles.map((d) => {
          const maxHrv = Math.max(...data.dayProfiles.map((p) => p.avgHRV), 1);
          const pct = (d.avgHRV / maxHrv) * 100;
          const isBest = d.dayName === data.bestDay.name;
          const isWorst = d.dayName === data.worstDay.name;
          return (
            <div key={d.dayName} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="relative h-16 w-full rounded-md bg-surface-2 overflow-hidden">
                <div
                  className={cn(
                    "absolute bottom-0 w-full rounded-md transition-all",
                    isBest ? "bg-status-normal/60" : isWorst ? "bg-status-critical/40" : "bg-primary/30",
                  )}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className={cn("text-fluid-xs", isBest ? "text-status-normal font-medium" : isWorst ? "text-status-critical font-medium" : "text-muted-foreground")}>{d.dayName}</span>
            </div>
          );
        })}
      </div>
      {data.socialJetLagFlag && (
        <div className="mt-3 rounded-lg bg-status-warning/10 px-3 py-2 text-fluid-xs text-status-warning">
          Social Jet Lag: Weekend sleep ({data.weekendSleep}) significantly different from weekday sleep ({data.weekdaySleep})
        </div>
      )}
      <p className="mt-3 text-fluid-xs text-muted-foreground leading-relaxed">{data.interpretation}</p>
    </InsightCard>
  );
}

function LifestyleImpactSection({ data }: { data: ComputedInsights["lifestyleImpact"] }) {
  const maxGap = Math.max(...data.factors.map((f) => f.gap), 1);

  return (
    <InsightCard title="Lifestyle Impact Analysis" icon={<Brain className="size-4" />}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-fluid-xs text-muted-foreground">Lifestyle Score</p>
          <span className="font-data text-fluid-2xl text-foreground">{data.overallScore}</span>
          <span className="text-fluid-sm text-muted-foreground"> /100</span>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {data.factors.map((f) => (
          <div key={f.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-fluid-xs text-muted-foreground">{f.name}</span>
              <span className="font-data text-fluid-xs text-foreground">{Math.round(f.score)}/100</span>
            </div>
            <div className="h-1 w-full rounded-full bg-surface-2 overflow-hidden">
              <div
                className={cn("h-full rounded-full", f.score >= 70 ? "bg-status-normal" : f.score >= 40 ? "bg-status-warning" : "bg-status-critical")}
                style={{ width: `${f.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-fluid-xs text-muted-foreground leading-relaxed">{data.interpretation}</p>
    </InsightCard>
  );
}

function VisitHistorySection({ data }: { data: ComputedInsights["visitHistory"] }) {
  return (
    <InsightCard title="Visit History" icon={<Stethoscope className="size-4" />}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-fluid-xs text-muted-foreground">Total doctor visits</p>
          <span className="font-data text-fluid-xl text-foreground">{data.totalVisits}</span>
        </div>
        {data.preventiveOverdue && (
          <StatusBadge status="yellow" label="Preventive care due" />
        )}
      </div>
      {data.visitReasons.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {data.visitReasons.slice(-5).map((v, i) => (
            <div key={`${v.date}-${i}`} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
              <span className="text-fluid-xs text-muted-foreground">{new Date(v.date).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
              <span className="text-fluid-xs text-foreground">{v.category}</span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-fluid-xs text-muted-foreground leading-relaxed">{data.interpretation}</p>
    </InsightCard>
  );
}

function MedicationSection({ data }: { data: ComputedInsights["medicationMapping"] }) {
  return (
    <InsightCard title="Medication Overview" icon={<Pill className="size-4" />}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-fluid-xs text-muted-foreground">Medications</p>
            <span className="font-data text-fluid-xl text-foreground">{data.medicationCount}</span>
          </div>
          <div>
            <p className="text-fluid-xs text-muted-foreground">Diagnoses</p>
            <span className="font-data text-fluid-xl text-foreground">{data.conditionCount}</span>
          </div>
        </div>
        {data.polypharmacyFlag && <StatusBadge status="yellow" label="Polypharmacy" />}
      </div>
      {data.mappings.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {data.mappings.map((m, i) => (
            <div key={`${m.medication}-${i}`} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
              <span className="text-fluid-xs text-foreground">{m.medication}</span>
              <div className="flex items-center gap-2">
                <span className="text-fluid-xs text-muted-foreground">{m.condition}</span>
                <span className={cn("size-1.5 rounded-full", m.matched ? "bg-status-normal" : "bg-status-warning")} />
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-fluid-xs text-muted-foreground leading-relaxed">{data.interpretation}</p>
    </InsightCard>
  );
}

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------

interface InsightsClientProps {
  ehr: EhrRecord;
  wearable: WearableTelemetry[];
  lifestyle: LifestyleSurvey;
}

export function InsightsClient({ ehr, wearable, lifestyle }: InsightsClientProps) {
  const features = computeAllFeatures(ehr, wearable, lifestyle);
  const insights = features.insights;

  return (
    <div className="flex flex-col gap-10 pb-8">
      {/* Page header */}
      <div>
        <h1 className="text-fluid-xl font-semibold text-foreground font-heading">Insights</h1>
        <p className="mt-1 text-fluid-sm text-muted-foreground">
          Deep analysis of your health data — patterns, correlations, and actionable recommendations.
        </p>
      </div>

      {/* Hero: Longevity Trend */}
      <section className="animate-in">
        <LongevityTrendSection data={insights.longevityTrend} />
      </section>

      {/* Row: Recovery Prediction + Week over Week */}
      <section className="animate-in stagger-1 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecoveryPredictionSection data={insights.recoveryPrediction} />
        <WeekOverWeekSection data={insights.weekOverWeek} />
      </section>

      {/* Section: Sleep & Recovery */}
      <section className="animate-in stagger-2">
        <h2 className="mb-4 text-fluid-base font-medium text-foreground">Sleep & Recovery</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SleepHrvSection data={insights.sleepHrvCorrelation} />
          <CircadianSection data={insights.circadianWeekday} />
        </div>
      </section>

      {/* Section: Body & Activity */}
      <section className="animate-in stagger-2">
        <h2 className="mb-4 text-fluid-base font-medium text-foreground">Body & Activity</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <EnergyBalanceSection data={insights.energyBalance} />
          <HydrationSection data={insights.hydration} />
          <SedentarySection data={insights.sedentaryScore} />
        </div>
      </section>

      {/* Section: Vital Signs */}
      <section className="animate-in stagger-2">
        <h2 className="mb-4 text-fluid-base font-medium text-foreground">Vital Signs</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Spo2Section data={insights.spo2Profile} />
          <LifestyleImpactSection data={insights.lifestyleImpact} />
        </div>
      </section>

      {/* Section: Clinical Context */}
      <section className="animate-in stagger-2">
        <h2 className="mb-4 text-fluid-base font-medium text-foreground">Clinical Context</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MedicationSection data={insights.medicationMapping} />
          <VisitHistorySection data={insights.visitHistory} />
        </div>
      </section>
    </div>
  );
}

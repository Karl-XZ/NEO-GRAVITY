"use client";

import { computeAllFeatures, recoveryScoreDaily } from "@/lib/features";
import { generateCoachSuggestions } from "@/lib/coach/generate-suggestions";
import type { EhrRecord, WearableTelemetry, LifestyleSurvey } from "@/lib/types";
import {
  BioAgeCard,
  ScoreCard,
  VitalTile,
  TrendChart,
  CoachCard,
  HealthCompanion,
} from "@/components/dashboard";

// ---------------------------------------------------------------------------
// Icons (inline SVGs for clinical feel)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DashboardClientProps {
  ehr: EhrRecord;
  wearable: WearableTelemetry[];
  lifestyle: LifestyleSurvey;
}

export function DashboardClient({ ehr, wearable, lifestyle }: DashboardClientProps) {
  const features = computeAllFeatures(ehr, wearable, lifestyle);
  const coachSuggestions = generateCoachSuggestions(features, ehr);

  const latest = wearable[wearable.length - 1];
  const prev7 = wearable.slice(-8, -1);
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  function trendPct(current: number, avgVal: number) {
    if (avgVal === 0) return 0;
    return ((current - avgVal) / avgVal) * 100;
  }

  const hrAvg7 = avg(prev7.map((d) => d.resting_hr_bpm));
  const hrvAvg7 = avg(prev7.map((d) => d.hrv_rmssd_ms));
  const stepsAvg7 = avg(prev7.map((d) => d.steps));
  const sleepAvg7 = avg(prev7.map((d) => d.sleep_duration_hrs));

  const dailyScoreData = wearable.map((_, i) => {
    const recovery = recoveryScoreDaily(wearable, i);
    return {
      date: wearable[i].date,
      readiness: recovery.score,
      recovery: recovery.score,
    };
  });

  const vitalChartData = wearable.map((d) => ({
    date: d.date,
    resting_hr: d.resting_hr_bpm,
    hrv: d.hrv_rmssd_ms,
  }));

  return (
    <div className="flex gap-6">
      {/* ── Dashboard Content (left) ──────────────────────── */}
      <div className="min-w-0 flex-1 flex flex-col gap-10">
        {/* ── Section 1: Hero Row ───────────────────────────── */}
        <section className="animate-in grid grid-cols-1 gap-4 lg:grid-cols-3">
          <BioAgeCard data={features.bioAge} chronologicalAge={ehr.age} />
          <ScoreCard
            label="Bereitschaft"
            value={features.recoveryScore.score}
            colorClass="text-chart-1"
            barColorClass="bg-chart-1"
          />
          <ScoreCard
            label="Erholung"
            value={features.recoveryScore.score}
            colorClass="text-chart-2"
            barColorClass="bg-chart-2"
          />
        </section>

        {/* ── Section 2: Vitals Strip ──────────────────────── */}
        <section className="animate-in stagger-1 grid grid-cols-2 gap-3 lg:grid-cols-4">
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

        {/* ── Section 3: Trend Charts ──────────────────────── */}
        <section className="animate-in stagger-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TrendChart
            title="Bereitschaft & Erholung — 30 Tage"
            data={dailyScoreData}
            series={[
              { dataKey: "readiness", label: "Bereitschaft", color: "var(--chart-1)" },
              { dataKey: "recovery", label: "Erholung", color: "var(--chart-2)" },
            ]}
            yDomain={[50, 100]}
          />
          <TrendChart
            title="Ruhe-HF & HRV — 30 Tage"
            data={vitalChartData}
            series={[
              { dataKey: "resting_hr", label: "Ruhe-HF", color: "var(--chart-4)" },
              { dataKey: "hrv", label: "HRV", color: "var(--chart-5)" },
            ]}
          />
        </section>

        {/* ── Section 4: Coach Insights ────────────────────── */}
        <section className="animate-in stagger-3 flex flex-col gap-4 pb-8">
          <h3 className="text-fluid-lg text-foreground">Coach-Empfehlungen</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {coachSuggestions.map((suggestion) => (
              <CoachCard key={suggestion.title} suggestion={suggestion} />
            ))}
          </div>
        </section>
      </div>

      {/* ── AI Health Companion (right panel) ─────────────── */}
      <aside className="hidden w-[380px] shrink-0 xl:block">
        <div className="sticky top-0">
          <HealthCompanion />
        </div>
      </aside>
    </div>
  );
}

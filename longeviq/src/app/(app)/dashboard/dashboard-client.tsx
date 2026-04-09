"use client";

import { useState } from "react";

import { computeAllFeatures } from "@/lib/features";
import { generateCoachSuggestions } from "@/lib/coach/generate-suggestions";
import type {
  CoachSuggestion,
  EhrRecord,
  LifestyleSurvey,
  WearableTelemetry,
} from "@/lib/types";
import {
  CoachCard,
  HealthCompanion,
  ScoreCard,
  VitalTile,
} from "@/components/dashboard";

const coachPreviewFallbacks: CoachSuggestion[] = [
  {
    severity: "red",
    title: "Reduce strain for the next 48 hours",
    rationale:
      "Several recovery signals suggest your system needs more restoration before pushing intensity again.",
    action:
      "Keep movement gentle, prioritise sleep, and avoid stacking demanding sessions back-to-back.",
  },
  {
    severity: "yellow",
    title: "Tighten your evening routine",
    rationale:
      "A calmer digital wind-down and more consistent sleep timing could improve recovery and mood quickly.",
    action:
      "Reduce screens 90 minutes before sleep and keep tonight's bedtime steady.",
  },
  {
    severity: "yellow",
    title: "Use a light Zone-2 session as a reset",
    rationale:
      "A low-intensity cardio block can support activity consistency without adding unnecessary recovery load.",
    action:
      "Plan a 30 to 40 minute easy walk or cycle session for tomorrow.",
  },
];

const severityOrder: Record<CoachSuggestion["severity"], number> = {
  red: 0,
  yellow: 1,
  green: 2,
};

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

function trendPct(current: number, avgVal: number) {
  if (avgVal === 0) return 0;
  return ((current - avgVal) / avgVal) * 100;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
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
  const [activeCoachSuggestion, setActiveCoachSuggestion] = useState<string | null>(null);

  const features = computeAllFeatures(ehr, wearable, lifestyle);
  const generatedPriorityCoachSuggestions = generateCoachSuggestions(features, ehr).filter(
    (suggestion) => suggestion.severity !== "green"
  );
  const priorityCoachSuggestions = [
    ...generatedPriorityCoachSuggestions,
    ...coachPreviewFallbacks.filter(
      (fallback) =>
        !generatedPriorityCoachSuggestions.some(
          (suggestion) => suggestion.title === fallback.title
        )
    ),
  ]
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 3);

  const latest = wearable[wearable.length - 1];
  const previousWeek = wearable.slice(-8, -1);
  const stepsAvg7 = average(previousWeek.map((day) => day.steps));
  const sleepAvg7 = average(previousWeek.map((day) => day.sleep_duration_hrs));

  return (
    <div className="flex gap-6">
      <div className="mx-auto flex min-w-0 max-w-[1400px] flex-1 flex-col gap-8">
        {priorityCoachSuggestions.length > 0 ? (
          <section className="animate-in rounded-[1.75rem] border border-white/70 bg-white/90 px-5 py-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.16)] sm:px-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Coach Queue
                </p>
                <h3 className="mt-2 text-fluid-lg text-foreground">Top coach suggestions</h3>
              </div>
              <div className="rounded-full border border-foreground/8 bg-background/75 px-3 py-1 text-[11px] text-muted-foreground">
                {priorityCoachSuggestions.length} active items
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row">
              {priorityCoachSuggestions.map((suggestion) => (
                <CoachCard
                  key={suggestion.title}
                  suggestion={suggestion}
                  isActive={activeCoachSuggestion === suggestion.title}
                  isDimmed={
                    activeCoachSuggestion !== null &&
                    activeCoachSuggestion !== suggestion.title
                  }
                  onActivate={() => setActiveCoachSuggestion(suggestion.title)}
                  onDeactivate={() =>
                    setActiveCoachSuggestion((current) =>
                      current === suggestion.title ? null : current
                    )
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="animate-in grid grid-cols-1 gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.16)] sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Scoreboard
                </p>
                <h3 className="mt-2 text-fluid-lg text-foreground">Recovery overview</h3>
              </div>
              <p className="max-w-[10rem] text-right text-xs leading-relaxed text-muted-foreground">
                A cleaner snapshot of how ready the system looks today.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ScoreCard
                label="Readiness"
                value={features.recoveryScore.score}
                colorClass="text-chart-1"
                barColorClass="bg-chart-1"
              />
              <ScoreCard
                label="Recovery"
                value={features.recoveryScore.score}
                colorClass="text-chart-2"
                barColorClass="bg-chart-2"
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.16)] sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Daily Rhythm
                </p>
                <h3 className="mt-2 text-fluid-lg text-foreground">Movement and sleep</h3>
              </div>
              <p className="max-w-[10rem] text-right text-xs leading-relaxed text-muted-foreground">
                Two daily signals that are easy to act on without noise.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <VitalTile
                label="Steps"
                value={latest.steps.toLocaleString("en-US")}
                unit=""
                trend={trendPct(latest.steps, stepsAvg7)}
                icon={<FootprintsIcon />}
              />
              <VitalTile
                label="Sleep"
                value={latest.sleep_duration_hrs.toFixed(1)}
                unit="hrs"
                trend={trendPct(latest.sleep_duration_hrs, sleepAvg7)}
                icon={<MoonIcon />}
              />
            </div>
          </div>
        </section>

        <div className="pb-8" />
      </div>

      <aside className="hidden w-[380px] shrink-0 xl:block">
        <div className="sticky top-0">
          <HealthCompanion />
        </div>
      </aside>
    </div>
  );
}

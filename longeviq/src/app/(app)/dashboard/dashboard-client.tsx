"use client";

import { useState } from "react";

import { computeAllFeatures } from "@/lib/features";
import { generateCoachSuggestions } from "@/lib/coach/generate-suggestions";
import type {
  CoachSuggestion,
  EhrRecord,
  WearableTelemetry,
  LifestyleSurvey,
} from "@/lib/types";
import {
  ScoreCard,
  VitalTile,
  CoachCard,
  HealthCompanion,
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

export function DashboardClient({ ehr, wearable, lifestyle }: DashboardClientProps) {
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
  const prev7 = wearable.slice(-8, -1);

  const stepsAvg7 = average(prev7.map((d) => d.steps));
  const sleepAvg7 = average(prev7.map((d) => d.sleep_duration_hrs));

<<<<<<< Updated upstream
  const weeklyAction = getWeeklyAction({
    movementPct: features.movementConsistency.pct,
    sleepFlagged: features.sleepFragmentation.flagged,
    boneLoadScore: features.boneLoad.score,
    wellbeingFlagged: features.wellbeing.depressionFlag,
  });

  const explainBullets = getExplainBullets({
    plainLanguageMode,
    cardioStatus: features.cardioRisk.status,
    movementPct: features.movementConsistency.pct,
    wellbeingFlagged: features.wellbeing.depressionFlag,
    sleepFlagged: features.sleepFragmentation.flagged,
  });

  const heartHeadline =
    features.cardioRisk.status === "green"
      ? "My Heart Today looks steady"
      : features.cardioRisk.status === "yellow"
        ? "My Heart Today needs attention"
        : "My Heart Today needs follow-up";

  const heartBody = plainLanguageMode
    ? features.cardioRisk.status === "green"
      ? "Your current heart-related signals do not show an urgent concern. Keep your routine calm and consistent."
      : features.cardioRisk.status === "yellow"
        ? "Your heart-related signals suggest this is the right week to act early, before problems grow."
        : "Your heart-related signals sit in a range that should be reviewed with a clinician."
    : `Cardiovascular status is ${features.cardioRisk.status} based on blood pressure, lipid context, and current risk features.`;

  const memoryBody = plainLanguageMode
    ? features.wellbeing.depressionFlag
      ? "Mood and resilience look lower than expected. A short clinic-led check-in would be a good next step."
      : "Mood and memory-related prevention signals look manageable right now, but a short check-in can still support confidence."
    : `WHO-5 wellbeing is ${features.wellbeing.who5}, cognitive reserve is ${features.cognitiveReserve.level}, and the current recommendation is clinic-led follow-up if mood declines further.`;

  const memoryComposite = memoryConfidence + moodState + sleepStability;
  const memoryCheckRecommendation =
    memoryComposite <= 7
      ? "Your check-in suggests a clinician-led follow-up would be sensible this week."
      : memoryComposite <= 10
        ? "Your check-in is mixed. Keep the weekly action simple and consider a clinic conversation if this persists."
        : "Your check-in looks relatively stable. Keep monitoring gently rather than adding complexity.";

  const followUpLabel =
    features.cardioRisk.status === "red"
      ? "Cardiovascular prevention review"
      : features.wellbeing.depressionFlag
        ? "Mood and resilience check-in"
        : "Preventive clinic follow-up";

  const followUpTiming =
    features.cardioRisk.status === "red"
      ? "Within 7 days"
      : features.wellbeing.depressionFlag
        ? "Within 14 days"
        : "Within 30 days";

=======
>>>>>>> Stashed changes
  return (
    <div className="flex gap-6">
      <div className="mx-auto flex min-w-0 max-w-[1400px] flex-1 flex-col gap-8">
        {priorityCoachSuggestions.length > 0 ? (
          <section className="animate-in overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(243,246,248,0.92)_100%)] px-5 py-5 shadow-[0_28px_72px_-42px_rgba(15,23,42,0.24)] sm:px-6">
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

<<<<<<< Updated upstream
      <section className="animate-in grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ScoreCard
          label="Readiness"
          value={features.recoveryScore.score}
          colorClass="text-chart-1"
          barColorClass="bg-chart-1"
          helpText="Readiness zeigt, wie bereit Ihr Körper heute für Belastung ist. Der Wert berücksichtigt unter anderem HRV, Ruhepuls und Schlafsignale."
        />
        <ScoreCard
          label="Recovery"
          value={features.recoveryScore.score}
          colorClass="text-chart-2"
          barColorClass="bg-chart-2"
          helpText="Recovery beschreibt, wie gut sich Ihr System zuletzt erholt hat. Höhere Werte sprechen für mehr Regeneration und geringere aktuelle Belastung."
        />
      </section>

      <section className="animate-in stagger-1 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <VitalTile
          label="Resting HR"
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
      </section>

      <section className="animate-in stagger-2 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader className="gap-3">
            <div className="flex items-center justify-between gap-3">
=======
        <section className="animate-in grid grid-cols-1 gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.97)_0%,rgba(242,247,244,0.9)_100%)] p-5 shadow-[0_28px_72px_-44px_rgba(15,23,42,0.24)] sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
>>>>>>> Stashed changes
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

          <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.98)_0%,rgba(248,250,251,0.92)_100%)] p-5 shadow-[0_28px_72px_-44px_rgba(15,23,42,0.24)] sm:p-6">
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
<<<<<<< Updated upstream
          </CardContent>
        </Card>
      </section>

      <div className="pb-8" />

      <Sheet open={memoryCheckOpen} onOpenChange={setMemoryCheckOpen}>
        <SheetContent side="right" className="w-full max-w-xl gap-0">
          <SheetHeader className="border-b">
            <SheetTitle>2-minute Memory & Mood Check-in</SheetTitle>
            <SheetDescription>
              A short, trust-first check-in for confidence, mood, and sleep. This is not a diagnosis.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-5 p-4">
            <div className="rounded-xl bg-surface-2 p-4">
              <p className="text-fluid-sm font-medium text-foreground">How steady does your memory feel today?</p>
              <p className="mt-1 text-fluid-xs text-muted-foreground">1 = noticeably off, 5 = steady and confident</p>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button
                    key={value}
                    variant={memoryConfidence === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMemoryConfidence(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-surface-2 p-4">
              <p className="text-fluid-sm font-medium text-foreground">How supported does your mood feel this week?</p>
              <p className="mt-1 text-fluid-xs text-muted-foreground">1 = struggling, 5 = coping well</p>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button
                    key={value}
                    variant={moodState === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMoodState(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-surface-2 p-4">
              <p className="text-fluid-sm font-medium text-foreground">How stable has your sleep felt recently?</p>
              <p className="mt-1 text-fluid-xs text-muted-foreground">1 = very disrupted, 5 = fairly steady</p>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button
                    key={value}
                    variant={sleepStability === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSleepStability(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-background px-4 py-4 ring-1 ring-foreground/10">
              <p className="text-fluid-xs uppercase tracking-wider text-muted-foreground">Current summary</p>
              <p className="mt-2 text-fluid-sm leading-relaxed text-foreground/85">{memoryCheckRecommendation}</p>
=======
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
>>>>>>> Stashed changes
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

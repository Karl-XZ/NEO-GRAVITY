"use client";

import { useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  Brain,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ShieldCheck,
} from "lucide-react";

import { computeAllFeatures, recoveryScoreDaily } from "@/lib/features";
import { generateCoachSuggestions } from "@/lib/coach/generate-suggestions";
import type {
  CoachSuggestion,
  EhrRecord,
  TrafficLight,
  WearableTelemetry,
  LifestyleSurvey,
} from "@/lib/types";
import {
  BioAgeCard,
  ScoreCard,
  VitalTile,
  TrendChart,
  CoachCard,
  HealthCompanion,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

function StatusBadge({ status }: { status: TrafficLight }) {
  const styles: Record<TrafficLight, string> = {
    green: "bg-status-normal/12 text-status-normal",
    yellow: "bg-status-warning/12 text-status-warning",
    red: "bg-status-critical/12 text-status-critical",
  };

  const labels: Record<TrafficLight, string> = {
    green: "Green light",
    yellow: "Yellow light",
    red: "Red light",
  };

  return (
    <Badge className={`rounded-full border-0 px-2.5 py-1 text-xs ${styles[status]}`}>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-current" />
        {labels[status]}
      </span>
    </Badge>
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

function getWeeklyAction(input: {
  movementPct: number;
  sleepFlagged: boolean;
  boneLoadScore: number;
  wellbeingFlagged: boolean;
}) {
  if (input.wellbeingFlagged) {
    return {
      title: "Schedule a 10-minute mood check-in",
      body: "Your wellbeing signal is the clearest place to start. A short check-in helps the clinic decide whether follow-up support is needed.",
      reason: "Mood and resilience look more fragile than your other prevention signals.",
    };
  }

  if (input.sleepFlagged) {
    return {
      title: "Protect 3 steadier nights this week",
      body: "Aim for a consistent bedtime and reduce late-evening stimulation. Better sleep is one of the fastest ways to calm both heart and mood signals.",
      reason: "Sleep fragmentation is showing up in your recent pattern.",
    };
  }

  if (input.movementPct < 70) {
    return {
      title: "Add 4 brisk walks this week",
      body: "A simple walking routine is the safest high-impact action for heart health, bone loading, and long-term independence.",
      reason: "Movement consistency is below the target range.",
    };
  }

  if (input.boneLoadScore < 80) {
    return {
      title: "Build one bone-strength session into your week",
      body: "Choose one simple weight-bearing session such as stairs, incline walking, or a light strength circuit.",
      reason: "Bone-supporting activity is present, but not yet strong enough.",
    };
  }

  return {
    title: "Keep the current routine steady",
    body: "Your main prevention signals are relatively stable. This week is about keeping the routine simple, not adding more complexity.",
    reason: "No single Concerned Preventer signal is currently dominant.",
  };
}

function getExplainBullets(input: {
  plainLanguageMode: boolean;
  cardioStatus: TrafficLight;
  movementPct: number;
  wellbeingFlagged: boolean;
  sleepFlagged: boolean;
}) {
  if (input.plainLanguageMode) {
    return [
      input.cardioStatus === "green"
        ? "Your heart signal looks steady today."
        : input.cardioStatus === "yellow"
          ? "Your heart signal deserves attention, but it is not an emergency message."
          : "Your heart signal should be confirmed with a clinician soon.",
      input.sleepFlagged
        ? "Your recent sleep pattern may be making recovery and mood harder."
        : "Your recent sleep pattern does not show a strong warning signal.",
      input.wellbeingFlagged
        ? "Mood and resilience look lower than expected, so a short clinic-led check-in is sensible."
        : "Mood and resilience are not the main issue right now.",
      input.movementPct < 70
        ? "A steady walking routine is likely to help more than a complicated plan."
        : "Consistency is working in your favour. Keep the routine simple.",
    ];
  }

  return [
    input.cardioStatus === "red"
      ? "Cardiovascular risk is elevated based on blood pressure and baseline risk features."
      : "Cardiovascular risk is currently not the primary escalation driver.",
    input.sleepFlagged
      ? "Sleep fragmentation is contributing to the current prevention profile."
      : "Sleep fragmentation is not materially changing the prevention profile.",
    input.wellbeingFlagged
      ? "WHO-5 wellbeing and cognitive reserve indicators suggest follow-up should be considered."
      : "WHO-5 wellbeing and cognitive reserve indicators remain within a manageable range.",
  ];
}

interface DashboardClientProps {
  ehr: EhrRecord;
  wearable: WearableTelemetry[];
  lifestyle: LifestyleSurvey;
}

export function DashboardClient({ ehr, wearable, lifestyle }: DashboardClientProps) {
  const [activeCoachSuggestion, setActiveCoachSuggestion] = useState<string | null>(null);
  const [plainLanguageMode, setPlainLanguageMode] = useState(true);
  const [weeklyActionDone, setWeeklyActionDone] = useState(false);
  const [memoryCheckOpen, setMemoryCheckOpen] = useState(false);
  const [memoryCheckCompleted, setMemoryCheckCompleted] = useState(false);
  const [memoryConfidence, setMemoryConfidence] = useState(3);
  const [moodState, setMoodState] = useState(3);
  const [sleepStability, setSleepStability] = useState(3);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpRequested, setFollowUpRequested] = useState(false);

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

  const hrAvg7 = average(prev7.map((d) => d.resting_hr_bpm));
  const hrvAvg7 = average(prev7.map((d) => d.hrv_rmssd_ms));
  const stepsAvg7 = average(prev7.map((d) => d.steps));
  const sleepAvg7 = average(prev7.map((d) => d.sleep_duration_hrs));

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

  return (
    <div className="flex gap-6">
      <div className="mx-auto flex min-w-0 max-w-[1400px] flex-1 flex-col gap-8">
        <section className="animate-in flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border-0 bg-primary/10 px-2.5 py-1 text-primary">
                Concerned Preventer experience
              </Badge>
              <StatusBadge status={features.cardioRisk.status} />
            </div>
            <h1 className="font-heading text-fluid-3xl leading-none text-foreground">
              Plain-language prevention with a trust-first clinic tone.
            </h1>
            <p className="mt-3 max-w-2xl text-fluid-base leading-relaxed text-muted-foreground">
              This dashboard is tuned for the Concerned Preventer persona: fewer numbers, clearer signals, one weekly action, and a direct path back to trusted care.
            </p>
          </div>
          <Button
            variant={plainLanguageMode ? "default" : "outline"}
            size="sm"
            onClick={() => setPlainLanguageMode((current) => !current)}
          >
            <BookOpenText />
            Plain-language mode {plainLanguageMode ? "On" : "Off"}
          </Button>
        </section>

        {priorityCoachSuggestions.length > 0 ? (
          <section className="animate-in flex flex-col gap-4">
            <h3 className="text-fluid-lg text-foreground">Coach suggestions</h3>
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

      <section className="animate-in grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BioAgeCard data={features.bioAge} chronologicalAge={ehr.age} />
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
              <div>
                <CardTitle className="text-fluid-lg">My Heart Today</CardTitle>
                <CardDescription>{heartHeadline}</CardDescription>
              </div>
              <StatusBadge status={features.cardioRisk.status} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="rounded-xl bg-surface-2 p-4">
              <p className="text-fluid-base leading-relaxed text-foreground/85">{heartBody}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-background px-4 py-3 ring-1 ring-foreground/10">
                <p className="text-fluid-xs uppercase tracking-wider text-muted-foreground">Blood pressure</p>
                <p className="mt-1 font-data text-fluid-lg text-foreground">{features.bpControl.sbp}/{features.bpControl.dbp}</p>
              </div>
              <div className="rounded-xl bg-background px-4 py-3 ring-1 ring-foreground/10">
                <p className="text-fluid-xs uppercase tracking-wider text-muted-foreground">Risk signal</p>
                <p className="mt-1 text-fluid-lg text-foreground capitalize">{features.cardioRisk.status}</p>
              </div>
              <div className="rounded-xl bg-background px-4 py-3 ring-1 ring-foreground/10">
                <p className="text-fluid-xs uppercase tracking-wider text-muted-foreground">Clinical note</p>
                <p className="mt-1 text-fluid-sm text-foreground">{features.bpControl.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle className="text-fluid-lg">One Thing This Week</CardTitle>
            <CardDescription>One clear action only. Keep the plan realistic.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-xl bg-primary/8 p-4">
              <p className="text-fluid-lg text-foreground">{weeklyAction.title}</p>
              <p className="mt-2 text-fluid-base leading-relaxed text-muted-foreground">{weeklyAction.body}</p>
            </div>
            <div className="rounded-xl bg-background px-4 py-3 ring-1 ring-foreground/10">
              <p className="text-fluid-xs uppercase tracking-wider text-muted-foreground">Why this one</p>
              <p className="mt-1 text-fluid-sm text-foreground/85">{weeklyAction.reason}</p>
            </div>
            <Button onClick={() => setWeeklyActionDone(true)}>
              {weeklyActionDone ? <CheckCircle2 /> : <CalendarCheck2 />}
              {weeklyActionDone ? "Weekly action added to plan" : "Add weekly action"}
            </Button>
            {weeklyActionDone ? (
              <div className="rounded-xl bg-status-normal/10 px-4 py-3 ring-1 ring-status-normal/20">
                <p className="text-fluid-sm font-medium text-status-normal">Saved to weekly plan</p>
                <p className="mt-1 text-fluid-sm text-foreground/80">
                  {weeklyAction.title} is now the single focus action for this week.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="animate-in stagger-3 grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-0 bg-surface-1">
          <CardHeader>
            <CardTitle className="text-fluid-lg">Explain It Simply</CardTitle>
            <CardDescription>
              {plainLanguageMode
                ? "Every insight is translated into calm, non-diagnostic language."
                : "Switch plain-language mode back on if you want the softer version."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {explainBullets.map((bullet) => (
              <div key={bullet} className="flex gap-3 rounded-xl bg-background px-4 py-3 ring-1 ring-foreground/8">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                <p className="text-fluid-sm leading-relaxed text-foreground/85">{bullet}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-surface-1">
          <CardHeader className="gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-fluid-lg">Memory & Mood Check-in</CardTitle>
                <CardDescription>Low-friction reassurance with a clinician-aware escalation path.</CardDescription>
              </div>
              <StatusBadge status={features.wellbeing.level} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-xl bg-surface-2 p-4">
              <p className="text-fluid-base leading-relaxed text-foreground/85">{memoryBody}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-background px-4 py-3 ring-1 ring-foreground/10">
                <p className="text-fluid-xs uppercase tracking-wider text-muted-foreground">WHO-5 wellbeing</p>
                <p className="mt-1 font-data text-fluid-lg text-foreground">{features.wellbeing.who5}</p>
              </div>
              <div className="rounded-xl bg-background px-4 py-3 ring-1 ring-foreground/10">
                <p className="text-fluid-xs uppercase tracking-wider text-muted-foreground">Cognitive reserve</p>
                <p className="mt-1 text-fluid-lg capitalize text-foreground">{features.cognitiveReserve.level}</p>
              </div>
            </div>
            <Button variant={memoryCheckCompleted ? "secondary" : "outline"} onClick={() => setMemoryCheckOpen(true)}>
              <Brain />
              {memoryCheckCompleted ? "Review check-in" : "Start 2-minute check-in"}
            </Button>
            {memoryCheckCompleted ? (
              <div className="rounded-xl bg-status-info/8 px-4 py-3 ring-1 ring-status-info/15">
                <p className="text-fluid-sm font-medium text-foreground">Latest check-in summary</p>
                <p className="mt-1 text-fluid-sm text-muted-foreground">{memoryCheckRecommendation}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="animate-in stagger-4">
        <Card className="border-0 bg-surface-1">
          <CardHeader className="gap-3">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="size-4" />
              <span className="text-fluid-xs uppercase tracking-wider">Trusted Care Path</span>
            </div>
            <CardTitle className="text-fluid-xl">Direct clinic follow-up, without the app chaos.</CardTitle>
            <CardDescription>
              Trust-first routing for the Concerned Preventer persona: simple explanation, one action, then a direct handoff back to care.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <div className="rounded-xl bg-background px-4 py-4 ring-1 ring-foreground/10">
                <p className="text-fluid-sm font-medium text-foreground">1. Review your signal in plain language</p>
                <p className="mt-1 text-fluid-sm text-muted-foreground">No dense lab wall. Just the clearest prevention message for this week.</p>
              </div>
              <div className="rounded-xl bg-background px-4 py-4 ring-1 ring-foreground/10">
                <p className="text-fluid-sm font-medium text-foreground">2. Do one weekly action</p>
                <p className="mt-1 text-fluid-sm text-muted-foreground">Walking, sleep stabilisation, or a short check-in - whichever has the best impact-to-effort ratio.</p>
              </div>
              <div className="rounded-xl bg-background px-4 py-4 ring-1 ring-foreground/10">
                <p className="text-fluid-sm font-medium text-foreground">3. Let the clinic follow up directly</p>
                <p className="mt-1 text-fluid-sm text-muted-foreground">If the signal stays yellow or turns red, hand the next step back to trusted care instead of leaving the user alone.</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 rounded-xl bg-primary/6 p-4">
              <div>
                <p className="text-fluid-sm font-medium text-foreground">Recommended follow-up</p>
                <p className="mt-1 text-fluid-base leading-relaxed text-muted-foreground">
                  {features.cardioRisk.status === "red"
                    ? "Request a clinic review for blood pressure and cardiovascular prevention."
                    : features.wellbeing.depressionFlag
                      ? "Request a short clinician-led mood and resilience check-in."
                      : "Request a preventive check-in with your clinic team to keep momentum simple and trusted."}
                </p>
              </div>
              <div className="rounded-xl bg-background px-4 py-3 ring-1 ring-foreground/10">
                <p className="text-fluid-xs uppercase tracking-wider text-muted-foreground">Trust-first note</p>
                <p className="mt-1 text-fluid-sm text-foreground/85">
                  This dashboard provides preventive guidance only. High-risk users should confirm with a clinician.
                </p>
              </div>
              <Button onClick={() => setFollowUpOpen(true)}>
                {followUpRequested ? <CheckCircle2 /> : <ArrowRight />}
                {followUpRequested ? "Review clinic follow-up" : "Request clinic follow-up"}
              </Button>
              {followUpRequested ? (
                <div className="rounded-xl bg-status-normal/10 px-4 py-3 ring-1 ring-status-normal/20">
                  <p className="text-fluid-sm font-medium text-status-normal">Clinic follow-up requested</p>
                  <p className="mt-1 text-fluid-sm text-foreground/80">
                    {followUpLabel} has been queued with a suggested timing of {followUpTiming}.
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="animate-in stagger-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrendChart
          title="Readiness & Recovery - 30 days"
          data={dailyScoreData}
          series={[
            { dataKey: "readiness", label: "Readiness", color: "var(--chart-1)" },
            { dataKey: "recovery", label: "Recovery", color: "var(--chart-2)" },
          ]}
          yDomain={[50, 100]}
        />
        <TrendChart
          title="Resting HR & HRV - 30 days"
          data={vitalChartData}
          series={[
            { dataKey: "resting_hr", label: "Resting HR", color: "var(--chart-4)" },
            { dataKey: "hrv", label: "HRV", color: "var(--chart-5)" },
          ]}
        />
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
            </div>
          </div>
          <SheetFooter className="border-t">
            <Button
              variant="outline"
              onClick={() => setMemoryCheckOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setMemoryCheckCompleted(true);
                setMemoryCheckOpen(false);
              }}
            >
              <ClipboardCheck />
              Save check-in
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <SheetContent side="right" className="w-full max-w-xl gap-0">
          <SheetHeader className="border-b">
            <SheetTitle>Trusted Care Path</SheetTitle>
            <SheetDescription>
              A direct clinic handoff for the Concerned Preventer persona. Designed to feel simple and supported.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-5 p-4">
            <div className="rounded-xl bg-primary/8 p-4">
              <p className="text-fluid-sm font-medium text-foreground">Recommended follow-up</p>
              <p className="mt-1 text-fluid-lg text-foreground">{followUpLabel}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="rounded-full border-0 bg-background text-foreground">
                  <Clock3 />
                  {followUpTiming}
                </Badge>
                <StatusBadge status={features.cardioRisk.status === "red" ? "red" : features.wellbeing.level} />
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-xl bg-background px-4 py-4 ring-1 ring-foreground/10">
                <p className="text-fluid-sm font-medium text-foreground">1. What the clinic will review</p>
                <p className="mt-1 text-fluid-sm text-muted-foreground">
                  {features.cardioRisk.status === "red"
                    ? "Blood pressure, cardiovascular risk drivers, and the safest next prevention step."
                    : features.wellbeing.depressionFlag
                      ? "Mood resilience, sleep burden, and whether additional support is needed."
                      : "Your current prevention profile and the simplest next action to maintain progress."}
                </p>
              </div>
              <div className="rounded-xl bg-background px-4 py-4 ring-1 ring-foreground/10">
                <p className="text-fluid-sm font-medium text-foreground">2. What the patient can expect</p>
                <p className="mt-1 text-fluid-sm text-muted-foreground">
                  A short clinic-led follow-up, plain-language explanation, and one agreed next step.
                </p>
              </div>
              <div className="rounded-xl bg-background px-4 py-4 ring-1 ring-foreground/10">
                <p className="text-fluid-sm font-medium text-foreground">3. Safety note</p>
                <p className="mt-1 text-fluid-sm text-muted-foreground">
                  This request is for preventive guidance only. High-risk users should still confirm clinical decisions with a qualified clinician.
                </p>
              </div>
            </div>
          </div>
          <SheetFooter className="border-t">
            <Button variant="outline" onClick={() => setFollowUpOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFollowUpRequested(true);
                setFollowUpOpen(false);
              }}
            >
              <CheckCircle2 />
              Confirm clinic handoff
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      </div>

      <aside className="hidden w-[380px] shrink-0 xl:block">
        <div className="sticky top-0">
          <HealthCompanion />
        </div>
      </aside>
    </div>
  );
}

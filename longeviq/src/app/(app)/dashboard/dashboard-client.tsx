"use client";

import { useEffect, useState } from "react";

import { computeAllFeatures } from "@/lib/features";
import {
  buildDailyPriority,
  formatMainFocusText,
  inferSuggestionPriorityDomain,
} from "@/lib/coach/decision-engine";
import { generateCoachSuggestions } from "@/lib/coach/generate-suggestions";
import { ALERT_MODE_STORAGE_KEY, isAlertMode } from "@/lib/profile";
import type {
  AlertMode,
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

function HeartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 0 1 8 4.5 3.5 3.5 0 0 1 13.5 7C13.5 10.5 8 14 8 14Z" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 8h-2.5l-2 4-3-8-2 4H2" />
    </svg>
  );
}

function FootprintsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10c1.5 0 2-1.5 2-3S5.5 4 4 4 2 5.5 2 7s.5 3 2 3ZM12 12c1.5 0 2-1.5 2-3s-.5-3-2-3-2 1.5-2 3 .5 3 2 3ZM4 10v2M12 12v2" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.5 8.5a5.5 5.5 0 1 1-6-6 4.5 4.5 0 0 0 6 6Z" />
    </svg>
  );
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function trendPct(current: number, avgVal: number) {
  if (avgVal === 0) return 0;
  return ((current - avgVal) / avgVal) * 100;
}

function getRecommendationFocusForSuggestion(suggestion: CoachSuggestion | null) {
  if (!suggestion) return "/recommendations";

  const domain = inferSuggestionPriorityDomain(suggestion);
  const normalized = `${suggestion.title} ${suggestion.rationale} ${suggestion.action}`.toLowerCase();

  if (domain === "sleep") return "/recommendations?focus=sleep-reset";
  if (domain === "activity") return "/recommendations?focus=movement-plan";
  if (domain === "mood" || domain === "recovery") {
    return "/recommendations?focus=recovery-review";
  }
  if (
    normalized.includes("metabol") ||
    normalized.includes("gluk") ||
    normalized.includes("hba1c")
  ) {
    return "/recommendations?focus=metabolic-diagnostics";
  }
  if (
    normalized.includes("ernährung") ||
    normalized.includes("ernahrung") ||
    normalized.includes("hydration")
  ) {
    return "/recommendations?focus=nutrition-review";
  }

  return "/recommendations?focus=cardio-review";
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
  const [alertMode] = useState<AlertMode>(() => {
    if (typeof window === "undefined") {
      return "simple";
    }

    const storedMode = window.localStorage.getItem(ALERT_MODE_STORAGE_KEY);
    return storedMode && isAlertMode(storedMode) ? storedMode : "simple";
  });
  const features = computeAllFeatures(ehr, wearable, lifestyle);
  const dailyPriority = buildDailyPriority(features, ehr);
  const mainSuggestion = generateCoachSuggestions(features, ehr, { limit: 1 })[0] ?? null;
  const detailedSuggestions = generateCoachSuggestions(features, ehr, {
    includeGreen: false,
    limit: 4,
  });
  const detailedAlertCards = detailedSuggestions
    .filter((suggestion) => suggestion.title !== mainSuggestion?.title)
    .slice(0, 3);
  const mainFocusText = formatMainFocusText({
    suggestion: mainSuggestion,
    fallback: dailyPriority,
  });

  const latest = wearable[wearable.length - 1];
  const prev7 = wearable.slice(-8, -1);

  const restingHrAvg7 = average(prev7.map((day) => day.resting_hr_bpm));
  const hrvAvg7 = average(prev7.map((day) => day.hrv_rmssd_ms));
  const stepsAvg7 = average(prev7.map((day) => day.steps));
  const sleepAvg7 = average(prev7.map((day) => day.sleep_duration_hrs));

  useEffect(() => {
    if (alertMode !== "notification") return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (window.Notification.permission !== "granted") return;

    const activeSuggestion = mainSuggestion ?? detailedSuggestions[0] ?? null;
    if (!activeSuggestion) return;

    const domain = inferSuggestionPriorityDomain(activeSuggestion);
    const hour = new Date().getHours();
    const scheduledHour =
      domain === "sleep"
        ? 19
        : domain === "clinical"
          ? 9
          : domain === "recovery"
            ? 12
            : domain === "mood"
              ? 13
              : 8;

    if (hour < scheduledHour || hour >= scheduledHour + 2) return;

    const key = `longeviq-alert-notification:${new Date().toISOString().slice(0, 10)}:${domain}`;
    if (window.localStorage.getItem(key)) return;

    window.localStorage.setItem(key, "sent");
    window.Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new window.Notification("LongevIQ", {
          body: formatMainFocusText({
            suggestion: activeSuggestion,
            fallback: dailyPriority,
          }),
        });
      }
    });
  }, [alertMode, dailyPriority, detailedSuggestions, mainSuggestion]);

  return (
    <div className="flex gap-6">
      <div className="mx-auto flex min-w-0 max-w-[1400px] flex-1 flex-col gap-8">
        {alertMode === "detailed" ? (
          detailedAlertCards.length > 0 ? (
            <section className="animate-in flex flex-col gap-3 lg:flex-row">
              {detailedAlertCards.map((suggestion) => (
                <CoachCard
                  key={suggestion.title}
                  suggestion={suggestion}
                  actionHref={getRecommendationFocusForSuggestion(suggestion)}
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
            </section>
          ) : null
        ) : (
          <section className="animate-in">
            <div className="overflow-hidden rounded-[2rem] border border-white/84 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(249,250,252,0.94)_58%,rgba(240,244,251,0.88)_100%)] p-5 shadow-[0_24px_48px_-36px_rgba(29,29,31,0.16)] ring-1 ring-black/[0.04] sm:p-6">
              <div className="flex items-stretch gap-4 sm:gap-5">
                <div className="w-1 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="mb-2 text-sm font-semibold tracking-[0.04em] text-primary">
                    Main priority today
                  </p>
                  <p className="text-[clamp(1.1rem,0.95rem+0.45vw,1.5rem)] font-medium leading-relaxed text-foreground">
                    {mainFocusText}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

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
            trend={trendPct(latest.resting_hr_bpm, restingHrAvg7)}
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

"use client";

import { useMemo } from "react";

import { generateCoachSuggestions } from "@/lib/coach/generate-suggestions";
import { computeAllFeatures, recoveryScoreDaily } from "@/lib/features";
import type {
  CoachSuggestion,
  EhrRecord,
  LifestyleSurvey,
  WearableTelemetry,
} from "@/lib/types";
import { HealthCompanion } from "@/components/dashboard";
import { PersonaDashboard } from "@/components/dashboard/persona-experiences";
import { useProfilePreferences } from "@/components/profile/profile-preferences-provider";

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
  const { profile, updateProfile } = useProfilePreferences();

  const features = useMemo(
    () => computeAllFeatures(ehr, wearable, lifestyle),
    [ehr, wearable, lifestyle]
  );

  const priorityCoachSuggestions = useMemo(() => {
    const generated = generateCoachSuggestions(features, ehr).filter(
      (suggestion) => suggestion.severity !== "green"
    );

    return [
      ...generated,
      ...coachPreviewFallbacks.filter(
        (fallback) => !generated.some((suggestion) => suggestion.title === fallback.title)
      ),
    ]
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
      .slice(0, 3);
  }, [features, ehr]);

  const dailyScoreData = useMemo(
    () =>
      wearable.map((_, index) => {
        const recovery = recoveryScoreDaily(wearable, index);
        return {
          date: wearable[index].date,
          readiness: recovery.score,
          recovery: recovery.score,
        };
      }),
    [wearable]
  );

  const vitalChartData = useMemo(
    () =>
      wearable.map((day) => ({
        date: day.date,
        resting_hr: day.resting_hr_bpm,
        hrv: day.hrv_rmssd_ms,
      })),
    [wearable]
  );

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <PersonaDashboard
          profile={profile}
          onPersonaChange={(value) => updateProfile({ persona_hint: value as typeof profile.persona_hint })}
          onUiModeChange={(value) => updateProfile({ ui_mode: value as typeof profile.ui_mode })}
          data={{
            ehr,
            wearable,
            lifestyle,
            features,
            dailyScoreData,
            vitalChartData,
            priorityCoachSuggestions,
          }}
        />
      </div>

      <aside className="hidden w-[380px] shrink-0 xl:block">
        <div className="sticky top-0">
          <HealthCompanion />
        </div>
      </aside>
    </div>
  );
}

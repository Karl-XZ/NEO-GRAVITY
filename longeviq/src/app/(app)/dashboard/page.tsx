"use client";

import { useRouter } from "next/navigation";
import { useAppState } from "@/components/AppState";
import { NoActiveCase } from "@/components/session/no-active-case";
import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  const router = useRouter();
  const { ehr, wearable, lifestyle, startQuestionnaireSignup } = useAppState();

  const handleStartQuestionnaire = () => {
    startQuestionnaireSignup();
    router.push("/assessment?mode=questionnaire");
  };

  if (!ehr || wearable.length === 0 || !lifestyle) {
    return (
      <div className="space-y-4">
        <NoActiveCase title="Kein aktiver Account im Dashboard" />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleStartQuestionnaire}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Fragebogen neu starten
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardClient ehr={ehr} wearable={wearable} lifestyle={lifestyle} />
  );
}

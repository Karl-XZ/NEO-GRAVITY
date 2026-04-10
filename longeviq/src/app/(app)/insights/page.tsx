"use client";

import { useAppState } from "@/components/AppState";
import { NoActiveCase } from "@/components/session/no-active-case";
import { InsightsClient } from "./insights-client";

export default function InsightsPage() {
  const { ehr, wearable, lifestyle } = useAppState();

  if (!ehr || wearable.length === 0 || !lifestyle) {
    return (
      <NoActiveCase title="Kein aktiver Account in den Analysen" />
    );
  }

  return <InsightsClient ehr={ehr} wearable={wearable} lifestyle={lifestyle} />;
}

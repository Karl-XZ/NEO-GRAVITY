"use client";

import { useAppState } from "@/components/AppState";
import { NoActiveCase } from "@/components/session/no-active-case";
import { JourneyClient } from "./journey-client";

export default function JourneyPage() {
  const { ehr, wearable, lifestyle } = useAppState();

  if (!ehr || wearable.length === 0 || !lifestyle) {
    return (
      <NoActiveCase title="Kein aktiver Account in der Roadmap" />
    );
  }

  return <JourneyClient ehr={ehr} wearable={wearable} lifestyle={lifestyle} />;
}

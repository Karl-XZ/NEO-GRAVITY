"use client";

import { useAppState } from "@/components/AppState";
import { NoActiveCase } from "@/components/session/no-active-case";
import { CoachClient } from "./coach-client";

export default function CoachPage() {
  const { ehr, wearable, lifestyle } = useAppState();

  if (!ehr || wearable.length === 0 || !lifestyle) {
    return (
      <NoActiveCase title="Kein aktiver Account im Coach" />
    );
  }

  return <CoachClient ehr={ehr} wearable={wearable} lifestyle={lifestyle} />;
}

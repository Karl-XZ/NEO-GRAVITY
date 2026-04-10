"use client";

import { useAppState } from "@/components/AppState";
import { NoActiveCase } from "@/components/session/no-active-case";
import { BiomarkersClient } from "./biomarkers-client";

export default function BiomarkersPage() {
  const { ehr, wearable } = useAppState();

  if (!ehr || wearable.length === 0) {
    return (
      <NoActiveCase title="Kein aktiver Account in den Biomarkern" />
    );
  }

  return <BiomarkersClient ehr={ehr} wearable={wearable} />;
}

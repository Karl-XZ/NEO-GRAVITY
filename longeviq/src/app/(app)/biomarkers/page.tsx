import { getEhrRecord, getWearable } from "@/lib/data";
import { BiomarkersClient } from "./biomarkers-client";

export default async function BiomarkersPage() {
  const [ehr, wearable] = await Promise.all([
    getEhrRecord(),
    getWearable(30),
  ]);

  return <BiomarkersClient ehr={ehr} wearable={wearable} />;
}

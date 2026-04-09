import { getEhrRecord, getWearable, getLifestyle } from "@/lib/data";
import { CoachClient } from "./coach-client";

export default async function CoachPage() {
  const [ehr, wearable, lifestyle] = await Promise.all([
    getEhrRecord(),
    getWearable(30),
    getLifestyle(),
  ]);

  return <CoachClient ehr={ehr} wearable={wearable} lifestyle={lifestyle} />;
}

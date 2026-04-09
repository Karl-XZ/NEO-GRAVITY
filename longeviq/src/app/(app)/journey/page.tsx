import { getEhrRecord, getWearable, getLifestyle } from "@/lib/data";
import { JourneyClient } from "./journey-client";

export default async function JourneyPage() {
  const [ehr, wearable, lifestyle] = await Promise.all([
    getEhrRecord(),
    getWearable(30),
    getLifestyle(),
  ]);

  return <JourneyClient ehr={ehr} wearable={wearable} lifestyle={lifestyle} />;
}

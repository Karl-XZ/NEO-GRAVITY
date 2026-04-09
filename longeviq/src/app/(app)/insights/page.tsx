import { getEhrRecord, getWearable, getLifestyle } from "@/lib/data";
import { InsightsClient } from "./insights-client";

export default async function InsightsPage() {
  const [ehr, wearable, lifestyle] = await Promise.all([
    getEhrRecord(),
    getWearable(30),
    getLifestyle(),
  ]);

  return (
    <InsightsClient ehr={ehr} wearable={wearable} lifestyle={lifestyle} />
  );
}

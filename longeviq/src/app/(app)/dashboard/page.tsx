import { getEhrRecord, getWearable, getLifestyle } from "@/lib/data";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const [ehr, wearable, lifestyle] = await Promise.all([
    getEhrRecord(),
    getWearable(30),
    getLifestyle(),
  ]);

  return (
    <DashboardClient ehr={ehr} wearable={wearable} lifestyle={lifestyle} />
  );
}

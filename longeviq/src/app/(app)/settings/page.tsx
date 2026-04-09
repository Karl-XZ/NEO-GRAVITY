import { getUserProfile } from "@/lib/data";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const profile = await getUserProfile();

  return <SettingsClient initialProfile={profile} />;
}

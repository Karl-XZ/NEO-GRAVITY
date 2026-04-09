import { getUserProfile } from "@/lib/data";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();

  return <AppShell profile={profile}>{children}</AppShell>;
}

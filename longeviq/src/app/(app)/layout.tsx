import { getUserProfile } from "@/lib/data";
import { AppShell } from "@/components/layout/app-shell";
import { AppProvider } from "@/components/AppState";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();

  return (
    <AppProvider>
      <AppShell profile={profile}>{children}</AppShell>
    </AppProvider>
  );
}

import type { UserProfile } from "@/lib/types";
import { ProfilePreferencesProvider } from "@/components/profile/profile-preferences-provider";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: UserProfile;
}) {
  return (
    <ProfilePreferencesProvider initialProfile={profile}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    </ProfilePreferencesProvider>
  );
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { UserProfile } from "@/lib/types";

const STORAGE_KEY = "longeviq-profile-preferences:v1";

type StoredProfileOverrides = Partial<
  Pick<
    UserProfile,
    "display_name" | "email" | "city" | "timezone" | "persona_hint" | "ui_mode"
  >
>;

type ProfilePreferencesContextValue = {
  profile: UserProfile;
  updateProfile: (patch: StoredProfileOverrides) => void;
  resetProfilePreferences: () => void;
};

const ProfilePreferencesContext = createContext<ProfilePreferencesContextValue | null>(null);

function mergeProfile(
  initialProfile: UserProfile,
  overrides: StoredProfileOverrides
): UserProfile {
  return {
    ...initialProfile,
    ...overrides,
    display_name: overrides.display_name ?? initialProfile.display_name,
    email: overrides.email ?? initialProfile.email,
    city: overrides.city ?? initialProfile.city,
    timezone: overrides.timezone ?? initialProfile.timezone,
    persona_hint: overrides.persona_hint ?? initialProfile.persona_hint,
    ui_mode: overrides.ui_mode ?? initialProfile.ui_mode,
  };
}

function readStoredOverrides(): StoredProfileOverrides | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredProfileOverrides) : null;
  } catch {
    return null;
  }
}

export function ProfilePreferencesProvider({
  children,
  initialProfile,
}: {
  children: ReactNode;
  initialProfile: UserProfile;
}) {
  const [overrides, setOverrides] = useState<StoredProfileOverrides>({});

  useEffect(() => {
    const storedOverrides = readStoredOverrides();

    if (!storedOverrides) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setOverrides(storedOverrides);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (Object.keys(overrides).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides]);

  const profile = useMemo(
    () => mergeProfile(initialProfile, overrides),
    [initialProfile, overrides]
  );

  const value = useMemo<ProfilePreferencesContextValue>(
    () => ({
      profile,
      updateProfile: (patch) => {
        setOverrides((current) => ({ ...current, ...patch }));
      },
      resetProfilePreferences: () => {
        setOverrides({});
      },
    }),
    [profile]
  );

  return (
    <ProfilePreferencesContext.Provider value={value}>
      {children}
    </ProfilePreferencesContext.Provider>
  );
}

export function useProfilePreferences() {
  const context = useContext(ProfilePreferencesContext);

  if (!context) {
    throw new Error("useProfilePreferences must be used within ProfilePreferencesProvider");
  }

  return context;
}

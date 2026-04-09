import type { AlertMode, PersonaHint, UserProfile } from "./types";

export const ALERT_MODE_STORAGE_KEY = "longeviq-alert-mode";

export interface RegionalHealthAlert {
  title: string;
  detail: string;
  tone: "info" | "warning" | "critical";
}

export function isAlertMode(value: string): value is AlertMode {
  return value === "simple" || value === "detailed" || value === "notification";
}

export function getStoredAlertMode(defaultMode: AlertMode): AlertMode {
  if (typeof window === "undefined") {
    return defaultMode;
  }

  const storedMode = window.localStorage.getItem(ALERT_MODE_STORAGE_KEY);
  return storedMode && isAlertMode(storedMode) ? storedMode : defaultMode;
}

export const PERSONA_LABELS: Record<PersonaHint, string> = {
  "preventive-performer": "Preventive Performer",
  "concerned-preventer": "Concerned Preventer",
  "digital-optimizer": "Digital Optimizer",
  "clinic-anchored-loyalist": "Clinic-Anchored Loyalist",
};

export function getProfileInitials(displayName: UserProfile["display_name"]) {
  if (!displayName) {
    return "U";
  }

  const parts = displayName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getPersonaLabel(personaHint: UserProfile["persona_hint"]) {
  if (!personaHint) {
    return "Profil wird kalibriert";
  }

  return PERSONA_LABELS[personaHint];
}

export function getRegionalHealthAlert(
  profile: Pick<UserProfile, "city" | "country_code" | "timezone">,
  now = new Date(),
): RegionalHealthAlert {
  const month = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: profile.timezone,
      month: "numeric",
    }).format(now),
  );
  const regionLabel = `${profile.city}, ${profile.country_code}`;

  if (month >= 3 && month <= 5) {
    return {
      title: `${regionLabel}: pollen elevated`,
      detail: "If you are sensitive, keep outdoor intensity lighter and plan recovery indoors.",
      tone: "warning",
    };
  }

  if (month >= 6 && month <= 8) {
    return {
      title: `${regionLabel}: heat strain risk`,
      detail: "Hydrate early and avoid your hardest outdoor training in the hottest hours.",
      tone: "warning",
    };
  }

  if (month >= 9 && month <= 11) {
    return {
      title: `${regionLabel}: respiratory season`,
      detail: "Sleep, hydration, and lighter load are worth prioritizing if you feel run down.",
      tone: "info",
    };
  }

  return {
    title: `${regionLabel}: cold and flu pressure`,
    detail: "Recovery, layering, and lower-intensity outdoor sessions are the safer baseline today.",
    tone: "critical",
  };
}

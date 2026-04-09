import type { PersonaHint, UiMode, UserProfile } from "./types";

export const PERSONA_LABELS: Record<PersonaHint, string> = {
  "preventive-performer": "Aktive Vorsorge",
  "concerned-preventer": "Einfach & Sicher",
  "digital-optimizer": "Daten & Trends",
  "clinic-anchored-loyalist": "Klinikbegleitung",
};

export const UI_MODE_LABELS: Record<UiMode, string> = {
  simple: "Kompakt",
  standard: "Standard",
  expert: "Detailliert",
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

export function getUiModeLabel(uiMode: UserProfile["ui_mode"]) {
  return UI_MODE_LABELS[uiMode] ?? "Standard";
}

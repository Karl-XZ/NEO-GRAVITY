import type { PersonaHint, UserProfile } from "./types";

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

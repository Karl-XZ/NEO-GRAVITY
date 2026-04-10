"use client";

import { useState, useSyncExternalStore } from "react";
import { Activity, Mail, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { useAppState } from "@/components/AppState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ALERT_MODE_STORAGE_KEY,
  getStoredAlertMode,
  getProfileInitials,
} from "@/lib/profile";
import type { AlertMode, UserProfile } from "@/lib/types";

type EditableProfileState = {
  displayName: string;
  email: string;
  city: string;
  timezone: string;
};

function createEditableState(profile: UserProfile): EditableProfileState {
  return {
    displayName: profile.display_name ?? "",
    email: profile.email,
    city: profile.city,
    timezone: profile.timezone,
  };
}

function subscribeToAlertMode() {
  return () => {};
}

const alertModeOptions: Array<{
  value: AlertMode;
  label: string;
  description: string;
}> = [
  {
    value: "simple",
    label: "Kompakt",
    description: "Zeigt nur den Hauptfokus des Tages.",
  },
  {
    value: "detailed",
    label: "Erweitert",
    description: "Zeigt zusaetzlich die 3 wichtigsten Alerts unter dem Tagesfokus.",
  },
  {
    value: "notification",
    label: "Hinweis",
    description: "Sendet Browser-Hinweise zum passenden Zeitpunkt des Tages.",
  },
];

export function SettingsClient() {
  const { currentProfile, selectedPatient, updateCurrentProfile } = useAppState();
  const profileResetKey = [
    currentProfile.id,
    currentProfile.patient_id,
    currentProfile.display_name ?? "",
    selectedPatient?.patientId ?? "none",
  ].join(":");

  return (
    <SettingsPanel
      key={profileResetKey}
      currentProfile={currentProfile}
      selectedPatient={selectedPatient}
      updateCurrentProfile={updateCurrentProfile}
    />
  );
}

function SettingsPanel({
  currentProfile,
  selectedPatient,
  updateCurrentProfile,
}: {
  currentProfile: UserProfile;
  selectedPatient: ReturnType<typeof useAppState>["selectedPatient"];
  updateCurrentProfile: ReturnType<typeof useAppState>["updateCurrentProfile"];
}) {
  const storedAlertMode = useSyncExternalStore(
    subscribeToAlertMode,
    () => getStoredAlertMode(currentProfile.alert_mode),
    () => currentProfile.alert_mode,
  );
  const [form, setForm] = useState<EditableProfileState>(() =>
    createEditableState(currentProfile),
  );
  const [selectedAlertMode, setSelectedAlertMode] = useState<AlertMode | null>(null);
  const [savedAt, setSavedAt] = useState("Noch nicht lokal geaendert");

  const currentAlertMode = selectedAlertMode ?? storedAlertMode;
  const isDirty =
    JSON.stringify(form) !== JSON.stringify(createEditableState(currentProfile)) ||
    currentAlertMode !== currentProfile.alert_mode;
  const profileCompletion = Math.round(
    ([form.displayName, form.email, form.city, form.timezone, currentAlertMode].filter(Boolean)
      .length /
      5) *
      100,
  );

  const initials = getProfileInitials(form.displayName);
  const isQuestionnaireDraft =
    selectedPatient?.source !== "questionnaire" &&
    currentProfile.patient_id === "Q-SELF-BASELINE";
  const activeSource = selectedPatient?.source ?? (isQuestionnaireDraft ? "questionnaire" : null);
  const currentDataSources =
    activeSource === "questionnaire"
      ? [
          {
            name: "Fragebogen-Basislinie",
            status: "Aktiv",
            detail: "Gerade aus Ihren Antworten abgeleitet",
          },
          {
            name: "Wearable-Signale",
            status: "Geschaetzt",
            detail: "Aus Schlaf-, Aktivitaets- und Stressangaben abgeleitet",
          },
          {
            name: "Klinische Basiswerte",
            status: "Geschaetzt",
            detail: "Aus Selbstauskuenften fuer die Demo angenaehert",
          },
        ]
      : activeSource === "persona"
        ? [
            {
              name: "Persona-Fall aus dem Pitchdeck",
              status: "Aktiv",
              detail: "Kuratiertes Fallprofil passend zum PPT-Case-Login",
            },
            {
              name: "Klinische Basisdaten",
              status: "Geladen",
              detail: "Mit dem aktiven Persona-Fall verknuepft",
            },
            {
              name: "Wearable- und Lebensstil-Signale",
              status: "Geladen",
              detail: "Deterministische Demo-Daten passend zur Persona",
            },
          ]
        : activeSource === "supabase"
          ? [
              {
                name: "Elektronische Patientenakte",
                status: "Geladen",
                detail: "Mit dem aktiven Fall importiert",
              },
              {
                name: "Wearable-Telemetrie",
                status: "Geladen",
                detail: "Mit dem aktiven Fall importiert",
              },
              {
                name: "Lifestyle-Daten",
                status: "Geladen",
                detail: "Mit dem aktiven Fall importiert",
              },
            ]
          : [
              {
                name: "Startseite",
                status: "Bereit",
                detail: "Login-Fall auswaehlen oder Fragebogen beginnen",
              },
              {
                name: "Ergebnisansicht",
                status: "Bereit",
                detail: "Wird nach der Fall- oder Fragebogenwahl befuellt",
              },
              {
                name: "Empfehlungs-Merkliste",
                status: "Lokal",
                detail: "Nur in dieser Demo-Sitzung gespeichert",
              },
            ];
  const sourceSummary =
    activeSource === "questionnaire"
      ? "Fragebogen aktiv"
      : activeSource === "persona"
        ? "Persona-Fall aktiv"
        : activeSource === "supabase"
          ? "Importfall aktiv"
          : "Demo bereit";

  function updateField<Key extends keyof EditableProfileState>(
    key: Key,
    value: EditableProfileState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ALERT_MODE_STORAGE_KEY, currentAlertMode);
    }

    updateCurrentProfile({
      display_name: form.displayName || null,
      email: form.email,
      city: form.city,
      timezone: form.timezone,
      alert_mode: currentAlertMode,
    });

    if (
      currentAlertMode === "notification" &&
      typeof window !== "undefined" &&
      "Notification" in window
    ) {
      const permission = await window.Notification.requestPermission();
      if (permission === "granted") {
        setSavedAt("Gerade eben lokal gespeichert · Browser-Hinweise aktiv");
        return;
      }
      if (permission === "denied") {
        setSavedAt("Gespeichert · Browser-Hinweise sind blockiert");
        return;
      }
    }

    setSavedAt("Gerade eben lokal gespeichert");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-24">
      <div className="animate-in">
        <h1 className="text-fluid-xl font-semibold tracking-tight">
          Ihr Profil
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Verwalten Sie Ihre persoenlichen Angaben, Praeferenzen und den aktiven
          Demo-Kontext an einem Ort.
        </p>
      </div>

      <section className="grid gap-6">
        <Card className="animate-in overflow-hidden border border-border bg-[linear-gradient(135deg,rgba(5,150,105,0.09),rgba(37,99,235,0.05))]">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
            <Avatar className="size-24 ring-4 ring-white/70">
              <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-primary/25 bg-primary/15 text-primary">
                  {currentProfile.plan_label}
                </Badge>
                <Badge variant="outline">{sourceSummary}</Badge>
                <Badge variant="outline">{currentProfile.patient_id}</Badge>
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {form.displayName || "Profil vervollstaendigen"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentProfile.role_label} in {form.city},{" "}
                  {currentProfile.country_code} · Mitglied seit{" "}
                  {new Date(currentProfile.created_at).toLocaleDateString(
                    "de-DE",
                    {
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-white/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em]">
                    Datenkontext
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {sourceSummary}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em]">
                    Profilvollstaendigkeit
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {profileCompletion}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Basierend auf Ihren Profilangaben
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em]">
                    Letzte Speicherung
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {savedAt}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6">
        <Card className="animate-in">
          <CardHeader>
            <CardTitle>Persoenliche Angaben</CardTitle>
            <CardDescription>
              Aktualisieren Sie Ihre Kerndaten fuer diese lokale Demo-Sitzung.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display-name">Anzeigename</Label>
                <Input
                  id="display-name"
                  value={form.displayName}
                  onChange={(event) =>
                    updateField("displayName", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Zeitzone</Label>
                <Input
                  id="timezone"
                  value={form.timezone}
                  onChange={(event) =>
                    updateField("timezone", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Demo-Profilmodus</p>
                <p className="text-xs text-muted-foreground">
                  Aenderungen werden lokal gespeichert und aktualisieren direkt
                  Topbar und Profilansicht.
                </p>
              </div>
              <Button onClick={handleSave} disabled={!isDirty}>
                Profil speichern
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in">
          <CardHeader>
            <CardTitle>Alert-Typ</CardTitle>
            <CardDescription>
              Legen Sie fest, wie stark LongevIQ Ihre taeglichen Hinweise ausspielt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {alertModeOptions.map((option) => {
                const isActive = currentAlertMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedAlertMode(option.value)}
                    className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                      isActive
                        ? "border-primary bg-primary/8 ring-1 ring-primary/20"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{option.label}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="animate-in">
          <CardHeader>
            <CardTitle>Datenquellen</CardTitle>
            <CardDescription>
              Aktiver Demo-Kontext und verfuegbare Quellen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentDataSources.map((source) => (
              <div
                key={source.name}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{source.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {source.detail}
                  </p>
                </div>
                <Badge className="w-fit border-primary/25 bg-primary/15 text-primary">
                  {source.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="animate-in">
          <CardHeader>
            <CardTitle>Privatsphaere und Export</CardTitle>
            <CardDescription>
              Verwalten Sie Sichtbarkeit, Export und Kontosicherheit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="min-w-0 flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <Mail className="mt-0.5 size-4 text-primary" />
                <div className="min-w-0">
                  <p className="break-all text-sm font-medium">{form.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Primaere Kontaktadresse
                  </p>
                </div>
              </div>
              <div className="min-w-0 flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <MapPin className="mt-0.5 size-4 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {form.city}, {currentProfile.country_code}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Zeitzone: {form.timezone}
                  </p>
                </div>
              </div>
              <div className="min-w-0 flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <ShieldCheck className="mt-0.5 size-4 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Datenschutz aktiviert</p>
                  <p className="text-xs text-muted-foreground">
                    Profildaten bleiben in dieser Demo lokal.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="rounded-xl border border-border bg-background px-4 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <p className="text-sm font-medium">Export-Vorschau</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Diese Demo zeigt nur die vorgesehenen Exportpfade. CSV- und PDF-Export sind in dieser Version noch nicht aktiviert.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="outline" disabled>CSV-Export (spaeter)</Button>
                <Button variant="outline" disabled>PDF-Report (spaeter)</Button>
              </div>
            </div>

            <Separator />

            <div className="rounded-xl border border-destructive/25 bg-destructive/[0.03] px-4 py-4">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  Konto-Loeschung
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Die Loeschfunktion ist in dieser Demo nicht aktiv. Der Hinweis zeigt nur, dass dieser Schritt in einem produktiven Setup besonders sensibel behandelt werden muesste.
              </p>
              <Button variant="destructive" className="mt-4" disabled>
                In dieser Demo nicht aktiv
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

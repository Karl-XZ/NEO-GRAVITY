"use client";

import { useState } from "react";
import { Activity, Mail, MapPin, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";

import { useProfilePreferences } from "@/components/profile/profile-preferences-provider";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPersonaLabel, getProfileInitials, getUiModeLabel } from "@/lib/profile";
import type { PersonaHint, UiMode } from "@/lib/types";

const dataSources = [
  { name: "Elektronische Patientenakte", status: "Verbunden", lastSync: "12.03.2026" },
  { name: "Wearable", status: "Verbunden", lastSync: "09.04.2026" },
  { name: "Lebensstil-Fragebogen", status: "Verbunden", lastSync: "01.04.2026" },
];

const personaOptions: { value: PersonaHint; label: string; description: string }[] = [
  {
    value: "preventive-performer",
    label: "Aktive Vorsorge",
    description: "Mehr Fokus auf Leistungsfähigkeit, Ziele und wichtige Kennzahlen.",
  },
  {
    value: "concerned-preventer",
    label: "Einfach & Sicher",
    description: "Klare Sprache, Ampelstatus und eine überschaubare Empfehlung für diese Woche.",
  },
  {
    value: "digital-optimizer",
    label: "Daten & Trends",
    description: "Mehr Verläufe, Protokolle und Exportmöglichkeiten für eine datenorientierte Ansicht.",
  },
  {
    value: "clinic-anchored-loyalist",
    label: "Klinikbegleitung",
    description: "Konzentriert sich auf Arztkontakt, Besuchsvorbereitung und eine einfache Übersicht.",
  },
];

const uiModeOptions: { value: UiMode; label: string; description: string }[] = [
  {
    value: "simple",
    label: "Kompakt",
    description: "Ruhigere Oberfläche mit weniger Kennzahlen und kürzeren Zusammenfassungen.",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Ausgewogene Standardansicht für den Alltag.",
  },
  {
    value: "expert",
    label: "Detailliert",
    description: "Mehr Kennzahlen und zusätzliche Einordnung für tieferes Verständnis.",
  },
];

type EditableProfileState = {
  displayName?: string;
  email?: string;
  city?: string;
  timezone?: string;
};

export function SettingsClient() {
  const { profile, updateProfile, resetProfilePreferences } = useProfilePreferences();
  const [form, setForm] = useState<EditableProfileState>({});
  const [savedAt, setSavedAt] = useState("Lokale Einstellungen aktiv");
  const displayName = form.displayName ?? profile.display_name ?? "";
  const email = form.email ?? profile.email;
  const city = form.city ?? profile.city;
  const timezone = form.timezone ?? profile.timezone;
  const isDirty = Object.keys(form).length > 0;

  const profileCompletion = Math.round(
    ([displayName, email, city, timezone].filter(Boolean).length / 4) * 100
  );

  const initials = getProfileInitials(displayName);
  const personaLabel = getPersonaLabel(profile.persona_hint);
  const uiModeLabel = getUiModeLabel(profile.ui_mode);

  function updateField<Key extends keyof EditableProfileState>(
    key: Key,
    value: EditableProfileState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    updateProfile({
      display_name: displayName,
      email,
      city,
      timezone,
    });
    setForm({});
    setSavedAt("Profil lokal gespeichert");
  }

  function handlePersonaChange(value: string) {
    updateProfile({ persona_hint: value as PersonaHint });
    setSavedAt("Ansichtsmodus lokal aktualisiert");
  }

  function handleUiModeChange(value: string) {
    updateProfile({ ui_mode: value as UiMode });
    setSavedAt("Detailgrad lokal aktualisiert");
  }

  function handleReset() {
    resetProfilePreferences();
    setForm({});
    setSavedAt("Lokale Anpassungen zurückgesetzt");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-24">
      <div className="animate-in">
        <h1 className="text-fluid-xl font-semibold tracking-tight">Profil & Darstellung</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Passen Sie Darstellung, Detailgrad, persönliche Angaben und Exportzugriff an einer Stelle an.
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
                  {profile.plan_label}
                </Badge>
                <Badge variant="outline">{personaLabel}</Badge>
                <Badge variant="outline">{uiModeLabel}</Badge>
                <Badge variant="outline">{profile.patient_id}</Badge>
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {displayName || "Profil vervollständigen"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.role_label} in {city}, {profile.country_code} · Mitglied seit{" "}
                  {new Date(profile.created_at).toLocaleDateString("de-DE", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-white/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em]">Datenquellen</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">3 aktiv</p>
                </div>
                <div className="rounded-xl border border-border bg-white/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em]">Profilstatus</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{profileCompletion}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Basierend auf den sichtbaren Profilfeldern
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em]">Letzte lokale Änderung</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{savedAt}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="animate-in">
          <CardHeader>
            <CardTitle>Ansichtsmodus</CardTitle>
            <CardDescription>
              Wählen Sie die Darstellung, die am besten zu Ihrem Informationsbedarf passt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs
              value={profile.persona_hint ?? "concerned-preventer"}
              onValueChange={handlePersonaChange}
              className="gap-4"
            >
              <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/60 p-2">
                {personaOptions.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="h-auto min-h-[44px] rounded-xl px-3 py-2 text-left"
                  >
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid gap-3">
              {personaOptions.map((option) => {
                const isActive = (profile.persona_hint ?? "concerned-preventer") === option.value;
                return (
                  <div
                    key={option.value}
                    className={`rounded-xl border px-4 py-4 transition-colors ${
                      isActive ? "border-primary/35 bg-primary/6" : "border-border bg-background"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{option.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      {isActive ? (
                        <Badge className="border-primary/25 bg-primary/15 text-primary">Aktiv</Badge>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in">
          <CardHeader>
            <CardTitle>Detailgrad</CardTitle>
            <CardDescription>
              Legen Sie fest, wie kompakt oder detailliert die Übersicht angezeigt wird.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs value={profile.ui_mode} onValueChange={handleUiModeChange} className="gap-4">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/60 p-2">
                {uiModeOptions.map((option) => (
                  <TabsTrigger key={option.value} value={option.value} className="h-auto rounded-xl px-3 py-2">
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid gap-3">
              {uiModeOptions.map((option) => {
                const isActive = profile.ui_mode === option.value;
                return (
                  <div
                    key={option.value}
                    className={`rounded-xl border px-4 py-4 transition-colors ${
                      isActive ? "border-primary/35 bg-primary/6" : "border-border bg-background"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{option.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      {isActive ? (
                        <Badge className="border-primary/25 bg-primary/15 text-primary">Aktiv</Badge>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6">
        <Card className="animate-in">
          <CardHeader>
            <CardTitle>Persönliche Angaben</CardTitle>
            <CardDescription>Aktualisieren Sie die sichtbaren Profildaten für diese Demo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display-name">Anzeigename</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(event) => updateField("displayName", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ort</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Zeitzone</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(event) => updateField("timezone", event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Demoprofil</p>
                <p className="text-xs text-muted-foreground">
                  Diese Änderungen werden für diese Demo nur lokal im Browser gespeichert.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw />
                  Lokale Anpassungen zurücksetzen
                </Button>
                <Button onClick={handleSave} disabled={!isDirty}>
                  Profil speichern
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="animate-in">
          <CardHeader>
            <CardTitle>Datenquellen</CardTitle>
            <CardDescription>Verbundene Systeme und ihr letzter Abgleich.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dataSources.map((source) => (
              <div
                key={source.name}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{source.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Letzte Synchronisierung: {source.lastSync}
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
            <CardTitle>Datenschutz & Export</CardTitle>
            <CardDescription>Verwalten Sie Sichtbarkeit, Exporte und Kontosicherheit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="min-w-0 flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <Mail className="mt-0.5 size-4 text-primary" />
                <div className="min-w-0">
                  <p className="break-all text-sm font-medium">{email}</p>
                  <p className="text-xs text-muted-foreground">Primäre Kontaktadresse</p>
                </div>
              </div>
              <div className="min-w-0 flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <MapPin className="mt-0.5 size-4 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {city}, {profile.country_code}
                  </p>
                  <p className="text-xs text-muted-foreground">Zeitzone: {timezone}</p>
                </div>
              </div>
              <div className="min-w-0 flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <ShieldCheck className="mt-0.5 size-4 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Datenschutz aktiv</p>
                  <p className="text-xs text-muted-foreground">
                    Profilanpassungen bleiben lokal, solange keine echte Speicherung aktiviert ist.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="rounded-xl border border-border bg-background px-4 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <p className="text-sm font-medium">Exportbereich</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Laden Sie CSV- oder PDF-Zusammenfassungen zum Teilen mit Praxis, Coach oder externen Tools herunter.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="outline">CSV-Export</Button>
                <Button variant="outline">PDF-Bericht</Button>
              </div>
            </div>

            <Separator />

            <div className="rounded-xl border border-destructive/25 bg-destructive/[0.03] px-4 py-4">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-destructive" />
                <p className="text-sm font-medium text-destructive">Konto löschen</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Dies ist eine Demo-Aktion. In einem echten Produkt würden Konto und verknüpfte Gesundheitsdaten dauerhaft entfernt.
              </p>
              <Button variant="destructive" className="mt-4">
                Konto und Daten löschen
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

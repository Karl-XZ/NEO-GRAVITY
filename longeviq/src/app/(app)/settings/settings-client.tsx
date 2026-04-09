"use client";

import { useState } from "react";
import { Activity, Mail, MapPin, ShieldCheck, Sparkles } from "lucide-react";
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
import { getPersonaLabel, getProfileInitials } from "@/lib/profile";
import type { UserProfile } from "@/lib/types";

const dataSources = [
  {
    name: "Elektronische Patientenakte",
    status: "Verbunden",
    lastSync: "12.03.2026",
  },
  {
    name: "Wearable (Smartwatch)",
    status: "Verbunden",
    lastSync: "09.04.2026",
  },
  {
    name: "Lifestyle-Fragebogen",
    status: "Verbunden",
    lastSync: "01.04.2026",
  },
];

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

export function SettingsClient({
  initialProfile,
}: {
  initialProfile: UserProfile;
}) {
  const [form, setForm] = useState<EditableProfileState>(() =>
    createEditableState(initialProfile),
  );
  const [savedAt, setSavedAt] = useState("Heute, 14:42");
  const isDirty =
    JSON.stringify(form) !== JSON.stringify(createEditableState(initialProfile));
  const profileCompletion = Math.round(
    ([form.displayName, form.email, form.city, form.timezone].filter(Boolean)
      .length /
      4) *
      100,
  );

  const initials = getProfileInitials(form.displayName);
  const personaLabel = getPersonaLabel(initialProfile.persona_hint);

  function updateField<Key extends keyof EditableProfileState>(
    key: Key,
    value: EditableProfileState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    setSavedAt("Gerade eben lokal gespeichert");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-24">
      <div className="animate-in">
        <h1 className="text-fluid-xl font-semibold tracking-tight">
          Ihr Profil
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Verwalten Sie Ihre persönlichen Angaben, Ihre Präferenzen und den
          Fokus Ihrer Longevity-Begleitung an einem Ort.
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
                <Badge className="bg-primary/15 text-primary border-primary/25">
                  {initialProfile.plan_label}
                </Badge>
                <Badge variant="outline">{personaLabel}</Badge>
                <Badge variant="outline">{initialProfile.patient_id}</Badge>
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {form.displayName || "Profil vervollständigen"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {initialProfile.role_label} in {form.city},{" "}
                  {initialProfile.country_code} · Mitglied seit{" "}
                  {new Date(initialProfile.created_at).toLocaleDateString(
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
                    Datenquellen
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    3 aktiv
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em]">
                    Profilvollständigkeit
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
            <CardTitle>Persönliche Angaben</CardTitle>
            <CardDescription>
              Aktualisieren Sie Ihre Kerndaten.
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
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(event) =>
                    updateField("city", event.target.value)
                  }
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
                  Anderungen werden fur diese Sitzung vorgemerkt, aber noch
                  nicht serverseitig gespeichert.
                </p>
              </div>
              <Button onClick={handleSave} disabled={!isDirty}>
                Profil speichern
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="animate-in">
          <CardHeader>
            <CardTitle>Datenquellen</CardTitle>
            <CardDescription>
              Verbundene Systeme und letzte Synchronisation.
            </CardDescription>
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
                    Zuletzt synchronisiert: {source.lastSync}
                  </p>
                </div>
                <Badge className="bg-primary/15 text-primary border-primary/25 w-fit">
                  {source.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="animate-in">
          <CardHeader>
            <CardTitle>Privatsphäre und Export</CardTitle>
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
                    {form.city}, {initialProfile.country_code}
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
                <p className="text-sm font-medium">Exportcenter</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Laden Sie Ihre wichtigsten Gesundheitsdaten als CSV oder PDF
                herunter, um sie mit Ihrem Arzt oder Coach zu teilen.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="outline">CSV Export</Button>
                <Button variant="outline">PDF Report</Button>
              </div>
            </div>

            <Separator />

            <div className="rounded-xl border border-destructive/25 bg-destructive/[0.03] px-4 py-4">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  Konto löschen
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Ihr Konto und alle zugehörigen Gesundheitsdaten werden
                unwiderruflich gelöscht. Dieser Vorgang kann nicht rückgängig
                gemacht werden.
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

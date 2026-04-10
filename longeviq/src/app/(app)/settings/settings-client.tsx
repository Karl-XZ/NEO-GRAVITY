"use client";

import { useState, useSyncExternalStore } from "react";
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
import {
  ALERT_MODE_STORAGE_KEY,
  getStoredAlertMode,
  getPersonaLabel,
  getProfileInitials,
} from "@/lib/profile";
import type { AlertMode, UserProfile } from "@/lib/types";

const dataSources = [
  {
    name: "Electronic Health Record",
    status: "Connected",
    lastSync: "03/12/2026",
  },
  {
    name: "Wearable (Smartwatch)",
    status: "Connected",
    lastSync: "04/09/2026",
  },
  {
    name: "Lifestyle Questionnaire",
    status: "Connected",
    lastSync: "04/01/2026",
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
    label: "Simple",
    description: "Shows only the main focus of the day.",
  },
  {
    value: "detailed",
    label: "Detailed",
    description: "Also shows the 3 most important alerts below the daily focus.",
  },
  {
    value: "notification",
    label: "Notification",
    description: "Sends browser notifications at the right time of day.",
  },
];

export function SettingsClient({
  initialProfile,
}: {
  initialProfile: UserProfile;
}) {
  const storedAlertMode = useSyncExternalStore(
    subscribeToAlertMode,
    () => getStoredAlertMode(initialProfile.alert_mode),
    () => initialProfile.alert_mode,
  );
  const [form, setForm] = useState<EditableProfileState>(() =>
    createEditableState(initialProfile),
  );
  const [selectedAlertMode, setSelectedAlertMode] = useState<AlertMode | null>(null);
  const [savedAt, setSavedAt] = useState("Today, 2:42 PM");
  const currentAlertMode = selectedAlertMode ?? storedAlertMode;
  const isDirty =
    JSON.stringify(form) !== JSON.stringify(createEditableState(initialProfile)) ||
    currentAlertMode !== initialProfile.alert_mode;
  const profileCompletion = Math.round(
    ([form.displayName, form.email, form.city, form.timezone, currentAlertMode].filter(Boolean)
      .length /
      5) *
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

  async function handleSave() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ALERT_MODE_STORAGE_KEY, currentAlertMode);
    }

    if (currentAlertMode === "notification" && typeof window !== "undefined" && "Notification" in window) {
      const permission = await window.Notification.requestPermission();
      if (permission === "granted") {
        setSavedAt("Just now saved locally · Browser notifications active");
        return;
      }
      if (permission === "denied") {
        setSavedAt("Saved · Browser notifications are blocked");
        return;
      }
    }

    setSavedAt("Just now saved locally");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-24">
      <div className="animate-in">
        <h1 className="text-fluid-xl font-semibold tracking-tight">
          Your Profile
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Manage your personal details, preferences, and longevity
          coaching focus all in one place.
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
                  {form.displayName || "Complete your profile"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {initialProfile.role_label} in {form.city},{" "}
                  {initialProfile.country_code} · Member since{" "}
                  {new Date(initialProfile.created_at).toLocaleDateString(
                    "en-US",
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
                    Data Sources
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    3 active
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em]">
                    Profile Completion
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {profileCompletion}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Based on your profile details
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em]">
                    Last Saved
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
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>
              Update your core information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={form.displayName}
                  onChange={(event) =>
                    updateField("displayName", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(event) =>
                    updateField("city", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
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
                <p className="text-sm font-medium">Demo Profile Mode</p>
                <p className="text-xs text-muted-foreground">
                  Changes are saved for this session but are not yet
                  persisted on the server.
                </p>
              </div>
              <Button onClick={handleSave} disabled={!isDirty}>
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in">
          <CardHeader>
            <CardTitle>Alert Type</CardTitle>
            <CardDescription>
              Choose how prominently LongevIQ delivers your daily alerts.
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
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>
              Connected systems and last synchronization.
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
                    Last synced: {source.lastSync}
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
            <CardTitle>Privacy and Export</CardTitle>
            <CardDescription>
              Manage visibility, export, and account security.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="min-w-0 flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <Mail className="mt-0.5 size-4 text-primary" />
                <div className="min-w-0">
                  <p className="break-all text-sm font-medium">{form.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Primary contact address
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
                    Timezone: {form.timezone}
                  </p>
                </div>
              </div>
              <div className="min-w-0 flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <ShieldCheck className="mt-0.5 size-4 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Privacy enabled</p>
                  <p className="text-xs text-muted-foreground">
                    Profile data stays local in this demo.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="rounded-xl border border-border bg-background px-4 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <p className="text-sm font-medium">Export Center</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Download your key health data as CSV or PDF to share with
                your doctor or coach.
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
                  Delete Account
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Your account and all associated health data will be
                permanently deleted. This action cannot be undone.
              </p>
              <Button variant="destructive" className="mt-4">
                Delete Account and Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

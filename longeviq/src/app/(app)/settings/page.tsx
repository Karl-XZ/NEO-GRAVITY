"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* ─── UI mode options ─── */
const uiModes = [
  {
    id: "simple",
    label: "Einfach",
    description: "Übersichtliche Darstellung der wichtigsten Werte",
  },
  {
    id: "standard",
    label: "Standard",
    description: "Detaillierte Ansicht mit Trends und Vergleichen",
  },
  {
    id: "expert",
    label: "Experte",
    description: "Voller Zugang zu allen Rohdaten und Analysen",
  },
] as const;

type UIMode = (typeof uiModes)[number]["id"];

/* ─── Data sources ─── */
const dataSources = [
  {
    name: "Elektronische Patientenakte",
    status: "Verbunden" as const,
    lastSync: "12.03.2026",
  },
  {
    name: "Wearable (Smartwatch)",
    status: "Verbunden" as const,
    lastSync: "09.04.2026",
  },
  {
    name: "Lifestyle-Fragebogen",
    status: "Verbunden" as const,
    lastSync: "01.04.2026",
  },
];

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("Thomas M.");
  const [selectedMode, setSelectedMode] = useState<UIMode>("standard");

  return (
    <div className="mx-auto max-w-3xl space-y-16 pb-24">
      {/* ─── Page header ─── */}
      <div className="animate-in">
        <h1 className="text-fluid-xl font-semibold tracking-tight">
          Einstellungen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profil, Datenquellen und Exportoptionen verwalten.
        </p>
      </div>

      {/* ════════════════════════════════════════════
          Section 1 — Profile
         ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div>
          <h2 className="text-base font-medium">Profil</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Persönliche Angaben und Anzeigeeinstellungen.
          </p>
        </div>

        <Separator />

        {/* Display name */}
        <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center">
          <Label htmlFor="display-name">Anzeigename</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {/* Patient ID */}
        <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center">
          <Label className="text-muted-foreground">Patienten-ID</Label>
          <span className="font-data text-sm text-muted-foreground">
            PAT-2024-0042
          </span>
        </div>

        {/* UI mode selector */}
        <div className="space-y-3 pt-2">
          <Label>UI-Modus</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {uiModes.map((mode) => {
              const isActive = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={cn(
                    "group relative cursor-pointer rounded-xl border px-4 py-4 text-left transition-all",
                    "bg-surface-1 hover:bg-surface-2",
                    isActive
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-border"
                  )}
                >
                  {/* Active indicator dot */}
                  <span
                    className={cn(
                      "absolute right-3 top-3 size-2 rounded-full transition-colors",
                      isActive ? "bg-primary" : "bg-border"
                    )}
                  />

                  <span className="block text-sm font-medium">
                    {mode.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {mode.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          Section 2 — Data sources
         ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div>
          <h2 className="text-base font-medium">Datenquellen</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Verbundene Systeme und letzte Synchronisation.
          </p>
        </div>

        <Separator />

        <div className="divide-y divide-border rounded-xl border border-border bg-surface-1">
          {dataSources.map((source) => (
            <div
              key={source.name}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Left: name + badge */}
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-sm font-medium">{source.name}</span>
                <Badge className="bg-primary/15 text-primary border-primary/25 w-fit">
                  {source.status}
                </Badge>
              </div>

              {/* Right: last sync + action */}
              <div className="flex items-center gap-4">
                <span className="font-data text-xs text-muted-foreground">
                  Zuletzt: {source.lastSync}
                </span>
                <Button variant="outline" size="sm">
                  Sync
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          Section 3 — Export
         ════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div>
          <h2 className="text-base font-medium">Datenexport</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Laden Sie Ihre Gesundheitsdaten als CSV oder PDF herunter.
          </p>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-3">
          <Button variant="outline">CSV Export</Button>
          <Button variant="outline">PDF Report</Button>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          Section 4 — Danger zone
         ════════════════════════════════════════════ */}
      <section className="mt-24 space-y-6">
        <div className="rounded-xl border border-destructive/25 bg-destructive/[0.03] px-5 py-5">
          <h2 className="text-base font-medium text-destructive">
            Konto löschen
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ihr Konto und alle zugehörigen Gesundheitsdaten werden unwiderruflich
            gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden.
          </p>
          <Button variant="destructive" className="mt-4">
            Konto und Daten löschen
          </Button>
        </div>
      </section>
    </div>
  );
}

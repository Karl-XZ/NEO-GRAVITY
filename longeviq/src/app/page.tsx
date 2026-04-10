"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Activity,
  ClipboardList,
  LockKeyhole,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useAppState } from "@/components/AppState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();
  const {
    currentProfile,
    featuredPatients,
    loadPatient,
    loading,
    selectedPatient,
    startQuestionnaireSignup,
  } = useAppState();
  const [showCases, setShowCases] = useState(false);
  const [loadingPatientId, setLoadingPatientId] = useState<string | null>(null);

  const handleRegister = () => {
    startQuestionnaireSignup();
    router.push("/assessment?mode=questionnaire");
  };

  const handleSelectCase = async (patientId: string) => {
    setLoadingPatientId(patientId);
    try {
      const success = await loadPatient(patientId);
      if (success) {
        router.push("/dashboard");
      }
    } finally {
      setLoadingPatientId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(5,150,105,0.11),transparent_32%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.1),transparent_28%),linear-gradient(180deg,#F8FBFD_0%,#F2F7FA_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_40px_90px_-60px_rgba(15,23,42,0.42)] backdrop-blur sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge className="border-0 bg-primary/12 text-primary">
                Persona Login + Fragebogen-Onboarding
              </Badge>
              <h1 className="mt-4 max-w-3xl text-[clamp(2rem,1.2rem+2.6vw,4.4rem)] font-semibold leading-[0.95] tracking-tight text-foreground">
                Eine Startseite fuer Demo-Accounts und neue Registrierungen
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Waehlbar zwischen vier kuratierten Persona-Faellen aus dem
                Longevity-Personas-Pitchdeck oder dem bestehenden Fragebogen fuer
                neue Nutzer.
              </p>

              {selectedPatient ? (
                <div className="mt-6 rounded-[1.5rem] border border-primary/15 bg-primary/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">
                    Aktive Sitzung
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {selectedPatient.displayName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentProfile.role_label} in {currentProfile.city}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => router.push("/dashboard")}
                  >
                    Zur aktiven Analyse
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4">
              <Card className="rounded-[1.75rem] border border-border bg-surface-1 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ClipboardList className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-foreground">
                      Registrieren
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Startet direkt den bestehenden Fragebogen-Flow fuer neue
                      Nutzer und legt ein neues lokales Demo-Profil an.
                    </p>
                    <Button className="mt-4" onClick={handleRegister}>
                      Mit Fragebogen starten
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[1.75rem] border border-border bg-surface-1 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-chart-2/10 text-chart-2">
                    <LockKeyhole className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-foreground">
                      Login
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Zeigt vier Login-Faelle aus dem PPT. Jeder Fall bringt sein
                      eigenes Profil, seine eigene Story und passende Demo-Daten mit.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowCases(true)}
                    >
                      Persona-Faelle anzeigen
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {showCases ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Login-Faelle
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  Vier Persona-Accounts aus dem Pitchdeck
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Auswahl wechselt gleichzeitig Fall, Account und Einstellungen.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {featuredPatients.map((patient) => (
                <Card
                  key={patient.patientId}
                  className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_28px_70px_-55px_rgba(15,23,42,0.35)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-0 bg-primary/12 text-primary">
                          {patient.tag}
                        </Badge>
                        {patient.techAffinity ? (
                          <Badge variant="outline">{patient.techAffinity}</Badge>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-xl font-semibold text-foreground">
                        {patient.displayName}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {patient.occupation ?? "Persona-Account"} · {patient.age} Jahre
                      </p>
                    </div>
                    <div className="rounded-2xl bg-surface-2 px-3 py-2 text-right">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Payment
                      </p>
                      <p className="mt-1 text-xs font-medium text-foreground">
                        {patient.willingnessToPay ?? "Demo"}
                      </p>
                    </div>
                  </div>

                  {patient.quote ? (
                    <p className="mt-4 rounded-2xl bg-surface-2/80 px-4 py-3 text-sm leading-relaxed text-foreground/85">
                      {patient.quote}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {patient.city ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5">
                        <MapPin className="size-3.5" />
                        {patient.city}
                      </span>
                    ) : null}
                    {patient.primaryConcern ? (
                      <span className="rounded-full bg-surface-2 px-3 py-1.5">
                        Fokus: {patient.primaryConcern}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {patient.shortSummary}
                  </p>

                  {patient.healthGoals?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {patient.healthGoals.slice(0, 3).map((goal) => (
                        <span
                          key={goal}
                          className="rounded-full bg-primary/8 px-3 py-1.5 text-xs text-primary"
                        >
                          {goal}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <Button
                    className="mt-5 w-full"
                    disabled={loading && loadingPatientId === patient.patientId}
                    onClick={() => void handleSelectCase(patient.patientId)}
                  >
                    {loading && loadingPatientId === patient.patientId
                      ? "Account wird geladen..."
                      : "Als diesen Account anmelden"}
                    <ArrowRight className="size-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-[1.5rem] border border-border bg-white/75 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Activity className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Vier kuratierte Accounts
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Thomas, Sabine, Max und Juergen
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[1.5rem] border border-border bg-white/75 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-chart-1/10 text-chart-1">
                  <Sparkles className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Fragebogen fuer neue Nutzer
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Registrierung ohne bestehende Rohdaten
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[1.5rem] border border-border bg-white/75 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-chart-2/10 text-chart-2">
                  <LockKeyhole className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Dynamische Account-Ansicht
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Topbar und Einstellungen wechseln mit dem Login
                  </p>
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}

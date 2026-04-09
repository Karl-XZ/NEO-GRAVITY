"use client";

import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Send,
  User,
  XCircle,
} from "lucide-react";
import { generateCoachSuggestions } from "@/lib/coach/generate-suggestions";
import { computeAllFeatures } from "@/lib/features";
import { THRESHOLDS } from "@/lib/thresholds";
import type {
  CoachSuggestion,
  EhrRecord,
  LifestyleSurvey,
  WearableTelemetry,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const severityConfig: Record<
  string,
  { label: string; borderColor: string; badgeBg: string; badgeText: string; icon: typeof XCircle }
> = {
  red: {
    label: "Kritisch",
    borderColor: "border-l-status-critical",
    badgeBg: "bg-status-critical/10",
    badgeText: "text-status-critical",
    icon: XCircle,
  },
  yellow: {
    label: "Beobachten",
    borderColor: "border-l-status-warning",
    badgeBg: "bg-status-warning/10",
    badgeText: "text-status-warning",
    icon: AlertTriangle,
  },
  green: {
    label: "Gut",
    borderColor: "border-l-status-normal",
    badgeBg: "bg-status-normal/10",
    badgeText: "text-status-normal",
    icon: CheckCircle2,
  },
};

const mockMessages = [
  {
    role: "user" as const,
    text: "Welcher Test bringt mich am schnellsten zu einem besseren VO2max Plan?",
  },
  {
    role: "coach" as const,
    text: "Ein formaler VO2max Test ist der starkste Kalibrierungspunkt. Damit lassen sich Trainingszonen und Ihr Goal Planner deutlich praziser steuern.",
  },
  {
    role: "user" as const,
    text: "Soll ich trotz niedriger HRV Intervalle machen?",
  },
  {
    role: "coach" as const,
    text: "Nicht heute. Nutzen Sie niedrige HRV plus erhohten Ruhepuls als Signal fur einen Build- oder Recovery-Tag statt fur einen High-Intensity-Block.",
  },
];

function SuggestionCard({ suggestion }: { suggestion: CoachSuggestion }) {
  const config = severityConfig[suggestion.severity] ?? severityConfig.green;
  const Icon = config.icon;

  return (
    <div className={cn("rounded-lg border-l-[3px] bg-surface-1 p-5", config.borderColor)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-[0.95rem] font-semibold leading-snug text-foreground">
          {suggestion.title}
        </h3>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            config.badgeBg,
            config.badgeText,
          )}
        >
          <Icon className="size-3" />
          {config.label}
        </span>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {suggestion.rationale}
      </p>

      <div className="rounded-md bg-surface-2/60 px-3.5 py-2.5">
        <p className="text-sm leading-relaxed text-foreground/80">
          <span className="mr-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Empfehlung
          </span>
          {suggestion.action}
        </p>
      </div>
    </div>
  );
}

function ChatMessage({ role, text }: { role: "user" | "coach"; text: string }) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="size-3.5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-surface-2 text-foreground/90"
            : "bg-surface-1 text-foreground/80 ring-1 ring-border",
        )}
      >
        {text}
      </div>
      {isUser && (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2">
          <User className="size-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function nextVo2Target(current: number) {
  if (current < 38) return 40;
  if (current < 42) return 45;
  if (current < 47) return 50;
  return Math.ceil((current + 2) / 2) * 2;
}

function labStatusTone(status: "Priority" | "Run" | "Monitor") {
  if (status === "Priority") return "border-status-critical/30 text-status-critical";
  if (status === "Run") return "border-primary/30 text-primary";
  return "border-status-warning/30 text-status-warning";
}

interface CoachClientProps {
  ehr: EhrRecord;
  wearable: WearableTelemetry[];
  lifestyle: LifestyleSurvey;
}

export function CoachClient({ ehr, wearable, lifestyle }: CoachClientProps) {
  const features = computeAllFeatures(ehr, wearable, lifestyle);
  const sortedSuggestions = generateCoachSuggestions(features, ehr);
  const vo2Target = nextVo2Target(features.vo2max.vo2max);

  function ldlStatus(): "green" | "yellow" | "red" {
    if (ehr.ldl_mmol >= THRESHOLDS.ldl.high) return "red";
    if (ehr.ldl_mmol >= THRESHOLDS.ldl.moderate_risk_target) return "yellow";
    return "green";
  }

  function crpStatus(): "green" | "yellow" | "red" {
    if (ehr.crp_mg_l >= THRESHOLDS.crp.moderate_risk) return "red";
    if (ehr.crp_mg_l >= THRESHOLDS.crp.low_risk) return "yellow";
    return "green";
  }

  const keyMetrics = [
    {
      label: "LDL-Cholesterin",
      value: `${ehr.ldl_mmol} mmol/L`,
      target: `< ${THRESHOLDS.ldl.moderate_risk_target} mmol/L`,
      status: ldlStatus(),
    },
    {
      label: "Blutdruck (sys/dia)",
      value: `${features.bpControl.sbp}/${features.bpControl.dbp} mmHg`,
      target: `< ${THRESHOLDS.bp.optimal_sbp}/${THRESHOLDS.bp.optimal_dbp} mmHg`,
      status: features.bpControl.status,
    },
    {
      label: "HbA1c",
      value: `${ehr.hba1c_pct} %`,
      target: `< ${THRESHOLDS.hba1c.normal} %`,
      status: features.prediabetes.status,
    },
    {
      label: "CRP",
      value: `${ehr.crp_mg_l} mg/L`,
      target: `< ${THRESHOLDS.crp.low_risk} mg/L`,
      status: crpStatus(),
    },
  ];

  const labExperiments = [
    {
      title: "VO2max Goal Sprint",
      status:
        features.vo2max.vo2max < vo2Target - 1 ? "Run" : "Monitor",
      duration: "4 Wochen",
      hypothesis:
        "Mehr aerobe Zeit im richtigen Pulsbereich sollte Ihre VO2max naher an den nachsten Benchmark bringen.",
      success: `Ziel ${vo2Target} statt aktuell ${features.vo2max.vo2max}`,
    },
    {
      title: "Readiness Calibration",
      status: features.strainRecovery.flag ? "Priority" : "Run",
      duration: "14 Tage",
      hypothesis:
        "Trainingsintensitat nur an hohen Readiness-Tagen sollte HRV stabilisieren und Uberbelastung fruher bremsen.",
      success: `Readiness ${features.recoveryScore.score}/100, Strain Ratio ${features.strainRecovery.ratio}`,
    },
    {
      title: "Diagnostics Upgrade",
      status: ehr.ldl_mmol >= 2.6 || ehr.hba1c_pct >= 5.7 ? "Priority" : "Monitor",
      duration: "Diesen Monat",
      hypothesis:
        "Premium-Diagnostics schaffen die Grundlage fur die nachste hochpreisige, datengetriebene Intervention.",
      success: "ApoB/Lp(a), VO2max Lab und CGM in einen Zyklus bringen",
    },
  ] as const;

  const performanceMetrics = [
    {
      label: "Bio-Age",
      value: `${features.bioAge.bioAge}`,
      note: `${features.bioAge.delta > 0 ? "+" : ""}${features.bioAge.delta} vs. ${ehr.age}`,
    },
    {
      label: "VO2max",
      value: `${features.vo2max.vo2max}`,
      note: features.vo2max.percentile,
    },
    {
      label: "Readiness",
      value: `${features.recoveryScore.score}/100`,
      note: features.strainRecovery.interpretation,
    },
    {
      label: "Longevity Percentile",
      value: `${features.longevityPercentile}`,
      note: "Peer-basiertes Composite Ranking",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-in mb-8 space-y-3">
        <Badge className="w-fit border-0 bg-primary/12 text-primary">
          Performance Lab
        </Badge>
        <div className="flex items-center gap-2.5">
          <Activity className="size-5 text-primary" />
          <h1 className="text-fluid-xl font-semibold tracking-tight">
            KI-Gesundheitscoach fur Preventive Performer
          </h1>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Diese Seite verbindet Ihre Coaching-Empfehlungen mit einem
          interventionstauglichen Performance Lab: Hypothese, Test, Signal,
          Entscheidung.
        </p>
      </div>

      <section className="animate-in stagger-1 mb-8 grid gap-4 xl:grid-cols-3">
        {labExperiments.map((experiment) => (
          <Card key={experiment.title} className="border-0 bg-surface-1">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-fluid-base text-foreground">
                  {experiment.title}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={labStatusTone(experiment.status)}
                >
                  {experiment.status}
                </Badge>
              </div>
              <p className="font-data text-fluid-xs text-muted-foreground">
                {experiment.duration}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-fluid-sm leading-relaxed text-muted-foreground">
                {experiment.hypothesis}
              </p>
              <div className="rounded-2xl bg-surface-2/60 px-4 py-3">
                <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                  Success metric
                </p>
                <p className="mt-1 text-fluid-sm text-foreground/85">
                  {experiment.success}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="animate-in stagger-2 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div>
          <div className="mb-5">
            <h2 className="mb-1 text-lg font-semibold tracking-tight">
              Aktuelle Empfehlungen
            </h2>
            <p className="text-sm text-muted-foreground">
              Priorisiert nach Risiko, Interventionseffekt und Re-Test-Potenzial.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {sortedSuggestions.map((suggestion, index) => (
              <SuggestionCard key={`${suggestion.title}-${index}`} suggestion={suggestion} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border-0 bg-surface-1">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Performance Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {performanceMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl bg-surface-2/60 p-4">
                    <p className="text-fluid-xs uppercase tracking-wide text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="mt-2 font-data text-2xl text-foreground">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-fluid-xs text-muted-foreground">
                      {metric.note}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Klinische Marker
              </h3>
              <div className="flex flex-col gap-3">
                {keyMetrics.map((metric) => {
                  const statusColor =
                    metric.status === "red"
                      ? "text-status-critical"
                      : metric.status === "yellow"
                        ? "text-status-warning"
                        : "text-status-normal";
                  const dotColor =
                    metric.status === "red"
                      ? "bg-status-critical"
                      : metric.status === "yellow"
                        ? "bg-status-warning"
                        : "bg-status-normal";

                  return (
                    <div key={metric.label} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-1.5 rounded-full", dotColor)} />
                        <span className="text-sm text-foreground/80">{metric.label}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={cn("font-data text-sm font-medium", statusColor)}>
                          {metric.value}
                        </span>
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          Ziel: {metric.target}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-surface-1">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Gesundheitscoach Chat
              </CardTitle>
            </CardHeader>

            <ScrollArea className="max-h-[360px] flex-1 px-5 py-3">
              <div className="flex flex-col gap-3">
                {mockMessages.map((message, index) => (
                  <ChatMessage key={index} role={message.role} text={message.text} />
                ))}
              </div>
            </ScrollArea>

            <Separator />

            <div className="flex items-center gap-2 px-4 py-3">
              <input
                type="text"
                disabled
                placeholder="Frage nach Training, Diagnostics oder Bio-Age..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
              <Button variant="default" size="icon-sm" disabled>
                <Send className="size-3.5" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

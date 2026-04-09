"use client";

import { Send, Activity, AlertTriangle, CheckCircle2, XCircle, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeAllFeatures } from "@/lib/features";
import { generateCoachSuggestions } from "@/lib/coach/generate-suggestions";
import type { EhrRecord, WearableTelemetry, LifestyleSurvey, CoachSuggestion } from "@/lib/types";
import { THRESHOLDS } from "@/lib/thresholds";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ─── severity helpers ─── */

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

/* ─── mock chat messages ─── */

const mockMessages = [
  {
    role: "user" as const,
    text: "Warum ist mein LDL zu hoch?",
  },
  {
    role: "coach" as const,
    text: "Ihr LDL-Cholesterin liegt über dem empfohlenen Zielwert von 2.6 mmol/L. Ich empfehle eine Besprechung der Medikation mit Ihrem Arzt sowie eine Ernährungsanpassung mit erhöhtem Omega-3-Anteil.",
  },
  {
    role: "user" as const,
    text: "Wie wirkt sich das auf mein Bio-Age aus?",
  },
  {
    role: "coach" as const,
    text: "Erhöhtes LDL ist einer der Faktoren, die Ihr biologisches Alter nach oben korrigieren. Eine LDL-Senkung könnte Ihren Bio-Age-Vorsprung weiter ausbauen.",
  },
];

/* ─── suggestion card ─── */

function SuggestionCard({ suggestion }: { suggestion: CoachSuggestion }) {
  const config = severityConfig[suggestion.severity] ?? severityConfig.green;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "border-l-[3px] rounded-lg bg-surface-1 p-5",
        config.borderColor
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-[0.95rem] font-semibold leading-snug text-foreground">
          {suggestion.title}
        </h3>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            config.badgeBg,
            config.badgeText
          )}
        >
          <Icon className="size-3" />
          {config.label}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground mb-4">
        {suggestion.rationale}
      </p>

      <div className="rounded-md bg-surface-2/60 px-3.5 py-2.5">
        <p className="text-sm leading-relaxed text-foreground/80">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mr-2">
            Empfehlung
          </span>
          {suggestion.action}
        </p>
      </div>
    </div>
  );
}

/* ─── chat message ─── */

function ChatMessage({ role, text }: { role: "user" | "coach"; text: string }) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
          <Bot className="size-3.5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-surface-2 text-foreground/90"
            : "bg-surface-1 text-foreground/80 ring-1 ring-border"
        )}
      >
        {text}
      </div>
      {isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 mt-0.5">
          <User className="size-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

/* ─── component ─── */

interface CoachClientProps {
  ehr: EhrRecord;
  wearable: WearableTelemetry[];
  lifestyle: LifestyleSurvey;
}

export function CoachClient({ ehr, wearable, lifestyle }: CoachClientProps) {
  const features = computeAllFeatures(ehr, wearable, lifestyle);
  const sortedSuggestions = generateCoachSuggestions(features, ehr);

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="animate-in mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <Activity className="size-5 text-primary" />
          <h1 className="text-fluid-xl font-semibold tracking-tight">
            KI-Gesundheitscoach
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Personalisierte Gesundheitsempfehlungen basierend auf Ihren klinischen Daten, Wearable-Metriken und Lebensstilfaktoren.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="animate-in stagger-1 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.65fr]">
        {/* ─── Left column: Active Insights ─── */}
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight mb-1">
              Aktuelle Empfehlungen
            </h2>
            <p className="text-sm text-muted-foreground">
              Basierend auf Ihren aktuellen Gesundheitsdaten
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {sortedSuggestions.map((suggestion, i) => (
              <SuggestionCard key={i} suggestion={suggestion} />
            ))}
          </div>
        </div>

        {/* ─── Right column: Health Summary + Chat ─── */}
        <div className="flex flex-col gap-6">
          {/* Health Summary */}
          <div className="rounded-lg bg-surface-1 ring-1 ring-border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Gesundheitsübersicht
            </h2>

            {/* Bio-Age prominent */}
            <div className="mb-5">
              <div className="flex items-baseline gap-2">
                <span className="font-data text-3xl font-bold text-primary text-glow-primary">
                  {features.bioAge.bioAge}
                </span>
                <span className="text-sm text-muted-foreground">
                  Bio-Age
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-data text-sm text-status-normal">
                  {features.bioAge.delta > 0 ? "+" : ""}{features.bioAge.delta}
                </span>
                <span className="text-xs text-muted-foreground">
                  vs. chronologisches Alter ({ehr.age})
                </span>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Key risk metrics */}
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
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
                  <div key={metric.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-1.5 rounded-full", dotColor)} />
                      <span className="text-sm text-foreground/80">
                        {metric.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={cn("font-data text-sm font-medium", statusColor)}>
                        {metric.value}
                      </span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        Ziel: {metric.target}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat section */}
          <div className="rounded-lg bg-surface-1 ring-1 ring-border flex flex-col overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Gesundheitscoach Chat
              </h2>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-5 py-3 max-h-[360px]">
              <div className="flex flex-col gap-3">
                {mockMessages.map((msg, i) => (
                  <ChatMessage key={i} role={msg.role} text={msg.text} />
                ))}
              </div>
            </ScrollArea>

            <Separator />

            {/* Input area */}
            <div className="flex items-center gap-2 px-4 py-3">
              <input
                type="text"
                disabled
                placeholder="Stellen Sie eine Frage zu Ihren Gesundheitsdaten..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
              <Button variant="default" size="icon-sm" disabled>
                <Send className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import type { CoachSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

const severityBarColor: Record<string, string> = {
  red: "bg-status-critical",
  yellow: "bg-status-warning",
  green: "bg-status-normal",
};

const severityTextColor: Record<string, string> = {
  red: "text-status-critical",
  yellow: "text-status-warning",
  green: "text-status-normal",
};

const severityGlow: Record<string, string> = {
  red: "bg-[radial-gradient(circle_at_bottom,rgba(220,38,38,0.12),transparent_62%)]",
  yellow: "bg-[radial-gradient(circle_at_bottom,rgba(217,119,6,0.12),transparent_62%)]",
  green: "bg-[radial-gradient(circle_at_bottom,rgba(5,150,105,0.12),transparent_62%)]",
};

interface CoachCardProps {
  suggestion: CoachSuggestion;
  isActive?: boolean;
  isDimmed?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

function normalizeTokens(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function isTooSimilarToTitle(title: string, body: string) {
  const titleTokens = normalizeTokens(title);
  const bodyTokens = new Set(normalizeTokens(body));

  if (titleTokens.length === 0) {
    return false;
  }

  const overlapCount = titleTokens.filter((token) => bodyTokens.has(token)).length;
  return overlapCount / titleTokens.length >= 0.6;
}

function getCardBodyText(suggestion: CoachSuggestion) {
  const candidates = [suggestion.rationale, suggestion.action].filter(Boolean);
  const nonRepeatingCandidate = candidates.find(
    (candidate) => !isTooSimilarToTitle(suggestion.title, candidate)
  );

  return nonRepeatingCandidate ?? suggestion.action ?? suggestion.rationale;
}

export function CoachCard({
  suggestion,
  isActive = false,
  isDimmed = false,
  onActivate,
  onDeactivate,
}: CoachCardProps) {
  const bodyText = getCardBodyText(suggestion);

  return (
    <div
      tabIndex={0}
      aria-expanded={isActive}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onDeactivate?.();
        }
      }}
      style={{ flexGrow: 1 }}
      className={cn(
        "group relative flex min-h-[220px] w-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] border transition-[transform,box-shadow,opacity,border-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:basis-0",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(246,248,250,0.96)_100%)]",
        isActive
          ? "border-primary/25 shadow-[0_24px_56px_-34px_rgba(15,23,42,0.28)]"
          : "border-white/70 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.22)]",
        isDimmed && "opacity-70"
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1.5",
          severityBarColor[suggestion.severity]
        )}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-60",
          severityGlow[suggestion.severity]
        )}
      />

      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
              suggestion.severity === "red"
                ? "bg-status-critical/10 text-status-critical"
                : suggestion.severity === "yellow"
                  ? "bg-status-warning/10 text-status-warning"
                  : "bg-status-normal/10 text-status-normal"
            )}
          >
            {suggestion.severity}
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Coach
          </span>
        </div>

        <div className="mt-5 flex flex-1 flex-col">
          <h4
            className={cn(
              "text-left text-base font-semibold leading-snug sm:text-[1.02rem]",
              severityTextColor[suggestion.severity]
            )}
          >
            {suggestion.title}
          </h4>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {bodyText}
          </p>
          <p className="mt-4 border-t border-foreground/6 pt-4 text-fluid-xs leading-relaxed text-muted-foreground">
            {suggestion.action}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-auto self-start rounded-full bg-white/80 px-3 text-fluid-xs text-primary shadow-none hover:bg-transparent hover:text-primary/80"
          >
            Aktionsplan anzeigen
          </Button>
        </div>
      </div>
    </div>
  );
}

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
      style={{ flexGrow: isActive ? 1.45 : isDimmed ? 0.9 : 1 }}
      className={cn(
        "group relative flex min-h-[228px] w-full min-w-0 overflow-hidden rounded-[1.65rem] border border-white/75 transition-[transform,box-shadow,flex-grow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:basis-0",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(246,248,250,0.95)_100%)]",
        isActive
          ? "-translate-y-1 shadow-[0_28px_70px_-34px_rgba(26,29,35,0.32)]"
          : "shadow-[0_18px_48px_-34px_rgba(26,29,35,0.24)]",
        isDimmed && "lg:scale-[0.985]"
      )}
    >
      {/* Severity bar */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1.5 shrink-0 rounded-l-[1.25rem]",
          severityBarColor[suggestion.severity]
        )}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          severityGlow[suggestion.severity],
          isActive && "opacity-100"
        )}
      />

      <div className="relative flex flex-1 px-5 py-5 sm:px-6">
        <div className="absolute inset-x-5 top-5 flex items-center justify-between sm:inset-x-6">
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

        <div
          className={cn(
            "absolute inset-x-5 top-[4.25rem] transition-[top,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:inset-x-6",
            isActive && "top-[4rem]"
          )}
        >
          <h4
            className={cn(
              "max-w-[16rem] text-left text-base font-semibold leading-snug line-clamp-2 sm:text-[1.02rem]",
              severityTextColor[suggestion.severity]
            )}
          >
            {suggestion.title}
          </h4>
          <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {bodyText}
          </p>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-x-5 bottom-5 translate-y-8 space-y-3 opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:inset-x-6",
            isActive && "pointer-events-auto translate-y-0 opacity-100"
          )}
        >
          <p className="border-t border-foreground/6 pt-3 text-fluid-xs leading-relaxed text-muted-foreground">
            {suggestion.action}
          </p>

          <Button
            variant="ghost"
            size="sm"
            className="h-auto rounded-full bg-white/80 px-3 text-fluid-xs text-primary shadow-none hover:bg-transparent hover:text-primary/80"
          >
            Aktionsplan anzeigen
          </Button>
        </div>
      </div>
    </div>
  );
}

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
        "group relative flex min-h-[208px] w-full min-w-0 overflow-hidden rounded-[1.25rem] ring-1 ring-foreground/8 transition-[transform,box-shadow,flex-grow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:basis-0",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,251,0.94)_100%)]",
        isActive
          ? "-translate-y-0.5 shadow-[0_22px_56px_-28px_rgba(26,29,35,0.28)]"
          : "shadow-[0_12px_36px_-30px_rgba(26,29,35,0.22)]",
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
        <div
          className={cn(
            "absolute inset-x-5 top-1/2 -translate-y-1/2 transition-[top,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:inset-x-6",
            isActive && "top-[42%] -translate-y-[58%]"
          )}
        >
          <h4
            className={cn(
              "mx-auto max-w-[15rem] text-center text-sm font-medium leading-snug line-clamp-2 sm:text-[0.95rem]",
              severityTextColor[suggestion.severity]
            )}
          >
            {suggestion.title}
          </h4>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-x-5 bottom-5 translate-y-8 space-y-3 opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:inset-x-6",
            isActive && "pointer-events-auto translate-y-0 opacity-100"
          )}
        >
          <p className="border-t border-foreground/6 pt-3 text-fluid-xs leading-relaxed text-muted-foreground line-clamp-3">
            {bodyText}
          </p>

          <Button
            variant="ghost"
            size="sm"
            className="h-auto rounded-full bg-white/70 px-3 text-fluid-xs text-primary shadow-none hover:bg-transparent hover:text-primary/80"
          >
            Aktionsplan anzeigen
          </Button>
        </div>
      </div>
    </div>
  );
}

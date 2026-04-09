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

interface CoachCardProps {
  suggestion: CoachSuggestion;
}

export function CoachCard({ suggestion }: CoachCardProps) {
  return (
    <div className="group relative flex min-w-[280px] flex-1 overflow-hidden rounded-xl bg-surface-1 ring-1 ring-foreground/10">
      {/* Severity bar */}
      <div
        className={cn(
          "w-1 shrink-0 rounded-l-xl",
          severityBarColor[suggestion.severity]
        )}
      />

      <div className="flex flex-col gap-2.5 px-4 py-4">
        <h4
          className={cn(
            "text-fluid-sm font-medium leading-snug",
            severityTextColor[suggestion.severity]
          )}
        >
          {suggestion.title}
        </h4>
        <p className="text-fluid-xs text-muted-foreground leading-relaxed line-clamp-2">
          {suggestion.rationale}
        </p>
        <div className="mt-auto pt-1">
          <Button variant="ghost" size="sm" className="text-fluid-xs text-primary px-0 h-auto hover:bg-transparent hover:text-primary/80">
            Aktionsplan anzeigen
          </Button>
        </div>
      </div>
    </div>
  );
}

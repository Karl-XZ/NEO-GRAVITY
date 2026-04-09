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
    <div className="group relative flex min-w-[280px] flex-1 overflow-hidden rounded-xl bg-surface-1 transition-shadow ring-1 ring-foreground/10 hover:shadow-sm">
      {/* Severity bar */}
      <div
        className={cn(
          "w-1 shrink-0 rounded-l-xl",
          severityBarColor[suggestion.severity]
        )}
      />

      <div className="flex min-h-[88px] flex-col px-4 py-4">
        <h4
          className={cn(
            "text-fluid-sm font-medium leading-snug",
            severityTextColor[suggestion.severity]
          )}
        >
          {suggestion.title}
        </h4>

        <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:mt-2.5 group-hover:max-h-32 group-hover:opacity-100 group-focus-within:mt-2.5 group-focus-within:max-h-32 group-focus-within:opacity-100">
          <p className="text-fluid-xs text-muted-foreground leading-relaxed line-clamp-2">
            {suggestion.rationale}
          </p>
        </div>

        <div className="mt-auto max-h-0 overflow-hidden pt-0 opacity-0 transition-all duration-200 group-hover:max-h-12 group-hover:pt-1 group-hover:opacity-100 group-focus-within:max-h-12 group-focus-within:pt-1 group-focus-within:opacity-100">
          <Button variant="ghost" size="sm" className="h-auto px-0 text-fluid-xs text-primary hover:bg-transparent hover:text-primary/80">
            Aktionsplan anzeigen
          </Button>
        </div>
      </div>
    </div>
  );
}

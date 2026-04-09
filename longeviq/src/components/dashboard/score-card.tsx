"use client";

import { CircleHelp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  label: string;
  value: number;
  maxValue?: number;
  colorClass?: string;
  barColorClass?: string;
  helpText?: string;
}

export function ScoreCard({
  label,
  value,
  maxValue = 100,
  colorClass = "text-foreground",
  barColorClass = "bg-primary",
  helpText,
}: ScoreCardProps) {
  const pct = Math.min((value / maxValue) * 100, 100);

  return (
    <Card className="overflow-visible border-0 bg-surface-1">
      <CardHeader>
        <CardTitle className="text-muted-foreground flex items-center gap-2 text-fluid-sm font-normal tracking-wide uppercase">
          <span>{label}</span>
          {helpText ? (
            <span className="group/info relative inline-flex">
              <button
                type="button"
                aria-label={`${label} explanation`}
                className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <span className="sr-only">{label} info</span>
                <CircleHelp className="size-3.5" />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute top-full left-0 z-20 mt-2 w-64 rounded-md bg-foreground px-3 py-2 text-[11px] normal-case leading-relaxed text-background opacity-0 shadow-lg transition-opacity duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100"
              >
                {helpText}
              </span>
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <span className={cn("font-data text-fluid-2xl leading-none", colorClass)}>
          {value}
        </span>
        <div className="flex flex-col gap-1.5">
          <div className="h-1 w-full rounded-full bg-surface-2 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColorClass)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-fluid-xs text-muted-foreground">
            von {maxValue}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

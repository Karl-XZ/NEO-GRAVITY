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
<<<<<<< Updated upstream
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
=======
    <Card className="overflow-hidden rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,251,0.94)_100%)] shadow-[0_24px_60px_-36px_rgba(15,23,42,0.28)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-fluid-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
            {label}
          </CardTitle>
          <span className="rounded-full border border-foreground/8 bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground">
            / {maxValue}
          </span>
        </div>
>>>>>>> Stashed changes
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <span className={cn("font-data text-[clamp(2.6rem,2.1rem+1.2vw,3.4rem)] leading-none", colorClass)}>
            {value}
          </span>
          <div className="pb-1 text-right">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Progress
            </p>
            <p className="mt-1 font-data text-sm text-foreground">{Math.round(pct)}%</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2/80">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColorClass)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-fluid-xs text-muted-foreground">
            Current score out of {maxValue}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

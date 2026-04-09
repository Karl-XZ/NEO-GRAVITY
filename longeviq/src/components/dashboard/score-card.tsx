"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  label: string;
  value: number;
  maxValue?: number;
  colorClass?: string;
  barColorClass?: string;
}

export function ScoreCard({
  label,
  value,
  maxValue = 100,
  colorClass = "text-foreground",
  barColorClass = "bg-primary",
}: ScoreCardProps) {
  const pct = Math.min((value / maxValue) * 100, 100);

  return (
    <Card className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/95 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.18)]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-fluid-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            {label}
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">
            {Math.round(pct)}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end gap-3">
          <span
            className={cn(
              "font-data text-[clamp(2.35rem,2rem+1vw,3rem)] leading-none",
              colorClass
            )}
          >
            {value}
          </span>
          <span className="pb-1 text-sm text-muted-foreground">/ {maxValue}</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
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

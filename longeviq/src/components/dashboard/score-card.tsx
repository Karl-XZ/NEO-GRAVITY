"use client";

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
}: ScoreCardProps) {
  const pct = Math.max(0, Math.min((value / maxValue) * 100, 100));

  return (
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
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <span className={cn("font-data text-fluid-2xl leading-none", colorClass)}>
          {value}
        </span>
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
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

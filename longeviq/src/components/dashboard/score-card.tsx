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
    <Card className="border-0 bg-surface-1">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-fluid-sm font-normal tracking-wide uppercase">
          {label}
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

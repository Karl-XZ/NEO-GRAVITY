"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BioAgeEstimate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BioAgeCardProps {
  data: BioAgeEstimate;
  chronologicalAge: number;
}

export function BioAgeCard({ data, chronologicalAge }: BioAgeCardProps) {
  const isYounger = data.delta < 0;

  return (
    <Card className="col-span-full lg:col-span-1 border-0 bg-surface-1">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-fluid-sm font-normal tracking-wide uppercase">
          Biological Age
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-baseline gap-4">
          <span className="font-data text-fluid-3xl text-glow-primary text-primary leading-none">
            {data.bioAge.toFixed(1)}
          </span>
          <div className="flex flex-col gap-1">
            <Badge
              className={cn(
                "text-xs px-2 py-0.5 rounded-md border-0",
                isYounger
                  ? "bg-status-normal/15 text-status-normal"
                  : "bg-status-critical/15 text-status-critical"
              )}
            >
              {isYounger ? "" : "+"}
              {data.delta.toFixed(1)} years
            </Badge>
            <span className="text-fluid-xs text-muted-foreground">
              vs. {chronologicalAge} chronological
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-fluid-xs text-muted-foreground uppercase tracking-wider">
            Contributing Factors
          </span>
          <ul className="flex flex-col gap-1.5">
            {data.drivers.map((driver) => {
              const isPositive = driver.toLowerCase().includes("lowers");
              return (
                <li key={driver} className="flex items-center gap-2 text-fluid-sm">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      isPositive ? "bg-status-normal" : "bg-status-warning"
                    )}
                  />
                  <span className="text-foreground/80">{driver}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

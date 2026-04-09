"use client";

import { cn } from "@/lib/utils";

interface VitalTileProps {
  label: string;
  value: string;
  unit: string;
  trend: number; // percentage change vs 7-day avg
  icon: React.ReactNode;
}

export function VitalTile({ label, value, unit, trend, icon }: VitalTileProps) {
  const isUp = trend > 0;
  const isNeutral = Math.abs(trend) < 0.5;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-1 px-4 py-4 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="[&_svg]:size-4 [&_svg]:stroke-muted-foreground">{icon}</span>
          <span className="text-fluid-xs uppercase tracking-wider">{label}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-data text-fluid-xl text-foreground leading-none">
          {value}
        </span>
        <span className="text-fluid-xs text-muted-foreground">{unit}</span>
      </div>

      <div className="flex items-center gap-1">
        {!isNeutral && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            className={cn(
              "shrink-0",
              isUp ? "text-status-warning rotate-0" : "text-status-normal rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M5 8V2M5 2L2 5M5 2L8 5" />
          </svg>
        )}
        <span
          className={cn(
            "font-data text-fluid-xs",
            isNeutral
              ? "text-muted-foreground"
              : isUp
                ? "text-status-warning"
                : "text-status-normal"
          )}
        >
          {isNeutral ? "—" : `${isUp ? "+" : ""}${trend.toFixed(1)}%`}
        </span>
        <span className="text-fluid-xs text-muted-foreground">vs 7-Tage-Schnitt</span>
      </div>
    </div>
  );
}

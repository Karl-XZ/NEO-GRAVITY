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
    <div className="rounded-[1.35rem] border border-white/70 bg-white/95 px-4 py-4 shadow-[0_14px_32px_-28px_rgba(15,23,42,0.16)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <span className="flex size-9 items-center justify-center rounded-2xl border border-foreground/8 bg-surface-2 [&_svg]:size-4 [&_svg]:stroke-current">
            {icon}
          </span>
          <span className="text-fluid-xs font-medium uppercase tracking-[0.16em]">{label}</span>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 font-data text-[11px]",
            isNeutral
              ? "bg-background/80 text-muted-foreground"
              : isUp
                ? "bg-status-warning/12 text-status-warning"
                : "bg-status-normal/12 text-status-normal"
          )}
        >
          {isNeutral ? "Stable" : `${isUp ? "+" : ""}${trend.toFixed(1)}%`}
        </span>
      </div>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="font-data text-[clamp(1.7rem,1.45rem+0.7vw,2.2rem)] leading-none text-foreground">
          {value}
        </span>
        <span className="text-fluid-xs text-muted-foreground">{unit}</span>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
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
          {isNeutral ? "No major change" : isUp ? "Above 7-day average" : "Below 7-day average"}
        </span>
      </div>
    </div>
  );
}

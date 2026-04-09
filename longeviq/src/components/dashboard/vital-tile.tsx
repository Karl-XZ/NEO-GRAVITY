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
    <div className="group relative overflow-hidden rounded-[1.45rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(241,243,245,0.88)_100%)] px-4 py-4 shadow-[0_22px_52px_-38px_rgba(15,23,42,0.28)] transition-transform duration-300 hover:-translate-y-0.5">
      <div className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top_left,rgba(5,150,105,0.12),transparent_58%)]" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <span className="flex size-9 items-center justify-center rounded-2xl border border-foreground/8 bg-background/75 [&_svg]:size-4 [&_svg]:stroke-current">
            {icon}
          </span>
          <span className="text-fluid-xs font-medium uppercase tracking-[0.2em]">{label}</span>
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

      <div className="relative mt-6 flex items-baseline gap-1.5">
        <span className="font-data text-[clamp(1.9rem,1.6rem+0.8vw,2.5rem)] leading-none text-foreground">
          {value}
        </span>
        <span className="text-fluid-xs text-muted-foreground">{unit}</span>
      </div>

      <div className="relative mt-4 flex items-center gap-1.5">
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

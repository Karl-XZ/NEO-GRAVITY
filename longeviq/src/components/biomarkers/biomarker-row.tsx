"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

export type BiomarkerStatus = "normal" | "warning" | "critical";

export interface BiomarkerRowProps {
  name: string;
  value: string;
  unit: string;
  status: BiomarkerStatus;
  reference: string;
  /** 0-100: where the value sits within the displayable range */
  rangePercent: number;
  /** Optional secondary label, e.g. "Systolisch / Diastolisch" */
  subtitle?: string;
}

const statusBorder: Record<BiomarkerStatus, string> = {
  normal: "border-l-status-normal",
  warning: "border-l-status-warning",
  critical: "border-l-status-critical",
};

const statusDot: Record<BiomarkerStatus, string> = {
  normal: "bg-status-normal",
  warning: "bg-status-warning",
  critical: "bg-status-critical",
};

const statusText: Record<BiomarkerStatus, string> = {
  normal: "text-status-normal",
  warning: "text-status-warning",
  critical: "text-status-critical",
};

const statusBarBg: Record<BiomarkerStatus, string> = {
  normal: "bg-status-normal",
  warning: "bg-status-warning",
  critical: "bg-status-critical",
};

const statusLabel: Record<BiomarkerStatus, string> = {
  normal: "Normal",
  warning: "Grenzwertig",
  critical: "Erhoht",
};

export function BiomarkerRow({
  name,
  value,
  unit,
  status,
  reference,
  rangePercent,
  subtitle,
}: BiomarkerRowProps) {
  const clampedPercent = Math.max(0, Math.min(100, rangePercent));

  return (
    <div
      className={cn(
        "group/row border-l-2 pl-4 py-4 transition-colors surface-hover rounded-r-md",
        statusBorder[status]
      )}
    >
      {/* Top row: name + value */}
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "inline-block size-2 shrink-0 rounded-full",
                statusDot[status]
              )}
            />
            <span className="text-fluid-base text-foreground">{name}</span>
          </div>
          {subtitle && (
            <span className="ml-[18px] mt-0.5 block text-fluid-xs text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 shrink-0">
          <span
            className={cn(
              "font-data text-fluid-lg font-medium text-glow-primary",
              statusText[status]
            )}
          >
            {value}
          </span>
          <span className="text-fluid-xs text-muted-foreground">{unit}</span>
        </div>
      </div>

      {/* Bottom row: range bar + reference */}
      <div className="mt-3 ml-[18px] flex items-center gap-4">
        {/* Range bar */}
        <div className="relative h-1 flex-1 max-w-[200px] rounded-full bg-surface-2 overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all",
              statusBarBg[status]
            )}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>

        {/* Reference text */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={<span />}
              className="cursor-default text-fluid-xs text-muted-foreground"
            >
              {reference}
            </TooltipTrigger>
            <TooltipContent side="top">
              <span>
                Status: {statusLabel[status]}
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

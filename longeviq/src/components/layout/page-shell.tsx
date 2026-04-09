import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

interface PageSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

interface HeroStatProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary" | "warning" | "critical";
}

const heroStatToneClasses: Record<NonNullable<HeroStatProps["tone"]>, string> = {
  default: "bg-white/72 text-foreground",
  primary: "bg-primary/8 text-primary ring-primary/8",
  warning: "bg-status-warning/10 text-status-warning ring-status-warning/8",
  critical: "bg-status-critical/10 text-status-critical ring-status-critical/8",
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-col gap-10 pb-24 sm:gap-12",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  meta,
  actions,
  children,
  className,
}: PageHeroProps) {
  return (
    <header
      className={cn(
        "glass-panel relative overflow-hidden rounded-[2.4rem] border border-white/80 px-6 py-7 sm:px-8 sm:py-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,113,227,0.1),transparent_28rem),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.44),transparent_20rem)]" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            {eyebrow ? (
              <p className="text-fluid-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <div className="space-y-2">
              <h1 className="text-[clamp(2rem,1.5rem+1.4vw,3.5rem)] font-semibold tracking-[-0.05em] text-foreground">
                {title}
              </h1>
              {description ? (
                <p className="max-w-2xl text-[clamp(0.95rem,0.88rem+0.25vw,1.08rem)] leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
        </div>

        {meta ? <div className="flex flex-wrap gap-3">{meta}</div> : null}
        {children ? <div className="grid gap-4">{children}</div> : null}
      </div>
    </header>
  );
}

export function HeroStat({
  label,
  value,
  hint,
  tone = "default",
}: HeroStatProps) {
  return (
    <div
      className={cn(
        "min-w-[158px] rounded-[1.6rem] px-4 py-3.5 ring-1 ring-black/[0.04] backdrop-blur-md",
        heroStatToneClasses[tone],
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-current/70">
        {label}
      </p>
      <p className="mt-2 font-data text-[clamp(1.2rem,1rem+0.55vw,1.7rem)] leading-none text-current">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-current/70">{hint}</p> : null}
    </div>
  );
}

export function PageSection({
  eyebrow,
  title,
  description,
  aside,
  children,
  className,
}: PageSectionProps) {
  return (
    <section className={cn("grid gap-4", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="text-fluid-xs font-medium uppercase tracking-[0.22em] text-muted-foreground/90">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-fluid-xl font-semibold tracking-[-0.04em] text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-fluid-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {aside ? <div className="flex shrink-0 flex-wrap gap-2">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function SoftPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/82 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(249,250,252,0.88)_100%)] shadow-[0_24px_48px_-36px_rgba(29,29,31,0.18)] ring-1 ring-black/[0.04]",
        className,
      )}
    >
      {children}
    </div>
  );
}

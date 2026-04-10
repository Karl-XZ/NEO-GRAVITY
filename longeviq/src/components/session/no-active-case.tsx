"use client";

import Link from "next/link";
import { ArrowRight, UserRoundSearch } from "lucide-react";

export function NoActiveCase({
  title = "Noch kein Fall aktiv",
  description = "Waehlen Sie auf der Startseite einen Persona-Fall oder starten Sie ueber den Fragebogen eine neue Registrierung.",
  ctaHref = "/",
  ctaLabel = "Zur Startseite",
}: {
  title?: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="max-w-md rounded-[2rem] border border-border bg-surface-1 p-8 text-center shadow-[0_28px_60px_-42px_rgba(15,23,42,0.24)]">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRoundSearch className="size-7" />
        </div>
        <h1 className="text-fluid-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <Link
          href={ctaHref}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {ctaLabel}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

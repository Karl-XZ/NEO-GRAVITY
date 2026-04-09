"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Menu, Settings2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { getPersonaLabel, getProfileInitials } from "@/lib/profile";
import type { UserProfile } from "@/lib/types";
import { NAV_ITEMS } from "./sidebar";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/assessment": "Assessment",
  "/biomarkers": "Biomarker",
  "/insights": "Insights",
  "/journey": "Journey",
  "/health-twin": "Health Twin",
  "/recommendations": "Empfehlungen",
  "/coach": "Gesundheitscoach",
  "/concept": "Konzept",
  "/profile": "Profil",
  "/settings": "Einstellungen",
};

export function Topbar({ profile }: { profile: UserProfile }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "LongevIQ";
  const [sheetOpen, setSheetOpen] = useState(false);
  const initials = getProfileInitials(profile.display_name);
  const personaLabel = getPersonaLabel(profile.persona_hint);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface-0 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground lg:hidden">
            <Menu className="size-5" />
            <span className="sr-only">Open navigation</span>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-64 bg-surface-0 border-border p-0"
            showCloseButton={false}
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>

            {/* Logo */}
            <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
              <Activity className="size-5 shrink-0 text-primary" />
              <span className="text-[15px] font-semibold tracking-tight font-heading">
                LongevIQ
              </span>
            </div>

            {/* Nav items */}
            <nav className="flex-1 space-y-0.5 px-2 pt-4">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-100",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wider">
          Beta
        </Badge>
      </div>

      <Link
        href="/settings"
        className="group flex items-center gap-3 rounded-xl border border-border bg-surface-1 px-3 py-2 transition-colors hover:bg-surface-2"
      >
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-none">
            {profile.display_name ?? "Unbekannter Nutzer"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {profile.role_label} | {personaLabel}
          </p>
        </div>
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <Settings2 className="hidden size-4 text-muted-foreground transition-colors group-hover:text-foreground sm:block" />
      </Link>
    </header>
  );
}

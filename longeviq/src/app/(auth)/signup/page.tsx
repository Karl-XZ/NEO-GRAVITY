"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Konto erstellen
        </h1>
        <p className="text-sm text-muted-foreground">
          Starten Sie Ihre personalisierte Longevity-Analyse.
        </p>
      </div>

      {/* Form */}
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="display-name">Anzeigename</Label>
          <Input
            id="display-name"
            type="text"
            placeholder="Max Mustermann"
            autoComplete="name"
            required
            className="h-10"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@beispiel.de"
            autoComplete="email"
            required
            className="h-10"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Passwort</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            className="h-10"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password-confirm">Passwort bestätigen</Label>
          <Input
            id="password-confirm"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            className="h-10"
          />
        </div>

        <Button type="submit" size="lg" className="mt-1 h-10 w-full">
          Konto erstellen
        </Button>
      </form>

      {/* Already registered */}
      <p className="text-center text-sm text-muted-foreground">
        Bereits registriert?{" "}
        <Link
          href="/login"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          Anmelden
        </Link>
      </p>
    </div>
  );
}

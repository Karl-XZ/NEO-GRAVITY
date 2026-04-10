"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to view your health data.
        </p>
      </div>

      {/* Form */}
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            required
            className="h-10"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="h-10"
          />
        </div>

        <Button type="submit" size="lg" className="mt-1 h-10 w-full">
          Sign in
        </Button>
      </form>

      {/* Forgot password link */}
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          Forgot password?
        </Link>
      </div>

      {/* Separator */}
      <div className="relative flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      {/* Create account */}
      <Link
        href="/signup"
        className="flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
      >
        Create account
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address. We will send you a reset link.
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

        <Button type="submit" size="lg" className="mt-1 h-10 w-full">
          Send link
        </Button>
      </form>

      {/* Back to login */}
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

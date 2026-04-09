import { NextResponse } from "next/server";

// Auth callback handler — will be implemented in Phase 3
export async function GET() {
  return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}

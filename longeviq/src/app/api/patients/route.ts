import { NextResponse } from "next/server";
import { getFeaturedPatients } from "@/lib/server/patient-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const patients = await getFeaturedPatients();
  return NextResponse.json({ patients });
}

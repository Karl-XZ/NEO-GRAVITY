import { NextResponse } from "next/server";
import { getPatientBundle } from "@/lib/server/patient-data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ patientId: string }> },
) {
  const { patientId } = await context.params;
  const bundle = await getPatientBundle(patientId);

  if (!bundle) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json(bundle);
}

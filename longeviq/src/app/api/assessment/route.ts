import { NextResponse } from "next/server";
import { createQuestionnaireBundle } from "@/lib/server/patient-data";
import type { QuestionnaireAssessmentInput } from "@/types";

export const dynamic = "force-dynamic";

function isValidPayload(
  payload: Partial<QuestionnaireAssessmentInput>,
): payload is QuestionnaireAssessmentInput {
  return (
    typeof payload.age === "number" &&
    typeof payload.sex === "string" &&
    typeof payload.country === "string" &&
    typeof payload.heightCm === "number" &&
    typeof payload.weightKg === "number" &&
    typeof payload.smokingStatus === "string" &&
    typeof payload.alcoholUnitsWeekly === "number" &&
    typeof payload.exerciseSessionsWeekly === "number" &&
    typeof payload.sedentaryHoursDay === "number" &&
    typeof payload.sleepHours === "number" &&
    typeof payload.sleepSatisfaction === "number" &&
    typeof payload.stressLevel === "number" &&
    typeof payload.dietQualityScore === "number" &&
    typeof payload.fruitVegServingsDaily === "number" &&
    typeof payload.waterGlassesDaily === "number" &&
    typeof payload.selfRatedHealth === "number" &&
    Array.isArray(payload.chronicConditions)
  );
}

export async function POST(request: Request) {
  let payload: Partial<QuestionnaireAssessmentInput>;

  try {
    payload = (await request.json()) as Partial<QuestionnaireAssessmentInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!isValidPayload(payload)) {
    return NextResponse.json(
      { error: "Invalid questionnaire payload." },
      { status: 400 },
    );
  }

  const bundle = await createQuestionnaireBundle(payload);
  return NextResponse.json(bundle);
}

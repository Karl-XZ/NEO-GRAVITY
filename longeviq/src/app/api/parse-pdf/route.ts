import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { base64 } = (await req.json()) as { base64?: string };

  if (!base64) {
    return Response.json({ error: "No PDF data provided" }, { status: 400 });
  }

  return Response.json(
    {
      error:
        "PDF parsing is unavailable in this environment because the required parser dependencies are not installed.",
    },
    { status: 503 },
  );
}

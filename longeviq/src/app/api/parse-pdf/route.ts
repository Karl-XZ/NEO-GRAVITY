import { NextRequest } from "next/server";
import { PDFParse } from "pdf-parse";

PDFParse.setWorker();

export async function POST(req: NextRequest) {
  const { base64 } = (await req.json()) as { base64: string };

  if (!base64) {
    return Response.json({ error: "No PDF data provided" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(base64, "base64");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    const text = result.text.trim();
    if (!text) {
      return Response.json(
        { error: "PDF contains no extractable text" },
        { status: 422 },
      );
    }
    return Response.json({ text });
  } catch (e) {
    return Response.json(
      { error: `Failed to parse PDF: ${e instanceof Error ? e.message : "unknown error"}` },
      { status: 422 },
    );
  }
}

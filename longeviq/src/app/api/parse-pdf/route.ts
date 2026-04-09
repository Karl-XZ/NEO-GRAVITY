import { NextRequest } from "next/server";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { join } from "path";
import { pathToFileURL } from "url";

GlobalWorkerOptions.workerSrc = pathToFileURL(
  join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
).href;

export async function POST(req: NextRequest) {
  const { base64 } = (await req.json()) as { base64: string };

  if (!base64) {
    return Response.json({ error: "No PDF data provided" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(base64, "base64");
    const data = new Uint8Array(buffer);

    const doc = await getDocument({ data, disableFontFace: true }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: Record<string, unknown>) => (typeof item.str === "string" ? item.str : ""))
        .join(" ");
      pages.push(text);
    }

    const fullText = pages.join("\n\n").trim();

    if (!fullText) {
      return Response.json(
        { error: "PDF contains no extractable text" },
        { status: 422 },
      );
    }

    return Response.json({ text: fullText });
  } catch (e) {
    return Response.json(
      { error: `Failed to parse PDF: ${e instanceof Error ? e.message : "unknown error"}` },
      { status: 422 },
    );
  }
}

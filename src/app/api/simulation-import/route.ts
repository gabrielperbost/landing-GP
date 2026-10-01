import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseInsurerSimulationText } from "@/lib/insurerSimulationImport";
import { isSimulateurAuthorizedFromRequest } from "@/lib/simulateurAuth";

export const runtime = "nodejs";

const MAX_PDF_SIZE_BYTES = 12 * 1024 * 1024;

type TextItem = {
  str?: string;
};

export async function POST(request: NextRequest) {
  try {
    if (!isSimulateurAuthorizedFromRequest(request)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "missing_file" }, { status: 400 });
    }

    const fileName = file.name || "simulation.pdf";
    if (!fileName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "unsupported_file_type" }, { status: 415 });
    }

    if (file.size <= 0 || file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json({ error: "invalid_file_size" }, { status: 413 });
    }

    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Objet assigné à une variable typée explicitement avant l'appel : passé en littéral
    // directement, TypeScript échoue parfois à vérifier les propriétés en excès contre une
    // union contenant plusieurs membres de type objet (ArrayBuffer | TypedArray | ...
    // | DocumentInitParameters), même quand la propriété existe bien sur le bon membre.
    const documentParams: Parameters<typeof pdfjs.getDocument>[0] = {
      data: bytes,
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false
    };
    const loadingTask = pdfjs.getDocument(documentParams);

    const pdf = await loadingTask.promise;

    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const tokens = (textContent.items as TextItem[])
        .map((item) => item.str?.trim() ?? "")
        .filter(Boolean);

      pages.push(tokens.join(" "));
    }

    const parsed = parseInsurerSimulationText({
      sourceFileName: fileName,
      pages
    });

    return NextResponse.json({
      data: parsed
    });
  } catch (error) {
    console.error("simulation_import_failed", error);
    return NextResponse.json({ error: "import_failed" }, { status: 500 });
  }
}

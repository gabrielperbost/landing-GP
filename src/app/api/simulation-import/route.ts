import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseInsurerSimulationText } from "@/lib/insurerSimulationImport";
import { isSimulateurAuthorizedFromRequest } from "@/lib/simulateurAuth";
import type * as pdfjsType from "pdfjs-dist/legacy/build/pdf.mjs";

// pdfjs-dist n'exporte pas DocumentInitParameters publiquement (il n'existe que dans un
// fichier de types interne) : on l'isole depuis le type réel du paramètre de getDocument(),
// qui est une union (ArrayBuffer | URL | TypedArray | DocumentInitParameters) — seul le
// membre objet a une propriété `data`, ce qui permet de l'extraire sans dépendre d'un
// chemin d'import interne fragile.
type GetDocumentParam = Parameters<typeof pdfjsType.getDocument>[0];
type DocumentInitParameters = Extract<GetDocumentParam, { data?: unknown }>;

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

    // Objet assigné à une variable typée explicitement avec DocumentInitParameters (pas
    // Parameters<typeof getDocument>[0], qui reste l'union ArrayBuffer | URL | TypedArray |
    // DocumentInitParameters et reproduit le même échec) : passé en littéral directement à
    // getDocument(), TypeScript échoue à vérifier les propriétés en excès contre cette union,
    // même quand la propriété existe bien sur le membre DocumentInitParameters.
    const documentParams: DocumentInitParameters = {
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

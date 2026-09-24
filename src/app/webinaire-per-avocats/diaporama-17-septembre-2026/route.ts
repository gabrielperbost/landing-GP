import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  const pdf = await readFile(
    path.join(process.cwd(), "assets/webinars/2026-09-17/diaporama-per-optimisation-fiscale.pdf")
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Diaporama-PER-optimisation-fiscale-17-09-2026.pdf"',
      "Content-Length": String(pdf.byteLength),
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}

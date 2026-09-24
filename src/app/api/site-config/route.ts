import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clean = (value: string | undefined, placeholders: string[]) => {
  const trimmed = (value ?? "").trim();
  return trimmed && !placeholders.includes(trimmed) ? trimmed : null;
};

/**
 * Identifiants de mesure d'audience lus côté serveur : les pages du site sont des fichiers
 * statiques, elles demandent donc ces valeurs ici, et seulement après le consentement du visiteur.
 */
export async function GET() {
  return NextResponse.json(
    {
      ga4Id: clean(process.env.NEXT_PUBLIC_GA4_ID, ["G-XXXXXXX"]),
      metaPixelId: clean(process.env.NEXT_PUBLIC_META_PIXEL_ID, ["YOUR_META_PIXEL_ID"])
    },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}

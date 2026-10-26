import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { CAMPAGNES_LEADS, enregistrerInscriptionWebinaire, inscritsARattacher, lireInscritsWebinaires } from "@/lib/gpf/campagnesLeads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LOT = 20;

/**
 * Reprise des inscrits des webinaires (Google Sheets) dans le CRM, sans tâche ni notification.
 * « analyser » : comptage par campagne, rien n'est écrit. « importer » : traite un lot de 20 et
 * renvoie le nombre restant (la page relance jusqu'à 0). Rejouable sans doublon.
 */
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { inscrits, erreurs } = await lireInscritsWebinaires();
  let aFaire;
  try {
    aFaire = await inscritsARattacher(inscrits);
  } catch {
    return NextResponse.json({ ok: false, error: "migration_requise" }, { status: 409 });
  }

  if (body?.etape !== "importer") {
    return NextResponse.json({
      ok: true,
      erreurs,
      parCampagne: CAMPAGNES_LEADS.map((c) => ({
        id: c.id,
        libelle: c.libelle,
        total: inscrits.filter((i) => i.campagne === c.id).length,
        aImporter: aFaire.filter((i) => i.campagne === c.id).length
      })),
      aImporter: aFaire.length
    });
  }

  let importes = 0;
  const echecs: { email: string; error: string }[] = [];
  for (const i of aFaire.slice(0, LOT)) {
    try {
      const r = await enregistrerInscriptionWebinaire(i);
      if (r.ok) importes++;
      else echecs.push({ email: String(i.email), error: r.error });
    } catch (error) {
      // Une fiche en erreur ne bloque pas le lot : elle est comptée en échec.
      echecs.push({ email: String(i.email), error: error instanceof Error ? error.message : String(error) });
    }
  }
  return NextResponse.json({ ok: true, importes, echecs, restants: Math.max(0, aFaire.length - LOT) });
}

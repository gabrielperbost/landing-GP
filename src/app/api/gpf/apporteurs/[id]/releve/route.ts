import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { chargerPilotage, moisDe } from "@/lib/gpf/pilotage";
import { genererPdf, type Bloc } from "@/lib/gpf/pdf";
import { GPF_PRODUIT_LABEL, formatNom, type GpfProduit } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eur = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);

/** Relevé PDF des rétrocessions d'un apporteur pour un mois (ou une année : mois=AAAA). */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const periode = request.nextUrl.searchParams.get("mois") ?? new Date().toISOString().slice(0, 7);
  if (!/^\d{4}(-\d{2})?$/.test(periode)) return NextResponse.json({ ok: false, error: "periode_invalide" }, { status: 400 });
  const { data: a } = await supabaseAdmin.from("gpf_apporteurs").select("*").eq("id", params.id).single();
  if (!a) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });

  const p = await chargerPilotage();
  const ids = new Set(p.clients.filter((c) => c.apporteur_id === a.id).map((c) => c.id));
  const dossierBy = new Map(p.dossiers.map((d) => [d.id, d]));
  const clientBy = new Map(p.clients.map((c) => [c.id, c]));
  const lignes = p.lignes.filter((l) => {
    const d = l.dossier_id ? dossierBy.get(l.dossier_id) : null;
    return d && ids.has(d.client_id) && moisDe(l).startsWith(periode) && Number(l.retrocession ?? 0) !== 0;
  });
  const total = lignes.reduce((s, l) => s + Number(l.retrocession ?? 0), 0);
  const libelle = periode.length === 4 ? `année ${periode}` : new Date(`${periode}-01T00:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const blocs: Bloc[] = [
    { t: "titre", texte: "Relevé de rétrocessions" },
    { t: "champs", lignes: [["Apporteur", a.nom], ["Période", libelle], ["Taux convenu", a.taux_retrocession != null ? `${String(a.taux_retrocession).replace(".", ",")} %` : "selon dossier"], ["Total à reverser", eur(total)]] },
    { t: "sousTitre", texte: "Détail" },
    ...(lignes.length
      ? [
          {
            t: "champs" as const,
            lignes: lignes.map((l) => {
              const d = dossierBy.get(l.dossier_id!)!;
              return [`${formatNom(clientBy.get(d.client_id) ?? null)}`, `${GPF_PRODUIT_LABEL[d.produit as GpfProduit] ?? d.produit} · commission ${eur(l.montant)} → rétrocession ${eur(Number(l.retrocession))}`] as [string, string];
            })
          }
        ]
      : [{ t: "para" as const, texte: "Aucune rétrocession sur la période." }]),
    { t: "para", texte: "Montants calculés à partir des bordereaux de commission validés par le cabinet.", petit: true }
  ];
  const pdf = await genererPdf("Relevé de rétrocessions", blocs);
  const nom = `Releve ${a.nom} ${periode}.pdf`.replace(/[\\/:*?"<>|]/g, "");
  return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nom)}` } });
}

import { NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { recueilPerime } from "@/lib/gpf/conformite";
import { GPF_STATUTS_CLOS, formatNom, type GpfStatut } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUIVIS = ["der", "lettre_mission", "collecte", "piece_identite", "rapport_adequation"] as const;
const PI = /^(cni|pi[eè]ce d'identit|passeport|titre de s[eé]jour)/i;

/**
 * Conformité de tous les contacts ayant une affaire en cours ou un contrat :
 * état de chaque pièce réglementaire, recueil de plus de 12 mois, affaires
 * bloquées avant souscription.
 */
export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [{ data: dossiers }, { data: clients }, conf, { data: docs }] = await Promise.all([
    supabaseAdmin.from("gpf_dossiers").select("id, client_id, statut, contrat_statut, produit").is("deleted_at", null),
    supabaseAdmin.from("gpf_clients").select("id, prenom, nom").is("deleted_at", null),
    supabaseAdmin.from("gpf_compliance").select("*"),
    supabaseAdmin.from("gpf_documents").select("client_id, type").is("deleted_at", null)
  ]);
  if (conf.error) return NextResponse.json({ ok: true, disponible: false, lignes: [], resume: null });

  const actifs = (dossiers ?? []).filter((d) => !GPF_STATUTS_CLOS.has(d.statut as GpfStatut) && d.contrat_statut !== "resilie");
  const parClient = new Map<string, typeof actifs>();
  for (const d of actifs) parClient.set(d.client_id, [...(parClient.get(d.client_id) ?? []), d]);
  const confPar = new Map<string, Map<string, { statut: string; date_signature: string | null; signature_statut?: string | null }>>();
  for (const x of conf.data ?? []) {
    if (!confPar.has(x.client_id)) confPar.set(x.client_id, new Map());
    confPar.get(x.client_id)!.set(x.type, x);
  }
  const avecPI = new Set((docs ?? []).filter((d) => d.client_id && PI.test(d.type)).map((d) => d.client_id));

  const lignes = (clients ?? [])
    .filter((c) => parClient.has(c.id))
    .map((c) => {
      const m = confPar.get(c.id) ?? new Map();
      const etat = Object.fromEntries(
        SUIVIS.map((t) => {
          let s = m.get(t)?.statut ?? "manquant";
          if (t === "piece_identite" && s !== "fait" && avecPI.has(c.id)) s = "fait";
          return [t, s];
        })
      ) as Record<(typeof SUIVIS)[number], string>;
      const ds = parClient.get(c.id)!;
      const enAmont = ds.some((d) => ["a_traiter", "nrp", "devis_a_realiser", "devis_envoye", "attente_documents"].includes(d.statut));
      return {
        client_id: c.id,
        client: formatNom(c),
        nbDossiers: ds.length,
        contrat: ds.some((d) => d.contrat_statut),
        etat,
        recueilDate: m.get("collecte")?.date_signature ?? null,
        recueilPerime: recueilPerime(m.get("collecte")?.date_signature),
        aSigner: Array.from(m.values()).filter((x) => x.signature_statut === "a_signer" && x.statut !== "fait").length,
        bloque: enAmont && (etat.der !== "fait" || etat.piece_identite !== "fait"),
        complet: SUIVIS.every((t) => etat[t] === "fait")
      };
    })
    .sort((a, b) => Number(b.bloque) - Number(a.bloque) || Number(b.recueilPerime) - Number(a.recueilPerime) || a.client.localeCompare(b.client));

  return NextResponse.json({
    ok: true,
    disponible: true,
    lignes,
    resume: {
      total: lignes.length,
      complets: lignes.filter((l) => l.complet).length,
      bloques: lignes.filter((l) => l.bloque).length,
      recueilsPerimes: lignes.filter((l) => l.recueilPerime).length,
      sansDer: lignes.filter((l) => l.etat.der !== "fait").length
    }
  });
}

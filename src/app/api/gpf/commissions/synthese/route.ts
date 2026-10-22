import { NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { arrondi, chargerPilotage, commissionEstimee, compagnieDe, derniersMois, estSigne, moisDe } from "@/lib/gpf/pilotage";
import { formatNom } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Synthèse des commissions : attendu (contrats signés, par mois d'effet) vs
 * encaissé (bordereaux validés), par compagnie, décommissions, contrats sans
 * commission reçue et rétrocessions à reverser aux apporteurs.
 */
export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { dossiers, clients, insurers, apporteurs, lignes } = await chargerPilotage();
  const mois = derniersMois(12);
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const dossierById = new Map(dossiers.map((d) => [d.id, d]));
  const insurerNom = new Map(insurers.map((i) => [i.id, i.nom]));
  const signes = dossiers.filter(estSigne);

  // Attendu vs encaissé par mois.
  const parMois = mois.map((m) => {
    const attendu = signes.filter((d) => (d.date_effet ?? d.date_signature ?? "").slice(0, 7) === m).reduce((s, d) => s + commissionEstimee(d), 0);
    const duMois = lignes.filter((l) => moisDe(l) === m);
    const encaisse = duMois.filter((l) => l.type_commission !== "decommission" && l.montant >= 0).reduce((s, l) => s + l.montant, 0);
    const decommissions = duMois.filter((l) => l.type_commission === "decommission" || l.montant < 0).reduce((s, l) => s + Math.abs(l.montant), 0);
    const retro = duMois.reduce((s, l) => s + Number(l.retrocession ?? 0), 0);
    return { mois: m, attendu: arrondi(attendu), encaisse: arrondi(encaisse), decommissions: arrondi(decommissions), retrocessions: arrondi(retro), net: arrondi(encaisse - decommissions - retro) };
  });

  // Par compagnie, sur 12 mois glissants.
  const depuis = mois[0];
  const compagnies = new Map<string, { compagnie: string; attendu: number; encaisse: number; decommissions: number; lignes: number }>();
  const acc = (nom: string) => compagnies.get(nom) ?? compagnies.set(nom, { compagnie: nom, attendu: 0, encaisse: 0, decommissions: 0, lignes: 0 }).get(nom)!;
  for (const d of signes) {
    if ((d.date_effet ?? d.date_signature ?? "").slice(0, 7) >= depuis) acc(compagnieDe(d.assureur_nom, insurers)).attendu += commissionEstimee(d);
  }
  for (const l of lignes) {
    if (moisDe(l) < depuis) continue;
    const nom = l.insurer_id ? insurerNom.get(l.insurer_id) ?? "Non renseignée" : compagnieDe(l.dossier_id ? dossierById.get(l.dossier_id)?.assureur_nom : null, insurers);
    const a = acc(nom);
    a.lignes++;
    if (l.type_commission === "decommission" || l.montant < 0) a.decommissions += Math.abs(l.montant);
    else a.encaisse += l.montant;
  }

  const nomDossier = (id: string | null) => {
    const d = id ? dossierById.get(id) : null;
    return d ? formatNom(clientById.get(d.client_id) ?? null) : null;
  };

  // Décommissions détaillées.
  const decommissions = lignes
    .filter((l) => l.type_commission === "decommission" || l.montant < 0)
    .sort((a, b) => moisDe(b).localeCompare(moisDe(a)))
    .map((l) => ({
      id: l.id,
      mois: moisDe(l),
      client: nomDossier(l.dossier_id) ?? l.client_nom_brut,
      client_id: l.dossier_id ? dossierById.get(l.dossier_id)?.client_id ?? null : null,
      compagnie: l.insurer_id ? insurerNom.get(l.insurer_id) ?? null : null,
      montant: arrondi(Math.abs(l.montant)),
      bordereau_id: l.bordereau_id
    }));

  // Contrats signés depuis plus de 60 jours sans aucune commission reçue.
  const avecLigne = new Set(lignes.map((l) => l.dossier_id).filter(Boolean));
  const limite = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const sansCommission = signes
    .filter((d) => d.contrat_statut !== "resilie" && !avecLigne.has(d.id) && commissionEstimee(d) > 0 && (d.date_effet ?? d.date_signature ?? "9999") <= limite)
    .map((d) => ({ id: d.id, client_id: d.client_id, client: formatNom(clientById.get(d.client_id) ?? null), produit: d.produit, compagnie: compagnieDe(d.assureur_nom, insurers), date_effet: d.date_effet, attendu: arrondi(commissionEstimee(d)) }))
    .sort((a, b) => (a.date_effet ?? "").localeCompare(b.date_effet ?? ""));

  // Rétrocessions par apporteur et par mois (montant à reverser).
  const apporteurDe = (dossierId: string | null) => {
    const d = dossierId ? dossierById.get(dossierId) : null;
    return d ? (clientById.get(d.client_id)?.apporteur_id as string | null) ?? null : null;
  };
  const retroApporteurs = apporteurs.map((a) => {
    const ls = lignes.filter((l) => Number(l.retrocession ?? 0) !== 0 && apporteurDe(l.dossier_id) === a.id);
    return {
      id: a.id,
      nom: a.nom,
      taux: a.taux_retrocession,
      parMois: mois.map((m) => ({ mois: m, montant: arrondi(ls.filter((l) => moisDe(l) === m).reduce((s, l) => s + Number(l.retrocession ?? 0), 0)) })),
      total12: arrondi(ls.filter((l) => moisDe(l) >= depuis).reduce((s, l) => s + Number(l.retrocession ?? 0), 0))
    };
  });
  // Rétrocessions sur des dossiers sans apporteur rattaché (taux saisi sur le dossier).
  const retroSansApporteur = arrondi(lignes.filter((l) => Number(l.retrocession ?? 0) !== 0 && !apporteurDe(l.dossier_id) && moisDe(l) >= depuis).reduce((s, l) => s + Number(l.retrocession ?? 0), 0));

  return NextResponse.json({
    ok: true,
    mois,
    parMois,
    compagnies: Array.from(compagnies.values())
      .map((c) => ({ ...c, attendu: arrondi(c.attendu), encaisse: arrondi(c.encaisse), decommissions: arrondi(c.decommissions), ecart: arrondi(c.encaisse - c.decommissions - c.attendu) }))
      .sort((a, b) => b.encaisse + b.attendu - (a.encaisse + a.attendu)),
    decommissions,
    sansCommission,
    retroApporteurs,
    retroSansApporteur
  });
}

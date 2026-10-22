import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { arrondi, chargerPilotage, commissionEstimee, compagnieDe, derniersMois, estContrat, estPerdu, estSigne, moisDe, type DossierP } from "@/lib/gpf/pilotage";
import { primeAnnuelle } from "@/lib/gpf/contrats";
import { normSource } from "@/lib/gpf/sources";
import { GPF_PRODUIT_LABEL, type GpfProduit } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AXES = ["produit", "compagnie", "source", "apporteur"] as const;
type Axe = (typeof AXES)[number];

/**
 * Reporting : une ligne par valeur de l'axe choisi (produit, compagnie, source
 * ou apporteur), avec leads, signatures, transformation, portefeuille et
 * commissions encaissées sur 6 et 12 mois. Période : n derniers mois.
 */
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const p = request.nextUrl.searchParams;
  const axe: Axe = AXES.includes(p.get("axe") as Axe) ? (p.get("axe") as Axe) : "produit";
  const nbMois = Math.min(36, Math.max(1, Number(p.get("mois") ?? 12) || 12));

  const { dossiers, clients, insurers, apporteurs, lignes } = await chargerPilotage();
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const dossierById = new Map(dossiers.map((d) => [d.id, d]));
  const insurerNom = new Map(insurers.map((i) => [i.id, i.nom]));
  const apporteurNom = new Map(apporteurs.map((a) => [a.id, a.nom]));
  const debut = derniersMois(nbMois)[0];
  const debut6 = derniersMois(6)[0];
  const debut12 = derniersMois(12)[0];

  const valeur = (d: DossierP): string => {
    const c = clientById.get(d.client_id);
    if (axe === "produit") return GPF_PRODUIT_LABEL[d.produit as GpfProduit] ?? d.produit;
    if (axe === "compagnie") return compagnieDe(d.assureur_nom, insurers);
    if (axe === "source") return normSource((c?.provenance as string) ?? (c?.source as string));
    return c?.apporteur_id ? apporteurNom.get(c.apporteur_id) ?? "Apporteur supprimé" : "Sans apporteur";
  };

  type Row = { valeur: string; leads: number; signes: number; perdus: number; contrats: number; primes: number; commEstimees: number; encaisse6: number; encaisse12: number };
  const rows = new Map<string, Row>();
  const row = (v: string) => rows.get(v) ?? rows.set(v, { valeur: v, leads: 0, signes: 0, perdus: 0, contrats: 0, primes: 0, commEstimees: 0, encaisse6: 0, encaisse12: 0 }).get(v)!;

  for (const d of dossiers) {
    const r = row(valeur(d));
    const cree = String(d.created_at ?? "").slice(0, 7);
    const signe = (d.date_signature ?? d.date_effet ?? "").slice(0, 7);
    if (cree >= debut) r.leads++;
    if (estSigne(d) && signe >= debut) {
      r.signes++;
      r.commEstimees += commissionEstimee(d);
    }
    if (estPerdu(d) && cree >= debut) r.perdus++;
    if (estContrat(d)) {
      r.contrats++;
      r.primes += primeAnnuelle(d) ?? 0;
    }
  }
  for (const l of lignes) {
    const m = moisDe(l);
    if (m < debut12) continue;
    const d = l.dossier_id ? dossierById.get(l.dossier_id) : null;
    const v = d ? valeur(d) : axe === "compagnie" && l.insurer_id ? insurerNom.get(l.insurer_id) ?? "Non renseignée" : "Non rapproché";
    const r = row(v);
    r.encaisse12 += l.montant;
    if (m >= debut6) r.encaisse6 += l.montant;
  }

  const lignesRapport = Array.from(rows.values())
    .map((r) => ({
      ...r,
      transformation: r.leads ? Math.round((r.signes / r.leads) * 100) : null,
      primes: arrondi(r.primes),
      commEstimees: arrondi(r.commEstimees),
      encaisse6: arrondi(r.encaisse6),
      encaisse12: arrondi(r.encaisse12)
    }))
    .filter((r) => r.leads || r.signes || r.contrats || r.encaisse12)
    .sort((a, b) => b.contrats + b.leads - (a.contrats + a.leads));

  const clientsP = clients.filter((c) => String(c.created_at).slice(0, 7) >= debut);
  const avecContrat = new Set(dossiers.filter(estContrat).map((d) => d.client_id));
  return NextResponse.json({
    ok: true,
    axe,
    mois: nbMois,
    resume: {
      nouveauxContacts: clientsP.length,
      nouveauxLeads: clientsP.filter((c) => !avecContrat.has(c.id)).length,
      clients: avecContrat.size
    },
    lignes: lignesRapport,
    // Commissions encaissées mois par mois sur 12 mois.
    encaissementsMensuels: derniersMois(12).map((m) => ({ mois: m, montant: arrondi(lignes.filter((l) => moisDe(l) === m).reduce((s, l) => s + l.montant, 0)) }))
  });
}

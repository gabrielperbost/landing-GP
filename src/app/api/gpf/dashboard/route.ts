import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_PRODUIT_LABEL, GPF_STATUTS_SIGNES, type GpfProduit } from "@/lib/gpf/types";
import { primeAnnuelle, prochaineEcheance } from "@/lib/gpf/contrats";
import { normSource } from "@/lib/gpf/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Dossier = Record<string, unknown> & {
  id: string;
  client_id: string;
  produit: GpfProduit;
  statut: string;
  contrat_statut?: string | null;
  date_signature?: string | null;
  date_effet: string | null;
  date_resiliation?: string | null;
  assureur_nom: string | null;
  precompte_lineaire_1ere_annee: number | null;
  frais_dossier: number | null;
  prochaine_action?: string | null;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const debutMois = (y: number, m: number) => new Date(Date.UTC(y, m, 1));

/** Date de signature : posée automatiquement depuis le CRM, à défaut date d'effet (historique Monday). */
const dateSignature = (d: Dossier) => (GPF_STATUTS_SIGNES.has(d.statut) || d.contrat_statut ? d.date_signature ?? d.date_effet : null);
const commissionEstimee = (d: Dossier) => Number(d.precompte_lineaire_1ere_annee ?? 0) + Number(d.frais_dossier ?? 0);
const variation = (actuel: number, precedent: number) => ({
  actuel,
  precedent,
  ecart: actuel - precedent,
  pourcentage: precedent ? Math.round(((actuel - precedent) / Math.abs(precedent)) * 100) : actuel ? 100 : 0
});

/**
 * Tableau de bord « Performance & Pilotage » : production signée, commissions,
 * contrats, leads, rentabilité par source et alertes, sur un mois ou en cumul
 * annuel, avec la comparaison à la période précédente.
 */
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const p = request.nextUrl.searchParams;
  const now = new Date();
  const [y, m] = (p.get("mois") ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).split("-").map(Number);
  const cumul = p.get("mode") === "cumul";
  const debut = cumul ? debutMois(y, 0) : debutMois(y, m - 1);
  const fin = debutMois(y, m);
  const debutPrec = cumul ? debutMois(y - 1, 0) : debutMois(y, m - 2);
  const finPrec = cumul ? debutMois(y - 1, m) : debutMois(y, m - 1);
  const dans = (date: string | null | undefined, a: Date, b: Date) => Boolean(date) && date! >= iso(a) && date! < iso(b);

  const [dossiersR, clientsR, lignesR, coutsR, conformiteR, documentsR, bordereauxR, appelsR] = await Promise.all([
    supabaseAdmin.from("gpf_dossiers").select("*").is("deleted_at", null),
    supabaseAdmin.from("gpf_clients").select("*").is("deleted_at", null),
    supabaseAdmin.from("gpf_commission_lines").select("montant, type_commission, periode_fin, created_at, bordereau_id"),
    supabaseAdmin.from("gpf_source_costs").select("source, mois, cout"),
    supabaseAdmin.from("gpf_compliance").select("client_id, type, date_expiration"),
    supabaseAdmin.from("gpf_documents").select("client_id, dossier_id, type, date_expiration").is("deleted_at", null),
    supabaseAdmin.from("gpf_bordereaux").select("*"),
    supabaseAdmin.from("gpf_calls").select("client_id")
  ]);
  const dossiers = (dossiersR.data ?? []) as Dossier[];
  const clients = clientsR.data ?? [];
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const bordereauValide = new Map((bordereauxR.data ?? []).map((b) => [b.id, b.import_statut ? b.import_statut === "valide" : b.statut_traitement === "valide"]));
  const lignes = (lignesR.data ?? []).filter((l) => bordereauValide.get(l.bordereau_id));

  const signesEntre = (a: Date, b: Date) => dossiers.filter((d) => dans(dateSignature(d), a, b));
  const signes = signesEntre(debut, fin);
  const signesPrec = signesEntre(debutPrec, finPrec);
  const volume = (list: Dossier[]) => list.reduce((s, d) => s + (primeAnnuelle(d) ?? 0), 0);
  const comm = (list: Dossier[]) => list.reduce((s, d) => s + commissionEstimee(d), 0);
  const encaisse = (a: Date, b: Date) =>
    lignes.filter((l) => l.type_commission !== "decommission" && dans((l.periode_fin ?? l.created_at)?.slice(0, 10), a, b)).reduce((s, l) => s + Number(l.montant ?? 0), 0);
  const decommissions = (a: Date, b: Date) =>
    lignes.filter((l) => l.type_commission === "decommission" && dans((l.periode_fin ?? l.created_at)?.slice(0, 10), a, b)).reduce((s, l) => s + Math.abs(Number(l.montant ?? 0)), 0);
  const resilies = (a: Date, b: Date) => dossiers.filter((d) => d.contrat_statut === "resilie" && dans(d.date_resiliation, a, b)).length;
  const estContratActif = (d: Dossier) => (d.contrat_statut ? d.contrat_statut === "actif" : GPF_STATUTS_SIGNES.has(d.statut));
  const actifs = dossiers.filter(estContratActif).length;
  const leadsEntre = (a: Date, b: Date) => clients.filter((c) => dans(c.created_at?.slice(0, 10), a, b));

  // Histogramme : 12 derniers mois jusqu'au mois sélectionné.
  const histogramme = Array.from({ length: 12 }, (_, i) => {
    const a = debutMois(y, m - 12 + i);
    const b = debutMois(y, m - 11 + i);
    const s = signesEntre(a, b);
    return { mois: iso(a).slice(0, 7), production: Math.round(volume(s)), commissions: Math.round(comm(s)), encaisse: Math.round(encaisse(a, b)), contrats: s.length };
  });

  const repartir = (cle: (d: Dossier) => string) => {
    const map = new Map<string, number>();
    const counts = new Map<string, number>();
    for (const d of signes) {
      const k = cle(d);
      map.set(k, (map.get(k) ?? 0) + (primeAnnuelle(d) ?? 0));
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return [...counts.keys()].map((k) => ({ label: k, volume: Math.round(map.get(k) ?? 0), contrats: counts.get(k) ?? 0 })).sort((a, b) => b.volume - a.volume || b.contrats - a.contrats);
  };

  // Rentabilité par source (leads arrivés sur la période).
  const signesParClient = new Map<string, Dossier[]>();
  for (const d of dossiers.filter((x) => dateSignature(x))) {
    if (!signesParClient.has(d.client_id)) signesParClient.set(d.client_id, []);
    signesParClient.get(d.client_id)!.push(d);
  }
  const sourceParClient = new Map<string, string>();
  for (const d of dossiers) if (!sourceParClient.has(d.client_id) && d.source) sourceParClient.set(d.client_id, String(d.source));
  const coutsPeriode = new Map<string, number>();
  for (const c of coutsR.data ?? []) if (dans(c.mois, debut, fin)) coutsPeriode.set(c.source, (coutsPeriode.get(c.source) ?? 0) + Number(c.cout));
  const parSource = new Map<string, { leads: number; signes: number; commissions: number }>();
  for (const c of leadsEntre(debut, fin)) {
    const s = normSource(c.provenance ?? sourceParClient.get(c.id));
    if (!parSource.has(s)) parSource.set(s, { leads: 0, signes: 0, commissions: 0 });
    const v = parSource.get(s)!;
    v.leads++;
    const sig = signesParClient.get(c.id) ?? [];
    if (sig.length) v.signes++;
    v.commissions += comm(sig);
  }
  for (const s of coutsPeriode.keys()) if (!parSource.has(s)) parSource.set(s, { leads: 0, signes: 0, commissions: 0 });
  const rentabilite = [...parSource.entries()]
    .map(([source, v]) => {
      const cout = coutsPeriode.get(source) ?? null;
      return {
        source,
        ...v,
        commissions: Math.round(v.commissions),
        conversion: v.leads ? Math.round((v.signes / v.leads) * 100) : 0,
        cout,
        coutParLead: cout != null && v.leads ? Math.round(cout / v.leads) : null,
        coutParContrat: cout != null && v.signes ? Math.round(cout / v.signes) : null,
        roi: cout ? Math.round(((v.commissions - cout) / cout) * 100) : null
      };
    })
    .sort((a, b) => b.leads - a.leads);

  // Alertes critiques.
  const today = iso(now);
  const signesClients = new Set(dossiers.filter((d) => dateSignature(d)).map((d) => d.client_id));
  const appeles = new Set((appelsR.data ?? []).map((a) => a.client_id));
  const il60j = new Date(Date.now() - 60 * 86400000).toISOString();
  const leadsNonRappeles = clients.filter(
    (c) => !signesClients.has(c.id) && !c.dernier_contact_at && !appeles.has(c.id) && c.created_at >= il60j && Date.now() - new Date(c.created_at).getTime() > 24 * 3600_000
  );
  const piExpirees = new Set<string>();
  for (const c of conformiteR.data ?? []) if (c.type === "piece_identite" && c.date_expiration && c.date_expiration < today) piExpirees.add(c.client_id);
  for (const d of documentsR.data ?? []) if (d.client_id && d.date_expiration && d.date_expiration < today && /^(cni|passeport|titre)/i.test(d.type)) piExpirees.add(d.client_id);
  const affairesOuvertes = dossiers.filter((d) => !d.contrat_statut && !GPF_STATUTS_SIGNES.has(d.statut) && d.statut !== "refuse" && d.statut !== "sans_suite");
  const dans60j = iso(new Date(Date.now() + 60 * 86400000));
  const resiliationsProches = dossiers.filter((d) => {
    if (!estContratActif(d) || (d.produit !== "mutuelle" && d.produit !== "prevoyance")) return false;
    const e = prochaineEcheance(d);
    return e != null && e >= today && e <= dans60j;
  });
  const bordereauxEcarts = (bordereauxR.data ?? []).filter((b) => b.import_statut === "a_verifier" && (b.nb_ecarts > 0 || b.nb_sans_contrat > 0));
  const nom = (id: string) => {
    const c = clientById.get(id);
    return c ? `${c.prenom} ${String(c.nom).toUpperCase()}` : "—";
  };

  const alertes = [
    { cle: "leads", label: "Leads non rappelés depuis plus de 24 h", n: leadsNonRappeles.length, lien: "/gpf/commercial", exemples: leadsNonRappeles.slice(0, 3).map((c) => nom(c.id)) },
    { cle: "pi", label: "Pièces d'identité expirées", n: piExpirees.size, lien: "/gpf/contacts", exemples: [...piExpirees].slice(0, 3).map(nom) },
    { cle: "action", label: "Affaires sans prochaine action", n: affairesOuvertes.filter((d) => !d.prochaine_action).length, lien: "/gpf/commercial", exemples: [] },
    { cle: "relancer", label: "Contrats « À relancer »", n: dossiers.filter((d) => d.contrat_statut === "a_relancer").length, lien: "/gpf/contrats", exemples: [] },
    { cle: "bordereaux", label: "Bordereaux avec écarts", n: bordereauxEcarts.length, lien: "/gpf/commissions?onglet=bordereaux", exemples: [] },
    {
      cle: "resiliation",
      label: "Résiliations possibles dans les 60 jours",
      n: resiliationsProches.length,
      lien: "/gpf/contrats",
      exemples: resiliationsProches.slice(0, 3).map((d) => `${nom(d.client_id)} (${GPF_PRODUIT_LABEL[d.produit]})`)
    }
  ];

  const derniersContrats = dossiers
    .filter((d) => dateSignature(d))
    .sort((a, b) => (dateSignature(a)! < dateSignature(b)! ? 1 : -1))
    .slice(0, 10)
    .map((d) => ({
      id: d.id,
      client_id: d.client_id,
      date: dateSignature(d),
      client: nom(d.client_id),
      produit: GPF_PRODUIT_LABEL[d.produit],
      compagnie: d.assureur_nom,
      prime: primeAnnuelle(d),
      commission: commissionEstimee(d) || null
    }));

  return NextResponse.json({
    ok: true,
    periode: { debut: iso(debut), fin: iso(fin), cumul },
    volume: variation(Math.round(volume(signes)), Math.round(volume(signesPrec))),
    contratsSignes: variation(signes.length, signesPrec.length),
    cartes: {
      commissionsEstimees: variation(Math.round(comm(signes)), Math.round(comm(signesPrec))),
      commissionsEncaissees: variation(Math.round(encaisse(debut, fin)), Math.round(encaisse(debutPrec, finPrec))),
      annulations: variation(resilies(debut, fin), resilies(debutPrec, finPrec)),
      decommissions: variation(Math.round(decommissions(debut, fin)), Math.round(decommissions(debutPrec, finPrec))),
      contratsActifs: variation(actifs, actifs - signes.length + resilies(debut, fin)),
      leads: variation(leadsEntre(debut, fin).length, leadsEntre(debutPrec, finPrec).length)
    },
    histogramme,
    repartition: {
      produit: repartir((d) => GPF_PRODUIT_LABEL[d.produit]),
      compagnie: repartir((d) => d.assureur_nom?.trim() || "Non renseignée")
    },
    rentabilite,
    alertes,
    derniersContrats
  });
}

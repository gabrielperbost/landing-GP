import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { arrondi, chargerPilotage, derniersMois, estContrat, estSigne, moisDe } from "@/lib/gpf/pilotage";
import { formatNom } from "@/lib/gpf/types";

export type Paiement = { id: string; apporteur_id: string; mois: string; montant: number; paye_le: string; reference: string | null };

/** Statistiques de tous les apporteurs (ou d'un seul) : leads, transformation, commissions, rétrocessions. */
export async function statsApporteurs(seul?: string) {
  const p = await chargerPilotage();
  const { data: paiementsData } = await supabaseAdmin.from("gpf_apporteur_paiements").select("*");
  const paiements = (paiementsData ?? []) as Paiement[];
  const mois = derniersMois(12);
  const dossiersPar = new Map<string, typeof p.dossiers>();
  for (const d of p.dossiers) dossiersPar.set(d.client_id, [...(dossiersPar.get(d.client_id) ?? []), d]);
  const clientDuDossier = new Map(p.dossiers.map((d) => [d.id, d.client_id]));

  return p.apporteurs
    .filter((a) => !seul || a.id === seul)
    .map((a) => {
      const clients = p.clients.filter((c) => c.apporteur_id === a.id);
      const ids = new Set(clients.map((c) => c.id));
      const signes = clients.filter((c) => (dossiersPar.get(c.id) ?? []).some(estSigne));
      const lignes = p.lignes.filter((l) => l.dossier_id && ids.has(clientDuDossier.get(l.dossier_id) ?? ""));
      const sesPaiements = paiements.filter((x) => x.apporteur_id === a.id);
      const parMois = mois.map((m) => {
        const ls = lignes.filter((l) => moisDe(l) === m);
        const paye = sesPaiements.find((x) => x.mois.slice(0, 7) === m);
        return {
          mois: m,
          commissions: arrondi(ls.reduce((s, l) => s + l.montant, 0)),
          aReverser: arrondi(ls.reduce((s, l) => s + Number(l.retrocession ?? 0), 0)),
          paye: paye ? Number(paye.montant) : 0,
          payeLe: paye?.paye_le ?? null
        };
      });
      const totalDu = lignes.reduce((s, l) => s + Number(l.retrocession ?? 0), 0);
      const totalPaye = sesPaiements.reduce((s, x) => s + Number(x.montant), 0);
      return {
        ...a,
        nbLeads: clients.length,
        nbSignes: signes.length,
        transformation: clients.length ? Math.round((signes.length / clients.length) * 100) : null,
        nbContrats: clients.reduce((s, c) => s + (dossiersPar.get(c.id) ?? []).filter(estContrat).length, 0),
        commissions12: arrondi(parMois.reduce((s, m) => s + m.commissions, 0)),
        aReverser12: arrondi(parMois.reduce((s, m) => s + m.aReverser, 0)),
        resteAPayer: arrondi(totalDu - totalPaye),
        parMois,
        paiements: sesPaiements.sort((x, y) => y.mois.localeCompare(x.mois)),
        leads: clients
          .map((c) => {
            const ds = dossiersPar.get(c.id) ?? [];
            return { id: c.id, nom: formatNom(c), created_at: c.created_at, produits: ds.map((d) => d.produit), statuts: ds.map((d) => d.statut), signe: ds.some(estSigne) };
          })
          .sort((x, y) => y.created_at.localeCompare(x.created_at))
      };
    });
}

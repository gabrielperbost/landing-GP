import type { GpfStatut } from "@/lib/gpf/types";

/**
 * Colonnes du pipeline commercial (vue Kanban), calquées sur le processus réel
 * de GP Finances. Chaque colonne regroupe un ou plusieurs statuts ; déposer une
 * carte dans une colonne lui donne le statut principal de la colonne.
 */
export const PIPELINE_COLONNES: { cle: string; label: string; statuts: GpfStatut[]; principal: GpfStatut }[] = [
  { cle: "a_traiter", label: "À traiter", statuts: ["a_traiter"], principal: "a_traiter" },
  { cle: "contacte", label: "Contacté / NRP", statuts: ["nrp"], principal: "nrp" },
  { cle: "decouverte", label: "Découverte", statuts: ["devis_a_realiser"], principal: "devis_a_realiser" },
  { cle: "devis", label: "Devis envoyé", statuts: ["devis_envoye"], principal: "devis_envoye" },
  { cle: "souscription", label: "En cours de souscription", statuts: ["en_cours_souscription", "attente_documents"], principal: "en_cours_souscription" },
  { cle: "banque", label: "Attente accord banque", statuts: ["attente_accord_banque"], principal: "attente_accord_banque" },
  { cle: "prise_effet", label: "Attente prise d'effet", statuts: ["attente_prise_effet"], principal: "attente_prise_effet" },
  { cle: "signe", label: "Signé", statuts: ["attente_reglement", "effectif"], principal: "effectif" }
];

export const indexEtape = (statut: string) => PIPELINE_COLONNES.findIndex((c) => (c.statuts as string[]).includes(statut));

/** Une affaire est bloquée si elle stagne : 14 jours dans la même étape, 7 jours en attente de pièces. */
export function estBloquee(d: { statut: string; etape_depuis?: string | null; updated_at: string }, now = Date.now()) {
  const depuis = new Date(d.etape_depuis ?? d.updated_at).getTime();
  const jours = (now - depuis) / 86400000;
  return d.statut === "attente_documents" ? jours > 7 : jours > 14;
}

export const joursDepuis = (date: string | null | undefined, now = Date.now()) => (date ? Math.max(0, Math.floor((now - new Date(date).getTime()) / 86400000)) : null);

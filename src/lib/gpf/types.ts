export type GpfClient = {
  id: string;
  civilite: string | null;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  annee_naissance: number | null;
  profession: string | null;
  fumeur: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const GPF_PRODUITS = [
  "assurance_emprunteur",
  "per",
  "assurance_vie",
  "mutuelle",
  "prevoyance",
  "regroupement_credits"
] as const;
export type GpfProduit = (typeof GPF_PRODUITS)[number];

export const GPF_PRODUIT_LABEL: Record<GpfProduit, string> = {
  assurance_emprunteur: "Assurance de prêt",
  per: "PER",
  assurance_vie: "Assurance-vie",
  mutuelle: "Mutuelle",
  prevoyance: "Prévoyance",
  regroupement_credits: "Regroupement de crédits"
};

export const GPF_STATUTS = [
  "a_traiter",
  "nrp",
  "devis_a_realiser",
  "devis_envoye",
  "en_cours_souscription",
  "attente_accord_banque",
  "attente_prise_effet",
  "attente_reglement",
  "attente_documents",
  "effectif",
  "refuse",
  "sans_suite"
] as const;
export type GpfStatut = (typeof GPF_STATUTS)[number];

export const GPF_STATUT_LABEL: Record<GpfStatut, string> = {
  a_traiter: "À traiter",
  nrp: "NRP",
  devis_a_realiser: "Devis à réaliser",
  devis_envoye: "Devis envoyé",
  en_cours_souscription: "En cours de souscription",
  attente_accord_banque: "Attente accord banque",
  attente_prise_effet: "Attente prise d'effet",
  attente_reglement: "Attente règlement",
  attente_documents: "Attente documents",
  effectif: "Effectif",
  refuse: "Refusé",
  sans_suite: "Sans suite"
};

export type GpfDossier = {
  id: string;
  client_id: string;
  co_client_id: string | null;
  produit: GpfProduit;
  statut: GpfStatut;
  source: string | null;
  insurer_id: string | null;
  reference_contrat: string | null;
  montant_pret: number | null;
  taux: number | null;
  duree_mois: number | null;
  date_effet: string | null;
  placement_initial: number | null;
  placement_mensuel: number | null;
  frais_gestion_pct: number | null;
  lien_dossier: string | null;
  date_depot: string | null;
  date_entree_attente_docs: string | null;
  date_derniere_relance: string | null;
  relances_envoyees: number;
  remuneration_apporteur_pct: number | null;
  created_at: string;
  updated_at: string;
};

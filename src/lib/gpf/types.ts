// est_client : au moins un dossier au statut "effectif". Sinon, c'est un
// prospect — un contact pas encore passé à l'acte, pas un client.
export type GpfClientListItem = GpfClient & { produits: GpfProduit[]; statuts: GpfStatut[]; est_client: boolean };

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

export type GpfDocument = {
  id: string;
  dossier_id: string;
  type: string;
  recu: boolean;
  nom_fichier: string | null;
  storage_path: string | null;
  taille_octets: number | null;
  date_reception: string | null;
  created_at: string;
};

// Un dossier signé devient un contrat (statut de contrat renseigné) ; sinon
// c'est une affaire du pipeline commercial.
export const GPF_CONTRAT_STATUTS = ["actif", "a_relancer", "resilie"] as const;
export type GpfContratStatut = (typeof GPF_CONTRAT_STATUTS)[number];
export const GPF_CONTRAT_STATUT_LABEL: Record<GpfContratStatut, string> = {
  actif: "Actif",
  a_relancer: "À relancer",
  resilie: "Résilié"
};
export const GPF_CONTRAT_STATUT_COLOR: Record<GpfContratStatut, string> = {
  actif: "#2f9e6e",
  a_relancer: "#c98a1f",
  resilie: "#b3463f"
};
// Statuts du pipeline qui signifient « signé » : passage automatique en contrat.
export const GPF_STATUTS_SIGNES: ReadonlySet<string> = new Set(["effectif", "attente_reglement"]);

/** Un dossier compte dans les revenus estimés s'il n'est ni perdu ni résilié. */
export const compteDansRevenus = (d: { statut: string; contrat_statut?: string | null }) =>
  !GPF_STATUTS_CLOS.has(d.statut as GpfStatut) && d.contrat_statut !== "resilie";

/** Affichage homogène partout : « Prénom NOM ». */
export const formatNom = (p: { prenom: string; nom: string } | null | undefined) => (p ? `${p.prenom} ${p.nom.toUpperCase()}`.trim() : "—");

// Statuts "clos" : un dossier perdu ne doit jamais compter dans les revenus
// estimés, ni apparaître dans la vue par défaut (il reste accessible via le
// filtre "Clos").
export const GPF_STATUTS_CLOS: ReadonlySet<GpfStatut> = new Set(["refuse", "sans_suite"]);

export const GPF_MOTIFS_REFUS = ["Tarif", "Refus banque", "Concurrent", "Injoignable", "Refus médical de l'assureur", "Autre"] as const;
export type GpfMotifRefus = (typeof GPF_MOTIFS_REFUS)[number];

export type GpfDossierWithClient = GpfDossier & {
  client: { id: string; prenom: string; nom: string } | null;
  co_client: { id: string; prenom: string; nom: string } | null;
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

export const GPF_PRODUIT_COLOR: Record<GpfProduit, string> = {
  assurance_emprunteur: "#fdab3d",
  per: "#00c875",
  assurance_vie: "#579bfc",
  mutuelle: "#a25ddc",
  prevoyance: "#e2445c",
  regroupement_credits: "#66ccff"
};

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

// Palette d'état sobre (identité GP Finances) : vert = fait/actif, ambre = en
// cours ou à relancer, rouge = manquant/impayé. Volontairement 3 teintes
// seulement, pas un arc-en-ciel par étape de pipeline — le libellé du statut
// porte déjà l'information précise.
const SOBER_VERT = "#2f9e6e";
const SOBER_AMBRE = "#c98a1f";
const SOBER_ROUGE = "#b3463f";

export const GPF_STATUT_COLOR: Record<GpfStatut, string> = {
  a_traiter: SOBER_AMBRE,
  nrp: SOBER_AMBRE,
  devis_a_realiser: SOBER_AMBRE,
  devis_envoye: SOBER_AMBRE,
  en_cours_souscription: SOBER_AMBRE,
  attente_accord_banque: SOBER_AMBRE,
  attente_prise_effet: SOBER_AMBRE,
  attente_reglement: SOBER_AMBRE,
  attente_documents: SOBER_AMBRE,
  effectif: SOBER_VERT,
  refuse: SOBER_ROUGE,
  sans_suite: SOBER_ROUGE
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
  assureur_nom: string | null;
  frais_dossier: number | null;
  precompte_lineaire_1ere_annee: number | null;
  lineaire_n1: number | null;
  frais_entree: number | null;
  motif_refus: string | null;
  prime_mensuelle: number | null;
  prime_annuelle: number | null;
  contrat_statut: GpfContratStatut | null;
  date_signature: string | null;
  date_echeance: string | null;
  date_resiliation: string | null;
  created_at: string;
  updated_at: string;
};

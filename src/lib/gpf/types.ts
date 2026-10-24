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
  type_contact?: GpfTypeContact;
  raison_sociale?: string | null;
  date_naissance?: string | null;
  situation_familiale?: string | null;
  nb_enfants?: number | null;
  provenance?: string | null;
  apporteur_id?: string | null;
  preference_contact?: string | null;
  score?: GpfScore | null;
  dernier_contact_at?: string | null;
  prochaine_action?: string | null;
  prochaine_action_date?: string | null;
  nrp_count?: number;
  budget?: GpfBudget;
  fiscalite?: GpfFiscalite;
  societe?: GpfSociete;
  created_at: string;
  updated_at: string;
};

export type GpfTypeContact = "particulier" | "tns" | "entreprise";
export const GPF_TYPE_CONTACT_LABEL: Record<GpfTypeContact, string> = { particulier: "Particulier", tns: "TNS", entreprise: "Entreprise" };

// Contact « entreprise » : identité de la société. Le représentant légal est porté par les champs
// du contact (civilité, prénom, nom, date de naissance, e-mail, téléphone), complétés ici.
export type GpfSociete = {
  forme_juridique?: string | null;
  siren?: string | null;
  code_naf?: string | null;
  activite?: string | null;
  date_creation?: string | null;
  capital?: number | null;
  effectif?: number | null;
  representant_qualite?: string | null;
  representant_lieu_naissance?: string | null;
  representant_nationalite?: string | null;
  representant_adresse?: string | null;
};
export const GPF_FORMES_JURIDIQUES = ["SARL", "EURL", "SAS", "SASU", "SA", "SCI", "SELARL", "SELAS", "SNC", "EI", "Association", "Autre"] as const;
export const GPF_QUALITES_REPRESENTANT = ["Gérant", "Co-gérant", "Président", "Directeur général", "Associé", "Mandataire"] as const;

export type GpfScore = "chaud" | "tiede" | "froid";
export const GPF_SCORE_LABEL: Record<GpfScore, string> = { chaud: "Chaud", tiede: "Tiède", froid: "Froid" };
export const GPF_SCORE_COLOR: Record<GpfScore, string> = { chaud: "#b3463f", tiede: "#c98a1f", froid: "#579bfc" };

// Provenances des leads de GP Finances.
export const GPF_PROVENANCES = ["Meta Ads", "Tally", "Masterleads", "Site", "Recommandation", "Apporteur", "Century 21", "Webinaire", "Autre"] as const;

export type GpfBudget = {
  revenus_annuels?: number | null;
  charges_annuelles?: number | null;
  credits_en_cours?: number | null;
  mensualites_credits?: number | null;
  patrimoine?: number | null;
  notes?: string | null;
};
export type GpfFiscalite = {
  tmi?: number | null;
  impot_paye?: number | null;
  revenu_fiscal_reference?: number | null;
  nb_parts?: number | null;
  plafond_epargne_retraite?: number | null;
  annee?: number | null;
};

export type GpfNoteCategorie = "reunion" | "suivi" | "conformite" | "contrats" | "autre";
export const GPF_NOTE_CATEGORIE_LABEL: Record<GpfNoteCategorie, string> = {
  reunion: "Réunion",
  suivi: "Suivi",
  conformite: "Conformité",
  contrats: "Contrats",
  autre: "Autre"
};
export type GpfNote = { id: string; client_id: string; dossier_id: string | null; categorie: GpfNoteCategorie; contenu: string; auteur: string; created_at: string };

export type GpfTaskCategorie = "appel" | "email" | "sms" | "document" | "relance" | "conformite" | "suivi" | "reunion";
export const GPF_TASK_CATEGORIE_LABEL: Record<GpfTaskCategorie, string> = {
  appel: "Appel",
  email: "E-mail",
  sms: "SMS",
  document: "Document",
  relance: "Relance",
  conformite: "Conformité",
  suivi: "Suivi",
  reunion: "Réunion"
};
export type GpfTaskEtat = "a_faire" | "en_cours" | "en_attente" | "terminee";
export const GPF_TASK_ETAT_LABEL: Record<GpfTaskEtat, string> = { a_faire: "À faire", en_cours: "En cours", en_attente: "En attente", terminee: "Terminée" };
export type GpfTask = {
  id: string;
  client_id: string | null;
  dossier_id: string | null;
  titre: string;
  categorie: GpfTaskCategorie;
  echeance: string | null;
  etat: GpfTaskEtat;
  notes: string | null;
  auto: boolean;
  origine: string | null;
  created_at: string;
  done_at: string | null;
  client?: { id: string; prenom: string; nom: string } | null;
};

export type GpfRdvStatut = "a_venir" | "provisoire" | "passe" | "annule";
export const GPF_RDV_STATUT_LABEL: Record<GpfRdvStatut, string> = { a_venir: "À venir", provisoire: "Provisoire", passe: "Passé", annule: "Annulé" };
export type GpfAppointment = {
  id: string;
  client_id: string | null;
  titre: string;
  debut: string;
  duree_min: number;
  lieu: string | null;
  lien_visio: string | null;
  statut: GpfRdvStatut;
  source: "manuel" | "calendly" | "google";
  notes: string | null;
  client?: { id: string; prenom: string; nom: string } | null;
};

export type GpfCallResultat = "joint" | "nrp" | "messagerie" | "rappeler";
export const GPF_CALL_RESULTAT_LABEL: Record<GpfCallResultat, string> = { joint: "Joint", nrp: "NRP", messagerie: "Messagerie", rappeler: "Rappeler le…" };
export type GpfCall = { id: string; client_id: string; dossier_id: string | null; resultat: GpfCallResultat; rappel_at: string | null; note: string | null; created_at: string };

export type GpfComplianceType = "collecte" | "lcb_ft" | "der" | "lettre_mission" | "piece_identite" | "profil" | "objectifs" | "rapport_adequation";
export const GPF_COMPLIANCE_ITEMS: { type: GpfComplianceType; label: string }[] = [
  { type: "collecte", label: "Collecte d'informations (recueil des besoins)" },
  { type: "lcb_ft", label: "LCB-FT" },
  { type: "der", label: "DER (document d'entrée en relation)" },
  { type: "lettre_mission", label: "Lettre de mission" },
  { type: "piece_identite", label: "Pièce d'identité" },
  { type: "profil", label: "Profil (investisseur / assuré)" },
  { type: "objectifs", label: "Objectifs" },
  { type: "rapport_adequation", label: "Rapport de conseil / adéquation" }
];
export type GpfCompliance = {
  id?: string;
  client_id: string;
  type: GpfComplianceType;
  statut: "manquant" | "en_cours" | "fait";
  pourcentage: number | null;
  date_signature: string | null;
  date_expiration: string | null;
  document_id: string | null;
  updated_at?: string;
};

export type GpfDocument = {
  id: string;
  dossier_id: string | null;
  client_id?: string | null;
  date_expiration?: string | null;
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
export const formatNom = (p: { prenom: string; nom: string; type_contact?: string | null; raison_sociale?: string | null } | null | undefined) => {
  if (!p) return "—";
  const personne = `${p.prenom} ${p.nom.toUpperCase()}`.trim();
  // Société : la raison sociale d'abord, le représentant entre parenthèses.
  return p.type_contact === "entreprise" && p.raison_sociale?.trim() ? `${p.raison_sociale.trim()} (${personne})` : personne;
};

// Statuts "clos" : un dossier perdu ne doit jamais compter dans les revenus
// estimés, ni apparaître dans la vue par défaut (il reste accessible via le
// filtre "Clos").
export const GPF_STATUTS_CLOS: ReadonlySet<GpfStatut> = new Set(["refuse", "sans_suite"]);

export const GPF_MOTIFS_REFUS = ["Tarif", "Refus banque", "Concurrent", "Injoignable", "Refus médical de l'assureur", "Autre"] as const;
export type GpfMotifRefus = (typeof GPF_MOTIFS_REFUS)[number];

export type GpfDossierWithClient = GpfDossier & {
  client: { id: string; prenom: string; nom: string; nrp_count?: number } | null;
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
  banque?: string | null;
  date_offre_pret?: string | null;
  date_signature_notaire?: string | null;
  cout_assurance_banque?: number | null;
  cout_assurance_delegation?: number | null;
  prochaine_action?: string | null;
  prochaine_action_date?: string | null;
  etape_depuis?: string | null;
  created_at: string;
  updated_at: string;
};

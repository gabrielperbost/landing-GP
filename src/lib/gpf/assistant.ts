import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { CLIENT_EDITABLE_FIELDS } from "@/lib/gpf/contacts";
import { chargerPilotage, derniersMois, moisDe, arrondi } from "@/lib/gpf/pilotage";
import { prochaineEcheance } from "@/lib/gpf/contrats";
import { GPF_COMPLIANCE_ITEMS, GPF_PRODUIT_LABEL, GPF_STATUT_LABEL, GPF_STATUTS_SIGNES, formatNom, type GpfProduit, type GpfStatut } from "@/lib/gpf/types";

// ---------------------------------------------------------------------------
// Outils de l'assistant : lecture seule, chaque résultat cite sa source. Les
// modifications ne sont jamais appliquées ici : elles reviennent à l'écran
// sous forme de propositions à valider par un clic.
// Aucune donnée de santé (statut fumeur, mentions médicales) ni pièce
// d'identité n'est transmise au modèle.
// ---------------------------------------------------------------------------

const SANTE = /(sant[ée]|m[ée]dical|maladie|pathologi|traitement|ant[ée]c[ée]dent|diab[eè]t|cancer|cardiaque|hospitali|chirurg|d[ée]pression|handicap|invalidit[ée] m|fumeur|tabac|imc|poids|questionnaire)/i;

/** Retire les phrases qui évoquent la santé avant tout envoi au modèle. */
export const sansSante = (t: string | null | undefined) =>
  (t ?? "")
    .split(/(?<=[.!?\n])\s+/)
    .filter((s) => !SANTE.test(s))
    .join(" ")
    .slice(0, 1500);

export type Source = { label: string; lien?: string };
export type Proposition = {
  id: string;
  titre: string;
  description: string;
  champs: { cle: string; label: string; avant: string | null; apres: string }[];
  action: { cible: "client" | "dossier" | "note" | "tache"; id: string | null; client_id?: string | null; champs: Record<string, unknown> };
};

// Champs modifiables via l'assistant, avec leur libellé.
export const CHAMPS_CLIENT: Record<string, string> = {
  email: "E-mail",
  telephone: "Téléphone",
  adresse: "Adresse",
  code_postal: "Code postal",
  ville: "Ville",
  profession: "Profession",
  situation_familiale: "Situation familiale",
  nb_enfants: "Enfants à charge",
  date_naissance: "Date de naissance",
  provenance: "Provenance",
  score: "Score",
  prochaine_action: "Prochaine action",
  prochaine_action_date: "Date de la prochaine action",
  "budget.revenus_annuels": "Revenus annuels",
  "budget.charges_annuelles": "Charges annuelles",
  "budget.credits_en_cours": "Crédits en cours",
  "budget.mensualites_credits": "Mensualités de crédit",
  "budget.patrimoine": "Patrimoine",
  "fiscalite.tmi": "TMI (%)",
  "fiscalite.impot_paye": "Impôt payé",
  "fiscalite.revenu_fiscal_reference": "Revenu fiscal de référence",
  "fiscalite.nb_parts": "Nombre de parts",
  "fiscalite.annee": "Année de l'avis"
};
export const CHAMPS_DOSSIER: Record<string, string> = {
  banque: "Banque",
  montant_pret: "Montant du prêt",
  taux: "Taux (%)",
  duree_mois: "Durée (mois)",
  date_offre_pret: "Date de l'offre de prêt",
  date_signature_notaire: "Signature chez le notaire",
  cout_assurance_banque: "Coût assurance banque",
  cout_assurance_delegation: "Coût assurance proposée",
  assureur_nom: "Compagnie",
  reference_contrat: "N° de contrat",
  prime_mensuelle: "Prime mensuelle",
  date_effet: "Date d'effet",
  prochaine_action: "Prochaine action",
  prochaine_action_date: "Date de la prochaine action"
};
// Garde-fou : seuls les champs déjà éditables côté fiche passent.
const CLIENT_OK = new Set(CLIENT_EDITABLE_FIELDS.filter((f) => f !== "fumeur" && f !== "notes"));

const fr = (v: unknown) => (v == null || v === "" ? null : typeof v === "number" ? v.toLocaleString("fr-FR") : String(v));

export const OUTILS = [
  {
    name: "rechercher_contacts",
    description: "Cherche des contacts par nom, e-mail ou téléphone. Renvoie id, nom, provenance et dossiers.",
    input_schema: { type: "object", properties: { q: { type: "string" } }, required: ["q"] }
  },
  {
    name: "fiche_contact",
    description: "Fiche complète d'un contact : coordonnées, budget, fiscalité, dossiers et projets, conformité, tâches, derniers appels, notes (sans données de santé), liste des documents.",
    input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
  },
  {
    name: "taches_a_faire",
    description: "Tâches ouvertes en retard ou dues aujourd'hui, et rendez-vous du jour.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "leads_a_relancer",
    description: "Leads sans contrat à rappeler : jamais contactés, NRP, ou sans nouvelle depuis plus de 7 jours.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "pieces_expirees",
    description: "Clients dont la pièce d'identité est expirée ou expire sous 60 jours, et recueils des besoins de plus de 12 mois.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "synthese_commissions",
    description: "Commissions encaissées (bordereaux validés) et attendues sur les 6 derniers mois, par mois.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "contrats_echeance",
    description: "Contrats mutuelle et prévoyance dont l'échéance tombe dans les N prochains jours (60 par défaut).",
    input_schema: { type: "object", properties: { jours: { type: "number" } } }
  },
  {
    name: "proposer_modification",
    description:
      "Propose une modification à l'utilisateur (elle n'est PAS appliquée : il valide d'un clic, champ par champ). cible = client (champs : " +
      Object.keys(CHAMPS_CLIENT).join(", ") +
      ") ou dossier (champs : " +
      Object.keys(CHAMPS_DOSSIER).join(", ") +
      "), ou note (champs : contenu, categorie) ou tache (champs : titre, echeance AAAA-MM-JJ, categorie).",
    input_schema: {
      type: "object",
      properties: {
        cible: { type: "string", enum: ["client", "dossier", "note", "tache"] },
        id: { type: "string", description: "id du client ou du dossier" },
        client_id: { type: "string", description: "id du client (pour une note ou une tâche)" },
        titre: { type: "string" },
        description: { type: "string" },
        champs: { type: "object" }
      },
      required: ["cible", "titre", "champs"]
    }
  }
];

type Ctx = { sources: Source[]; propositions: Proposition[] };

export async function executerOutil(nom: string, input: Record<string, unknown>, ctx: Ctx): Promise<unknown> {
  switch (nom) {
    case "rechercher_contacts": {
      const q = String(input.q ?? "").trim().replace(/[,()%]/g, "");
      if (q.length < 2) return [];
      const { data } = await supabaseAdmin
        .from("gpf_clients")
        .select("id, prenom, nom, email, telephone, provenance, ville")
        .is("deleted_at", null)
        .or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,email.ilike.%${q}%,telephone.ilike.%${q}%`)
        .limit(10);
      const ids = (data ?? []).map((c) => c.id);
      const { data: ds } = ids.length ? await supabaseAdmin.from("gpf_dossiers").select("client_id, produit, statut").in("client_id", ids).is("deleted_at", null) : { data: [] };
      ctx.sources.push({ label: "Contacts" , lien: "/gpf/contacts" });
      return (data ?? []).map((c) => ({
        ...c,
        nom: formatNom(c),
        dossiers: (ds ?? []).filter((d) => d.client_id === c.id).map((d) => `${GPF_PRODUIT_LABEL[d.produit as GpfProduit] ?? d.produit} (${GPF_STATUT_LABEL[d.statut as GpfStatut] ?? d.statut})`)
      }));
    }
    case "fiche_contact": {
      const id = String(input.id ?? "");
      const [{ data: c }, { data: dossiers }, conf, taches, appels, notes, docs] = await Promise.all([
        supabaseAdmin.from("gpf_clients").select("*").eq("id", id).single(),
        supabaseAdmin.from("gpf_dossiers").select("*").eq("client_id", id).is("deleted_at", null),
        supabaseAdmin.from("gpf_compliance").select("type, statut, date_signature, date_expiration").eq("client_id", id),
        supabaseAdmin.from("gpf_tasks").select("titre, echeance, etat").eq("client_id", id).neq("etat", "terminee").is("deleted_at", null),
        supabaseAdmin.from("gpf_calls").select("resultat, created_at, note").eq("client_id", id).order("created_at", { ascending: false }).limit(5),
        supabaseAdmin.from("gpf_notes").select("categorie, contenu, created_at").eq("client_id", id).is("deleted_at", null).order("created_at", { ascending: false }).limit(10),
        supabaseAdmin.from("gpf_documents").select("type, date_reception, date_expiration").eq("client_id", id).is("deleted_at", null)
      ]);
      if (!c) return { erreur: "contact introuvable" };
      ctx.sources.push({ label: `Fiche ${formatNom(c)}`, lien: `/gpf/contacts/${id}` });
      return {
        id: c.id,
        nom: formatNom(c),
        civilite: c.civilite,
        email: c.email,
        telephone: c.telephone,
        adresse: [c.adresse, c.code_postal, c.ville].filter(Boolean).join(" "),
        date_naissance: c.date_naissance ?? c.annee_naissance,
        profession: c.profession,
        situation_familiale: c.situation_familiale,
        nb_enfants: c.nb_enfants,
        provenance: c.provenance,
        score: c.score,
        nrp_count: c.nrp_count,
        dernier_contact: c.dernier_contact_at,
        prochaine_action: c.prochaine_action,
        prochaine_action_date: c.prochaine_action_date,
        budget: c.budget,
        fiscalite: c.fiscalite,
        notes_generales: sansSante(c.notes),
        dossiers: (dossiers ?? []).map((d) => ({
          id: d.id,
          produit: GPF_PRODUIT_LABEL[d.produit as GpfProduit] ?? d.produit,
          etape: GPF_STATUT_LABEL[d.statut as GpfStatut] ?? d.statut,
          contrat: d.contrat_statut,
          compagnie: d.assureur_nom,
          banque: d.banque,
          montant_pret: d.montant_pret,
          taux: d.taux,
          duree_mois: d.duree_mois,
          date_effet: d.date_effet,
          prime_mensuelle: d.prime_mensuelle,
          cout_assurance_banque: d.cout_assurance_banque,
          cout_assurance_delegation: d.cout_assurance_delegation,
          prochaine_action: d.prochaine_action,
          motif_refus: d.motif_refus && !SANTE.test(d.motif_refus) ? d.motif_refus : d.motif_refus ? "Refus" : null
        })),
        conformite: GPF_COMPLIANCE_ITEMS.map((i) => {
          const x = (conf.data ?? []).find((y) => y.type === i.type);
          return { element: i.label, statut: x?.statut ?? "manquant", signe_le: x?.date_signature ?? null, expire_le: x?.date_expiration ?? null };
        }),
        taches_ouvertes: taches.data ?? [],
        derniers_appels: (appels.data ?? []).map((a) => ({ ...a, note: sansSante(a.note) })),
        notes: (notes.data ?? []).map((n) => ({ ...n, contenu: sansSante(n.contenu) })).filter((n) => n.contenu),
        documents: (docs.data ?? []).map((d) => ({ type: d.type, recu_le: d.date_reception, expire_le: d.date_expiration }))
      };
    }
    case "taches_a_faire": {
      const fin = new Date();
      fin.setHours(23, 59, 59, 999);
      const debut = new Date();
      debut.setHours(0, 0, 0, 0);
      const [{ data: t }, { data: r }, { data: clients }] = await Promise.all([
        supabaseAdmin.from("gpf_tasks").select("titre, echeance, categorie, client_id").neq("etat", "terminee").is("deleted_at", null).lte("echeance", fin.toISOString()).order("echeance").limit(50),
        supabaseAdmin.from("gpf_appointments").select("titre, debut, client_id, lieu").gte("debut", debut.toISOString()).lte("debut", fin.toISOString()).order("debut"),
        supabaseAdmin.from("gpf_clients").select("id, prenom, nom").is("deleted_at", null)
      ]);
      const nom = new Map((clients ?? []).map((c) => [c.id, formatNom(c)]));
      ctx.sources.push({ label: "Tâches", lien: "/gpf/taches" }, { label: "Agenda", lien: "/gpf/agenda" });
      return {
        taches: (t ?? []).map((x) => ({ ...x, client: x.client_id ? nom.get(x.client_id) : null, en_retard: x.echeance < debut.toISOString() })),
        rendez_vous: (r ?? []).map((x) => ({ ...x, client: x.client_id ? nom.get(x.client_id) : null }))
      };
    }
    case "leads_a_relancer": {
      const [{ data: clients }, { data: dossiers }] = await Promise.all([
        supabaseAdmin.from("gpf_clients").select("id, prenom, nom, provenance, created_at, dernier_contact_at, nrp_count, telephone").is("deleted_at", null),
        supabaseAdmin.from("gpf_dossiers").select("client_id, statut, contrat_statut, produit").is("deleted_at", null)
      ]);
      const signes = new Set((dossiers ?? []).filter((d) => d.contrat_statut || GPF_STATUTS_SIGNES.has(d.statut) || d.statut === "refuse" || d.statut === "sans_suite").map((d) => d.client_id));
      const il7j = new Date(Date.now() - 7 * 86400000).toISOString();
      ctx.sources.push({ label: "Commercial", lien: "/gpf/commercial" });
      return (clients ?? [])
        .filter((c) => !signes.has(c.id) && (!c.dernier_contact_at || c.dernier_contact_at < il7j || (c.nrp_count ?? 0) > 0))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 25)
        .map((c) => ({ id: c.id, nom: formatNom(c), provenance: c.provenance, arrive_le: c.created_at.slice(0, 10), dernier_contact: c.dernier_contact_at?.slice(0, 10) ?? "jamais", nrp: c.nrp_count ?? 0 }));
    }
    case "pieces_expirees": {
      const dans60 = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
      const ilYa1an = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
      const [{ data: conf }, { data: clients }] = await Promise.all([
        supabaseAdmin.from("gpf_compliance").select("client_id, type, date_expiration, date_signature").in("type", ["piece_identite", "collecte"]),
        supabaseAdmin.from("gpf_clients").select("id, prenom, nom").is("deleted_at", null)
      ]);
      const nom = new Map((clients ?? []).map((c) => [c.id, formatNom(c)]));
      ctx.sources.push({ label: "Conformité", lien: "/gpf/conformite" });
      return {
        pieces_identite: (conf ?? []).filter((x) => x.type === "piece_identite" && x.date_expiration && x.date_expiration <= dans60).map((x) => ({ client_id: x.client_id, client: nom.get(x.client_id), expire_le: x.date_expiration })),
        recueils_a_refaire: (conf ?? []).filter((x) => x.type === "collecte" && x.date_signature && x.date_signature < ilYa1an).map((x) => ({ client_id: x.client_id, client: nom.get(x.client_id), signe_le: x.date_signature }))
      };
    }
    case "synthese_commissions": {
      const p = await chargerPilotage();
      const mois = derniersMois(6);
      ctx.sources.push({ label: "Commissions", lien: "/gpf/commissions" });
      return mois.map((m) => ({
        mois: m,
        encaisse: arrondi(p.lignes.filter((l) => moisDe(l) === m).reduce((s, l) => s + l.montant, 0)),
        bordereaux_a_verifier: p.bordereaux.filter((b) => b.import_statut === "a_verifier").length
      }));
    }
    case "contrats_echeance": {
      const jours = Math.min(365, Math.max(1, Number(input.jours ?? 60) || 60));
      const lim = new Date(Date.now() + jours * 86400000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: ds }, { data: clients }] = await Promise.all([
        supabaseAdmin.from("gpf_dossiers").select("*").is("deleted_at", null).in("produit", ["mutuelle", "prevoyance"]),
        supabaseAdmin.from("gpf_clients").select("id, prenom, nom").is("deleted_at", null)
      ]);
      const nom = new Map((clients ?? []).map((c) => [c.id, formatNom(c)]));
      ctx.sources.push({ label: "Contrats", lien: "/gpf/contrats" });
      return (ds ?? [])
        .filter((d) => (d.contrat_statut ? d.contrat_statut === "actif" : GPF_STATUTS_SIGNES.has(d.statut)))
        .map((d) => ({ d, e: prochaineEcheance(d) }))
        .filter(({ e }) => e && e >= today && e <= lim)
        .map(({ d, e }) => ({ client_id: d.client_id, client: nom.get(d.client_id), produit: GPF_PRODUIT_LABEL[d.produit as GpfProduit], compagnie: d.assureur_nom, echeance: e }));
    }
    case "proposer_modification": {
      const p = await construireProposition(input);
      if ("erreur" in p) return p;
      ctx.propositions.push(p);
      return { ok: true, message: "Proposition affichée à l'utilisateur, en attente de sa validation." };
    }
  }
  return { erreur: "outil inconnu" };
}

/** Met en forme une proposition (avec les valeurs actuelles) sans rien modifier. */
export async function construireProposition(input: Record<string, unknown>): Promise<Proposition | { erreur: string }> {
  const cible = input.cible as Proposition["action"]["cible"];
  const champsIn = (input.champs ?? {}) as Record<string, unknown>;
  const id = (input.id as string) || null;
  const base = { id: crypto.randomUUID(), titre: String(input.titre ?? "Modification proposée"), description: String(input.description ?? "") };

  if (cible === "client" || cible === "dossier") {
    if (!id) return { erreur: "id requis" };
    const table = cible === "client" ? "gpf_clients" : "gpf_dossiers";
    const libelles = cible === "client" ? CHAMPS_CLIENT : CHAMPS_DOSSIER;
    const { data: avant } = await supabaseAdmin.from(table).select("*").eq("id", id).single();
    if (!avant) return { erreur: `${cible} introuvable` };
    const champs: Proposition["champs"] = [];
    const action: Record<string, unknown> = {};
    for (const [cle, v] of Object.entries(champsIn)) {
      if (!(cle in libelles) || v == null || v === "") continue;
      const [racine, sous] = cle.split(".");
      if (cible === "client" && !CLIENT_OK.has(racine)) continue;
      const actuel = sous ? (avant[racine] as Record<string, unknown> | null)?.[sous] : avant[racine];
      if (String(actuel ?? "") === String(v)) continue;
      champs.push({ cle, label: libelles[cle], avant: fr(actuel), apres: fr(v) ?? "" });
      action[cle] = v;
    }
    if (!champs.length) return { erreur: "aucun changement par rapport aux valeurs actuelles" };
    return { ...base, champs, action: { cible, id, champs: action } };
  }
  if (cible === "note") {
    const contenu = sansSante(String(champsIn.contenu ?? ""));
    if (!contenu || !input.client_id) return { erreur: "contenu et client_id requis" };
    return { ...base, champs: [{ cle: "contenu", label: "Note", avant: null, apres: contenu }], action: { cible, id: null, client_id: String(input.client_id), champs: { contenu, categorie: champsIn.categorie ?? "suivi" } } };
  }
  if (cible === "tache") {
    const titre = String(champsIn.titre ?? "").trim();
    if (!titre) return { erreur: "titre requis" };
    return {
      ...base,
      champs: [
        { cle: "titre", label: "Tâche", avant: null, apres: titre },
        ...(champsIn.echeance ? [{ cle: "echeance", label: "Échéance", avant: null, apres: String(champsIn.echeance) }] : [])
      ],
      action: { cible, id: null, client_id: (input.client_id as string) || null, champs: { titre, echeance: champsIn.echeance ?? null, categorie: champsIn.categorie ?? "suivi" } }
    };
  }
  return { erreur: "cible invalide" };
}

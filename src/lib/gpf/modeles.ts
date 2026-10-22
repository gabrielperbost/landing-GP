import "server-only";
import { CABINET } from "@/lib/gpf/cabinet";
import type { Bloc } from "@/lib/gpf/pdf";
import { GPF_PRODUIT_LABEL, type GpfClient, type GpfDossier, type GpfProduit } from "@/lib/gpf/types";

// ---------------------------------------------------------------------------
// Modèles des documents réglementaires et des courriers. Aucun champ de santé
// n'y figure (ni questionnaire, ni antécédents, ni statut fumeur).
// Textes à faire relire par le cabinet avant usage définitif.
// ---------------------------------------------------------------------------

export type TypeDocument = "der" | "lettre_mission" | "recueil" | "rapport_adequation";
export type TypeCourrier = "resiliation_lemoine" | "resiliation_echeance" | "resiliation_hamon";

export const DOC_LABEL: Record<TypeDocument, string> = {
  der: "DER",
  lettre_mission: "Lettre de mission",
  recueil: "Recueil des besoins",
  rapport_adequation: "Rapport d'adéquation"
};
export const COURRIER_LABEL: Record<TypeCourrier, string> = {
  resiliation_lemoine: "Résiliation loi Lemoine",
  resiliation_echeance: "Résiliation à échéance",
  resiliation_hamon: "Résiliation infra-annuelle (Hamon)"
};

const eur = (v: number | null | undefined) =>
  v == null ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(Number(v));
const date = (v: string | null | undefined) => (v ? new Date(v.length === 10 ? `${v}T00:00:00` : v).toLocaleDateString("fr-FR") : "—");
const aujourdhui = () => new Date().toLocaleDateString("fr-FR");
const nomComplet = (c: GpfClient) => `${c.civilite ? c.civilite + " " : ""}${c.prenom} ${c.nom.toUpperCase()}`.trim();
const adresse = (c: GpfClient) => [c.adresse, [c.code_postal, c.ville].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "—";
const produit = (p: string) => GPF_PRODUIT_LABEL[p as GpfProduit] ?? p;
const cabinetLigne = `${CABINET.nom}, ${CABINET.bureaux}, ${CABINET.codePostal} ${CABINET.ville}`;

function identiteClient(c: GpfClient): Bloc {
  return {
    t: "champs",
    lignes: [
      ["Client", nomComplet(c)],
      ["Adresse", adresse(c)],
      ["Téléphone", c.telephone ?? "—"],
      ["E-mail", c.email ?? "—"]
    ]
  };
}

export function modeleDocument(type: TypeDocument, c: GpfClient, dossiers: GpfDossier[], compagnies: string[], extra: { motivation?: string; besoins?: string } = {}): { titre: string; blocs: Bloc[] } {
  const produits = Array.from(new Set(dossiers.map((d) => produit(d.produit))));

  if (type === "der") {
    return {
      titre: "Document d'entrée en relation",
      blocs: [
        { t: "titre", texte: "Document d'entrée en relation" },
        { t: "para", texte: `Remis le ${aujourdhui()} à ${nomComplet(c)}.`, petit: true },
        { t: "sousTitre", texte: "Le cabinet" },
        {
          t: "champs",
          lignes: [
            ["Dénomination", CABINET.nom],
            ["Représentant", CABINET.dirigeant],
            ["Siège social", `${CABINET.adresse}, ${CABINET.codePostal} ${CABINET.ville}`],
            ["Bureaux", `${CABINET.bureaux}, ${CABINET.codePostal} ${CABINET.ville} (sur rendez-vous)`],
            ["Contact", `${CABINET.telephone} · ${CABINET.email}`],
            ["Immatriculation", `ORIAS n° ${CABINET.orias} (www.orias.fr), en qualité de ${CABINET.statuts}`],
            ["Société", `SIREN ${CABINET.siren} — ${CABINET.rcs}`],
            ["Association", `Membre de la ${CABINET.association}`],
            ["Responsabilité civile", CABINET.rcPro]
          ]
        },
        { t: "sousTitre", texte: "Nature du conseil" },
        {
          t: "para",
          texte:
            "Le cabinet exerce en qualité de courtier (article L.521-2, II, 1°, b du Code des assurances) : il fonde son conseil sur l'analyse d'un nombre suffisant de contrats offerts sur le marché, adaptés à vos besoins. Il n'est soumis à aucune obligation contractuelle de travailler exclusivement avec une ou plusieurs entreprises d'assurance."
        },
        { t: "para", texte: `Principales compagnies partenaires : ${compagnies.join(", ") || "—"}.` },
        {
          t: "para",
          texte:
            "Le cabinet ne détient aucune participation, directe ou indirecte, d'au moins 10 % du capital ou des droits de vote d'une entreprise d'assurance, et aucune entreprise d'assurance ne détient une telle participation dans le cabinet."
        },
        { t: "sousTitre", texte: "Rémunération" },
        {
          t: "para",
          texte:
            "Le cabinet est rémunéré par une commission versée par l'entreprise d'assurance, incluse dans la prime ou la cotisation. Des frais de dossier peuvent être convenus préalablement avec vous ; leur montant est alors précisé dans la lettre de mission. Sur simple demande, vous pouvez obtenir des informations sur la nature et le mode de calcul de cette rémunération."
        },
        { t: "sousTitre", texte: "Réclamations et médiation" },
        {
          t: "para",
          texte: `Toute réclamation peut être adressée par écrit à ${CABINET.email} ou à ${cabinetLigne}. Le cabinet en accuse réception sous 10 jours ouvrables et y répond dans un délai maximum de deux mois. En cas de désaccord persistant, vous pouvez saisir gratuitement le médiateur : ${CABINET.mediateur}.`
        },
        { t: "para", texte: `Autorité de contrôle : ${CABINET.autorite}.` },
        { t: "sousTitre", texte: "Données personnelles" },
        {
          t: "para",
          texte:
            "Les informations recueillies sont utilisées pour l'étude et le suivi de vos contrats, transmises uniquement aux entreprises d'assurance et partenaires concernés, et conservées pendant la durée de la relation puis le temps des prescriptions légales. Vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition auprès du cabinet, et pouvez saisir la CNIL (www.cnil.fr)."
        },
        { t: "signatures", gauche: "Le client", droite: `Pour ${CABINET.nom}` }
      ]
    };
  }

  if (type === "lettre_mission") {
    return {
      titre: "Lettre de mission",
      blocs: [
        { t: "titre", texte: "Lettre de mission" },
        { t: "sousTitre", texte: "Entre" },
        identiteClient(c),
        { t: "para", texte: `et ${CABINET.nom}, ${CABINET.qualite}, ORIAS n° ${CABINET.orias}, représenté par ${CABINET.dirigeant}.` },
        { t: "sousTitre", texte: "Objet de la mission" },
        {
          t: "para",
          texte: `Le client confie au cabinet une mission de recherche, de conseil et de mise en place de solutions d'assurance pour : ${produits.join(", ") || "les besoins exprimés lors de l'entretien"}.`
        },
        {
          t: "liste",
          items: [
            "recueillir les informations nécessaires sur la situation, les besoins et les exigences du client ;",
            "analyser les offres du marché et présenter une ou plusieurs solutions adaptées, avec un conseil motivé ;",
            "accompagner le client dans la souscription et, le cas échéant, dans la résiliation de ses contrats existants ;",
            "assurer le suivi des contrats souscrits par son intermédiaire."
          ]
        },
        { t: "sousTitre", texte: "Engagements du client" },
        {
          t: "para",
          texte:
            "Le client s'engage à fournir des informations exactes et complètes et à informer le cabinet de tout changement de situation. Les éventuelles informations médicales sont transmises directement par le client à l'assureur et ne sont pas conservées par le cabinet."
        },
        { t: "sousTitre", texte: "Rémunération" },
        { t: "para", texte: "Le cabinet est rémunéré par commission de l'entreprise d'assurance, incluse dans la cotisation. Frais de dossier éventuels : ______ €." },
        { t: "sousTitre", texte: "Durée" },
        { t: "para", texte: "La mission prend effet à la signature et dure jusqu'à la mise en place des contrats ; le suivi se poursuit tant que les contrats sont gérés par le cabinet. Chaque partie peut y mettre fin par écrit à tout moment." },
        { t: "para", texte: `Fait à ${CABINET.ville}, le ${aujourdhui()}, en deux exemplaires.` },
        { t: "signatures", gauche: "Le client (« lu et approuvé »)", droite: `Pour ${CABINET.nom}` }
      ]
    };
  }

  if (type === "recueil") {
    const b = c.budget ?? {};
    const f = c.fiscalite ?? {};
    const projets: Bloc[] = dossiers.flatMap((d) => [
      { t: "para" as const, texte: produit(d.produit), gras: true },
      {
        t: "champs" as const,
        lignes: [
          ["Contrat actuel / banque", [d.banque, d.assureur_nom].filter(Boolean).join(" · ") || "—"],
          ...(d.produit === "assurance_emprunteur" || d.produit === "regroupement_credits"
            ? ([
                ["Montant emprunté", eur(d.montant_pret)],
                ["Durée", d.duree_mois ? `${d.duree_mois} mois` : "—"],
                ["Taux", d.taux != null ? `${String(d.taux).replace(".", ",")} %` : "—"],
                ["Coût assurance actuelle", eur(d.cout_assurance_banque)]
              ] as [string, string][])
            : ([
                ["Versement initial", eur(d.placement_initial)],
                ["Versement mensuel", eur(d.placement_mensuel)]
              ] as [string, string][]))
        ]
      }
    ]);
    return {
      titre: "Recueil des besoins",
      blocs: [
        { t: "titre", texte: "Recueil d'informations et des besoins" },
        { t: "para", texte: `Établi le ${aujourdhui()}. À mettre à jour au moins une fois par an.`, petit: true },
        { t: "sousTitre", texte: "Situation personnelle" },
        identiteClient(c),
        {
          t: "champs",
          lignes: [
            ["Date de naissance", date(c.date_naissance) !== "—" ? date(c.date_naissance) : c.annee_naissance ? String(c.annee_naissance) : "—"],
            ["Situation familiale", c.situation_familiale ?? "—"],
            ["Enfants à charge", c.nb_enfants != null ? String(c.nb_enfants) : "—"],
            ["Profession", c.profession ?? "—"]
          ]
        },
        { t: "sousTitre", texte: "Situation financière" },
        {
          t: "champs",
          lignes: [
            ["Revenus annuels", eur(b.revenus_annuels)],
            ["Charges annuelles", eur(b.charges_annuelles)],
            ["Crédits en cours", eur(b.credits_en_cours)],
            ["Mensualités de crédit", eur(b.mensualites_credits)],
            ["Patrimoine estimé", eur(b.patrimoine)],
            ["Tranche marginale d'imposition", f.tmi != null ? `${f.tmi} %` : "—"],
            ["Impôt sur le revenu payé", eur(f.impot_paye)]
          ]
        },
        { t: "sousTitre", texte: "Projets et contrats concernés" },
        ...(projets.length ? projets : [{ t: "para" as const, texte: "—" }]),
        { t: "sousTitre", texte: "Besoins et exigences exprimés" },
        { t: "para", texte: extra.besoins?.trim() || "____________________________________________\n____________________________________________\n____________________________________________" },
        { t: "para", texte: "Ce document ne contient aucune donnée de santé : les éventuelles formalités médicales sont accomplies directement auprès de l'assureur.", petit: true },
        { t: "para", texte: "Le client certifie l'exactitude des informations ci-dessus." },
        { t: "signatures", gauche: "Le client", droite: `Pour ${CABINET.nom}` }
      ]
    };
  }

  // Rapport d'adéquation (devoir de conseil), un bloc par dossier concerné.
  const blocsDossiers: Bloc[] = dossiers.flatMap((d) => {
    const lignes: [string, string][] = [
      ["Produit", produit(d.produit)],
      ["Solution retenue", d.assureur_nom ?? "—"],
      ["Date d'effet prévue", date(d.date_effet)],
      ["Cotisation", d.prime_mensuelle != null ? `${eur(d.prime_mensuelle)} / mois` : d.prime_annuelle != null ? `${eur(d.prime_annuelle)} / an` : "—"]
    ];
    if (d.produit === "assurance_emprunteur") {
      lignes.push(["Coût total contrat actuel", eur(d.cout_assurance_banque)], ["Coût total solution proposée", eur(d.cout_assurance_delegation)]);
      if (d.cout_assurance_banque != null && d.cout_assurance_delegation != null)
        lignes.push(["Économie estimée", eur(Number(d.cout_assurance_banque) - Number(d.cout_assurance_delegation))]);
    }
    return [{ t: "para" as const, texte: produit(d.produit), gras: true }, { t: "champs" as const, lignes }];
  });
  return {
    titre: "Rapport d'adéquation",
    blocs: [
      { t: "titre", texte: "Rapport d'adéquation et conseil" },
      { t: "para", texte: `Établi le ${aujourdhui()}.`, petit: true },
      identiteClient(c),
      { t: "sousTitre", texte: "Rappel des besoins" },
      { t: "para", texte: extra.besoins?.trim() || "Selon le recueil des besoins signé par le client." },
      { t: "sousTitre", texte: "Solution proposée" },
      ...(blocsDossiers.length ? blocsDossiers : [{ t: "para" as const, texte: "—" }]),
      { t: "sousTitre", texte: "Motivation du conseil" },
      {
        t: "para",
        texte:
          extra.motivation?.trim() ||
          "La solution retenue répond aux besoins exprimés au meilleur rapport garanties / coût parmi les offres étudiées. Pour une assurance de prêt, les garanties proposées respectent l'équivalence exigée par l'établissement prêteur."
      },
      { t: "para", texte: "Le client reconnaît avoir reçu les documents d'information précontractuelle (fiche standardisée d'information, conditions générales, document d'information sur le produit) et disposé du temps nécessaire pour les étudier." },
      { t: "signatures", gauche: "Le client", droite: `Pour ${CABINET.nom}` }
    ]
  };
}

export type DonneesCourrier = { destinataire?: string; adresseDestinataire?: string; reference?: string; numeroPret?: string; dateEffet?: string };

export function modeleCourrier(type: TypeCourrier, c: GpfClient, d: GpfDossier | null, don: DonneesCourrier): { titre: string; blocs: Bloc[] } {
  const ref = don.reference || d?.reference_contrat || "____________";
  const dest = [don.destinataire || d?.assureur_nom || "Service résiliation", ...(don.adresseDestinataire ?? "").split("\n").filter(Boolean)];
  const entete: Bloc[] = [
    { t: "para", texte: `${nomComplet(c)}\n${c.adresse ?? ""}\n${[c.code_postal, c.ville].filter(Boolean).join(" ")}` },
    { t: "adresse", lignes: dest },
    { t: "para", texte: `${c.ville ?? CABINET.ville}, le ${aujourdhui()}` },
    { t: "para", texte: "Lettre recommandée avec accusé de réception", gras: true }
  ];
  const fin: Bloc[] = [
    { t: "para", texte: "Je vous remercie de m'adresser une confirmation écrite de cette résiliation ainsi que, le cas échéant, le remboursement de la part de cotisation correspondant à la période non couverte." },
    { t: "para", texte: "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées." },
    { t: "espace", h: 16 },
    { t: "para", texte: nomComplet(c) },
    { t: "para", texte: "Signature :" }
  ];

  if (type === "resiliation_lemoine") {
    return {
      titre: COURRIER_LABEL[type],
      blocs: [
        ...entete,
        { t: "para", texte: `Objet : résiliation de mon contrat d'assurance emprunteur n° ${ref}${don.numeroPret ? ` — prêt n° ${don.numeroPret}` : ""}`, gras: true },
        { t: "para", texte: "Madame, Monsieur," },
        {
          t: "para",
          texte: `Conformément à l'article L.113-12-2 du Code des assurances (loi n° 2022-270 du 28 février 2022, dite « loi Lemoine »), je vous informe de ma décision de résilier le contrat d'assurance emprunteur référencé ci-dessus, garantissant le prêt souscrit auprès de ${d?.banque ?? "mon établissement prêteur"}.`
        },
        {
          t: "para",
          texte: `J'ai souscrit un nouveau contrat présentant un niveau de garanties équivalent, dont l'acceptation est soumise à l'établissement prêteur. La résiliation prendra effet dix jours après la réception par vous de la décision d'acceptation de la banque${don.dateEffet ? `, à la date de prise d'effet du nouveau contrat prévue le ${date(don.dateEffet)}` : ""}.`
        },
        ...fin
      ]
    };
  }
  if (type === "resiliation_echeance") {
    return {
      titre: COURRIER_LABEL[type],
      blocs: [
        ...entete,
        { t: "para", texte: `Objet : résiliation à échéance de mon contrat n° ${ref}`, gras: true },
        { t: "para", texte: "Madame, Monsieur," },
        {
          t: "para",
          texte: `Par la présente, je vous informe de ma décision de résilier mon contrat ${d ? produit(d.produit).toLowerCase() : ""} n° ${ref} à sa prochaine date d'échéance${d?.date_echeance ? `, soit le ${date(d.date_echeance)}` : ""}, conformément aux dispositions de l'article L.113-12 du Code des assurances (ou L.221-10 du Code de la mutualité) et de la loi Chatel.`
        },
        ...fin
      ]
    };
  }
  return {
    titre: COURRIER_LABEL[type],
    blocs: [
      ...entete,
      { t: "para", texte: `Objet : résiliation de mon contrat n° ${ref}`, gras: true },
      { t: "para", texte: "Madame, Monsieur," },
      {
        t: "para",
        texte: `Mon contrat ${d ? produit(d.produit).toLowerCase() : ""} n° ${ref} ayant plus d'un an d'ancienneté${d?.date_effet ? ` (souscrit le ${date(d.date_effet)})` : ""}, je vous informe de ma décision de le résilier, conformément à l'article L.113-15-2 du Code des assurances (loi Hamon) ou à l'article L.221-10-2 du Code de la mutualité pour la complémentaire santé. La résiliation prendra effet un mois après la réception de ce courrier.`
      },
      ...fin
    ]
  };
}

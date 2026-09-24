export type DepotDocType = "offre" | "tableau" | "identite" | "autre";

export type DepotDocumentStatus = Record<DepotDocType, boolean>;

export type DepotTokenPayload = {
  v: 1;
  dossierId: string;
  clientName: string;
  clientEmail?: string;
  bankCode?: string;
  mondayItemId?: string;
  mondayBoardId?: string;
  iat: number;
  exp: number;
};

export type BankTutorial = {
  code: string;
  label: string;
  aliases?: string[];
  primaryPath: string;
  secondaryPaths?: string[];
  documents: string[];
  specialCases?: string[];
  tips?: string[];
  videoUrl?: string;
  examplePdfs?: Array<{
    type: "offre" | "tableau";
    label: string;
    url: string;
    previewUrl?: string;
  }>;
};

export const DEPOT_ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

export const DEPOT_DOC_LABELS: Record<DepotDocType, string> = {
  offre: "Offre de prêt",
  tableau: "Tableau d'amortissement",
  identite: "Pièce d'identité",
  autre: "Autre document"
};

export const DEPOT_REQUIRED_DOCS: DepotDocType[] = ["offre", "tableau"];

export const BANK_TUTORIALS: BankTutorial[] = [
  {
    code: "bnp",
    label: "BNP Paribas",
    aliases: ["bnp paribas", "bnpp"],
    primaryPath: "Mes comptes -> Mes crédits -> Crédit immobilier -> Documents",
    documents: ["Offre préalable de crédit immobilier", "Tableau d'amortissement"],
    specialCases: [
      "Le tableau d'amortissement peut ne pas être disponible en ligne.",
      "Dans ce cas, demandez-le directement à votre conseiller."
    ],
    tips: [
      "Cherchez le document nommé « Offre préalable de crédit immobilier »."
    ],
    examplePdfs: [
      {
        type: "offre",
        label: "Exemple Offre de prêt",
        url: "/examples/bnp/odp-bnp-modif.pdf",
        previewUrl: "/examples/bnp/odp-bnp-modif-preview.png"
      },
      {
        type: "tableau",
        label: "Exemple Tableau d'amortissement",
        url: "/examples/bnp/ta-bnp-modif.pdf",
        previewUrl: "/examples/bnp/ta-bnp-modif-preview.png"
      }
    ]
  },
  {
    code: "ca",
    label: "Crédit Agricole",
    aliases: ["credit agricole"],
    primaryPath: "Mes comptes -> Mes contrats -> Mes documents -> Crédits",
    secondaryPaths: ["Mes comptes -> Crédits -> Détail du prêt"],
    documents: ["Offre de prêt immobilier", "Tableau d'amortissement"],
    tips: [
      "Le tableau peut apparaître sous « Plan d'amortissement » ou « Échéancier »."
    ],
    examplePdfs: [
      {
        type: "offre",
        label: "Exemple Offre de prêt",
        url: "/examples/ca/odp-ca-modif.pdf",
        previewUrl: "/examples/ca/odp-ca-modif-preview.png"
      },
      {
        type: "tableau",
        label: "Exemple Tableau d'amortissement",
        url: "/examples/ca/ta-ca-modif.pdf",
        previewUrl: "/examples/ca/ta-ca-modif-preview.png"
      }
    ]
  },
  {
    code: "sg",
    label: "Société Générale",
    aliases: ["societe generale", "société générale", "sg"],
    primaryPath: "Mes comptes -> Emprunts -> Crédit immobilier -> Détail du crédit -> Documents",
    secondaryPaths: ["Mes documents -> Crédits"],
    documents: ["Offre de prêt", "Tableau d'amortissement"],
    examplePdfs: [
      {
        type: "offre",
        label: "Exemple Offre de prêt",
        url: "/examples/sg/odp-sg-modif.pdf",
        previewUrl: "/examples/sg/odp-sg-modif-preview.png"
      },
      {
        type: "tableau",
        label: "Exemple Tableau d'amortissement",
        url: "/examples/sg/ta-sg-modif.pdf",
        previewUrl: "/examples/sg/ta-sg-modif-preview.png"
      }
    ]
  },
  {
    code: "cic",
    label: "CIC",
    primaryPath: "Espace client -> Voir tous les comptes -> Crédit immobilier -> Détail du prêt",
    documents: ["Offre de prêt signée", "Tableau d'amortissement"],
    tips: [
      "Le tableau peut être nommé « Plan de remboursement » ou « Tableau d'échéancier »."
    ],
    examplePdfs: [
      {
        type: "offre",
        label: "Exemple Offre de prêt",
        url: "/examples/cic/odp-cic-modif.pdf",
        previewUrl: "/examples/cic/odp-cic-modif-preview.png"
      },
      {
        type: "tableau",
        label: "Exemple Tableau d'amortissement",
        url: "/examples/cic/ta-cic-modif.pdf",
        previewUrl: "/examples/cic/ta-cic-modif-preview.png"
      }
    ]
  },
  {
    code: "ce",
    label: "Caisse d'Épargne",
    aliases: ["caisse d epargne", "caisse d'épargne", "ce"],
    primaryPath: "Mes crédits -> E-documents (Univers: Mes crédits, Type: Contrats)",
    documents: ["Offre de prêt immobilier", "Tableau d'amortissement"],
    specialCases: [
      "Le tableau d'amortissement peut apparaître sous « Courrier de fin de versement »."
    ],
    examplePdfs: [
      {
        type: "offre",
        label: "Exemple Offre de prêt",
        url: "/examples/ce/odp-ce-modif.pdf",
        previewUrl: "/examples/ce/odp-ce-modif-preview.png"
      },
      {
        type: "tableau",
        label: "Exemple Tableau d'amortissement",
        url: "/examples/ce/ta-ce-modif.pdf",
        previewUrl: "/examples/ce/ta-ce-modif-preview.png"
      }
    ]
  },
  {
    code: "lcl",
    label: "LCL",
    primaryPath: "Mes comptes -> Mes crédits -> Documents / Mon dossier",
    secondaryPaths: ["Mes contrats -> Crédit immobilier"],
    documents: ["Offre préalable de crédit immobilier", "Plan d'amortissement"],
    examplePdfs: [
      {
        type: "offre",
        label: "Exemple Offre de prêt",
        url: "/examples/lcl/odp-lcl-modif.pdf",
        previewUrl: "/examples/lcl/odp-lcl-modif-preview.png"
      },
      {
        type: "tableau",
        label: "Exemple Tableau d'amortissement",
        url: "/examples/lcl/ta-lcl-modif.pdf",
        previewUrl: "/examples/lcl/ta-lcl-modif-preview.png"
      }
    ]
  },
  {
    code: "bp",
    label: "Banque Populaire",
    aliases: ["banque populaire", "bp"],
    primaryPath: "Documents -> Mes documents électroniques -> Contrats signés (Offre de prêt)",
    secondaryPaths: [
      "Crédits -> Gérer -> Rééditer le tableau d'amortissement (Tableau d'amortissement)"
    ],
    documents: ["Offre de prêt", "Tableau d'amortissement"],
    tips: [
      "Le tableau peut être nommé « Plan de remboursement »."
    ],
    examplePdfs: [
      {
        type: "offre",
        label: "Exemple Offre de prêt",
        url: "/examples/bp/odp-banque-populaire-modif.pdf",
        previewUrl: "/examples/bp/odp-banque-populaire-modif-preview.png"
      },
      {
        type: "tableau",
        label: "Exemple Tableau d'amortissement",
        url: "/examples/bp/ta-banque-populaire-modif.pdf",
        previewUrl: "/examples/bp/ta-banque-populaire-modif-preview.png"
      }
    ]
  },
  {
    code: "bourso",
    label: "Boursorama",
    aliases: ["boursorama banque", "boursorama", "bourso"],
    primaryPath: "Mes produits -> Crédit immobilier -> Détail du crédit",
    documents: ["Offre de prêt immobilier", "Tableau d'amortissement"],
    tips: [
      "Le tableau d'amortissement peut être généré automatiquement dans l'espace crédit."
    ],
    examplePdfs: [
      {
        type: "offre",
        label: "Exemple Offre de prêt",
        url: "/examples/bourso/odp-bourso-modif-2.pdf",
        previewUrl: "/examples/bourso/odp-bourso-modif-2-preview.png"
      },
      {
        type: "tableau",
        label: "Exemple Tableau d'amortissement",
        url: "/examples/bourso/ta-bourso-modif.pdf",
        previewUrl: "/examples/bourso/ta-bourso-modif-preview.png"
      }
    ]
  },
  {
    code: "cm",
    label: "Crédit Mutuel",
    aliases: ["credit mutuel", "crédit mutuel", "cm"],
    primaryPath: "Mes comptes -> Crédits -> Détail du prêt -> Documents",
    secondaryPaths: ["Mes documents -> Contrats de crédit immobilier"],
    documents: ["Offre de prêt immobilier", "Tableau d'amortissement"],
    tips: [
      "Le tableau peut apparaître sous « Plan de remboursement » ou « Échéancier »."
    ],
    examplePdfs: [
      {
        type: "offre",
        label: "Exemple Offre de prêt",
        url: "/examples/cm/odp-cm-modif.pdf",
        previewUrl: "/examples/cm/odp-cm-modif-preview.png"
      },
      {
        type: "tableau",
        label: "Exemple Tableau d'amortissement",
        url: "/examples/cm/ta-cm-modif.pdf",
        previewUrl: "/examples/cm/ta-cm-modif-preview.png"
      }
    ]
  }
];

export const BANK_BY_CODE = new Map(BANK_TUTORIALS.map((bank) => [bank.code, bank]));

export const DEPOT_DOCUMENT_NAMES = {
  offre: [
    "Offre préalable de crédit immobilier",
    "Contrat de prêt immobilier",
    "Conditions particulières du prêt",
    "Contrat de crédit"
  ],
  tableau: [
    "Plan d'amortissement",
    "Échéancier",
    "Plan de remboursement",
    "Tableau de remboursement"
  ]
} as const;

export const DEPOT_FALLBACK_SECTIONS = ["Mes documents", "Mes contrats", "Mes crédits", "Archives", "E-documents"];

export const DEPOT_QUICK_TIPS = [
  "Téléchargez les documents en PDF.",
  "Vérifiez l'année de signature de votre prêt.",
  "Regardez en priorité la section Crédits immobiliers."
];

const normalizeBankText = (value: string) =>
  value
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();

export const resolveBankCode = (value: string | undefined) => {
  if (!value) return "";

  const maybeCode = value.trim().toLowerCase();
  if (BANK_BY_CODE.has(maybeCode)) return maybeCode;

  const normalized = normalizeBankText(value);
  const matched = BANK_TUTORIALS.find((bank) => {
    if (normalizeBankText(bank.label) === normalized) return true;
    return (bank.aliases ?? []).some((alias) => normalizeBankText(alias) === normalized);
  });

  return matched?.code ?? "";
};

export const getBankLabel = (code: string | undefined) => {
  if (!code) return "Banque non renseignée";
  return BANK_BY_CODE.get(code)?.label ?? code;
};

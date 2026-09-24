import Link from "next/link";

type TabId =
  | "dashboard"
  | "dossiers"
  | "simulations"
  | "portail"
  | "documents"
  | "signatures"
  | "bibliotheque"
  | "connecteurs"
  | "webhooks"
  | "catalogue"
  | "parametres"
  | "contact";

type NavItem = {
  label: string;
  tab: TabId;
  icon: string;
  badge?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

type PageProps = {
  searchParams?: {
    tab?: string | string[];
  };
};

const sidebarGroups: NavGroup[] = [
  {
    title: "Général",
    items: [
      { label: "Dashboard", tab: "dashboard", icon: "▦" },
      { label: "Dossiers", tab: "dossiers", icon: "☰", badge: "24" },
      { label: "Simulations", tab: "simulations", icon: "≈" }
    ]
  },
  {
    title: "Parcours client",
    items: [
      { label: "Portail client", tab: "portail", icon: "◎" },
      { label: "Documents", tab: "documents", icon: "◫" },
      { label: "Signatures", tab: "signatures", icon: "✍" },
      { label: "Bibliothèque", tab: "bibliotheque", icon: "☷" }
    ]
  },
  {
    title: "Assureurs",
    items: [
      { label: "Connecteurs API", tab: "connecteurs", icon: "⤳" },
      { label: "Webhooks", tab: "webhooks", icon: "◌" },
      { label: "Catalogue produits", tab: "catalogue", icon: "⌘" }
    ]
  },
  {
    title: "Compte",
    items: [
      { label: "Paramètres", tab: "parametres", icon: "⚙" },
      { label: "Contact", tab: "contact", icon: "✉" }
    ]
  }
];

const tabConfig: Record<TabId, { title: string; subtitle: string; actionLabel: string; searchLabel: string }> = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Vue d'ensemble des actions du jour",
    actionLabel: "+ Nouveau dossier",
    searchLabel: "Rechercher un client..."
  },
  dossiers: {
    title: "Dossiers",
    subtitle: "Suivi opérationnel de tous les dossiers",
    actionLabel: "+ Créer un dossier",
    searchLabel: "Rechercher une référence..."
  },
  simulations: {
    title: "Simulations",
    subtitle: "Comparatifs multi-assureurs centralisés",
    actionLabel: "+ Nouvelle simulation",
    searchLabel: "Rechercher une simulation..."
  },
  portail: {
    title: "Portail client",
    subtitle: "Expérience client unifiée et sécurisée",
    actionLabel: "Ouvrir un portail",
    searchLabel: "Rechercher un espace client..."
  },
  documents: {
    title: "Documents",
    subtitle: "Checklist et validation documentaire",
    actionLabel: "+ Ajouter un document",
    searchLabel: "Rechercher un document..."
  },
  signatures: {
    title: "Signatures",
    subtitle: "Suivi des signatures électroniques",
    actionLabel: "+ Lancer une signature",
    searchLabel: "Rechercher une enveloppe..."
  },
  bibliotheque: {
    title: "Bibliothèque",
    subtitle: "Ressources internes et modèles de documents",
    actionLabel: "+ Ajouter une ressource",
    searchLabel: "Rechercher une ressource..."
  },
  connecteurs: {
    title: "Connecteurs API",
    subtitle: "Statut des flux avec les assureurs",
    actionLabel: "+ Ajouter un connecteur",
    searchLabel: "Rechercher un partenaire..."
  },
  webhooks: {
    title: "Webhooks",
    subtitle: "Journal des événements synchronisés",
    actionLabel: "+ Nouveau webhook",
    searchLabel: "Rechercher un événement..."
  },
  catalogue: {
    title: "Catalogue produits",
    subtitle: "Offres et garanties disponibles",
    actionLabel: "+ Ajouter un produit",
    searchLabel: "Rechercher un produit..."
  },
  parametres: {
    title: "Paramètres",
    subtitle: "Configuration du SaaS GP FINANCES",
    actionLabel: "Enregistrer",
    searchLabel: "Rechercher un réglage..."
  },
  contact: {
    title: "Contact",
    subtitle: "Points de contact et support client",
    actionLabel: "Ouvrir la page contact",
    searchLabel: "Rechercher un sujet..."
  }
};

const dashboardCards = [
  { label: "Leads entrants", value: "12", note: "Aujourd'hui" },
  { label: "Dossiers en cours", value: "31", note: "Tous statuts confondus" },
  { label: "Signatures à relancer", value: "5", note: "OTP en attente" },
  { label: "Connecteurs actifs", value: "4/6", note: "Partenaires branchés" }
];

const dossiersRows = [
  { ref: "DOS-2026-101", client: "Marie Dupont", step: "Dépôt documents", insurer: "Assureur A", priority: "Haute" },
  { ref: "DOS-2026-102", client: "Thomas Mercier", step: "Signature", insurer: "Assureur B", priority: "Moyenne" },
  { ref: "DOS-2026-103", client: "Emma Laurent", step: "Validation médicale", insurer: "Assureur C", priority: "Haute" },
  { ref: "DOS-2026-104", client: "Julien Arnaud", step: "Terminé", insurer: "Assureur A", priority: "Basse" }
];

const simulationRows = [
  { partner: "Assureur A", monthly: "52 EUR", annual: "624 EUR", score: "Très compétitif" },
  { partner: "Assureur B", monthly: "56 EUR", annual: "672 EUR", score: "Compétitif" },
  { partner: "Assureur C", monthly: "61 EUR", annual: "732 EUR", score: "Standard" }
];

const documentRows = [
  { name: "Offre de prêt", state: "Reçu" },
  { name: "Tableau d'amortissement", state: "Reçu" },
  { name: "Questionnaire de santé simplifié", state: "À déposer" },
  { name: "Carte nationale d'identité", state: "À déposer" }
];

const signatureRows = [
  { document: "Mandat de substitution.pdf", signer: "Marie Dupont", state: "Signé" },
  { document: "Bulletin d'adhésion.pdf", signer: "Thomas Mercier", state: "En attente OTP" },
  { document: "Mandat SEPA.pdf", signer: "Emma Laurent", state: "À signer" }
];

const connectorRows = [
  { partner: "Assureur A", simulation: "Connecté", souscription: "Connecté", webhooks: "Actifs" },
  { partner: "Assureur B", simulation: "Connecté", souscription: "Partiel", webhooks: "Actifs" },
  { partner: "Assureur C", simulation: "Partiel", souscription: "Back-office", webhooks: "Manuels" }
];

const webhookRows = [
  "10:12:09 - simulation.generated - DOS-2026-101",
  "10:13:41 - client.link.sent - marie.dupont@email.com",
  "10:17:03 - documents.uploaded - DOS-2026-101",
  "10:20:14 - signature.completed - DOS-2026-104"
];

const catalogueRows = [
  { product: "Emprunteur Premium", insurer: "Assureur A", ciCrD: "CI + CRD", status: "Actif" },
  { product: "TNS Protect", insurer: "Assureur B", ciCrD: "CRD", status: "Actif" },
  { product: "Essentiel 2T", insurer: "Assureur C", ciCrD: "CI", status: "À valider" }
];

const settingRows = [
  { label: "Authentification renforcée (MFA)", value: "Activée" },
  { label: "Durée de vie du lien client", value: "15 minutes" },
  { label: "Relance automatique documents", value: "J+2 / J+5 / J+8" },
  { label: "Archivage coffre client", value: "Automatique" }
];

const contactRows = [
  { channel: "Téléphone", value: "06 51 22 42 13", href: "tel:+33651224213" },
  { channel: "Email", value: "contact@gp-finances.fr", href: "mailto:contact@gp-finances.fr" },
  { channel: "Rendez-vous", value: "Calendly GP FINANCES", href: "https://calendly.com/gabriel-perbost-gp-finances/economies" }
];

const normalizeTab = (value: string | string[] | undefined): TabId => {
  const raw = Array.isArray(value) ? value[0] : value;
  const allowed: TabId[] = [
    "dashboard",
    "dossiers",
    "simulations",
    "portail",
    "documents",
    "signatures",
    "bibliotheque",
    "connecteurs",
    "webhooks",
    "catalogue",
    "parametres",
    "contact"
  ];
  if (raw && allowed.includes(raw as TabId)) return raw as TabId;
  return "bibliotheque";
};

function renderTabContent(tab: TabId) {
  if (tab === "dashboard") {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((card) => (
            <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
              <p className="mt-1 text-sm text-slate-600">{card.note}</p>
            </article>
          ))}
        </div>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">Activité récente</h2>
          <ul className="mt-3 space-y-2">
            {webhookRows.map((row) => (
              <li key={row} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {row}
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  if (tab === "dossiers") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2 pr-4">Référence</th>
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Étape</th>
                <th className="pb-2 pr-4">Assureur</th>
                <th className="pb-2">Priorité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dossiersRows.map((row) => (
                <tr key={row.ref}>
                  <td className="py-2 pr-4 font-semibold text-slate-900">{row.ref}</td>
                  <td className="py-2 pr-4 text-slate-700">{row.client}</td>
                  <td className="py-2 pr-4 text-slate-700">{row.step}</td>
                  <td className="py-2 pr-4 text-slate-700">{row.insurer}</td>
                  <td className="py-2 text-slate-700">{row.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (tab === "simulations") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Comparatif rapide</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {simulationRows.map((row) => (
            <article key={row.partner} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{row.partner}</p>
              <p className="mt-2 text-sm text-slate-700">Mensuel: {row.monthly}</p>
              <p className="text-sm text-slate-700">Annuel: {row.annual}</p>
              <p className="mt-2 text-xs font-semibold text-blue-700">{row.score}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (tab === "portail") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Accès portail client</h2>
        <p className="mt-2 text-sm text-slate-600">Visualisez le rendu côté client avec l&apos;état dossier vide ou en cours.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/espace-client/portail?stage=empty" className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Ouvrir portail vide
          </Link>
          <Link href="/espace-client/portail?stage=in_progress" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Ouvrir portail en cours
          </Link>
        </div>
      </section>
    );
  }

  if (tab === "documents") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Suivi documentaire</h2>
        <ul className="mt-3 space-y-2">
          {documentRows.map((row) => (
            <li key={row.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-700">{row.name}</span>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">{row.state}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (tab === "signatures") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Enveloppes de signature</h2>
        <ul className="mt-3 space-y-2">
          {signatureRows.map((row) => (
            <li key={row.document} className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:grid-cols-[1.5fr_1fr_auto] md:items-center">
              <span className="text-sm text-slate-700">{row.document}</span>
              <span className="text-sm text-slate-600">{row.signer}</span>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">{row.state}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (tab === "connecteurs") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2 pr-4">Partenaire</th>
                <th className="pb-2 pr-4">Simulation</th>
                <th className="pb-2 pr-4">Souscription</th>
                <th className="pb-2">Webhooks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {connectorRows.map((row) => (
                <tr key={row.partner}>
                  <td className="py-2 pr-4 font-semibold text-slate-900">{row.partner}</td>
                  <td className="py-2 pr-4 text-slate-700">{row.simulation}</td>
                  <td className="py-2 pr-4 text-slate-700">{row.souscription}</td>
                  <td className="py-2 text-slate-700">{row.webhooks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (tab === "webhooks") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Journal webhooks</h2>
        <ul className="mt-3 space-y-2">
          {webhookRows.map((row) => (
            <li key={row} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {row}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (tab === "catalogue") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2 pr-4">Produit</th>
                <th className="pb-2 pr-4">Assureur</th>
                <th className="pb-2 pr-4">CI / CRD</th>
                <th className="pb-2">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {catalogueRows.map((row) => (
                <tr key={row.product}>
                  <td className="py-2 pr-4 font-semibold text-slate-900">{row.product}</td>
                  <td className="py-2 pr-4 text-slate-700">{row.insurer}</td>
                  <td className="py-2 pr-4 text-slate-700">{row.ciCrD}</td>
                  <td className="py-2 text-slate-700">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (tab === "parametres") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Réglages principaux</h2>
        <ul className="mt-3 space-y-2">
          {settingRows.map((row) => (
            <li key={row.label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-700">{row.label}</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{row.value}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (tab === "contact") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Support et contact</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {contactRows.map((row) => (
            <article key={row.channel} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{row.channel}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{row.value}</p>
              <a
                href={row.href}
                className="mt-3 inline-flex rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                target={row.href.startsWith("http") ? "_blank" : undefined}
                rel={row.href.startsWith("http") ? "noreferrer" : undefined}
              >
                Ouvrir
              </a>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-10">
      <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
        <p className="text-4xl text-slate-300">☷</p>
        <p className="mt-3 text-lg font-semibold text-slate-700">Aucune ressource enregistrée</p>
        <p className="mt-1 text-sm text-slate-500">Ajoutez vos ressources pour organiser vos dossiers client.</p>
      </div>
    </section>
  );
}

export default function SaasSidebarPreviewPage({ searchParams }: PageProps) {
  const currentTab = normalizeTab(searchParams?.tab);
  const currentConfig = tabConfig[currentTab];

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1650px] md:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white md:flex md:flex-col">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-lg font-semibold text-slate-900">GP FINANCES</p>
            <p className="mt-0.5 text-xs text-slate-500">SaaS courtage assurance emprunteur</p>
          </div>

          <div className="flex-1 space-y-6 px-3 py-5">
            {sidebarGroups.map((group) => (
              <section key={group.title}>
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{group.title}</p>
                <nav className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const isActive = currentTab === item.tab;
                    return (
                      <Link
                        key={item.label}
                        href={`/previews/saas-sidebar?tab=${item.tab}`}
                        className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition ${
                          isActive ? "bg-blue-700 text-white" : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`text-xs ${isActive ? "text-white" : "text-slate-400"}`}>{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                        {item.badge ? (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isActive ? "bg-white/15 text-white" : "bg-slate-200 text-slate-700"}`}>
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>
              </section>
            ))}
          </div>

          <div className="border-t border-slate-200 px-5 py-4">
            <p className="text-sm font-semibold text-slate-900">Gabriel Perbost</p>
            <p className="text-xs text-slate-500">Administrateur</p>
            <button type="button" className="mt-3 inline-flex rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
              Déconnexion
            </button>
          </div>
        </aside>

        <section className="flex flex-col">
          <header className="border-b border-slate-200 bg-white px-5 py-4 md:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{currentConfig.title}</h1>
                <p className="mt-1 text-sm text-slate-500">{currentConfig.subtitle}</p>
              </div>
              <button type="button" className="inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                {currentConfig.actionLabel}
              </button>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder={currentConfig.searchLabel}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 md:w-[340px]"
              />
              <button type="button" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700">
                Filtres
              </button>
              <button type="button" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700">
                Paramètres
              </button>
            </div>

            {renderTabContent(currentTab)}

            <footer className="flex flex-wrap gap-2 text-sm">
              <Link href="/previews/espace-client-process" className="rounded-md border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50">
                Voir la maquette process complète
              </Link>
              <Link href="/espace-client" className="rounded-md border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50">
                Voir l&apos;espace client actuel
              </Link>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";

type Tone = "success" | "warning" | "info" | "neutral";

const navItems = [
  { id: "simulateur", label: "Simulation" },
  { id: "acces", label: "Acces securise" },
  { id: "dossier", label: "Depot dossier" },
  { id: "signature", label: "Signature" },
  { id: "sync", label: "Sync assureurs" },
  { id: "coffre", label: "Coffre client" },
  { id: "backoffice", label: "Back-office" }
];

const flowSteps = [
  {
    title: "1. Landing + simulation",
    detail: "Le prospect remplit un formulaire court. Le moteur remonte un comparatif multi-assureurs au branding GP FINANCES."
  },
  {
    title: "2. Lien de connexion securise",
    detail: "Magic link expirable + OTP SMS. Le client accede directement a son espace, sans redirection externe."
  },
  {
    title: "3. Dossier pre-rempli",
    detail: "Le profil client est precharge et une checklist dynamique affiche les pieces exactes a fournir."
  },
  {
    title: "4. Depot des documents",
    detail: "Upload dans le coffre GP FINANCES avec controle format, lisibilite, et completude du dossier."
  },
  {
    title: "5. Signature interne",
    detail: "Le client signe dans la plateforme GP FINANCES. Piste d'audit horodatee et preuve de consentement conservee."
  },
  {
    title: "6. Synchronisation assureur",
    detail: "Transmission automatique des pieces vers les assureurs via API + mise a jour des statuts via webhooks."
  },
  {
    title: "7. Coffre unique final",
    detail: "Le client retrouve au meme endroit ses documents deposees, les documents assureur, et les contrats actifs."
  }
];

const kpiCards = [
  { label: "Assureurs connectes", value: "6", note: "Simulation + souscription" },
  { label: "Temps moyen dossier", value: "18 min", note: "Simulation -> signature" },
  { label: "Docs centralises", value: "100%", note: "Un seul espace client" },
  { label: "Canal principal", value: "GP FINANCES", note: "Pas de sortie vers site assureur" }
];

const marketOffers = [
  { insurer: "Assureur A", monthly: "52 EUR/mois", annual: "624 EUR/an", savings: "32%", status: "Eligible" },
  { insurer: "Assureur B", monthly: "56 EUR/mois", annual: "672 EUR/an", savings: "27%", status: "Eligible" },
  { insurer: "Assureur C", monthly: "60 EUR/mois", annual: "720 EUR/an", savings: "22%", status: "Eligible" },
  { insurer: "Assureur D", monthly: "64 EUR/mois", annual: "768 EUR/an", savings: "17%", status: "Info complementaire" },
  { insurer: "Assureur E", monthly: "68 EUR/mois", annual: "816 EUR/an", savings: "11%", status: "En attente API" },
  { insurer: "Assureur F", monthly: "71 EUR/mois", annual: "852 EUR/an", savings: "8%", status: "En attente API" }
];

const onboardingChecklist = [
  { item: "Identite emprunteur", status: "Valide", tone: "success" as Tone },
  { item: "Tableau d'amortissement", status: "Valide", tone: "success" as Tone },
  { item: "Questionnaire medical", status: "A corriger", tone: "warning" as Tone },
  { item: "Mandat de substitution", status: "A signer", tone: "info" as Tone },
  { item: "Bulletin d'adhesion", status: "A signer", tone: "info" as Tone }
];

const signatureQueue = [
  {
    document: "Mandat de substitution.pdf",
    owner: "GP FINANCES",
    signer: "Marie Dupont",
    status: "Signature OK",
    tone: "success" as Tone
  },
  {
    document: "Bulletin d'adhesion assureur.pdf",
    owner: "Assureur A",
    signer: "Marie Dupont",
    status: "OTP en cours",
    tone: "warning" as Tone
  },
  {
    document: "Autorisation prelevement.pdf",
    owner: "Assureur A",
    signer: "Marie Dupont",
    status: "A signer",
    tone: "info" as Tone
  }
];

const apiBridge = [
  {
    partner: "Assureur A",
    simulation: "Connecte",
    souscription: "Connecte",
    documents: "Connecte",
    signature: "Connecte",
    webhook: "Actif"
  },
  {
    partner: "Assureur B",
    simulation: "Connecte",
    souscription: "Connecte",
    documents: "Connecte",
    signature: "Partiel",
    webhook: "Actif"
  },
  {
    partner: "Assureur C",
    simulation: "Connecte",
    souscription: "Partiel",
    documents: "Partiel",
    signature: "Externe",
    webhook: "Actif"
  },
  {
    partner: "Assureur D",
    simulation: "Connecte",
    souscription: "Backoffice",
    documents: "Backoffice",
    signature: "Externe",
    webhook: "Manuel"
  }
];

const syncLog = [
  "10:12:09 - POST /api/simulations -> 6 offres normalisees",
  "10:12:17 - POST /api/client-portal/session-link -> magic link envoye",
  "10:13:40 - POST /api/client-portal/verify-otp -> session securisee active",
  "10:17:04 - POST /api/documents/upload -> 3 pieces stockees (bucket client-847)",
  "10:19:31 - POST /api/signatures/start -> enveloppe de signature creee",
  "10:21:10 - POST /api/insurer-a/subscription -> dossier transmis",
  "10:21:19 - WEBHOOK /api/insurer/status -> statut: ACCEPTED",
  "10:21:22 - POST /api/vault/finalize -> certificat et police archives"
];

const vaultOverview = [
  { folder: "Documents client", count: 3, weight: "4.2 MB", updated: "Aujourd'hui 10:17" },
  { folder: "Documents assureur", count: 4, weight: "1.1 MB", updated: "Aujourd'hui 10:21" },
  { folder: "Signatures et preuves", count: 3, weight: "2.5 MB", updated: "Aujourd'hui 10:22" },
  { folder: "Contrats actifs", count: 2, weight: "0.8 MB", updated: "Aujourd'hui 10:22" }
];

const backOfficeColumns = [
  {
    title: "Nouveaux leads",
    cards: ["Lead #L-2034 - Marie Dupont", "Lead #L-2035 - Thomas Mercier", "Lead #L-2036 - Emma Laurent"]
  },
  {
    title: "Dossiers incomplets",
    cards: ["DOS-981 - Piece medicale manquante", "DOS-982 - OTP expire", "DOS-983 - IBAN illisible"]
  },
  {
    title: "Signature en cours",
    cards: ["DOS-984 - 1 doc restant", "DOS-985 - valider co-emprunteur", "DOS-986 - relance J+1 planifiee"]
  },
  {
    title: "Dossiers valides",
    cards: ["DOS-977 - Assureur A", "DOS-978 - Assureur B", "DOS-979 - Assureur C"]
  }
];

const securityChecklist = [
  "Liens de connexion expires (15 min) + OTP",
  "Controle d'acces strict par client/dossier (RLS/ACL)",
  "URLs signees pour telechargement des documents",
  "Journal d'audit complet: vue, upload, signature, sync",
  "Politique RGPD: retention, purge, suppression sur demande",
  "Verification HMAC sur webhooks + protection anti-replay"
];

const toneClassMap: Record<Tone, string> = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-slate-100 text-slate-700"
};

const getOfferTone = (status: string): Tone => {
  if (status === "Eligible") return "success";
  if (status === "Info complementaire") return "warning";
  return "neutral";
};

const getSyncStateTone = (value: string): Tone => {
  if (value === "Connecte" || value === "Actif") return "success";
  if (value === "Partiel") return "warning";
  return "neutral";
};

export default function EspaceClientProcessPreviewPage() {
  return (
    <main className="container py-10 space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Maquette complete - Process GP FINANCES</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Parcours integral: simulation, signature, coffre client unique</h1>
        <p className="mt-3 max-w-4xl text-slate-700">
          Prototype detaille d&apos;un parcours 100% interne GP FINANCES: du lead jusqu&apos;au contrat actif, sans obliger le client
          a aller sur le site de l&apos;assureur.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/espace-client" className="inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Voir la version site
          </Link>
          <Link href="/" className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Voir la landing actuelle
          </Link>
          <Link
            href="/previews/depot-reminders"
            className="inline-flex rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Retour aux previews emails
          </Link>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Navigation maquette</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">KPI de la vision cible</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => (
            <article key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
              <p className="mt-1 text-sm text-slate-600">{card.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Flux complet jusqu&apos;au bout</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {flowSteps.map((step) => (
            <li key={step.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-blue-700">{step.title}</p>
              <p className="mt-2 text-sm text-slate-700">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="simulateur" className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ecran 1 - Landing + simulateur multi-courtiers</h2>
          <p className="mt-2 text-sm text-slate-600">
            Le client remplit son profil en moins de 2 minutes, puis voit un comparatif unifie en marque blanche GP FINANCES.
          </p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <input type="text" value="Marie Dupont" readOnly className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" />
              <input type="email" value="marie.dupont@email.com" readOnly className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" />
              <input type="text" value="Capital restant: 248 000 EUR" readOnly className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" />
              <input type="text" value="Age: 37 ans - Non fumeur" readOnly className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" />
            </div>
            <button type="button" className="mt-3 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
              Lancer la simulation
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4 font-semibold">Assureur</th>
                  <th className="py-2 pr-4 font-semibold">Mensualite</th>
                  <th className="py-2 pr-4 font-semibold">Cout annuel</th>
                  <th className="py-2 pr-4 font-semibold">Economies</th>
                  <th className="py-2 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {marketOffers.map((offer) => (
                  <tr key={offer.insurer} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 pr-4">{offer.insurer}</td>
                    <td className="py-3 pr-4">{offer.monthly}</td>
                    <td className="py-3 pr-4">{offer.annual}</td>
                    <td className="py-3 pr-4 font-semibold text-emerald-700">{offer.savings}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassMap[getOfferTone(offer.status)]}`}>{offer.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article id="acces" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ecran 2 - Lien magique + OTP</h2>
          <p className="mt-2 text-sm text-slate-600">
            Connexion client protegee avec expiration courte et verification multi-facteur.
          </p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Etape 1: email transactionnel</p>
              <p className="mt-1 text-sm text-slate-600">Lien unique envoye, valide 15 minutes.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Etape 2: OTP</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input type="text" value="4 8 2 1 9 0" readOnly className="h-10 w-44 rounded-md border border-slate-300 bg-white px-3 text-sm tracking-[0.25em]" />
                <button type="button" className="h-10 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white">
                  Verifier
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Session securisee active</p>
              <p className="mt-1 text-sm text-emerald-700">Dossier GPF-2026-00321 pre-rempli a 68%.</p>
            </div>
          </div>
        </article>
      </section>

      <section id="dossier" className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ecran 3 - Depot des pieces</h2>
          <p className="mt-2 text-sm text-slate-600">Checklist dynamique qui affiche ce qui est valide, a corriger, ou a signer.</p>
          <ul className="mt-4 space-y-2">
            {onboardingChecklist.map((entry) => (
              <li key={entry.item} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <span className="text-sm text-slate-800">{entry.item}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassMap[entry.tone]}`}>{entry.status}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Zone de depot securisee</p>
            <p className="mt-1 text-sm text-slate-600">Formats: PDF, JPG, PNG - Max 15 MB/document - Scan antivirus au depot.</p>
            <button type="button" className="mt-3 inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              Importer un document
            </button>
          </div>
        </article>

        <article id="signature" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ecran 4 - Signature electronique interne</h2>
          <p className="mt-2 text-sm text-slate-600">
            Le client signe tout dans l&apos;espace GP FINANCES, y compris les documents issus des assureurs partenaires.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4 font-semibold">Document</th>
                  <th className="py-2 pr-4 font-semibold">Origine</th>
                  <th className="py-2 pr-4 font-semibold">Signataire</th>
                  <th className="py-2 font-semibold">Etat</th>
                </tr>
              </thead>
              <tbody>
                {signatureQueue.map((entry) => (
                  <tr key={entry.document} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 pr-4">{entry.document}</td>
                    <td className="py-3 pr-4">{entry.owner}</td>
                    <td className="py-3 pr-4">{entry.signer}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassMap[entry.tone]}`}>{entry.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
              Demarrer la signature
            </button>
            <button type="button" className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Voir piste d&apos;audit
            </button>
          </div>
        </article>
      </section>

      <section id="sync" className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ecran 5 - Bridge API assureurs</h2>
          <p className="mt-2 text-sm text-slate-600">
            Couche de normalisation pour garder une UX unique meme avec des APIs heterogenes selon les assureurs.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Partenaire</th>
                  <th className="py-2 pr-3 font-semibold">Simulation</th>
                  <th className="py-2 pr-3 font-semibold">Souscription</th>
                  <th className="py-2 pr-3 font-semibold">Documents</th>
                  <th className="py-2 pr-3 font-semibold">Signature</th>
                  <th className="py-2 font-semibold">Webhook</th>
                </tr>
              </thead>
              <tbody>
                {apiBridge.map((row) => (
                  <tr key={row.partner} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 pr-3">{row.partner}</td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClassMap[getSyncStateTone(row.simulation)]}`}>{row.simulation}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClassMap[getSyncStateTone(row.souscription)]}`}>{row.souscription}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClassMap[getSyncStateTone(row.documents)]}`}>{row.documents}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClassMap[getSyncStateTone(row.signature)]}`}>{row.signature}</span>
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClassMap[getSyncStateTone(row.webhook)]}`}>{row.webhook}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Journal technique temps reel</h2>
          <p className="mt-2 text-sm text-slate-600">Trace de bout en bout du dossier jusqu&apos;a l&apos;acceptation assureur.</p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs text-slate-100">
            {syncLog.map((line) => (
              <p key={line} className="font-mono">
                {line}
              </p>
            ))}
          </div>
        </article>
      </section>

      <section id="coffre" className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ecran 6 - Coffre documentaire unique</h2>
          <p className="mt-2 text-sm text-slate-600">
            Tous les documents restent disponibles dans un seul espace: depots initiaux, documents assureur, preuves de signature, contrats.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4 font-semibold">Dossier</th>
                  <th className="py-2 pr-4 font-semibold">Fichiers</th>
                  <th className="py-2 pr-4 font-semibold">Poids</th>
                  <th className="py-2 font-semibold">Mise a jour</th>
                </tr>
              </thead>
              <tbody>
                {vaultOverview.map((folder) => (
                  <tr key={folder.folder} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 pr-4">{folder.folder}</td>
                    <td className="py-3 pr-4">{folder.count}</td>
                    <td className="py-3 pr-4">{folder.weight}</td>
                    <td className="py-3">{folder.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
              Telecharger mon contrat
            </button>
            <button type="button" className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Partager a ma banque
            </button>
          </div>
        </article>

        <article id="backoffice" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ecran 7 - Back-office GP FINANCES</h2>
          <p className="mt-2 text-sm text-slate-600">Vue operationnelle interne pour suivre les leads, les blocages et les dossiers finalises.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {backOfficeColumns.map((column) => (
              <div key={column.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">{column.title}</p>
                <ul className="mt-2 space-y-2">
                  {column.cards.map((card) => (
                    <li key={card} className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
                      {card}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Bloc securite et conformite (production)</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {securityChecklist.map((item) => (
            <li key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-blue-900">Resultat de la maquette</h2>
        <p className="mt-2 max-w-4xl text-sm text-blue-800">
          Cette version montre un parcours complet de niveau production: simulation, connexion, dossier, signature, synchronisation,
          et coffre final centralise. Le client reste dans l&apos;environnement GP FINANCES du debut a la fin.
        </p>
      </section>
    </main>
  );
}

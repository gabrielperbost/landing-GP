import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Tone } from "@/components/espace-client/ui";
import { PortalDocumentsPanel } from "@/components/espace-client/PortalDocumentsPanel";
import { FirstLoginPasswordSetup } from "@/components/espace-client/FirstLoginPasswordSetup";
import { PortalTokenBootstrap } from "@/components/espace-client/PortalTokenBootstrap";
import { getSimulationFromMonday } from "@/lib/mondaySimulation";
import { getPortalSessionFromCookieStore } from "@/lib/portalAuth";
import { isLikelySimulationUrl } from "@/lib/simulationUrl";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PortalSection = "Mes documents" | "Documents assureur";

type PortalDoc = {
  name: string;
  status: string;
  tone: Tone;
  section: PortalSection;
  documentUrl?: string;
};

type SessionProgress = {
  status: string;
  offreDone: boolean;
  tableauDone: boolean;
  offreUrl: string;
  tableauUrl: string;
  simulationUrl: string;
  simulationName: string;
};

type TimelineState = "done" | "current" | "next";
type PortalStage =
  | "empty"
  | "first_login"
  | "password_set"
  | "in_progress"
  | "simulation_available"
  | "proposal_accepted"
  | "complete";
type StatusConfig = { status: string; tone: Tone };

const MY_DOC_NAMES = ["Offre de prêt", "Tableau d'amortissement"];

const INSURER_DOC_NAMES = [
  "Questionnaire de Santé Simplifié",
  "Carte nationale d'identité",
  "Protection des données personnelles",
  "Notice d'information",
  "Politique de confidentialité",
  "IPID",
  "Adhésion 85209514911",
  "Demande d'Adhésion",
  "Mandat de résiliation",
  "Fiche Devoir de Conseil Immobilier",
  "Mandat SEPA",
  "Certificat d'Assurance de Prêt",
  "Lettre de résiliation"
];

const timelineStateLabel: Record<TimelineState, string> = {
  done: "Terminé",
  current: "En cours",
  next: "À venir"
};

const timelineStateClass: Record<TimelineState, string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-800",
  current: "border-blue-200 bg-blue-50 text-blue-800",
  next: "border-slate-100 bg-white text-slate-500"
};

const STAGE_TIMELINE_PROGRESS: Record<PortalStage, { doneCount: number; currentStep: number | null }> = {
  empty: { doneCount: 0, currentStep: 1 },
  first_login: { doneCount: 1, currentStep: 2 },
  password_set: { doneCount: 2, currentStep: 3 },
  in_progress: { doneCount: 3, currentStep: 4 },
  simulation_available: { doneCount: 4, currentStep: 5 },
  proposal_accepted: { doneCount: 5, currentStep: 6 },
  complete: { doneCount: 8, currentStep: null }
};

const STAGE_DEFAULT_STATUS: Record<PortalStage, StatusConfig> = {
  empty: { status: "À venir", tone: "neutral" },
  first_login: { status: "À venir", tone: "neutral" },
  password_set: { status: "À venir", tone: "neutral" },
  in_progress: { status: "En cours", tone: "info" },
  simulation_available: { status: "En cours", tone: "info" },
  proposal_accepted: { status: "En cours", tone: "info" },
  complete: { status: "Signé", tone: "success" }
};

const STAGE_STATUS_OVERRIDES: Record<PortalStage, Record<string, StatusConfig>> = {
  empty: {},
  first_login: {
    "Questionnaire de Santé Simplifié": { status: "À déposer", tone: "warning" },
    "Carte nationale d'identité": { status: "À déposer", tone: "warning" },
    "Protection des données personnelles": { status: "À signer", tone: "warning" },
    "Notice d'information": { status: "À lire", tone: "info" },
    "Politique de confidentialité": { status: "À lire", tone: "info" },
    IPID: { status: "À lire", tone: "info" }
  },
  password_set: {
    "Questionnaire de Santé Simplifié": { status: "Reçu", tone: "success" },
    "Carte nationale d'identité": { status: "Reçu", tone: "success" },
    "Protection des données personnelles": { status: "À signer", tone: "warning" },
    "Notice d'information": { status: "À lire", tone: "info" },
    "Politique de confidentialité": { status: "À lire", tone: "info" },
    IPID: { status: "À lire", tone: "info" }
  },
  in_progress: {
    "Questionnaire de Santé Simplifié": { status: "À signer", tone: "warning" },
    "Carte nationale d'identité": { status: "Reçu", tone: "success" },
    "Protection des données personnelles": { status: "À signer", tone: "warning" },
    "Notice d'information": { status: "À conserver", tone: "success" },
    "Politique de confidentialité": { status: "À conserver", tone: "success" },
    IPID: { status: "À lire", tone: "success" },
    "Adhésion 85209514911": { status: "En attente", tone: "neutral" },
    "Demande d'Adhésion": { status: "À signer", tone: "warning" },
    "Mandat de résiliation": { status: "À signer", tone: "warning" },
    "Fiche Devoir de Conseil Immobilier": { status: "À signer", tone: "warning" },
    "Mandat SEPA": { status: "À signer", tone: "warning" },
    "Certificat d'Assurance de Prêt": { status: "En attente", tone: "neutral" },
    "Lettre de résiliation": { status: "En attente", tone: "neutral" }
  },
  simulation_available: {
    "Questionnaire de Santé Simplifié": { status: "À signer", tone: "warning" },
    "Carte nationale d'identité": { status: "Reçu", tone: "success" },
    "Protection des données personnelles": { status: "À signer", tone: "warning" },
    "Notice d'information": { status: "À conserver", tone: "success" },
    "Politique de confidentialité": { status: "À conserver", tone: "success" },
    IPID: { status: "À lire", tone: "success" },
    "Adhésion 85209514911": { status: "En attente", tone: "neutral" },
    "Demande d'Adhésion": { status: "À signer", tone: "warning" },
    "Mandat de résiliation": { status: "À signer", tone: "warning" },
    "Fiche Devoir de Conseil Immobilier": { status: "À signer", tone: "warning" },
    "Mandat SEPA": { status: "À signer", tone: "warning" },
    "Certificat d'Assurance de Prêt": { status: "En attente", tone: "neutral" },
    "Lettre de résiliation": { status: "En attente", tone: "neutral" }
  },
  proposal_accepted: {
    "Questionnaire de Santé Simplifié": { status: "À signer", tone: "warning" },
    "Carte nationale d'identité": { status: "Reçu", tone: "success" },
    "Protection des données personnelles": { status: "À signer", tone: "warning" },
    "Notice d'information": { status: "À conserver", tone: "success" },
    "Politique de confidentialité": { status: "À conserver", tone: "success" },
    IPID: { status: "À lire", tone: "success" },
    "Adhésion 85209514911": { status: "En attente", tone: "neutral" },
    "Demande d'Adhésion": { status: "À signer", tone: "warning" },
    "Mandat de résiliation": { status: "À signer", tone: "warning" },
    "Fiche Devoir de Conseil Immobilier": { status: "À signer", tone: "warning" },
    "Mandat SEPA": { status: "À signer", tone: "warning" },
    "Certificat d'Assurance de Prêt": { status: "En attente", tone: "neutral" },
    "Lettre de résiliation": { status: "En attente", tone: "neutral" }
  },
  complete: {
    "Carte nationale d'identité": { status: "Reçu", tone: "success" },
    "Notice d'information": { status: "À conserver", tone: "success" },
    "Politique de confidentialité": { status: "À conserver", tone: "success" },
    IPID: { status: "À lire", tone: "success" },
    "Adhésion 85209514911": { status: "Émis", tone: "success" },
    "Certificat d'Assurance de Prêt": { status: "À conserver", tone: "success" }
  }
};

const baseTimelineSteps = [
  {
    title: "1. Première connexion",
    detail: "Lien envoyé par email pour créer votre accès.",
    short: "Accès email"
  },
  {
    title: "2. Changement du mot de passe",
    detail: "Création de votre mot de passe personnel.",
    short: "Mot de passe"
  },
  {
    title: "3. Dépôt initial des documents",
    detail: "Vos premiers documents ont été déposés sur la plateforme.",
    short: "Dépôt docs"
  },
  {
    title: "4. Études des documents",
    detail: "Vos documents sont en cours d'étude par nos équipes.",
    short: "Étude dossier"
  },
  {
    title: "5. Simulation disponible",
    detail: "Votre proposition d'assurance est disponible sur le portail.",
    short: "Simulation dispo"
  },
  {
    title: "6. Signature des documents",
    detail: "Les documents contractuels ont été signés.",
    short: "Signature contrat"
  },
  {
    title: "7. Prise en charge du dossier par nos équipes",
    detail: "Votre dossier est traité en priorité.",
    short: "Traitement équipe"
  },
  {
    title: "8. Dossier effectif",
    detail: "Activation finale et archivage dans votre coffre documentaire.",
    short: "Dossier actif"
  }
];

type PortalPageProps = {
  searchParams?: {
    firstLogin?: string | string[];
    stage?: string | string[];
    email?: string | string[];
    token?: string | string[];
    simulationUrl?: string | string[];
    simulationName?: string | string[];
  };
};

const isFirstLogin = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value.includes("1");
  return value === "1";
};

const getSingleValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
};

const getPortalStage = (firstLoginValue: string | string[] | undefined, stageValue: string | string[] | undefined): PortalStage => {
  if (isFirstLogin(firstLoginValue)) return "first_login";

  const stage = getSingleValue(stageValue);
  if (stage === "empty") return "empty";
  if (stage === "complete") return "complete";
  if (stage === "in_progress") return "in_progress";
  if (stage === "simulation_available") return "simulation_available";
  if (stage === "proposal_accepted") return "proposal_accepted";
  if (stage === "password_set") return "password_set";
  return "password_set";
};

const getStageFromSessionStatus = (rawStatus: string | undefined): PortalStage | null => {
  const status = String(rawStatus ?? "").trim().toLowerCase();
  if (status === "transferred") return "complete";
  if (status === "proposal_accepted" || status === "accepted") return "proposal_accepted";
  if (status === "simulation_available") return "simulation_available";
  if (status === "in_progress") return "in_progress";
  if (status === "password_set") return "password_set";
  return null;
};

const STAGE_MY_DOC_STATUS: Record<PortalStage, StatusConfig> = {
  empty: { status: "À déposer", tone: "warning" },
  first_login: { status: "À déposer", tone: "warning" },
  password_set: { status: "À déposer", tone: "warning" },
  in_progress: { status: "Déposé", tone: "success" },
  simulation_available: { status: "Déposé", tone: "success" },
  proposal_accepted: { status: "Déposé", tone: "success" },
  complete: { status: "Déposé", tone: "success" }
};

const INSURER_DOC_BLOCKED_STATUS: StatusConfig = {
  status: "En attente",
  tone: "neutral"
};

const areClientDocsDeposited = (docs: PortalDoc[]) =>
  docs
    .filter((doc) => doc.section === "Mes documents")
    .every((doc) => doc.status === "Déposé");

const getSessionProgress = async (token: string): Promise<SessionProgress | null> => {
  if (!token || !isSupabaseConfigured) return null;

  const { data: session, error } = await supabaseAdmin
    .from("sessions")
    .select("status, offre_url, tableau_url, monday_item_id")
    .eq("token", token)
    .single();

  if (error || !session) return null;

  const simulation = await getSimulationFromMonday(session.monday_item_id ?? "");

  return {
    status: session.status ?? "",
    offreDone: Boolean(session.offre_url),
    tableauDone: Boolean(session.tableau_url),
    offreUrl: session.offre_url ?? "",
    tableauUrl: session.tableau_url ?? "",
    simulationUrl: simulation?.url ?? "",
    simulationName: simulation?.name ?? ""
  };
};

const buildPortalDocs = ({
  stage,
  sessionProgress
}: {
  stage: PortalStage;
  sessionProgress: SessionProgress | null;
}): { docs: PortalDoc[]; clientDocsDeposited: boolean } => {
  const defaultConfig = STAGE_DEFAULT_STATUS[stage];
  const stageOverrides = STAGE_STATUS_OVERRIDES[stage];
  const myDocStatus = STAGE_MY_DOC_STATUS[stage];

  const myDocs = MY_DOC_NAMES.map((name) => {
    if (sessionProgress) {
      const done = name === "Offre de prêt" ? sessionProgress.offreDone : sessionProgress.tableauDone;
      return {
        name,
        status: done ? "Déposé" : "À déposer",
        tone: (done ? "success" : "warning") as Tone,
        section: "Mes documents" as PortalSection,
        documentUrl: done ? (name === "Offre de prêt" ? sessionProgress.offreUrl : sessionProgress.tableauUrl) : undefined
      };
    }

    return {
      name,
      status: myDocStatus.status,
      tone: myDocStatus.tone,
      section: "Mes documents" as PortalSection,
      documentUrl: undefined
    };
  });

  const clientDocsDeposited = areClientDocsDeposited(myDocs);

  const insurerDocs = INSURER_DOC_NAMES.map((name) => {
    const config = clientDocsDeposited ? stageOverrides[name] ?? defaultConfig : INSURER_DOC_BLOCKED_STATUS;
    return {
      name,
      status: config.status,
      tone: config.tone,
      section: "Documents assureur" as PortalSection
    };
  });

  return {
    docs: [...myDocs, ...insurerDocs],
    clientDocsDeposited
  };
};

export default async function EspaceClientPortailPage({ searchParams }: PortalPageProps) {
  const portalStage = getPortalStage(searchParams?.firstLogin, searchParams?.stage);
  const forceFirstLoginFromQuery = isFirstLogin(searchParams?.firstLogin);
  const cookieStore = cookies();
  const cookieSession = getPortalSessionFromCookieStore(cookieStore);
  const queryEmail = getSingleValue(searchParams?.email);
  const queryToken = getSingleValue(searchParams?.token);
  const clientEmail = cookieSession?.email || queryEmail;
  const clientToken = cookieSession?.token || queryToken;
  const simulationUrlFromQuery = getSingleValue(searchParams?.simulationUrl);
  const simulationNameFromQuery = getSingleValue(searchParams?.simulationName);
  const portalAfterPasswordHref = "/espace-client/portail";

  if (!clientToken && !isFirstLogin(searchParams?.firstLogin)) {
    redirect("/espace-client/connexion");
  }

  if (!clientToken && isFirstLogin(searchParams?.firstLogin)) {
    redirect("/espace-client/connexion?error=invalid_link");
  }

  const sessionProgress = await getSessionProgress(clientToken);
  const docsReady = Boolean(sessionProgress?.offreDone && sessionProgress?.tableauDone);
  const simulationFromSession = sessionProgress?.simulationUrl ?? "";
  const simulationFromQuery = isLikelySimulationUrl(simulationUrlFromQuery) ? simulationUrlFromQuery : "";
  const simulationReady = Boolean(simulationFromSession);
  const statusDrivenStage = getStageFromSessionStatus(sessionProgress?.status);
  const effectivePortalStage: PortalStage =
    forceFirstLoginFromQuery
      ? "first_login"
      : statusDrivenStage === "complete" || portalStage === "complete"
      ? "complete"
      : statusDrivenStage === "proposal_accepted" || portalStage === "proposal_accepted"
        ? "proposal_accepted"
      : docsReady
        ? simulationReady
          ? "simulation_available"
          : "in_progress"
        : statusDrivenStage === "password_set"
          ? "password_set"
          : portalStage === "first_login" && !statusDrivenStage
            ? "first_login"
            : statusDrivenStage ?? portalStage;
  const simulationUrl = simulationFromSession || simulationFromQuery;
  const simulationName = simulationFromSession ? sessionProgress?.simulationName ?? "" : simulationUrl ? simulationNameFromQuery : "";
  const showFirstLoginBlock = effectivePortalStage === "first_login";
  const initialProposalAccepted = effectivePortalStage === "proposal_accepted" || effectivePortalStage === "complete";
  const { docs } = buildPortalDocs({ stage: effectivePortalStage, sessionProgress });
  const myDocs = docs.filter((doc) => doc.section === "Mes documents");
  const insurerDocs = docs.filter((doc) => doc.section === "Documents assureur");
  const timelineProgress = STAGE_TIMELINE_PROGRESS[effectivePortalStage];
  const timelineSteps: Array<{ title: string; detail: string; short: string; state: TimelineState }> = baseTimelineSteps.map((step, index) => {
    const stepNumber = index + 1;
    if (timelineProgress.currentStep === stepNumber) {
      return { ...step, state: "current" };
    }
    if (stepNumber <= timelineProgress.doneCount) {
      return { ...step, state: "done" };
    }
    return { ...step, state: "next" };
  });
  const totalTimelineSteps = baseTimelineSteps.length;
  const timelineProgressNodes = timelineProgress.doneCount + (timelineProgress.currentStep ? 0.5 : 0);
  const timelinePercent = Math.max(
    0,
    Math.min(100, ((Math.max(timelineProgressNodes, 1) - 1) / Math.max(totalTimelineSteps - 1, 1)) * 100)
  );

  return (
    <main className="container py-8 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
        {queryToken ? <PortalTokenBootstrap token={queryToken || undefined} email={queryEmail || undefined} /> : null}

        <header
          className="relative rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] sm:rounded-[36px] sm:p-10"
        >
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Portail client</p>
            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
              <Link
                href="/espace-client/contact"
                className="inline-flex h-11 min-w-[118px] items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-800 shadow-[0_10px_24px_-16px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_16px_28px_-16px_rgba(15,23,42,0.55)] sm:h-14 sm:min-w-[176px] sm:px-8 sm:text-sm"
              >
                Contact
              </Link>
              <Link
                href="/espace-client/connexion?logout=1"
                className="inline-flex h-11 min-w-[134px] items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-800 shadow-[0_10px_24px_-16px_rgba(15,23,42,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_16px_28px_-16px_rgba(15,23,42,0.55)] sm:h-14 sm:min-w-[208px] sm:px-8 sm:text-sm"
              >
                Déconnexion
              </Link>
            </div>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl" style={{ lineHeight: 1.12 }}>
            Votre dossier en un coup d&apos;œil
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg" style={{ lineHeight: 1.6 }}>
            Tous vos documents sont ici, au même endroit. Aucun espace externe, aucun parcours compliqué.
          </p>
          {clientEmail ? (
            <p className="mt-4 text-sm font-semibold text-slate-500 sm:text-base">
              Connecté en tant que: <span className="text-slate-700">{clientEmail}</span>
            </p>
          ) : null}
        </header>

        <section
          className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] sm:rounded-[34px] sm:p-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">Timeline du dossier</p>
            <p className="text-xs text-slate-500 sm:text-sm">
              Étape actuelle:{" "}
              <span className="font-semibold text-slate-700">
                {timelineProgress.currentStep ? timelineProgress.currentStep : totalTimelineSteps}/{totalTimelineSteps}
              </span>
            </p>
          </div>

          <div className="mt-5 md:hidden">
            <div className="h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-emerald-400 transition-all" style={{ width: `${timelinePercent}%` }} />
            </div>
            <div className="mt-4 -mx-1 overflow-x-auto pb-2">
              <ol className="flex min-w-max items-start gap-4 px-1">
                {timelineSteps.map((step, index) => {
                  const stepNumber = index + 1;
                  const dotClass =
                    step.state === "done"
                      ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                      : step.state === "current"
                        ? "border-blue-300 bg-blue-100 text-blue-700"
                        : "border-slate-200 bg-white text-slate-400";
                  return (
                    <li key={step.title} className="w-[88px] shrink-0 text-center">
                      <span className={`mx-auto inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${dotClass}`}>
                        {step.state === "done" ? "✓" : stepNumber}
                      </span>
                      <p className="mt-2 text-[12px] font-semibold leading-tight text-slate-700">{step.short}</p>
                      <p className="mt-1 text-[11px] leading-tight text-slate-500">{timelineStateLabel[step.state]}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          <div className="mt-7 hidden overflow-x-auto pb-2 md:block">
            <div className="relative min-w-[860px] px-2 lg:min-w-[1020px]" style={{ paddingTop: 8, paddingBottom: 8 }}>
              <div className="absolute left-10 right-10 top-6 h-1.5 rounded-full bg-slate-200" />
              <div
                className="absolute left-10 top-6 h-1.5 rounded-full bg-emerald-400 transition-all"
                style={{ width: `calc((100% - 5rem) * ${timelinePercent / 100})` }}
              />
              <ul className="relative z-10 flex items-start justify-between">
                {timelineSteps.map((step, index) => {
                  const stepNumber = index + 1;
                  const dotClass =
                    step.state === "done"
                      ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                      : step.state === "current"
                        ? "border-blue-300 bg-blue-100 text-blue-700"
                        : "border-slate-200 bg-white text-slate-400";
                  return (
                    <li key={step.title} className="flex w-[96px] flex-col items-center text-center lg:w-[116px]" style={{ rowGap: 2 }}>
                      <span
                        title={`${step.title} — ${step.detail} (${timelineStateLabel[step.state]})`}
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold ${dotClass}`}
                      >
                        {step.state === "done" ? "✓" : stepNumber}
                      </span>
                      <span className="mt-3 text-sm font-semibold text-slate-700">Étape {stepNumber}</span>
                      <span className="mt-1 text-xs leading-tight text-slate-500" style={{ maxWidth: 96 }}>
                        {step.short}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        {showFirstLoginBlock ? (
          <section
            className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.3)] sm:rounded-[32px] sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Première connexion</p>
            <h2 className="mt-2 text-2xl font-semibold text-amber-900">Créez votre mot de passe personnel</h2>
            <p className="mt-3 max-w-3xl text-base text-amber-800">
              Pour des raisons de sécurité, vous devez définir votre mot de passe personnel avant d&apos;utiliser le portail.
            </p>
            <p className="mt-2 text-base font-semibold text-amber-900">Votre email sera votre identifiant.</p>

            <FirstLoginPasswordSetup email={clientEmail} token={clientToken} redirectHref={portalAfterPasswordHref} />
          </section>
        ) : null}

        {effectivePortalStage === "password_set" ? (
          <section
            className="rounded-[26px] border border-blue-200 bg-blue-50 p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.3)] sm:rounded-[32px] sm:p-7"
          >
            <p className="text-base font-semibold text-blue-800">Mot de passe mis à jour.</p>
            <p className="mt-1.5 text-base text-blue-700">La suite du dossier n&apos;est pas encore validée. Les prochaines étapes restent à traiter.</p>
          </section>
        ) : null}

        {effectivePortalStage === "empty" ? (
          <section
            className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.3)] sm:rounded-[32px] sm:p-7"
          >
            <p className="text-base font-semibold text-amber-800">Dossier initialisé, aucune action réalisée.</p>
            <p className="mt-1.5 text-base text-amber-700">Le client n&apos;a encore rien déposé et aucun document assureur n&apos;est signé.</p>
          </section>
        ) : null}

        {clientToken && !sessionProgress ? (
          <section
            className="rounded-[26px] border border-rose-200 bg-rose-50 p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.3)] sm:rounded-[32px] sm:p-7"
          >
            <p className="text-base font-semibold text-rose-700">Impossible de charger les documents déposés.</p>
            <p className="mt-1.5 text-base text-rose-700">
              Ouvrez le lien reçu par email pour reconnecter votre dossier, puis revenez sur cet espace.
            </p>
          </section>
        ) : null}

        <section
          className="rounded-[26px] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] sm:rounded-[36px] sm:p-8"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Documents déposés</h2>
          <PortalDocumentsPanel
            initialMyDocs={myDocs}
            initialSimulationUrl={simulationUrl || undefined}
            initialSimulationName={simulationName || undefined}
            insurerDocs={insurerDocs}
            initialProposalAccepted={initialProposalAccepted}
          />
        </section>

      </div>
    </main>
  );
}

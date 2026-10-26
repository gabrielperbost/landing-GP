/**
 * Configuration des sessions du webinaire PER grand public.
 * Chaque session a sa page d'inscription, son onglet dans le Google Sheet, son lien Zoom
 * et ses rappels. Un seul fichier à modifier si une date, une heure ou un lien Zoom changent.
 */
const SITE_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://gp-finances.fr").replace(/\/+$/, "");

const env = (value: string | undefined) => value?.trim() || "";

const TITLE = "Webinaire PER : payer moins d'impôts et préparer sa retraite";
const DURATION_LABEL = "45 minutes d'explications et d'exemples chiffrés + 15 minutes de questions";

export type WebinarPerSessionId = "2026-11-01" | "2026-11-08";

export type WebinarPerSession = {
  id: WebinarPerSessionId;
  title: string;
  audience: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  registrationPath: string;
  unsubscribePath: string;
  meetingUrl: string;
  videoUrl: string;
  replayPolicy: string;
  /** Onglet du Google Sheet où sont écrites les inscriptions de cette session. */
  sheetName: string;
  /** Préfixe de la colonne « Source » (permet aussi de distinguer les lignes si l'onglet est partagé). */
  sourcePrefix: string;
  /** Inscriptions et marquages de rappel antérieurs à cette date : ignorés (ils concernent une session passée). */
  campaignStart: string;
  icsUid: string;
  /** Format ISO UTC (heure de Paris = UTC+1 en novembre). */
  startUtc: string;
  endUtc: string;
  startLocal: string;
  endLocal: string;
};

export const WEBINAR_PER_SESSIONS: Record<WebinarPerSessionId, WebinarPerSession> = {
  "2026-11-01": {
    id: "2026-11-01",
    title: TITLE,
    audience: "Grand public",
    dateLabel: "Dimanche 1er novembre 2026",
    timeLabel: "15h00 à 16h00",
    durationLabel: DURATION_LABEL,
    registrationPath: "/webinaire-per",
    unsubscribePath: "/api/webinar-per/unsubscribe",
    // La variable d'environnement WEBINAR_PER_MEETING_URL reste prioritaire.
    meetingUrl: env(process.env.WEBINAR_PER_MEETING_URL) || "https://us06web.zoom.us/j/82484836786?pwd=xZVc62LUchxU5endIuHDMVNhtupfb1.1",
    videoUrl: "https://www.youtube.com/watch?v=CNFS4tn5538",
    replayPolicy: "Participation gratuite sur inscription. Un replay sera envoyé aux personnes inscrites.",
    sheetName: "Feuille 1",
    sourcePrefix: "webinaire-per",
    // Les inscriptions et rappels antérieurs concernent le webinaire du 11 octobre.
    campaignStart: "2026-10-15T00:00:00Z",
    icsUid: "webinaire-per-grand-public-2026-11-01@gp-finances.fr",
    startUtc: "20261101T140000Z",
    endUtc: "20261101T150000Z",
    startLocal: "2026-11-01T15:00:00",
    endLocal: "2026-11-01T16:00:00"
  },
  "2026-11-08": {
    id: "2026-11-08",
    title: TITLE,
    audience: "Grand public",
    dateLabel: "Dimanche 8 novembre 2026",
    timeLabel: "15h00 à 16h00",
    durationLabel: DURATION_LABEL,
    registrationPath: "/webinaire-per-8-novembre",
    unsubscribePath: "/api/webinar-per/unsubscribe",
    // La variable d'environnement WEBINAR_PER_8NOV_MEETING_URL reste prioritaire.
    meetingUrl: env(process.env.WEBINAR_PER_8NOV_MEETING_URL) || "https://us06web.zoom.us/j/87575702326?pwd=3zNcYVD9JpMHdDchuM5Jq7A8Zf2E0b.1",
    videoUrl: "https://www.youtube.com/watch?v=CNFS4tn5538",
    replayPolicy: "Participation gratuite sur inscription. Un replay sera envoyé aux personnes inscrites.",
    sheetName: "Feuille 2",
    sourcePrefix: "webinaire-per-8nov",
    campaignStart: "2026-10-26T00:00:00Z",
    icsUid: "webinaire-per-grand-public-2026-11-08@gp-finances.fr",
    startUtc: "20261108T140000Z",
    endUtc: "20261108T150000Z",
    startLocal: "2026-11-08T15:00:00",
    endLocal: "2026-11-08T16:00:00"
  }
};

export const WEBINAR_PER_DEFAULT_SESSION: WebinarPerSessionId = "2026-11-01";

/** Session demandée (identifiant inconnu ou absent : session du 1er novembre). */
export const getWebinarPerSession = (id?: unknown): WebinarPerSession =>
  WEBINAR_PER_SESSIONS[String(id ?? "") as WebinarPerSessionId] ?? WEBINAR_PER_SESSIONS[WEBINAR_PER_DEFAULT_SESSION];

// Compatibilité : session du 1er novembre (utilisée par les invitations de prospection et leurs bilans).
export const WEBINAR_PER = WEBINAR_PER_SESSIONS[WEBINAR_PER_DEFAULT_SESSION];
export const WEBINAR_PER_CAMPAIGN_START = WEBINAR_PER.campaignStart;

export const getWebinarPerEvent = (session: WebinarPerSession = WEBINAR_PER) => {
  // Lien Zoom pas encore renseigné : on renvoie vers la page d'inscription plutôt qu'un bouton vide.
  const url = session.meetingUrl || getWebinarPerRegistrationUrl(SITE_BASE_URL, session);
  return {
    title: session.title,
    startUtc: session.startUtc,
    endUtc: session.endUtc,
    startLocal: session.startLocal,
    endLocal: session.endLocal,
    timezone: "Europe/Paris",
    url,
    location: url,
    description: "45 minutes d'explications et d'exemples chiffrés + 15 minutes de questions.\n\nLien de connexion : " + url
  };
};

export const WEBINAR_PER_EVENT = getWebinarPerEvent();

export const getWebinarPerMeetingUrl = (session: WebinarPerSession = WEBINAR_PER) => getWebinarPerEvent(session).url;

export const getWebinarPerRegistrationUrl = (baseUrl = SITE_BASE_URL, session: WebinarPerSession = WEBINAR_PER) =>
  `${baseUrl.replace(/\/+$/, "")}${session.registrationPath}`;

export const getWebinarPerUnsubscribeUrl = (email: string, session: WebinarPerSession = WEBINAR_PER) =>
  `${SITE_BASE_URL}${session.unsubscribePath}?email=${encodeURIComponent(email)}&session=${session.id}`;

export const getWebinarPerBaseUrl = () => SITE_BASE_URL;

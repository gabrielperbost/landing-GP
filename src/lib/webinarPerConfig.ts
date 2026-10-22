/**
 * Configuration du webinaire PER grand public du dimanche 1er novembre 2026.
 * Un seul fichier à modifier si la date, l'heure ou le lien Zoom changent.
 */
const SITE_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://gp-finances.fr").replace(/\/+$/, "");

// Lien Zoom du webinaire du 1er novembre (la variable d'environnement WEBINAR_PER_MEETING_URL reste prioritaire).
const DEFAULT_MEETING_URL = "https://us06web.zoom.us/j/82484836786?pwd=xZVc62LUchxU5endIuHDMVNhtupfb1.1";

export const WEBINAR_PER = {
  title: "Webinaire PER : payer moins d'impôts et préparer sa retraite",
  audience: "Grand public",
  dateLabel: "Dimanche 1er novembre 2026",
  timeLabel: "15h00 à 16h00 (heure de Paris)",
  durationLabel: "45 minutes d'explications et d'exemples chiffrés + 15 minutes de questions",
  registrationPath: "/webinaire-per",
  unsubscribePath: "/api/webinar-per/unsubscribe",
  meetingUrl: (process.env.WEBINAR_PER_MEETING_URL?.trim() || DEFAULT_MEETING_URL),
  videoUrl: "https://www.youtube.com/watch?v=CNFS4tn5538",
  replayPolicy: "Participation gratuite sur inscription. Un replay sera envoyé aux personnes inscrites."
} as const;

// Format ISO UTC (heure de Paris = UTC+1 le 1er novembre 2026 : passage à l'heure d'hiver le 25 octobre).
// Date de début de campagne : les inscriptions et rappels antérieurs concernent le webinaire du 11 octobre.
export const WEBINAR_PER_CAMPAIGN_START = "2026-10-15T00:00:00Z";
export const WEBINAR_PER_EVENT = {
  title: WEBINAR_PER.title,
  startUtc: "20261101T140000Z",
  endUtc: "20261101T150000Z",
  startLocal: "2026-11-01T15:00:00",
  endLocal: "2026-11-01T16:00:00",
  timezone: "Europe/Paris",
  get url() {
    return WEBINAR_PER.meetingUrl;
  },
  get location() {
    return WEBINAR_PER.meetingUrl;
  },
  get description() {
    return (
      "45 minutes d'explications et d'exemples chiffrés + 15 minutes de questions.\n\n" +
      "Lien de connexion : " +
      WEBINAR_PER.meetingUrl
    );
  }
};

export const getWebinarPerRegistrationUrl = (baseUrl = SITE_BASE_URL) =>
  `${baseUrl.replace(/\/+$/, "")}${WEBINAR_PER.registrationPath}`;

export const getWebinarPerBaseUrl = () => SITE_BASE_URL;

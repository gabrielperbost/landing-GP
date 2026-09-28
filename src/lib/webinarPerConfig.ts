/**
 * Configuration du webinaire PER grand public du dimanche 11 octobre 2026.
 * Un seul fichier à modifier si la date, l'heure ou le lien Zoom changent.
 */
const SITE_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://gp-finances.fr").replace(/\/+$/, "");

// À remplacer par le vrai lien Zoom dès qu'il existe (variable d'environnement
// WEBINAR_PER_MEETING_URL en priorité, pour ne pas avoir à modifier le code).
const DEFAULT_MEETING_URL = "https://zoom.us/j/AJOUTER-LE-LIEN-ZOOM";

export const WEBINAR_PER = {
  title: "Webinaire PER : comprendre et optimiser sa retraite",
  audience: "Grand public",
  dateLabel: "Dimanche 11 octobre 2026",
  timeLabel: "15h00 à 16h00 (heure de Paris)",
  durationLabel: "45 minutes d'explications et d'exemples chiffrés + 15 minutes de questions",
  registrationPath: "/webinaire-per",
  unsubscribePath: "/api/webinar-per/unsubscribe",
  meetingUrl: (process.env.WEBINAR_PER_MEETING_URL?.trim() || DEFAULT_MEETING_URL),
  videoUrl: "https://www.youtube.com/watch?v=CNFS4tn5538",
  replayPolicy: "Participation gratuite sur inscription. Un replay sera envoyé aux personnes inscrites."
} as const;

// Format ISO UTC (heure de Paris = UTC+2 en octobre, heure d'été encore en vigueur le 11/10/2026).
export const WEBINAR_PER_EVENT = {
  title: WEBINAR_PER.title,
  startUtc: "20261011T130000Z",
  endUtc: "20261011T140000Z",
  startLocal: "2026-10-11T15:00:00",
  endLocal: "2026-10-11T16:00:00",
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

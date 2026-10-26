import { WEBINAR_PER, getWebinarPerBaseUrl, getWebinarPerEvent, type WebinarPerSession } from "@/lib/webinarPerConfig";

const buildUrl = (base: string, path: string) => `${base.replace(/\/+$/, "")}${path}`;

/** Liens « Ajouter à mon agenda » (Google, Outlook) et fichier .ics pour Apple/autres. */
export const getWebinarPerCalendarLinks = (baseUrl = getWebinarPerBaseUrl(), session: WebinarPerSession = WEBINAR_PER) => {
  const event = getWebinarPerEvent(session);

  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", event.title);
  googleUrl.searchParams.set("dates", `${event.startLocal.replace(/[-:]/g, "")}/${event.endLocal.replace(/[-:]/g, "")}`);
  googleUrl.searchParams.set("ctz", event.timezone);
  googleUrl.searchParams.set("details", event.description);
  googleUrl.searchParams.set("location", event.location);

  const outlookUrl = new URL("https://outlook.office.com/calendar/0/action/compose");
  outlookUrl.searchParams.set("subject", event.title);
  outlookUrl.searchParams.set("startdt", event.startLocal);
  outlookUrl.searchParams.set("enddt", event.endLocal);
  outlookUrl.searchParams.set("body", event.description);
  outlookUrl.searchParams.set("location", event.location);

  return {
    google: googleUrl.toString(),
    outlook: outlookUrl.toString(),
    ics: buildUrl(baseUrl, `/api/webinar-per/calendar?session=${session.id}`)
  };
};

const escapeIcsText = (value: string) =>
  value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");

export const buildWebinarPerIcs = (session: WebinarPerSession = WEBINAR_PER) => {
  const event = getWebinarPerEvent(session);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GP Finances//Webinaire PER//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${session.icsUid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${event.startUtc}`,
    `DTEND:${event.endUtc}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `URL:${event.url}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
};

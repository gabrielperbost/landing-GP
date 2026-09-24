const SITE_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://gp-finances.fr").replace(/\/+$/, "");

export const WEBINAR_AVOCATS_MEETING_URL =
  process.env.WEBINAR_AVOCATS_MEETING_URL?.trim() ||
  "https://us06web.zoom.us/j/83656205859?pwd=P3ojRfWiNLgfMZddL5hBhKMovNJ8mT.1";

export const WEBINAR_AVOCATS_CALENDAR_EVENT = {
  title: "Webinaire PER pour avocats",
  startUtc: "20260917T160000Z",
  endUtc: "20260917T170000Z",
  startLocal: "2026-09-17T18:00:00",
  endLocal: "2026-09-17T19:00:00",
  timezone: "Europe/Paris",
  url: WEBINAR_AVOCATS_MEETING_URL,
  location: WEBINAR_AVOCATS_MEETING_URL,
  description:
    "45 minutes d'explications et d'exemples chiffrés + 15 minutes de questions.\n\nLien de connexion Zoom : " +
    WEBINAR_AVOCATS_MEETING_URL
};

const buildUrl = (base: string, path: string) => `${base.replace(/\/+$/, "")}${path}`;

export const getWebinarAvocatsCalendarLinks = (baseUrl = SITE_BASE_URL) => {
  const event = WEBINAR_AVOCATS_CALENDAR_EVENT;

  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", event.title);
  googleUrl.searchParams.set("dates", "20260917T180000/20260917T190000");
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
    ics: buildUrl(baseUrl, "/api/webinar-avocats/calendar")
  };
};

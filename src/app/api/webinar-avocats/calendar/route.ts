import { NextResponse } from "next/server";
import { WEBINAR_AVOCATS_CALENDAR_EVENT } from "@/lib/webinarAvocatsCalendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const escapeIcsText = (value: string) =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");

const formatDateStamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

// RFC 5545: fold at 75 UTF-8 octets without splitting a character.
const foldIcsLine = (value: string) => {
  const lines: string[] = [];
  let line = "";
  let octets = 0;
  for (const character of value) {
    const size = Buffer.byteLength(character, "utf8");
    if (octets + size > 75) {
      lines.push(line);
      line = " ";
      octets = 1;
    }
    line += character;
    octets += size;
  }
  lines.push(line);
  return lines;
};

export async function GET() {
  const event = WEBINAR_AVOCATS_CALENDAR_EVENT;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GP Finances//Webinaire PER Avocats//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:webinaire-per-avocats-20260917@gp-finances.fr",
    `DTSTAMP:${formatDateStamp(new Date())}`,
    `DTSTART:${event.startUtc}`,
    `DTEND:${event.endUtc}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `URL:${event.url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(event.title)}`,
    "TRIGGER:-P1D",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(event.title)}`,
    "TRIGGER:-PT1H",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(event.title)}`,
    "TRIGGER:PT0S",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].flatMap(foldIcsLine).join("\r\n") + "\r\n";

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="webinaire-per-avocats.ics"'
    }
  });
}

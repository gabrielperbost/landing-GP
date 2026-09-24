import { LEGAL } from "@/content/site";
import { getWebinarAvocatsCalendarLinks, WEBINAR_AVOCATS_MEETING_URL } from "@/lib/webinarAvocatsCalendar";
import { createWebinarTrackingToken } from "@/lib/webinarAvocatsTokens";
import { buildWebinarAvocatsReplay } from "@/lib/webinarAvocatsReplay";
import { buildWebinarAvocatsReplayNonregistered } from "@/lib/webinarAvocatsReplayNonregistered";

export const WEBINAR_AVOCATS = {
  title: "Webinaire PER pour avocats",
  audience: "Avocats inscrits à un barreau français",
  dateLabel: "Jeudi 17 septembre 2026",
  timeLabel: "18h00 à 19h00",
  durationLabel: "45 minutes d'explications et d'exemples chiffrés + 15 minutes de questions",
  registrationPath: "/webinaire-per-avocats",
  unsubscribePath: "/api/webinar-avocats/unsubscribe",
  defaultReplayPolicy: "Participation gratuite sur inscription. Un replay sera envoyé aux personnes inscrites."
};

export type WebinarAvocatsEmailTemplate =
  | "invitation"
  | "relance_s1"
  | "relance_s2"
  | "relance_s3"
  | "relance_s4"
  | "relance_s5"
  | "relance_s6"
  | "relance_s7"
  | "relance_3d"
  | "relance_30d"
  | "relance_24h"
  | "relance_j0"
  | "confirmation"
  | "registered_reminder_30d"
  | "registered_reminder_14d"
  | "registered_reminder_7d"
  | "registered_reminder_3d"
  | "registered_reminder_1d"
  | "registered_reminder_morning"
  | "registered_replay"
  | "nonregistered_replay";

export const WEBINAR_AVOCATS_EMAIL_TEMPLATES: WebinarAvocatsEmailTemplate[] = [
  "invitation",
  "relance_s1",
  "relance_s2",
  "relance_s3",
  "relance_s4",
  "relance_s5",
  "relance_s6",
  "relance_s7",
  "relance_3d",
  "relance_30d",
  "relance_24h",
  "relance_j0",
  "confirmation",
  "registered_reminder_30d",
  "registered_reminder_14d",
  "registered_reminder_7d",
  "registered_reminder_3d",
  "registered_reminder_1d",
  "registered_reminder_morning",
  "registered_replay",
  "nonregistered_replay"
];

export type WebinarAvocatsContact = {
  prenom?: string;
  nom?: string;
  email: string;
  barreau?: string;
  cabinet?: string;
  registrationUrl?: string;
  unsubscribeUrl?: string;
  audienceLabel?: string;
  recipientRegionLabel?: string;
  campaignSource?: string;
};

export type WebinarAvocatsEmail = {
  subject: string;
  previewText: string;
  html: string;
  text?: string;
};

const SITE_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://gp-finances.fr").replace(/\/+$/, "");
const COMPANY_WEBSITE_URL = `${SITE_BASE_URL}/per`;
const COMPANY_BROCHURE_URL = `${SITE_BASE_URL}/plaquettes/plaquette-gp-finances.pdf`;

export const getWebinarAvocatsRegistrationUrl = (baseUrl = SITE_BASE_URL) =>
  `${baseUrl.replace(/\/+$/, "")}${WEBINAR_AVOCATS.registrationPath}`;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatName = (contact: Partial<WebinarAvocatsContact>) => {
  return "Maître";
};

const buildTrackedUrl = ({
  baseUrl,
  event,
  target,
  contact,
  source
}: {
  baseUrl: string;
  event: "questionnaire" | "plaquette" | "site";
  target: string;
  contact: WebinarAvocatsContact;
  source: string;
}) => {
  // Brevo tracks this final wave. Direct links avoid extra Sheets writes
  // competing with registration and unsubscribe checks during the send.
  if (source.startsWith("webinaire-per-avocats-j0-noninscrits-")) return target;

  const token = createWebinarTrackingToken(contact.email);
  if (!token) return target;

  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/api/webinar-avocats/track`);
  url.searchParams.set("event", event);
  url.searchParams.set("email", contact.email);
  url.searchParams.set("token", token);
  url.searchParams.set("target", target);
  url.searchParams.set("source", source);
  if (contact.prenom) url.searchParams.set("prenom", contact.prenom);
  if (contact.nom) url.searchParams.set("nom", contact.nom);
  return url.toString();
};

const cta = (label: string, href: string) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border-collapse:collapse;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr>
            <td align="center" bgcolor="#1A3C5C" style="padding:14px 24px;border:1px solid #143047;">
              <a href="${escapeHtml(href)}" target="_blank" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;font-family:Arial,sans-serif;">
                ${escapeHtml(label)}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const infoGrid = () => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fbff" style="margin:20px 0;border-collapse:collapse;">
    <tr>
      <td style="padding:16px;border-bottom:1px solid #d9e2f2;">
        <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;">Date</p>
        <p style="margin:4px 0 0;font-size:15px;color:#0f172a;font-weight:700;">${WEBINAR_AVOCATS.dateLabel}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px;border-bottom:1px solid #d9e2f2;">
        <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;">Horaire</p>
        <p style="margin:4px 0 0;font-size:15px;color:#0f172a;font-weight:700;">${WEBINAR_AVOCATS.timeLabel}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px;border-bottom:1px solid #d9e2f2;">
        <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;">Format</p>
        <p style="margin:4px 0 0;font-size:15px;color:#0f172a;font-weight:700;">${WEBINAR_AVOCATS.durationLabel}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px;">
        <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;">En visioconférence</p>
        <p style="margin:4px 0 0;font-size:15px;color:#0f172a;font-weight:700;">Participation gratuite sur inscription. Replay envoyé aux inscrits.</p>
      </td>
    </tr>
  </table>
`;

const programBlock = () => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="margin:20px 0;border-collapse:collapse;">
    <tr>
      <td style="padding:16px;font-family:Arial,sans-serif;">
        <p style="margin:0 0 10px;font-size:15px;color:#0f172a;font-weight:bold;">En 60 minutes, nous verrons ensemble :</p>
        <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#334155;">• Les principales solutions permettant de réduire votre imposition.</p>
        <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#334155;">• Pourquoi et dans quelles situations le PER peut être pertinent.</p>
        <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#334155;">• Comment calculer votre économie d'impôt et votre plafond disponible.</p>
        <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#334155;">• Comment déterminer le montant adapté à votre situation.</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">• Quels frais, conditions et règles fiscales vérifier avant de verser.</p>
      </td>
    </tr>
  </table>
`;

const lawyerExampleBlock = () => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fbff" style="margin:20px 0;border-collapse:collapse;">
    <tr>
      <td style="padding:16px;font-family:Arial,sans-serif;">
        <p style="margin:0 0 8px;font-size:13px;color:#1A3C5C;font-weight:bold;text-transform:uppercase;">Exemple simplifié</p>
        <p style="margin:0 0 10px;font-size:15px;color:#0f172a;font-weight:bold;">Avocat libéral imposé à 30 %</p>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#334155;">
          Un avocat dispose d'un plafond de déduction suffisant et envisage de verser <strong>10 000 €</strong> sur son PER avant la fin de l'année.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:10px 0;">
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#475569;border-bottom:1px solid #d9e2f2;">Versement PER</td>
            <td align="right" style="padding:8px 0;font-size:14px;color:#0f172a;font-weight:bold;border-bottom:1px solid #d9e2f2;">10 000 €</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#475569;border-bottom:1px solid #d9e2f2;">Tranche marginale d'imposition</td>
            <td align="right" style="padding:8px 0;font-size:14px;color:#0f172a;font-weight:bold;border-bottom:1px solid #d9e2f2;">30 %</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#475569;">Économie d'impôt indicative</td>
            <td align="right" style="padding:8px 0;font-size:14px;color:#166534;font-weight:bold;">3 000 €</td>
          </tr>
        </table>
        <p style="margin:10px 0 0;font-size:12px;line-height:1.55;color:#64748b;">
          Exemple volontairement simplifié : le résultat réel dépend du revenu imposable, du plafond disponible, de la situation familiale,
          des frais du contrat et de l'horizon de retraite.
        </p>
      </td>
    </tr>
  </table>
`;

const speakerBlock = () => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fffaf0" style="margin:20px 0;border-left:4px solid #C8A86B;border-collapse:collapse;">
    <tr>
      <td style="padding:14px 16px;font-family:Arial,sans-serif;">
        <p style="margin:0 0 6px;font-size:14px;color:#1A3C5C;font-weight:bold;">Intervenant</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">
          <strong>Gabriel PERBOST</strong>, gérant de GP Finances, accompagne des particuliers et professionnels sur l'optimisation
          fiscale, la préparation retraite et la structuration de solutions PER.
        </p>
      </td>
    </tr>
  </table>
`;

const meetingCta = () => `
  ${cta("Accéder au webinaire", WEBINAR_AVOCATS_MEETING_URL)}
  <div style="margin:18px 0;padding:18px;background:#f8fbff;font-size:14px;line-height:1.7;">
    <p style="margin:0 0 10px;"><strong>Si le bouton ne fonctionne pas, utilisez les informations ci-dessous :</strong></p>
    <p style="margin:0 0 10px;">Gabriel Perbost vous invite à une réunion Zoom programmée.<br />
      <strong>Sujet :</strong> Webinaire – PER et optimisation fiscale – Spécial avocats<br />
      <strong>Heure :</strong> 17 septembre 2026 à 18h00 (heure de Paris)</p>
    <p style="margin:0 0 10px;"><strong>Participer à la réunion Zoom :</strong><br />
      <a href="${escapeHtml(WEBINAR_AVOCATS_MEETING_URL)}" style="color:#1A3C5C;word-break:break-all;">${escapeHtml(WEBINAR_AVOCATS_MEETING_URL)}</a></p>
    <p style="margin:0;"><strong>ID de réunion :</strong> 836 5620 5859<br />
      <strong>Code secret :</strong> 1709</p>
  </div>
`;

const calendarLinksBlock = (baseUrl = SITE_BASE_URL) => {
  const links = getWebinarAvocatsCalendarLinks(baseUrl);

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;border-collapse:collapse;">
      <tr>
        <td align="center">
          <table width="430" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fbff" style="width:430px;max-width:430px;border-collapse:collapse;">
            <tr>
              <td align="center" style="padding:18px;font-family:Arial,sans-serif;text-align:center;">
                <p style="margin:0 0 8px;font-size:15px;color:#1A3C5C;font-weight:bold;">Ajouter le webinaire à votre agenda</p>
                <p style="margin:0 0 14px;font-size:13px;line-height:1.55;color:#475569;">
                  Le fichier agenda inclut les rappels la veille, 1 heure avant et au début du webinaire.
                </p>
                <table align="center" width="280" cellpadding="0" cellspacing="0" border="0" style="width:280px;margin:0 auto;border-collapse:collapse;">
                  <tr>
                    <td align="center" width="280" bgcolor="#1A3C5C" style="width:280px;padding:10px 14px;border:1px solid #143047;text-align:center;">
                      <a href="${escapeHtml(links.ics)}" target="_blank" style="color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;font-family:Arial,sans-serif;">
                        Fichier agenda avec rappels
                      </a>
                    </td>
                  </tr>
                </table>
                <table align="center" width="280" cellpadding="0" cellspacing="0" border="0" style="width:280px;margin:8px auto 0;border-collapse:collapse;">
                  <tr>
                    <td align="center" width="280" bgcolor="#ffffff" style="width:280px;padding:10px 14px;border:1px solid #1A3C5C;text-align:center;">
                      <a href="${escapeHtml(links.google)}" target="_blank" style="color:#1A3C5C;text-decoration:none;font-size:13px;font-weight:bold;font-family:Arial,sans-serif;">
                        Google Agenda
                      </a>
                    </td>
                  </tr>
                </table>
                <table align="center" width="280" cellpadding="0" cellspacing="0" border="0" style="width:280px;margin:8px auto 0;border-collapse:collapse;">
                  <tr>
                    <td align="center" width="280" bgcolor="#ffffff" style="width:280px;padding:10px 14px;border:1px solid #1A3C5C;text-align:center;">
                      <a href="${escapeHtml(links.outlook)}" target="_blank" style="color:#1A3C5C;text-decoration:none;font-size:13px;font-weight:bold;font-family:Arial,sans-serif;">
                        Outlook
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:12px 0 0;font-size:11px;line-height:1.45;color:#64748b;">
                  Google Agenda peut afficher son rappel par défaut à 10 minutes. Pour conserver les 3 rappels, utilisez le fichier agenda.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
};

const companyLinksBlock = ({
  websiteUrl,
  brochureUrl
}: {
  websiteUrl: string;
  brochureUrl: string;
}) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border-collapse:collapse;">
    <tr>
      <td align="center">
        <table width="430" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fbff" style="width:430px;max-width:430px;border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:18px 18px 20px;font-family:Arial,sans-serif;text-align:center;">
              <p style="margin:0 0 8px;font-size:15px;color:#1A3C5C;font-weight:bold;">En savoir plus sur GP Finances</p>
              <p style="margin:0 0 16px;font-size:13px;line-height:1.55;color:#475569;">
                Découvrez mon accompagnement PER et téléchargez la plaquette de présentation.
              </p>
              <table align="center" width="280" cellpadding="0" cellspacing="0" border="0" style="width:280px;margin:0 auto;border-collapse:collapse;">
                <tr>
                  <td align="center" width="280" bgcolor="#1A3C5C" style="width:280px;padding:10px 14px;border:1px solid #143047;text-align:center;">
                    <a href="${escapeHtml(websiteUrl)}" target="_blank" style="color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;font-family:Arial,sans-serif;">
                      Notre site
                    </a>
                  </td>
                </tr>
              </table>
              <table align="center" width="280" cellpadding="0" cellspacing="0" border="0" style="width:280px;margin:8px auto 0;border-collapse:collapse;">
                <tr>
                  <td align="center" width="280" bgcolor="#ffffff" style="width:280px;padding:10px 14px;border:1px solid #1A3C5C;text-align:center;">
                    <a href="${escapeHtml(brochureUrl)}" target="_blank" style="color:#1A3C5C;text-decoration:none;font-size:13px;font-weight:bold;font-family:Arial,sans-serif;">
                      Télécharger la plaquette
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const wrapEmail = ({
  title,
  previewText,
  body,
  contact,
  includeUnsubscribe = true,
  companyWebsiteUrl = COMPANY_WEBSITE_URL,
  companyBrochureUrl = COMPANY_BROCHURE_URL
}: {
  title: string;
  previewText: string;
  body: string;
  contact: Partial<WebinarAvocatsContact>;
  includeUnsubscribe?: boolean;
  companyWebsiteUrl?: string;
  companyBrochureUrl?: string;
}) => {
  const unsubscribeUrl = contact.unsubscribeUrl || "#";
  const audienceLabel = contact.audienceLabel || WEBINAR_AVOCATS.audience;
  const recipientRegionLabel = contact.recipientRegionLabel || "à un barreau français";
  const campaignSource = contact.campaignSource || "webinaire-per-avocats";
  const trackedCompanyWebsiteUrl = contact.email
    ? buildTrackedUrl({
        baseUrl: SITE_BASE_URL,
        event: "site",
        target: companyWebsiteUrl,
        contact: contact as WebinarAvocatsContact,
        source: `${campaignSource}-site`
      })
    : companyWebsiteUrl;
  const trackedCompanyBrochureUrl = contact.email
    ? buildTrackedUrl({
        baseUrl: SITE_BASE_URL,
        event: "plaquette",
        target: companyBrochureUrl,
        contact: contact as WebinarAvocatsContact,
        source: `${campaignSource}-plaquette`
      })
    : companyBrochureUrl;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#eef3fb;font-family:Arial,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(previewText)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef3fb" style="border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:28px 14px;">
        <table width="640" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:640px;max-width:640px;border-collapse:collapse;">
          <tr>
            <td bgcolor="#1A3C5C" style="padding:22px 26px;color:#ffffff;font-family:Arial,sans-serif;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold;color:#EAD7A0;">GP Finances · PER avocats</p>
              <h1 style="margin:0;font-size:24px;line-height:1.25;color:#ffffff;font-weight:bold;">${escapeHtml(title)}</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.55;color:#EAF2FF;">${escapeHtml(audienceLabel)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:26px;font-size:15px;line-height:1.7;color:#1f2937;">
              ${body}
              ${companyLinksBlock({ websiteUrl: trackedCompanyWebsiteUrl, brochureUrl: trackedCompanyBrochureUrl })}
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;padding-top:18px;border-top:1px solid #e2e8f0;">
                <tr>
                  <td style="font-size:13px;color:#475569;line-height:1.55;">
                    <strong style="color:#0f172a;">Gabriel PERBOST</strong><br>
                    Gérant de GP Finances<br>
                    ${escapeHtml(LEGAL.company)} · ${escapeHtml(LEGAL.orias)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 26px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;line-height:1.5;color:#64748b;text-align:center;">
              Vous recevez cet email car votre adresse professionnelle apparaît dans une base de contacts d'avocats inscrits ${escapeHtml(recipientRegionLabel)}.
              ${includeUnsubscribe ? `&nbsp;·&nbsp;<a href="${escapeHtml(unsubscribeUrl)}" style="color:#475569;text-decoration:underline;">Se désinscrire</a>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const buildWebinarAvocatsEmail = ({
  template,
  contact,
  baseUrl = SITE_BASE_URL
}: {
  template: WebinarAvocatsEmailTemplate;
  contact: WebinarAvocatsContact;
  baseUrl?: string;
}): WebinarAvocatsEmail => {
  if (template === "nonregistered_replay") {
    return buildWebinarAvocatsReplayNonregistered(contact.unsubscribeUrl || "");
  }
  if (template === "registered_replay") {
    return buildWebinarAvocatsReplay(contact.unsubscribeUrl || "");
  }
  const rawRegistrationUrl = contact.registrationUrl || getWebinarAvocatsRegistrationUrl(baseUrl);
  const campaignSource = contact.campaignSource || "webinaire-per-avocats";
  const registrationUrl = buildTrackedUrl({
    baseUrl,
    event: "questionnaire",
    target: rawRegistrationUrl,
    contact,
    source: `${campaignSource}-${template}`
  });
  const prenom = formatName(contact);
  const recipientRegionLabel = contact.recipientRegionLabel || "à un barreau français";

  const registeredReminder = ({
    subject,
    title,
    previewText,
    intro,
    includeMeetingLink = false
  }: {
    subject: string;
    title: string;
    previewText: string;
    intro: string;
    includeMeetingLink?: boolean;
  }): WebinarAvocatsEmail => ({
    subject,
    previewText,
    html: wrapEmail({
      title,
      previewText,
      contact,
      includeUnsubscribe: false,
      body: `
        <p style="margin:0 0 14px;">Bonjour ${escapeHtml(prenom)},</p>
        <p style="margin:0 0 14px;">${intro}</p>
        ${infoGrid()}
        <p style="margin:0 0 14px;">
          Pour préparer au mieux la session, gardez à portée de main votre dernier avis d'imposition si vous souhaitez vérifier
          votre plafond de déduction PER ou demander une simulation personnalisée après le webinaire.
        </p>
        ${includeMeetingLink ? meetingCta() : ""}
        ${calendarLinksBlock(baseUrl)}
        <p style="margin:0;">À bientôt,</p>
      `
    })
  });

  if (template === "confirmation") {
    const previewText = "Votre inscription au webinaire PER pour avocats est confirmée.";
    return {
      subject: "Confirmation - Webinaire PER pour avocats",
      previewText,
      html: wrapEmail({
        title: "Votre inscription est confirmée",
        previewText,
        contact,
        includeUnsubscribe: false,
        body: `
          <p style="margin:0 0 14px;">Bonjour ${escapeHtml(prenom)},</p>
          <p style="margin:0 0 14px;">Votre inscription au webinaire PER dédié aux avocats est bien enregistrée.</p>
          ${calendarLinksBlock(baseUrl)}
          ${infoGrid()}
          ${programBlock()}
          ${meetingCta()}
          <p style="margin:0;">À bientôt,</p>
        `
      })
    };
  }

  if (template === "registered_reminder_30d") {
    return registeredReminder({
      subject: "Webinaire PER avocats - rendez-vous le 17 septembre",
      title: "Votre webinaire PER approche",
      previewText: "Rappel à 30 jours : votre place est réservée pour le webinaire PER avocats.",
      intro: "Votre inscription au webinaire PER pour avocats du jeudi 17 septembre est bien prise en compte. Je vous enverrai les informations pratiques avant la session."
    });
  }

  if (template === "registered_reminder_14d") {
    return registeredReminder({
      subject: "Dans 2 semaines - Webinaire PER pour avocats",
      title: "Webinaire PER avocats : rappel à 2 semaines",
      previewText: "Le webinaire PER pour avocats aura lieu dans deux semaines.",
      intro: "Le webinaire aura lieu dans deux semaines. Nous verrons comment identifier les leviers fiscaux adaptés et comment raisonner concrètement sur le PER."
    });
  }

  if (template === "registered_reminder_7d") {
    return registeredReminder({
      subject: "Dans 1 semaine - Webinaire fiscalité et PER",
      title: "Rappel : webinaire dans une semaine",
      previewText: "Votre webinaire fiscalité et PER pour avocats a lieu dans une semaine.",
      intro: "Le webinaire aura lieu dans une semaine. Ce rappel vous permet de bloquer le créneau dans votre agenda."
    });
  }

  if (template === "registered_reminder_3d") {
    return registeredReminder({
      subject: "J-3 - Webinaire PER pour avocats",
      title: "J-3 avant le webinaire PER",
      previewText: "Plus que trois jours avant le webinaire PER pour avocats.",
      intro: "Le webinaire a lieu dans trois jours. Nous aborderons les points de vigilance avant tout versement PER et les méthodes de calcul utiles."
    });
  }

  if (template === "registered_reminder_1d") {
    return registeredReminder({
      subject: "Demain 18h - Webinaire PER pour avocats",
      title: "Votre webinaire a lieu demain",
      previewText: "Rappel : le webinaire PER pour avocats a lieu demain à 18h.",
      intro: "Le webinaire a lieu demain de 18h à 19h. Le lien de connexion Zoom figure ci-dessous.",
      includeMeetingLink: true
    });
  }

  if (template === "registered_reminder_morning") {
    return registeredReminder({
      subject: "Aujourd'hui 18h - Webinaire PER pour avocats",
      title: "Webinaire aujourd'hui à 18h",
      previewText: "Votre webinaire PER pour avocats a lieu aujourd'hui à 18h.",
      intro: "Le webinaire a lieu aujourd'hui à 18h. Vous trouverez les informations pratiques ci-dessous.",
      includeMeetingLink: true
    });
  }

  if (template === "relance_s1") {
    const previewText = "Premier rappel : les solutions fiscales utiles ne sont pas toujours celles que l'on imagine.";
    return {
      subject: "Avocats : payez-vous trop d'impôts ?",
      previewText,
      html: wrapEmail({
        title: "Avocats : payez-vous trop d'impôts ?",
        previewText,
        contact,
        body: `
          <p style="margin:0 0 14px;">Bonjour ${escapeHtml(prenom)},</p>
          <p style="margin:0 0 14px;">
            Je vous renvoie l'invitation au webinaire gratuit que j'organise pour les avocats inscrits ${escapeHtml(recipientRegionLabel)}.
          </p>
          <p style="margin:0 0 14px;">
            L'idée est de repartir des leviers concrets : réduction du revenu imposable, préparation retraite, plafond de
            déduction disponible et points de vigilance avant de verser.
          </p>
          ${infoGrid()}
          ${cta("Réserver ma place", registrationUrl)}
          <p style="margin:0;font-size:13px;color:#64748b;">${escapeHtml(WEBINAR_AVOCATS.defaultReplayPolicy)}</p>
        `
      })
    };
  }

  if (template === "relance_30d") {
    const previewText = "J-30 : il reste environ un mois pour vous inscrire au webinaire PER dédié aux avocats.";
    return {
      subject: "J-30 - Webinaire PER pour avocats",
      previewText,
      html: wrapEmail({
        title: "J-30 avant le webinaire PER pour avocats",
        previewText,
        contact,
        body: `
          <p style="margin:0 0 14px;">Bonjour ${escapeHtml(prenom)},</p>
          <p style="margin:0 0 14px;">
            À environ un mois du webinaire, je me permets de vous renvoyer l'invitation.
          </p>
          <p style="margin:0 0 14px;">
            L'objectif est simple : vous donner une méthode claire pour savoir si le PER peut être réellement pertinent
            dans votre situation, comment estimer une économie d'impôt et quels points vérifier avant tout versement.
          </p>
          ${infoGrid()}
          ${lawyerExampleBlock()}
          <p style="margin:0 0 14px;">
            La participation est gratuite sur inscription. Un replay sera envoyé aux personnes inscrites.
          </p>
          ${cta("Je m'inscris gratuitement au webinaire", registrationUrl)}
        `
      })
    };
  }

  if (template === "relance_s2") {
    const previewText = "Le PER peut être intéressant, mais uniquement si les chiffres sont cohérents.";
    return {
      subject: "PER avocat : dans quels cas est-ce vraiment pertinent ?",
      previewText,
      html: wrapEmail({
        title: "Le PER n'est pas adapté à tout le monde",
        previewText,
        contact,
        body: `
          <p style="margin:0 0 14px;">Bonjour ${escapeHtml(prenom)},</p>
          <p style="margin:0 0 14px;">
            Le PER est souvent présenté comme une solution évidente pour réduire l'impôt. En pratique, il faut vérifier plusieurs éléments.
          </p>
          <p style="margin:0 0 14px;">
            Votre tranche marginale d'imposition, votre plafond disponible, votre effort d'épargne, votre horizon de retraite et les
            frais du contrat changent fortement l'intérêt réel de l'opération.
          </p>
          <p style="margin:0 0 14px;">
            C'est précisément ce que nous verrons pendant le webinaire, avec une méthode de calcul simple.
          </p>
          ${cta("M'inscrire au webinaire", registrationUrl)}
        `
      })
    };
  }

  if (template === "relance_s3") {
    const previewText = "Un exemple chiffré pour comprendre l'impact fiscal possible d'un versement PER.";
    return {
      subject: "Exemple : un avocat verse 10 000 € sur son PER",
      previewText,
      html: wrapEmail({
        title: "Exemple chiffré : avocat libéral et PER",
        previewText,
        contact,
        body: `
          <p style="margin:0 0 14px;">Bonjour ${escapeHtml(prenom)},</p>
          <p style="margin:0 0 14px;">
            Pour rendre le sujet plus concret, voici un exemple volontairement simplifié que nous reprendrons pendant le webinaire.
          </p>
          ${lawyerExampleBlock()}
          <p style="margin:0 0 14px;">
            L'objectif du webinaire est justement de vous donner les bons réflexes pour ne pas raisonner uniquement sur l'économie
            d'impôt, mais sur l'intérêt global de l'opération.
          </p>
          ${cta("Voir les exemples pendant le webinaire", registrationUrl)}
        `
      })
    };
  }

  if (template === "relance_s4") {
    const previewText = "Le plafond de déduction est l'un des points clés avant tout versement PER.";
    return {
      subject: "Avez-vous vérifié votre plafond PER disponible ?",
      previewText,
      html: wrapEmail({
        title: "Le plafond disponible change tout",
        previewText,
        contact,
        body: `
          <p style="margin:0 0 14px;">Bonjour ${escapeHtml(prenom)},</p>
          <p style="margin:0 0 14px;">
            Avant de décider d'un versement PER, il faut vérifier votre plafond de déduction disponible.
          </p>
          <p style="margin:0 0 14px;">
            Ce plafond figure sur votre avis d'imposition. Il permet de savoir jusqu'où un versement peut réduire votre revenu
            imposable, sans faire d'hypothèse approximative.
          </p>
          <p style="margin:0 0 14px;">
            Pendant le webinaire, je montrerai comment lire cette information et comment l'utiliser pour estimer un versement cohérent.
          </p>
          ${cta("Réserver ma place", registrationUrl)}
        `
      })
    };
  }

  if (template === "relance_s5") {
    const previewText = "L'erreur fréquente : regarder uniquement l'économie d'impôt, sans vérifier les frais et la sortie.";
    return {
      subject: "PER : l'erreur à éviter avant de verser",
      previewText,
      html: wrapEmail({
        title: "Ne regardez pas seulement l'économie d'impôt",
        previewText,
        contact,
        body: `
          <p style="margin:0 0 14px;">Bonjour ${escapeHtml(prenom)},</p>
          <p style="margin:0 0 14px;">
            Un versement PER peut réduire l'impôt, mais ce n'est pas le seul critère à regarder.
          </p>
          <p style="margin:0 0 14px;">
            Les frais d'entrée, les frais de gestion, les supports disponibles, les règles de sortie et votre horizon de placement
            doivent aussi être analysés.
          </p>
          <p style="margin:0 0 14px;">
            Le webinaire a pour but de vous donner une grille de lecture claire avant toute décision.
          </p>
          ${cta("M'inscrire gratuitement", registrationUrl)}
        `
      })
    };
  }

  if (template === "relance_s6") {
    const previewText = "Plus la fin d'année approche, plus il faut anticiper les versements et les délais.";
    return {
      subject: "Impôt 2026 : pourquoi anticiper avant la fin d'année ?",
      previewText,
      html: wrapEmail({
        title: "Anticiper évite les décisions de dernière minute",
        previewText,
        contact,
        body: `
          <p style="margin:0 0 14px;">Bonjour ${escapeHtml(prenom)},</p>
          <p style="margin:0 0 14px;">
            Les décisions fiscales efficaces se préparent rarement dans l'urgence.
          </p>
          <p style="margin:0 0 14px;">
            Si un versement PER est pertinent, il faut avoir le temps de vérifier le plafond disponible, choisir le bon niveau de
            versement, analyser les frais et mettre en place le contrat si nécessaire.
          </p>
          <p style="margin:0 0 14px;">
            Le webinaire du 17 septembre permet d'avoir cette méthode suffisamment tôt avant la fin de l'année.
          </p>
          ${cta("Réserver ma place pour le 17 septembre", registrationUrl)}
        `
      })
    };
  }

  if (template === "relance_s7" || template === "relance_3d") {
    const countdown = template === "relance_3d" ? "J-3" : "J-7";
    const previewText = `${countdown} : le webinaire PER pour avocats a lieu jeudi 17 septembre à 18h.`;
    return {
      subject: `${countdown} / Webinaire fiscalité PER pour avocats`,
      previewText,
      html: wrapEmail({
        title: `${countdown} pour vous inscrire`,
        previewText,
        contact,
        body: `
          <p style="margin:0 0 14px;">Bonjour ${escapeHtml(prenom)},</p>
          <p style="margin:0 0 14px;">
            Le webinaire consacré aux leviers d'optimisation fiscale des avocats et au PER aura lieu jeudi 17 septembre de 18h à 19h.
          </p>
          <p style="margin:0 0 14px;">
            Nous verrons comment identifier les solutions pertinentes, calculer une économie d'impôt indicative et vérifier les
            points importants avant un versement.
          </p>
          ${infoGrid()}
          ${cta("Je m'inscris avant le webinaire", registrationUrl)}
        `
      })
    };
  }

  if (template === "relance_24h" || template === "relance_j0") {
    const isTonight = template === "relance_j0";
    const previewText = isTonight
      ? "Ce soir à 18h : webinaire gratuit fiscalité et PER pour avocats. Inscription encore ouverte, replay envoyé aux inscrits."
      : "Demain à 18h : webinaire gratuit fiscalité et PER pour avocats. Inscription encore ouverte, replay envoyé aux inscrits.";
    return {
      subject: isTonight
        ? "Ce soir à 18h : PER & optimisation fiscale – spécial avocats"
        : "J-1 / Webinaire fiscalité PER pour avocats",
      previewText,
      html: wrapEmail({
        title: isTonight ? "Ce soir à 18h : PER & optimisation fiscale" : "J-1 pour vous inscrire",
        previewText,
        contact: isTonight ? { ...contact, audienceLabel: "Spécial avocat" } : contact,
        body: `
          <p style="margin:0 0 14px;">Bonjour ${escapeHtml(prenom)},</p>
          <p style="margin:0 0 14px;">
            Le webinaire consacré aux leviers d'optimisation fiscale des avocats et au PER a lieu <strong>${isTonight ? "ce soir" : "demain"}, jeudi 17 septembre 2026, de 18h à 19h (heure de Paris)</strong>.
          </p>
          <p style="margin:0 0 14px;">
            Nous verrons comment identifier les solutions pertinentes pour votre situation, estimer une économie d'impôt
            indicative et vérifier les plafonds, les frais et les conditions avant un versement sur un PER.
          </p>
          ${infoGrid()}
          <p style="margin:0 0 14px;">
            Vous pouvez encore vous inscrire gratuitement. Si vous n'êtes pas disponible en direct, un replay sera envoyé aux personnes inscrites.
          </p>
          <p style="margin:0;">Au plaisir de vous retrouver ${isTonight ? "ce soir" : "demain"},</p>
          ${cta("Je m'inscris gratuitement au webinaire", registrationUrl)}
        `
      })
    };
  }

  const previewText = `Un webinaire réservé aux avocats inscrits ${recipientRegionLabel} pour réduire votre impôt 2026 et préparer votre retraite.`;
  return {
    subject: "Avocats : comment réduire votre impôt 2026 tout en préparant votre retraite ?",
    previewText,
    html: wrapEmail({
      title: "Avocats : comment réduire votre impôt 2026 tout en préparant votre retraite ?",
      previewText,
      contact,
      body: `
        <p style="margin:0 0 14px;">Bonjour ${escapeHtml(prenom)},</p>
        <p style="margin:0 0 14px;">
          En tant qu'avocat, payez-vous trop d'impôts ?
        </p>
        <p style="margin:0 0 14px;">
          Plusieurs solutions peuvent réduire votre imposition, mais toutes ne sont pas adaptées à votre situation.
        </p>
        <p style="margin:0 0 14px;">
          J'organise un webinaire gratuit d'une heure pour présenter les principaux leviers accessibles aux avocats, puis
          approfondir le Plan d'Épargne Retraite à partir d'exemples concrets.
        </p>
        <p style="margin:0 0 14px;">
          J'ai commencé par accompagner des avocats de mon entourage sur ces questions. Aujourd'hui, j'accompagne régulièrement
          des membres de la profession dans l'optimisation de leur fiscalité et la préparation de leur retraite.
        </p>
        ${infoGrid()}
        ${programBlock()}
        ${speakerBlock()}
        <p style="margin:0 0 14px;">
          Le nombre de participants étant limité afin de conserver un véritable temps d'échange à la fin de la présentation,
          je vous invite à réserver votre place dès maintenant.
        </p>
        ${cta("Je m'inscris gratuitement au webinaire", registrationUrl)}
        <p style="margin:0 0 14px;">
          À l'issue du webinaire, les participants qui le souhaitent pourront également demander une
          <strong> simulation fiscale personnalisée</strong>, sans engagement.
        </p>
        <p style="margin:0;font-size:13px;color:#64748b;">${escapeHtml(WEBINAR_AVOCATS.defaultReplayPolicy)}</p>
      `
    })
  };
};

import { WEBINAR_PER, getWebinarPerRegistrationUrl } from "@/lib/webinarPerConfig";
import { getWebinarPerCalendarLinks } from "@/lib/webinarPerCalendar";

export type WebinarPerEmailTemplate = "confirmation" | "reminder_7d" | "reminder_3d" | "reminder_1d" | "reminder_morning" | "replay";

export type WebinarPerContact = { prenom: string; email: string };
export type WebinarPerEmail = { subject: string; html: string; text: string };

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

const firstName = (contact: WebinarPerContact) => escapeHtml(contact.prenom.trim() || "Bonjour");

const shell = ({ title, contact, contentHtml, unsubscribeUrl }: { title: string; contact: WebinarPerContact; contentHtml: string; unsubscribeUrl: string }) => `
<div style="background:#f5f8ff;padding:26px 14px;">
  <div style="max-width:640px;margin:0 auto;">
    <div style="background:linear-gradient(180deg,#eef4ff 0%, #f5f8ff 100%);border-radius:18px;padding:14px;">
      <div style="background:#ffffff;border:1px solid #e7eefb;border-radius:16px;overflow:hidden;">
        <div style="padding:18px 18px 14px 18px;border-bottom:1px solid #edf2ff;">
          <div style="font-family:Arial,sans-serif;color:#0b1220;font-weight:800;font-size:16px;">GP Finances</div>
          <div style="font-family:Arial,sans-serif;color:#4b5563;font-size:13px;margin-top:4px;">Courtier indépendant · Webinaire PER</div>
        </div>
        <div style="padding:18px;">
          <div style="font-family:Arial,sans-serif;font-size:18px;font-weight:900;color:#0b1220;margin:0 0 10px;">${title}</div>
          <div style="font-family:Arial,sans-serif;font-size:14px;color:#334155;line-height:1.6;">
            <p style="margin:0 0 12px;">Bonjour ${firstName(contact)},</p>
            ${contentHtml}
          </div>
          <div style="margin-top:20px;border-top:1px solid #edf2ff;padding-top:14px;">
            <div style="font-family:Arial,sans-serif;color:#64748b;font-size:11px;line-height:1.5;">
              GP Finances · Gabriel Perbost, courtier indépendant, ORIAS 23003789. Cet e-mail n'est ni un conseil personnalisé ni une offre de produit : le PER doit être étudié au regard de votre situation.
              <br>Vous recevez cet e-mail parce que vous vous êtes inscrit(e) au webinaire du ${WEBINAR_PER.dateLabel}.
              <a href="${unsubscribeUrl}" style="color:#64748b;">Se désinscrire</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`;

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#0d1f3c;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;font-size:14px;padding:13px 22px;border-radius:10px;margin:6px 8px 0 0;">${label}</a>`;

export const buildWebinarPerEmail = (
  template: WebinarPerEmailTemplate,
  contact: WebinarPerContact,
  { unsubscribeUrl, replayUrl }: { unsubscribeUrl: string; replayUrl?: string }
): WebinarPerEmail => {
  const calendar = getWebinarPerCalendarLinks();
  const registrationUrl = getWebinarPerRegistrationUrl();
  const dateTime = `${WEBINAR_PER.dateLabel}, ${WEBINAR_PER.timeLabel}`;

  const meetingBlock = `
    <div style="background:#f1f6ff;border:1px solid #dbeafe;border-radius:14px;padding:14px;margin:14px 0;">
      <div style="font-weight:900;color:#1A3C5C;margin-bottom:6px;">${dateTime}</div>
      <div style="color:#0f172a;">${WEBINAR_PER.durationLabel}</div>
      <div style="margin-top:12px;">
        ${button(WEBINAR_PER.meetingUrl, "Rejoindre le webinaire")}
        ${button(calendar.google, "Ajouter à Google Agenda")}
        ${button(calendar.ics, "Télécharger le .ics")}
      </div>
    </div>`;

  switch (template) {
    case "confirmation":
      return {
        subject: "Inscription confirmée : Webinaire PER, " + WEBINAR_PER.dateLabel,
        text: `Votre inscription au webinaire PER du ${dateTime} est confirmée. Lien : ${WEBINAR_PER.meetingUrl}`,
        html: shell({
          title: "Votre inscription est confirmée",
          contact,
          unsubscribeUrl,
          contentHtml: `
            <p style="margin:0 0 12px;">C'est noté : vous êtes inscrit(e) au webinaire <b>« ${escapeHtml(WEBINAR_PER.title)} »</b>.</p>
            ${meetingBlock}
            <p style="margin:14px 0 0;">Au programme : comprendre le PER, calculer votre économie d'impôt potentielle et éviter les erreurs les plus fréquentes. Vous pourrez poser vos questions en direct.</p>
            <p style="margin:12px 0 0;">À dimanche !<br>Gabriel Perbost</p>`
        })
      };
    case "reminder_7d":
      return {
        subject: "J-7 : votre webinaire PER approche",
        text: `Plus qu'une semaine avant le webinaire PER du ${dateTime}.`,
        html: shell({
          title: "Plus qu'une semaine avant le webinaire",
          contact,
          unsubscribeUrl,
          contentHtml: `
            <p style="margin:0 0 12px;">Rendez-vous dans une semaine pour parler retraite et fiscalité. Une question à laquelle vous aimeriez que je réponde pendant le webinaire ? Répondez simplement à cet e-mail.</p>
            ${meetingBlock}`
        })
      };
    case "reminder_3d":
      return {
        subject: "J-3 : webinaire PER dimanche prochain",
        text: `Le webinaire PER a lieu dans 3 jours, ${dateTime}.`,
        html: shell({
          title: "Dans 3 jours",
          contact,
          unsubscribeUrl,
          contentHtml: `
            <p style="margin:0 0 12px;">Le webinaire PER approche. Gardez ce créneau : ${dateTime}.</p>
            ${meetingBlock}`
        })
      };
    case "reminder_1d":
      return {
        subject: "C'est demain : votre webinaire PER",
        text: `Le webinaire PER a lieu demain, ${dateTime}. Lien : ${WEBINAR_PER.meetingUrl}`,
        html: shell({
          title: "C'est demain !",
          contact,
          unsubscribeUrl,
          contentHtml: `
            <p style="margin:0 0 12px;">Dernier rappel avant demain, ${WEBINAR_PER.timeLabel}. Gardez ce lien sous la main :</p>
            ${meetingBlock}`
        })
      };
    case "reminder_morning":
      return {
        subject: "Aujourd'hui à " + WEBINAR_PER.timeLabel.split(" ")[0] + " : votre webinaire PER",
        text: `Le webinaire PER a lieu aujourd'hui à ${WEBINAR_PER.timeLabel}. Lien : ${WEBINAR_PER.meetingUrl}`,
        html: shell({
          title: "C'est aujourd'hui",
          contact,
          unsubscribeUrl,
          contentHtml: `
            <p style="margin:0 0 12px;">Rendez-vous cet après-midi à ${WEBINAR_PER.timeLabel.split(" ")[0]}. Voici le lien de connexion :</p>
            ${meetingBlock}
            <p style="margin:14px 0 0;">À tout à l'heure !<br>Gabriel</p>`
        })
      };
    case "replay":
      return {
        subject: "Le replay du webinaire PER est disponible",
        text: `Merci pour votre inscription. Voici le replay : ${replayUrl || ""}`,
        html: shell({
          title: "Merci, et voici le replay",
          contact,
          unsubscribeUrl,
          contentHtml: `
            <p style="margin:0 0 12px;">Merci pour votre participation (ou votre inscription, si vous n'avez pas pu vous connecter). Voici le replay du webinaire :</p>
            ${replayUrl ? `<div style="margin:14px 0;">${button(replayUrl, "Voir le replay")}</div>` : ""}
            <p style="margin:14px 0 0;">Une question sur votre situation personnelle ? Je vous propose un échange gratuit et sans engagement.</p>
            <div style="margin-top:10px;">${button("https://calendly.com/gabriel-perbost-gp-finances/votre-etude-d-optimisation-fiscale", "Prendre rendez-vous")}</div>`
        })
      };
  }
};

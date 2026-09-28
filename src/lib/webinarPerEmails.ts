import { WEBINAR_PER, getWebinarPerRegistrationUrl } from "@/lib/webinarPerConfig";
import { getWebinarPerCalendarLinks } from "@/lib/webinarPerCalendar";

export type WebinarPerEmailTemplate =
  | "confirmation"
  | "reminder_11d"
  | "reminder_9d"
  | "reminder_7d"
  | "reminder_5d"
  | "reminder_3d"
  | "reminder_1d"
  | "reminder_morning"
  | "replay";

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

// Guide PDF offert à l'inscription (lead magnet), joint à l'e-mail de confirmation
// et disponible en lien direct au cas où la pièce jointe serait filtrée.
export const WEBINAR_PER_GUIDE_URL = "https://gp-finances.fr/site/assets/guide-per-gp-finances.pdf";
const WEBINAR_PER_GUIDE_NAME = "Guide-PER-GP-Finances.pdf";

const guideBlock = () => `
  <div style="margin:14px 0;padding:14px 16px;background:#f1f6ff;border:1px solid #dbeafe;border-radius:12px;">
    <div style="font-family:Arial,sans-serif;font-weight:900;color:#0b1220;font-size:13.5px;margin-bottom:6px;">📄 Votre guide « Le PER expliqué simplement »</div>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#334155;line-height:1.5;margin:0 0 10px;">Il est joint à cet e-mail. Si vous ne le voyez pas, téléchargez-le directement :</p>
    ${button(WEBINAR_PER_GUIDE_URL, "Télécharger le guide (PDF)")}
  </div>`;

// Avis Google réels (vérifiés sur la fiche GP FINANCES), jamais inventés.
const GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps/place/Gabriel+PERBOST+-+GP+FINANCES+-+Courtage+en+pr%C3%AAts+%26+assurances/@48.8266378,2.2708441,17z/data=!4m8!3m7!1s0x47e67b4268d18555:0x77ce3efc101ceda2!8m2!3d48.8266378!4d2.2708441!9m1!1b1!16s%2Fg%2F11nvx_gz_z?hl=fr";
const REVIEWS: { author: string; text: string }[] = [
  { author: "Julien Menier", text: "Très réactif, et très pro, je recommande à 100%" },
  {
    author: "Johanna Djian",
    text: "Un courtier qui a tout pour plaire : efficace, pédagogue, professionnel, réactif, et en plus sympathique ! Allez y les yeux fermés !"
  },
  { author: "Duarte Joao", text: "Parfait, Gabriel est d'une efficacité incroyable. Bravo ! Professionnalisme incroyable" },
  {
    author: "Didier Dorville",
    text: "Excellente expérience avec Gabriel. À l'écoute de nos besoins et de notre situation, il a su nous accompagner avec efficacité…"
  },
  {
    author: "Edouard Ballout",
    text: "Gabriel associe toutes les qualités recherchées : disponibilité, clarté et efficacité. Je ne peux que recommander !"
  }
];

// Témoignages vidéo réels de clients PER, déjà utilisés sur la page d'inscription.
const VIDEO_TESTIMONIALS: { name: string; img: string }[] = [
  { name: "Anaëlle", img: "https://gp-finances.fr/site/assets/temoignage-anaelle.jpg" },
  { name: "Dorothée", img: "https://gp-finances.fr/site/assets/temoignage-dorothee.jpg" }
];

const reviewsBlock = (pair: [number, number]) => `
  <div style="margin:16px 0;padding:14px 16px;background:#fffaf0;border:1px solid #f3e2b8;border-radius:12px;">
    <div style="font-family:Arial,sans-serif;font-weight:900;color:#0b1220;font-size:13px;margin-bottom:10px;">★★★★★ 5/5 · 17 avis Google</div>
    ${pair
      .map(
        (i, idx) => `
      <div style="font-family:Arial,sans-serif;font-size:13px;color:#334155;line-height:1.5;${idx === 0 ? "margin:0 0 10px;padding-bottom:10px;border-bottom:1px solid #f3e2b8;" : "margin:0;"}">
        « ${escapeHtml(REVIEWS[i].text)} »<br>
        <span style="color:#8a6d1d;font-weight:700;">— ${escapeHtml(REVIEWS[i].author)}</span>
      </div>`
      )
      .join("")}
    <a href="${GOOGLE_REVIEWS_URL}" style="display:inline-block;margin-top:10px;color:#0d1f3c;font-family:Arial,sans-serif;font-size:12px;font-weight:700;">Voir tous les avis Google ↗</a>
  </div>`;

const videoTestimonialsBlock = (registrationUrl: string) => `
  <div style="margin:16px 0;">
    <div style="font-family:Arial,sans-serif;font-weight:900;color:#0b1220;font-size:13px;margin-bottom:8px;">Témoignages clients PER (vidéo)</div>
    <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
      ${VIDEO_TESTIMONIALS.map(
        (v) => `
        <td style="width:50%;padding:0 6px 0 0;">
          <a href="${registrationUrl}#inscription" style="display:block;text-decoration:none;">
            <img src="${v.img}" alt="Témoignage client ${escapeHtml(v.name)}" width="260" style="width:100%;height:auto;border-radius:10px;display:block;border:1px solid #e7eefb;">
            <div style="font-family:Arial,sans-serif;font-size:12px;color:#0d1f3c;font-weight:700;margin-top:4px;">▶ Témoignage — ${escapeHtml(v.name)}</div>
          </a>
        </td>`
      ).join("")}
    </tr></table>
  </div>`;

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
        subject: "Inscription confirmée + votre guide PER offert",
        text: `Votre inscription au webinaire PER du ${dateTime} est confirmée. Lien : ${WEBINAR_PER.meetingUrl}. Votre guide « Le PER expliqué simplement » est joint à cet e-mail (aussi disponible ici : ${WEBINAR_PER_GUIDE_URL}).`,
        html: shell({
          title: "Votre inscription est confirmée",
          contact,
          unsubscribeUrl,
          contentHtml: `
            <p style="margin:0 0 12px;">C'est noté : vous êtes inscrit(e) au webinaire <b>« ${escapeHtml(WEBINAR_PER.title)} »</b>.</p>
            ${meetingBlock}
            ${guideBlock()}
            <p style="margin:14px 0 0;">Au programme : comprendre le PER, calculer votre économie d'impôt potentielle et éviter les erreurs les plus fréquentes. Vous pourrez poser vos questions en direct.</p>
            ${videoTestimonialsBlock(registrationUrl)}
            ${reviewsBlock([0, 1])}
            <p style="margin:14px 0 0;">À dimanche !<br>Gabriel Perbost</p>`
        })
      };
    case "reminder_11d":
      return {
        subject: "Merci pour votre inscription au webinaire PER",
        text: `Merci pour votre inscription au webinaire PER du ${dateTime}. En attendant, la vidéo « 5 erreurs à éviter avec le PER » : ${WEBINAR_PER.videoUrl}`,
        html: shell({
          title: "Merci pour votre inscription",
          contact,
          unsubscribeUrl,
          contentHtml: `
            <p style="margin:0 0 12px;">Votre place est réservée pour le ${dateTime}. En attendant, si vous voulez une première mise en jambe, voici une courte vidéo où j'explique les 5 erreurs les plus fréquentes avec le PER :</p>
            <div style="margin:10px 0 16px;">${button(WEBINAR_PER.videoUrl, "Regarder la vidéo (3 min)")}</div>
            ${videoTestimonialsBlock(registrationUrl)}
            ${reviewsBlock([2, 3])}`
        })
      };
    case "reminder_9d":
      return {
        subject: "Une question à me poser avant le webinaire PER ?",
        text: `Le webinaire PER a lieu le ${dateTime}. Une question à me poser en avance ? Répondez à cet e-mail.`,
        html: shell({
          title: "Une question pour le webinaire ?",
          contact,
          unsubscribeUrl,
          contentHtml: `
            <p style="margin:0 0 12px;">Le webinaire approche : ${dateTime}. Si vous avez déjà une question sur votre situation (âge, tranche d'imposition, projet de retraite…), répondez à cet e-mail : je pourrai y répondre pendant la session.</p>
            ${meetingBlock}
            ${reviewsBlock([4, 0])}`
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
            ${meetingBlock}
            ${videoTestimonialsBlock(registrationUrl)}
            ${reviewsBlock([1, 2])}`
        })
      };
    case "reminder_5d":
      return {
        subject: "J-5 : ce que vous allez apprendre au webinaire PER",
        text: `Le webinaire PER a lieu dans 5 jours, ${dateTime}.`,
        html: shell({
          title: "Dans 5 jours",
          contact,
          unsubscribeUrl,
          contentHtml: `
            <p style="margin:0 0 12px;">Au programme le ${dateTime} : comprendre le PER simplement, calculer votre économie d'impôt selon votre tranche, et éviter les erreurs les plus fréquentes avant de verser. 15 minutes de questions en direct à la fin.</p>
            ${meetingBlock}
            ${reviewsBlock([3, 4])}`
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
            ${meetingBlock}
            ${reviewsBlock([0, 1])}
            ${videoTestimonialsBlock(registrationUrl)}`
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
            ${meetingBlock}
            ${reviewsBlock([2, 3])}`
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
            ${reviewsBlock([4, 0])}
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

/**
 * Invitations au webinaire PER grand public du dimanche 1er novembre 2026,
 * envoyées aux contacts « assurance emprunteur » (fichier Leads_emprunteur).
 * Reprend la mécanique de la campagne avocats (invitation puis relances aux
 * non-inscrits), avec un ton grand public et une cadence plus courte.
 *
 * Module autonome (aucun import) : il sert à la fois aux aperçus et à l'envoi.
 * Le prénom n'est pas repris (fichier trop hétérogène : noms inversés, civilités,
 * numéros) et aucune donnée du fichier autre que l'adresse e-mail n'est utilisée.
 */

export const PER_PROSPECTION = {
  dateLabel: "Dimanche 1er novembre 2026",
  dateShort: "dimanche 1er novembre",
  timeLabel: "15h00 à 16h00",
  hour: "15h",
  durationLabel: "45 minutes d'explications et d'exemples chiffrés + 15 minutes de questions",
  registrationUrl: "https://gp-finances.fr/webinaire-per",
  siteUrl: "https://gp-finances.fr/per",
  orias: "23003789",
  source: "webinaire-per-novembre-prospection"
} as const;

export type PerProspectionTemplate =
  | "invitation"
  | "relance_j7"
  | "relance_j5"
  | "relance_j3"
  | "relance_j2"
  | "relance_j1"
  | "relance_j0"
  | "relance_h1";

// Calendrier d'envoi (heure de Paris) : tous les 2 jours, puis chaque matin à 10h, puis 1h avant.
// date + heure de début, l'envoi n'étant lancé que dans la fenêtre [heure, heure + 3h[ (H-1 : 1h).
export const PER_PROSPECTION_SCHEDULE: { id: PerProspectionTemplate; date: string; hour: number; label: string }[] = [
  { id: "invitation", date: "2026-10-23", hour: 10, label: "Vendredi 23 octobre, 10h (J-9)" },
  { id: "relance_j7", date: "2026-10-25", hour: 10, label: "Dimanche 25 octobre, 10h (J-7)" },
  { id: "relance_j5", date: "2026-10-27", hour: 10, label: "Mardi 27 octobre, 10h (J-5)" },
  { id: "relance_j3", date: "2026-10-29", hour: 10, label: "Jeudi 29 octobre, 10h (J-3)" },
  { id: "relance_j2", date: "2026-10-30", hour: 10, label: "Vendredi 30 octobre, 10h (J-2)" },
  { id: "relance_j1", date: "2026-10-31", hour: 10, label: "Samedi 31 octobre, 10h (J-1)" },
  { id: "relance_j0", date: "2026-11-01", hour: 10, label: "Dimanche 1er novembre, 10h (jour J)" },
  { id: "relance_h1", date: "2026-11-01", hour: 14, label: "Dimanche 1er novembre, 14h (H-1)" }
];

export type PerProspectionEmail = { subject: string; previewText: string; html: string; text: string };

const esc = (v: string) =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

// Chaque lien porte la vague (utm_content) et sa nature (utm_term) : Brevo enregistre le clic
// avec l'adresse du destinataire, la page d'inscription enregistre la vague qui a amené l'inscrit.
const track = (url: string, template: PerProspectionTemplate, label: string) =>
  `${url}${url.includes("?") ? "&" : "?"}utm_source=email&utm_medium=prospection&utm_campaign=${PER_PROSPECTION.source}&utm_content=${template}&utm_term=${label}`;

export const PER_YOUTUBE_CHANNEL = "https://www.youtube.com/@gabrielperbost";

// Vidéos PER publiques de la chaîne (vérifiées en ligne le 22 octobre 2026), avec leur vignette du site.
const VIDEOS = [
  { key: "video-5-erreurs", url: "https://www.youtube.com/watch?v=CNFS4tn5538", img: "https://gp-finances.fr/site/assets/per-5-erreurs.jpg", title: "PER : les 5 erreurs à éviter absolument" },
  { key: "video-arnaque-bon-plan", url: "https://youtu.be/jq9OEVgWx_4", img: "https://gp-finances.fr/site/assets/per-arnaque-bon-plan-2.jpg", title: "PER : arnaque ou bon plan ?" },
  { key: "video-assurance-vie-vs-per", url: "https://youtu.be/MHB_XZe4j9g", img: "https://gp-finances.fr/site/assets/assurance-vie-vs-per.jpg", title: "Assurance-vie ou PER : lequel choisir ?" }
];

// Témoignages vidéo de clientes PER (YouTube Shorts publics).
const TESTIMONIALS = [
  { key: "temoignage-annaelle", url: "https://youtube.com/shorts/gwC2ozYhkAw", img: "https://gp-finances.fr/email/per-testimonials/annaelle-wide.jpg", name: "Annaëlle" },
  { key: "temoignage-dorothee", url: "https://youtube.com/shorts/_X1GVr28qRY", img: "https://gp-finances.fr/email/per-testimonials/dorothee-wide.jpg", name: "Dorothée" }
];

const p = (html: string) => `<p style="margin:0 0 14px;">${html}</p>`;

const cta = (label: string, href: string) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border-collapse:collapse;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr><td align="center" bgcolor="#1A3C5C" style="padding:14px 24px;border:1px solid #143047;">
          <a href="${esc(href)}" target="_blank" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;font-family:Arial,sans-serif;">${esc(label)}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>`;

const infoRow = (label: string, value: string, last = false) => `
    <tr><td style="padding:14px 16px;${last ? "" : "border-bottom:1px solid #d9e2f2;"}">
      <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;font-weight:700;">${label}</p>
      <p style="margin:4px 0 0;font-size:15px;color:#0f172a;font-weight:700;">${value}</p>
    </td></tr>`;

const infoGrid = () => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fbff" style="margin:20px 0;border-collapse:collapse;">
    ${infoRow("Date", PER_PROSPECTION.dateLabel)}
    ${infoRow("Horaire", PER_PROSPECTION.timeLabel)}
    ${infoRow("Format", PER_PROSPECTION.durationLabel)}
    ${infoRow("En visioconférence", "Gratuit, sur inscription. Replay envoyé aux inscrits.", true)}
  </table>`;

const programBlock = () => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;border-collapse:collapse;">
    <tr><td style="padding:0 2px;font-family:Arial,sans-serif;">
      <p style="margin:0 0 10px;font-size:15px;color:#0f172a;font-weight:bold;">En une heure, nous verrons ensemble :</p>
      <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#334155;">• Ce qu'est le PER, simplement, et comment il fonctionne.</p>
      <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#334155;">• Comment calculer votre économie d'impôt selon votre tranche d'imposition.</p>
      <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#334155;">• Où trouver votre plafond de déduction sur votre avis d'impôt.</p>
      <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#334155;">• Dans quels cas le PER est intéressant, et dans quels cas il ne l'est pas.</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">• Les frais et les règles de sortie à vérifier avant de verser.</p>
    </td></tr>
  </table>`;

const exampleRow = (label: string, value: string, strong = false, last = false) => `
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#475569;${last ? "" : "border-bottom:1px solid #d9e2f2;"}">${label}</td>
            <td align="right" style="padding:8px 0;font-size:14px;color:${strong ? "#166534" : "#0f172a"};font-weight:bold;${last ? "" : "border-bottom:1px solid #d9e2f2;"}">${value}</td>
          </tr>`;

// Calcul mécanique (versement × tranche marginale), dans la limite du plafond disponible.
const exampleBlock = () => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fbff" style="margin:20px 0;border-collapse:collapse;">
    <tr><td style="padding:16px;font-family:Arial,sans-serif;">
      <p style="margin:0 0 8px;font-size:13px;color:#1A3C5C;font-weight:bold;text-transform:uppercase;">Exemple simplifié</p>
      <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#334155;">Un même versement de <strong>4 000 €</strong> sur un PER, dans la limite du plafond de déduction :</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:6px 0;">
        ${exampleRow("Imposé dans la tranche à 11 %", "440 € d'impôt en moins", true)}
        ${exampleRow("Imposé dans la tranche à 30 %", "1 200 € d'impôt en moins", true)}
        ${exampleRow("Imposé dans la tranche à 41 %", "1 640 € d'impôt en moins", true, true)}
      </table>
      <p style="margin:10px 0 0;font-size:12px;line-height:1.55;color:#64748b;">
        Exemple volontairement simplifié : le résultat réel dépend de votre revenu, de votre plafond disponible, de votre situation
        familiale, des frais du contrat et de la fiscalité à la sortie.
      </p>
    </td></tr>
  </table>`;

const speakerBlock = () => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fffaf0" style="margin:20px 0;border-left:4px solid #C8A86B;border-collapse:collapse;">
    <tr><td style="padding:14px 16px;font-family:Arial,sans-serif;">
      <p style="margin:0 0 6px;font-size:14px;color:#1A3C5C;font-weight:bold;">Intervenant</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">Gabriel Perbost, courtier indépendant en assurance et en crédit (GP Finances, Issy-les-Moulineaux). Noté 5/5 sur Google.</p>
    </td></tr>
  </table>`;

const thumbCell = (href: string, img: string, caption: string, width: number) => `
        <td valign="top" style="padding:0 6px 10px 0;width:${width}%;">
          <a href="${esc(href)}" target="_blank" style="text-decoration:none;display:block;">
            <img src="${img}" alt="${esc(caption)}" width="190" style="width:100%;height:auto;display:block;border:1px solid #d9e2f2;">
            <span style="display:block;margin-top:6px;font-size:13px;line-height:1.4;color:#1A3C5C;font-weight:bold;font-family:Arial,sans-serif;">▶ ${esc(caption)}</span>
          </a>
        </td>`;

// Vidéo mise en avant (demande de Gabriel) : grande vignette cliquable + bouton.
const featuredVideoBlock = (template: PerProspectionTemplate) => {
  const v = VIDEOS[0];
  const href = esc(track(v.url, template, v.key));
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;border-collapse:collapse;">
    <tr><td style="font-family:Arial,sans-serif;padding-bottom:10px;">
      <p style="margin:0;font-size:15px;color:#0f172a;font-weight:bold;">En vidéo : les 5 erreurs à éviter avec le PER</p>
    </td></tr>
    <tr><td>
      <a href="${href}" target="_blank" style="display:block;text-decoration:none;">
        <img src="${v.img}" alt="${esc(v.title)}" width="588" style="width:100%;max-width:588px;height:auto;display:block;border:1px solid #d9e2f2;">
      </a>
    </td></tr>
    <tr><td style="padding-top:10px;font-family:Arial,sans-serif;">
      <a href="${href}" target="_blank" style="display:inline-block;background:#C8A86B;color:#0f1f33;text-decoration:none;font-weight:bold;font-size:14px;padding:11px 18px;">▶ Regarder la vidéo sur YouTube</a>
    </td></tr>
  </table>`;
};

const videosBlock = (template: PerProspectionTemplate) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;border-collapse:collapse;">
    <tr><td style="font-family:Arial,sans-serif;padding-bottom:10px;">
      <p style="margin:0;font-size:15px;color:#0f172a;font-weight:bold;">Mes autres vidéos sur le PER</p>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Comparatifs et explications, quelques minutes chacune.</p>
    </td></tr>
    <tr><td><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
      ${VIDEOS.slice(1).map((v) => thumbCell(track(v.url, template, v.key), v.img, v.title, 50)).join("")}
    </tr></table></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:13px;">
      <a href="${esc(track(PER_YOUTUBE_CHANNEL, template, "chaine-youtube"))}" target="_blank" style="color:#1A3C5C;font-weight:bold;">Voir toutes mes vidéos sur YouTube</a>
    </td></tr>
  </table>`;

const testimonialsBlock = (template: PerProspectionTemplate) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;border-collapse:collapse;">
    <tr><td style="font-family:Arial,sans-serif;padding-bottom:10px;">
      <p style="margin:0;font-size:15px;color:#0f172a;font-weight:bold;">Elles ont mis en place leur PER avec GP Finances</p>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Deux clientes racontent leur expérience, en vidéo.</p>
    </td></tr>
    <tr><td><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
      ${TESTIMONIALS.map((t) => thumbCell(track(t.url, template, t.key), t.img, `Témoignage de ${t.name}`, 50)).join("")}
    </tr></table></td></tr>
    <tr><td style="font-family:Arial,sans-serif;font-size:13px;color:#475569;">Noté 5/5 sur Google (17 avis).</td></tr>
  </table>`;

const wrap = ({ title, previewText, body, unsubscribeUrl }: { title: string; previewText: string; body: string; unsubscribeUrl: string }) => `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#eef3fb;font-family:Arial,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(previewText)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef3fb" style="border-collapse:collapse;">
    <tr><td align="center" style="padding:28px 14px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:640px;border-collapse:collapse;">
        <tr><td bgcolor="#1A3C5C" style="padding:22px 26px;color:#ffffff;font-family:Arial,sans-serif;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:bold;color:#EAD7A0;">GP Finances · Webinaire PER</p>
          <h1 style="margin:0;font-size:24px;line-height:1.25;color:#ffffff;font-weight:bold;">${esc(title)}</h1>
          <p style="margin:10px 0 0;font-size:14px;line-height:1.55;color:#EAF2FF;">${PER_PROSPECTION.dateLabel} · ${PER_PROSPECTION.hour}</p>
        </td></tr>
        <tr><td style="padding:26px;font-size:15px;line-height:1.7;color:#1f2937;">
          ${body}
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;padding-top:18px;border-top:1px solid #e2e8f0;">
            <tr><td style="font-size:13px;color:#475569;line-height:1.55;">
              <strong style="color:#0f172a;">Gabriel PERBOST</strong><br>
              Gérant de GP Finances, courtier indépendant<br>
              06 51 22 42 13 · ORIAS ${PER_PROSPECTION.orias}
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:14px 26px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;line-height:1.5;color:#64748b;text-align:center;">
          Vous recevez cet e-mail car vous avez été en contact avec GP Finances au sujet de l'assurance de votre crédit immobilier.
          Ce message n'est ni un conseil personnalisé ni une offre de produit.
          GP Finances, courtier en assurance, ORIAS ${PER_PROSPECTION.orias}, RCS Nanterre 899 363 907.
          &nbsp;·&nbsp;<a href="${esc(unsubscribeUrl)}" style="color:#475569;text-decoration:underline;">Se désinscrire</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const toText = (lines: string[], unsubscribeUrl: string) =>
  [
    ...lines,
    "",
    `${PER_PROSPECTION.dateLabel}, ${PER_PROSPECTION.timeLabel}. Gratuit, sur inscription. Replay envoyé aux inscrits.`,
    "",
    "Gabriel PERBOST, GP Finances, courtier indépendant, 06 51 22 42 13, ORIAS 23003789.",
    "Vous recevez cet e-mail car vous avez été en contact avec GP Finances au sujet de l'assurance de votre crédit immobilier.",
    `Se désinscrire : ${unsubscribeUrl}`
  ].join("\n");

type Spec = { subject: string; previewText: string; title: string; body: string; text: string[] };

const SPECS = (link: (label: string) => string, t: PerProspectionTemplate): Record<PerProspectionTemplate, Spec> => {
  const url = link("inscription");
  const video = featuredVideoBlock(t);
  const autres = videosBlock(t);
  const temoignages = testimonialsBlock(t);
  return {
  invitation: {
    subject: "Retraite et impôts : webinaire gratuit le dimanche 1er novembre",
    previewText: "Une heure pour comprendre le PER, calculer votre économie d'impôt et éviter les erreurs fréquentes.",
    title: "Réduire vos impôts tout en préparant votre retraite ?",
    body: `
        ${p("Bonjour,")}
        ${p("Nous avons échangé il y a quelque temps au sujet de l'assurance de votre crédit immobilier. Je reviens vers vous pour un tout autre sujet, qui concerne beaucoup de propriétaires : la préparation de la retraite.")}
        ${p("Le Plan d'Épargne Retraite (PER) permet de mettre de l'argent de côté pour plus tard, tout en réduisant ses impôts dès aujourd'hui. Mais il n'est pas adapté à tout le monde, et les erreurs coûtent cher.")}
        ${p(`J'organise un <strong>webinaire gratuit d'une heure, le ${PER_PROSPECTION.dateShort} à 15h</strong>, pour tout expliquer simplement, avec des exemples chiffrés.`)}
        ${infoGrid()}
        ${programBlock()}
        ${speakerBlock()}
        ${cta("Je m'inscris gratuitement", url)}
        ${p("À l'inscription, vous recevez aussi un guide PDF offert : « Le PER expliqué simplement ».")}`,
    text: [
      "Nous avons échangé il y a quelque temps au sujet de l'assurance de votre crédit immobilier. Je reviens vers vous pour un autre sujet : la préparation de la retraite.",
      `J'organise un webinaire gratuit d'une heure, le ${PER_PROSPECTION.dateShort} à 15h, pour expliquer simplement le PER : comment il fonctionne, combien d'impôt il permet d'économiser, et dans quels cas il n'est pas adapté.`,
      "Guide PDF offert à l'inscription."
    ]
  },
  relance_j7: {
    subject: "PER : combien d'impôt pourriez-vous économiser ?",
    previewText: "Un exemple chiffré en 30 secondes, et la méthode complète dimanche 1er novembre à 15h.",
    title: "Combien d'impôt pourriez-vous économiser ?",
    body: `
        ${p("Bonjour,")}
        ${p("Pour rendre le PER plus concret, voici un exemple simple que nous reprendrons en détail pendant le webinaire.")}
        ${exampleBlock()}
        ${p("L'intérêt dépend avant tout de votre tranche d'imposition. Pour certains, le PER est un vrai levier ; pour d'autres, une autre solution sera plus adaptée. Le webinaire sert justement à faire le tri.")}
        ${infoGrid()}
        ${video}
        ${cta("Je m'inscris gratuitement", url)}
        ${autres}`,
    text: [
      "Un même versement de 4 000 € sur un PER, dans la limite du plafond : 440 € d'impôt en moins à 11 %, 1 200 € à 30 %, 1 640 € à 41 % (exemple simplifié).",
      "L'intérêt dépend avant tout de votre tranche d'imposition : c'est ce que nous verrons pendant le webinaire."
    ]
  },
  relance_j5: {
    subject: "Avez-vous regardé votre plafond PER sur votre avis d'impôt ?",
    previewText: "Le chiffre à vérifier avant tout versement, et comment le lire. On en parle dimanche 1er novembre.",
    title: "Le chiffre à vérifier avant de verser",
    body: `
        ${p("Bonjour,")}
        ${p("Avant de verser sur un PER, il faut connaître votre plafond de déduction. C'est lui qui fixe jusqu'où un versement peut réduire votre revenu imposable.")}
        ${p("Bonne nouvelle : il est déjà calculé pour vous. Il figure sur votre dernier avis d'impôt, dans la rubrique consacrée à l'épargne retraite. Peu de gens savent le lire.")}
        ${p(`Pendant le webinaire du ${PER_PROSPECTION.dateShort}, je vous montrerai où le trouver et comment l'utiliser pour choisir un montant cohérent, sans approximation.`)}
        ${infoGrid()}
        ${video}
        ${temoignages}
        ${cta("Je réserve ma place", url)}`,
    text: [
      "Avant de verser sur un PER, il faut connaître votre plafond de déduction : il figure sur votre dernier avis d'impôt.",
      `Pendant le webinaire du ${PER_PROSPECTION.dateShort}, je vous montrerai où le trouver et comment l'utiliser.`
    ]
  },
  relance_j3: {
    subject: "PER : l'erreur à éviter avant de verser",
    previewText: "Regarder seulement l'économie d'impôt, sans vérifier les frais et la sortie. Rendez-vous dimanche 15h.",
    title: "Ne regardez pas seulement l'économie d'impôt",
    body: `
        ${p("Bonjour,")}
        ${p("Un versement sur un PER peut réduire votre impôt. Mais ce n'est pas le seul critère.")}
        ${p("Les frais du contrat, les supports proposés, les règles de sortie à la retraite et la fiscalité au moment de récupérer l'argent changent fortement l'intérêt réel de l'opération.")}
        ${p("Le webinaire de dimanche vous donne une grille de lecture claire pour décider en connaissance de cause.")}
        ${infoGrid()}
        ${video}
        ${autres}
        ${cta("Je m'inscris gratuitement", url)}`,
    text: [
      "Un versement PER peut réduire l'impôt, mais les frais, les supports, les règles de sortie et la fiscalité à la sortie comptent autant.",
      "Le webinaire de dimanche vous donne une grille de lecture claire."
    ]
  },
  relance_j2: {
    subject: "Dimanche 15h : webinaire gratuit sur le PER",
    previewText: "Plus que deux jours pour réserver votre place. Replay envoyé aux inscrits.",
    title: "Plus que deux jours pour vous inscrire",
    body: `
        ${p("Bonjour,")}
        ${p(`Le webinaire gratuit sur le Plan d'Épargne Retraite a lieu ce <strong>${PER_PROSPECTION.dateShort}, de 15h à 16h</strong>.`)}
        ${p("En une heure : comprendre le PER, calculer votre économie d'impôt selon votre tranche, et éviter les erreurs fréquentes. 15 minutes de questions en direct à la fin.")}
        ${infoGrid()}
        ${p("Pas disponible dimanche ? Inscrivez-vous quand même : le replay sera envoyé à toutes les personnes inscrites.")}
        ${video}
        ${temoignages}
        ${cta("Je réserve ma place", url)}`,
    text: [
      `Le webinaire gratuit sur le PER a lieu ce ${PER_PROSPECTION.dateShort}, de 15h à 16h.`,
      "Pas disponible ? Inscrivez-vous quand même, le replay est envoyé aux inscrits."
    ]
  },
  relance_j1: {
    subject: "Demain 15h : PER, impôts et retraite (gratuit)",
    previewText: "C'est demain. Inscription gratuite, replay envoyé aux inscrits.",
    title: "C'est demain à 15h",
    body: `
        ${p("Bonjour,")}
        ${p("Le webinaire gratuit sur le Plan d'Épargne Retraite a lieu <strong>demain, dimanche 1er novembre, de 15h à 16h</strong>.")}
        ${p("Si vous l'avez sous la main, prenez votre dernier avis d'impôt : vous pourrez suivre les exemples avec vos propres chiffres.")}
        ${infoGrid()}
        ${video}
        ${temoignages}
        ${cta("Je m'inscris pour demain", url)}`,
    text: [
      "Le webinaire gratuit sur le PER a lieu demain, dimanche 1er novembre, de 15h à 16h.",
      "Prenez votre dernier avis d'impôt pour suivre avec vos propres chiffres."
    ]
  },
  relance_j0: {
    subject: "Cet après-midi 15h : PER, impôts et retraite (gratuit)",
    previewText: "C'est aujourd'hui. Inscription encore ouverte, replay envoyé aux inscrits.",
    title: "C'est cet après-midi à 15h",
    body: `
        ${p("Bonjour,")}
        ${p("Le webinaire gratuit sur le Plan d'Épargne Retraite a lieu <strong>aujourd'hui de 15h à 16h</strong>.")}
        ${p("Une heure pour comprendre le PER, calculer votre économie d'impôt et savoir si c'est pertinent pour vous, avec 15 minutes de questions en direct.")}
        ${p("L'inscription est encore ouverte. Si vous ne pouvez pas vous connecter, le replay vous sera envoyé.")}
        ${video}
        ${cta("Je m'inscris pour cet après-midi", url)}
        ${p("Au plaisir de vous retrouver,")}`,
    text: ["Le webinaire gratuit sur le PER a lieu aujourd'hui de 15h à 16h.", "Inscription encore ouverte, replay envoyé aux inscrits."]
  },
  relance_h1: {
    subject: "Dans 1 heure : webinaire gratuit sur le PER",
    previewText: "On commence à 15h. Il est encore temps de vous inscrire.",
    title: "On commence dans 1 heure",
    body: `
        ${p("Bonjour,")}
        ${p("Le webinaire gratuit sur le Plan d'Épargne Retraite commence <strong>à 15h, dans une heure</strong>.")}
        ${p("Il est encore temps de vous inscrire : vous recevrez le lien de connexion par e-mail dans la foulée, et le replay si vous ne pouvez pas rester jusqu'au bout.")}
        ${cta("Je m'inscris et je reçois le lien", url)}
        ${p("À tout à l'heure,")}`,
    text: ["Le webinaire gratuit sur le PER commence à 15h, dans une heure.", "Inscrivez-vous : le lien de connexion vous est envoyé aussitôt."]
  }
  };
};

export const buildPerProspectionEmail = (template: PerProspectionTemplate, unsubscribeUrl: string): PerProspectionEmail => {
  const link = (label: string) => track(PER_PROSPECTION.registrationUrl, template, label);
  const spec = SPECS(link, template)[template];
  const url = link("inscription");
  return {
    subject: spec.subject,
    previewText: spec.previewText,
    html: wrap({ title: spec.title, previewText: spec.previewText, unsubscribeUrl, body: spec.body }),
    text: toText(["Bonjour,", ...spec.text, `Inscription gratuite : ${url}`], unsubscribeUrl)
  };
};

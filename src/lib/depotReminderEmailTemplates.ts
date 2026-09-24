import { LEGAL } from "@/content/site";

export const DEPOT_REMINDER_DAY_OFFSETS = [2, 5, 8, 12, 16, 20, 25, 30] as const;
export type DepotReminderDayOffset = (typeof DEPOT_REMINDER_DAY_OFFSETS)[number];

type BuildDepotReminderEmailParams = {
  dayOffset: DepotReminderDayOffset;
  clientName: string;
  link: string;
  expiresAt: string;
  siteBaseUrl: string;
  savingsValue?: number | null;
  instagramUrl?: string;
  linkedinUrl?: string;
};

type ReminderEmailBodyContext = {
  dayOffset: DepotReminderDayOffset;
  siteBaseUrl: string;
  savingsValue: number | null;
  instagramUrl: string;
  linkedinUrl: string;
};

type ReminderTemplateConfig = {
  subject: string;
  title: string;
  subtitle: string;
  bodyHtml: (ctx: ReminderEmailBodyContext) => string;
  footerNote?: string;
};

const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/gabriel_perbost/";
const DEFAULT_LINKEDIN_URL = "https://www.linkedin.com/in/gabriel-perbost/";

const formatFrDate = (isoDate: string) => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("fr-FR");
};

const formatFrNumber = (value: number) => new Intl.NumberFormat("fr-FR").format(value);

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderCaseStudyBlock = ({
  heading,
  oldLabel,
  oldCost,
  newLabel,
  newCost,
  savings,
  reduction
}: {
  heading: string;
  oldLabel: string;
  oldCost: string;
  newLabel: string;
  newCost: string;
  savings: string;
  reduction: string;
}) => `
  <div style="margin:14px 0 0;border:1px solid #dbe7ff;border-radius:12px;background:#f5f9ff;padding:14px;">
    <p style="margin:0 0 10px;font-size:14px;color:#294f97;font-weight:700;">${escapeHtml(heading)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;border-spacing:0 8px;">
      <tr>
        <td style="width:34%;background:#fff7f7;border:1px solid #ffd4d4;border-radius:10px;padding:10px;vertical-align:top;">
          <div style="font-size:11px;color:#9f1239;font-weight:700;text-transform:uppercase;">Avant</div>
          <div style="margin:4px 0 0;font-size:12px;color:#475569;">${escapeHtml(oldLabel)}</div>
          <div style="margin:6px 0 0;font-size:22px;color:#9f1239;font-weight:800;">${escapeHtml(oldCost)}</div>
        </td>
        <td style="width:33%;padding:0 6px;text-align:center;vertical-align:middle;">
          <div style="font-size:11px;color:#64748b;font-weight:700;">Mêmes garanties</div>
          <div style="font-size:20px;color:#94a3b8;line-height:1;">-></div>
        </td>
        <td style="width:33%;background:#f3fff7;border:1px solid #c5f1d3;border-radius:10px;padding:10px;vertical-align:top;">
          <div style="font-size:11px;color:#166534;font-weight:700;text-transform:uppercase;">Après</div>
          <div style="margin:4px 0 0;font-size:12px;color:#475569;">${escapeHtml(newLabel)}</div>
          <div style="margin:6px 0 0;font-size:22px;color:#166534;font-weight:800;">${escapeHtml(newCost)}</div>
        </td>
      </tr>
    </table>
    <div style="margin:8px 0 0;background:#0f172a;border-radius:10px;padding:12px;text-align:center;color:#ffffff;">
      <div style="font-size:11px;opacity:.8;text-transform:uppercase;">Économie réalisée</div>
      <div style="font-size:28px;line-height:1.15;font-weight:800;">${escapeHtml(savings)}</div>
      <div style="margin-top:4px;font-size:13px;opacity:.9;">${escapeHtml(reduction)}</div>
    </div>
  </div>
`;

const renderPriorityMomentumBlock = () => `
  <div style="border:1px solid #cfe7d4;background:#f6fff8;border-radius:12px;padding:14px;margin:0 0 14px;">
    <p style="margin:0 0 8px;font-size:13px;color:#166534;font-weight:700;">
      Votre dossier est prêt à passer en analyse d'assurance emprunteur
    </p>
    <div style="height:6px;border-radius:999px;background:#dbe5ea;overflow:hidden;margin:0 0 10px;">
      <div style="height:6px;width:62%;background:#16a34a;"></div>
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="font-size:11px;color:#166534;line-height:1.4;">Étape validée<br/><b>Lien actif</b></td>
        <td style="font-size:11px;color:#166534;line-height:1.4;" align="center">À finaliser<br/><b>Dépôt des pièces</b></td>
        <td style="font-size:11px;color:#64748b;line-height:1.4;" align="right">Étape suivante<br/><b>Comparaison 51 assureurs</b></td>
      </tr>
    </table>
  </div>
`;

const reminderConfigByDay: Record<DepotReminderDayOffset, ReminderTemplateConfig> = {
  2: {
    subject: "GP Finances - Assurance emprunteur : voici concrètement ce que vous perdez aujourd’hui",
    title: "Votre étude peut démarrer dès réception des documents",
    subtitle: "Dès que vous transmettez les pièces, nous lançons l'analyse de votre assurance emprunteur.",
    bodyHtml: () =>
      `
      <p style="margin:0 0 10px;font-size:14px;color:#334155;line-height:1.6;">
        Pour illustrer les gains possibles, voici un cas concret traité récemment :
      </p>
      ${renderCaseStudyBlock({
        heading: "Exemple cliente - même niveau de garanties conservé",
        oldLabel: "Ancienne assurance banque (coût total estimé)",
        oldCost: "32 710 €",
        newLabel: "Nouvelle assurance proposée par notre cabinet",
        newCost: "11 510 €",
        savings: "21 200 €",
        reduction: "Soit environ 65% de baisse du coût total."
      })}
      <p style="margin:12px 0 0;font-size:13px;color:#475569;line-height:1.55;">
        Le plus important : l'équivalence de garanties est conservée, votre banque ne change pas, et nous gérons les démarches.
      </p>
    `
  },
  5: {
    subject: "GP Finances - Assurance emprunteur : bonne nouvelle, vous pouvez changer simplement",
    title: "Loi Lemoine : vos droits, et notre méthode pour les faire appliquer",
    subtitle: "Votre dossier est prioritaire dès que vos documents sont déposés.",
    bodyHtml: () =>
      `
      <div style="margin:0;border:1px solid #dbe7ff;border-radius:12px;background:#f8fbff;padding:14px;">
        <p style="margin:0 0 8px;font-size:14px;color:#294f97;font-weight:700;">Ce que la loi vous garantit</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;border-spacing:0 8px;">
          <tr>
            <td style="background:#fff;border:1px solid #dce8ff;border-radius:10px;padding:10px;">
              <div style="font-size:12px;font-weight:700;color:#0f172a;">Résiliation à tout moment</div>
              <div style="margin-top:4px;font-size:12px;color:#475569;">Vous pouvez changer d'assurance emprunteur pendant toute la durée du prêt.</div>
            </td>
          </tr>
          <tr>
            <td style="background:#fff;border:1px solid #dce8ff;border-radius:10px;padding:10px;">
              <div style="font-size:12px;font-weight:700;color:#0f172a;">Équivalence de garanties obligatoire</div>
              <div style="margin-top:4px;font-size:12px;color:#475569;">La banque doit accepter si les garanties du nouveau contrat sont équivalentes.</div>
            </td>
          </tr>
          <tr>
            <td style="background:#fff;border:1px solid #dce8ff;border-radius:10px;padding:10px;">
              <div style="font-size:12px;font-weight:700;color:#0f172a;">Réponse encadrée</div>
              <div style="margin-top:4px;font-size:12px;color:#475569;">Tout refus doit être motivé sur les garanties, pas sur le simple changement de contrat.</div>
            </td>
          </tr>
        </table>
      </div>
      <p style="margin:12px 0 0;font-size:13px;color:#475569;line-height:1.55;">
        Dès réception de vos pièces, nous vérifions l'équivalence de garanties point par point et nous préparons une proposition exploitable immédiatement.
      </p>
    `
  },
  8: {
    subject: "GP Finances - Assurance emprunteur : ils pensaient que ce n’était pas possible",
    title: "Ce que disent nos clients en vidéo",
    subtitle: "Des retours réels et des économies chiffrées sur l'assurance de prêt.",
    bodyHtml: ({ siteBaseUrl }) => {
      const videos = [
        { href: `${siteBaseUrl}#avis-video`, poster: `${siteBaseUrl}/videos/posters/Tem1-poster-v3.png`, amount: "21 200 €" },
        { href: `${siteBaseUrl}#avis-video`, poster: `${siteBaseUrl}/videos/posters/Tem2-poster.png`, amount: "17 000 €" },
        { href: `${siteBaseUrl}#avis-video`, poster: `${siteBaseUrl}/videos/posters/Tem3-poster.png`, amount: "8 000 €" }
      ];

      return `
      <p style="margin:0 0 10px;font-size:13px;color:#334155;line-height:1.55;">
        Vous pouvez voir les témoignages vidéo directement sur notre page avis.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          ${videos
            .map(
              (video) => `
                <td style="width:33.33%;padding-right:6px;vertical-align:top;">
                  <a href="${escapeHtml(video.href)}" style="text-decoration:none;display:block;border:1px solid #dce8ff;border-radius:8px;overflow:hidden;background:#fff;">
                    <img src="${escapeHtml(video.poster)}" alt="Avis client vidéo GP Finances" style="display:block;width:100%;height:auto;" />
                    <div style="padding:6px 8px;font-size:11px;color:#334155;">Économie ${escapeHtml(video.amount)}</div>
                  </a>
                </td>
              `
            )
            .join("")}
        </tr>
      </table>
      <div style="margin:12px 0 0;">
        <a href="${escapeHtml(siteBaseUrl)}#avis-video" style="display:inline-block;background:#ffffff;border:1px solid #dce8ff;border-radius:10px;padding:10px 14px;text-decoration:none;color:#1d4ed8;font-size:13px;font-weight:700;">
          Voir les avis vidéo sur le site
        </a>
      </div>
    `;
    }
  },
  12: {
    subject: "GP Finances - Assurance emprunteur : pourquoi tant d’emprunteurs paient trop cher",
    title: "Analyses pédagogiques pour comprendre votre assurance de prêt",
    subtitle: "Vous visualisez la méthode, puis nous lançons votre étude dès réception des documents.",
    bodyHtml: ({ instagramUrl, linkedinUrl }) => `
      <div style="margin:0;border:1px solid #dbe7ff;border-radius:12px;background:#f8fbff;padding:14px;">
        <p style="margin:0 0 8px;font-size:14px;color:#294f97;font-weight:700;">Où suivre le contenu</p>
        <div style="margin:0 0 10px;">
          <a href="${escapeHtml(instagramUrl)}" style="display:inline-block;margin-right:8px;background:#ffffff;border:1px solid #dce8ff;border-radius:10px;padding:10px 12px;text-decoration:none;color:#1d4ed8;font-size:13px;font-weight:700;">
            Instagram
          </a>
          <a href="${escapeHtml(linkedinUrl)}" style="display:inline-block;background:#ffffff;border:1px solid #dce8ff;border-radius:10px;padding:10px 12px;text-decoration:none;color:#1d4ed8;font-size:13px;font-weight:700;">
            LinkedIn
          </a>
        </div>
        <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;color:#334155;">
          <li>Exemples réels de dossiers avec chiffres.</li>
          <li>Explications claires sur la loi Lemoine et les garanties.</li>
          <li>Conseils pratiques pour accélérer votre changement d'assurance.</li>
        </ul>
      </div>
      <div style="margin:12px 0 0;border:1px solid #dce8ff;border-radius:12px;background:#ffffff;padding:12px;">
        <p style="margin:0 0 6px;font-size:13px;color:#0f172a;font-weight:700;">Priorité recommandée</p>
        <p style="margin:0;font-size:12px;color:#475569;line-height:1.5;">
          Regardez un contenu, puis utilisez votre lien d'accès client dans la foulée : c'est la manière la plus simple de transformer l'intention en action.
        </p>
      </div>
    `
  },
  16: {
    subject: "GP Finances - Assurance emprunteur : ce qui fait vraiment la différence dans un dossier",
    title: "Ce que vous gagnez en nous confiant votre dossier",
    subtitle: "Nous visons un gain financier concret, avec un process clair et rapide.",
    bodyHtml: () => `
      <p style="margin:0 0 10px;font-size:13px;color:#334155;line-height:1.55;">
        Votre objectif n'est pas d'envoyer “un document de plus”, mais de déclencher une étude qui peut réduire le coût total de votre assurance de prêt.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;border-spacing:0 8px;">
        <tr>
          <td style="background:#ffffff;border:1px solid #dce8ff;border-radius:10px;padding:12px;vertical-align:top;">
            <div style="font-size:13px;color:#0f172a;font-weight:700;">Simulation gratuite</div>
            <div style="margin-top:4px;font-size:13px;color:#475569;line-height:1.45;">Vous évaluez vos économies potentielles sans engagement.</div>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #dce8ff;border-radius:10px;padding:12px;vertical-align:top;">
            <div style="font-size:13px;color:#0f172a;font-weight:700;">Devis en 24h</div>
            <div style="margin-top:4px;font-size:13px;color:#475569;line-height:1.45;">Une réponse claire et actionnable en moins de 24h après réception du dossier.</div>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid #dce8ff;border-radius:10px;padding:12px;vertical-align:top;">
            <div style="font-size:13px;color:#0f172a;font-weight:700;">51 assureurs comparés</div>
            <div style="margin-top:4px;font-size:13px;color:#475569;line-height:1.45;">Mise en concurrence large pour viser le meilleur rapport garanties/prix.</div>
          </td>
        </tr>
      </table>
      <div style="margin:12px 0 0;border:1px solid #dbe7ff;border-radius:12px;background:#f5f9ff;padding:12px;">
        <p style="margin:0;font-size:12px;color:#334155;line-height:1.5;">
          En clair : vous déposez vos pièces une fois, nous gérons l'analyse, la comparaison et les échanges liés à votre assurance emprunteur.
        </p>
      </div>
    `
  },
  20: {
    subject: "GP Finances - Assurance emprunteur : plus de 3 millions d’euros déjà économisés",
    title: "Le compteur global progresse, votre dossier peut être le prochain",
    subtitle: "Chaque semaine, de nouveaux clients réduisent leur coût d'assurance de prêt.",
    bodyHtml: ({ siteBaseUrl, savingsValue }) => `
      <div style="margin:0;border:1px solid #cfe7d4;background:#f6fff8;border-radius:12px;padding:14px;">
        <p style="margin:0 0 6px;font-size:13px;color:#166534;font-weight:700;">Compteur global GP Finances</p>
        <div style="font-size:28px;color:#166534;font-weight:800;line-height:1.15;">
          ${savingsValue !== null ? `${formatFrNumber(savingsValue)} €` : "Voir le compteur en direct"}
        </div>
        <p style="margin:6px 0 0;font-size:12px;color:#334155;line-height:1.5;">
          Cliquez pour accéder au compteur sur le site et voir le montant global des économies déjà réalisées.
        </p>
      </div>
      <div style="margin:12px 0 0;">
        <a href="${escapeHtml(siteBaseUrl)}#compteur-economies" style="display:inline-block;background:#ffffff;border:1px solid #dce8ff;border-radius:10px;padding:10px 14px;text-decoration:none;color:#1d4ed8;font-size:13px;font-weight:700;">
          Ouvrir le compteur global
        </a>
      </div>
      <p style="margin:12px 0 0;font-size:12px;color:#475569;line-height:1.5;">
        Déposer vos documents aujourd'hui nous permet de positionner votre dossier dans la prochaine vague d'analyses.
      </p>
    `
  },
  25: {
    subject: "GP Finances - Assurance emprunteur : ce client pensait déjà être bien couvert",
    title: "Exemple concret : 57% de réduction du coût total",
    subtitle: "Un deuxième cas réaliste, pour visualiser le potentiel de votre dossier.",
    bodyHtml: () =>
      `
      ${renderCaseStudyBlock({
        heading: "Dossier type résidence principale",
        oldLabel: "Contrat banque en place (coût total)",
        oldCost: "24 960 €",
        newLabel: "Nouveau contrat avec équivalence de garanties",
        newCost: "10 730 €",
        savings: "14 230 €",
        reduction: "Soit 57% de réduction du coût total."
      })}
      <p style="margin:12px 0 0;font-size:13px;color:#475569;line-height:1.55;">
        Le niveau de couverture est resté conforme aux exigences de la banque.
      </p>
    `
  },
  30: {
    subject: "GP Finances - Assurance emprunteur : clôture de votre dossier, sans retour de votre part",
    title: "Dernier rappel avant expiration du lien",
    subtitle: "Votre lien est encore actif : vous pouvez encore lancer votre étude d'assurance de prêt.",
    bodyHtml: () =>
      `
      ${renderCaseStudyBlock({
        heading: "Dossier type profil cadre - prêt longue durée",
        oldLabel: "Ancien contrat groupe bancaire (coût total)",
        oldCost: "38 700 €",
        newLabel: "Contrat alternatif avec équivalence de garanties",
        newCost: "11 997 €",
        savings: "26 703 €",
        reduction: "Soit 69% de réduction du coût total."
      })}
      <p style="margin:12px 0 0;font-size:13px;color:#475569;line-height:1.55;">
        Si vous souhaitez profiter du même niveau d'optimisation, il suffit d'accéder à votre lien de dépôt sécurisé puis de déposer vos documents.
      </p>
    `,
    footerNote: "Si vos documents ont déjà été transmis, ignorez simplement cet email."
  }
};

const buildShell = ({
  clientName,
  link,
  expiresAt,
  title,
  subtitle,
  contentHtml,
  footerNote
}: {
  clientName: string;
  link: string;
  expiresAt: string;
  title: string;
  subtitle: string;
  contentHtml: string;
  footerNote?: string;
}) => {
  const safeName = escapeHtml(clientName || "Client");
  const safeLink = escapeHtml(link);
  const formattedExpiry = formatFrDate(expiresAt);

  return `
    <div style="margin:0;padding:28px;background:#eef3fb;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:660px;margin:0 auto;background:#ffffff;border:1px solid #d9e2f2;border-radius:18px;overflow:hidden;">
        <div style="padding:20px 24px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#ffffff;">
          <h1 style="margin:0;font-size:22px;line-height:1.25;">${escapeHtml(title)}</h1>
          <p style="margin:8px 0 0;font-size:14px;opacity:.92;">
            Bonjour ${safeName}, ${escapeHtml(subtitle)}
          </p>
        </div>

        <div style="padding:24px;">
          <p style="margin:0 0 12px;font-size:14px;color:#334155;line-height:1.55;">
            Votre lien de dépôt sécurisé pour votre assurance emprunteur (assurance de prêt immobilier) est toujours actif.
            Déposez vos documents et nous lancerons votre analyse.
          </p>

          ${renderPriorityMomentumBlock()}

          <div style="margin:16px 0 18px;text-align:center;">
            <a href="${safeLink}" style="display:block;width:100%;max-width:340px;box-sizing:border-box;margin:0 auto;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:16px 18px;border-radius:12px;font-weight:800;font-size:16px;letter-spacing:.1px;text-align:center;box-shadow:0 8px 20px rgba(29,78,216,.25);">
              Accéder au dépôt de documents
            </a>
          </div>

          <div style="border:1px solid #cfe7d4;background:#f6fff8;border-radius:12px;padding:12px 14px;margin:0 0 14px;">
            <p style="margin:0;font-size:12px;color:#166534;line-height:1.45;">
              Documents attendus pour l'étude de votre assurance de prêt : offre de prêt + tableau d'amortissement.
            </p>
          </div>

          ${contentHtml}

          <p style="margin:16px 0 0;font-size:12px;color:#475569;line-height:1.45;">
            Lien personnel disponible jusqu'au ${escapeHtml(formattedExpiry || "la date d'expiration prévue")}.
          </p>
          <p style="margin:8px 0 0;font-size:12px;color:#475569;">
            Besoin d'aide pour retrouver vos documents ? Répondez à cet email, je vous accompagne.
          </p>
          <p style="margin:8px 0 0;font-size:11px;color:#64748b;">
            ${escapeHtml(footerNote ?? "Si vos documents ont déjà été transmis, ignorez simplement ce rappel.")}
          </p>
          <p style="margin:8px 0 0;font-size:11px;color:#64748b;">
            ${escapeHtml(LEGAL.company)} • ${escapeHtml(LEGAL.status)} • ORIAS ${escapeHtml(LEGAL.orias)} • ${escapeHtml(LEGAL.rcs)}
          </p>
        </div>
      </div>
    </div>
  `;
};

export const isDepotReminderDayOffset = (value: number): value is DepotReminderDayOffset =>
  DEPOT_REMINDER_DAY_OFFSETS.includes(value as DepotReminderDayOffset);

export const buildDepotReminderEmail = ({
  dayOffset,
  clientName,
  link,
  expiresAt,
  siteBaseUrl,
  savingsValue = null,
  instagramUrl = DEFAULT_INSTAGRAM_URL,
  linkedinUrl = DEFAULT_LINKEDIN_URL
}: BuildDepotReminderEmailParams) => {
  const template = reminderConfigByDay[dayOffset];
  const contentHtml = template.bodyHtml({
    dayOffset,
    siteBaseUrl: siteBaseUrl.replace(/\/+$/, ""),
    savingsValue,
    instagramUrl,
    linkedinUrl
  });

  return {
    subject: template.subject,
    html: buildShell({
      clientName,
      link,
      expiresAt,
      title: template.title,
      subtitle: template.subtitle,
      contentHtml,
      footerNote: template.footerNote
    })
  };
};

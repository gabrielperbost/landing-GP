import "server-only";

const DEFAULT_CALENDLY =
  process.env.CALENDLY_URL ||
  process.env.NEXT_PUBLIC_PER_CALENDLY_URL ||
  "https://calendly.com/gabriel-perbost-gp-finances/votre-etude-d-optimisation-fiscale";

const SITE_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://gp-finances.fr").replace(/\/+$/, "");

const VIDEOS = {
  frederic: {
    url: "https://youtu.be/guuKhgTjcUI",
    thumbnailUrl: `${SITE_BASE_URL}/email/per-testimonials/frederic-wide.jpg`,
    thumbnailCid: "per-testimonial-frederic"
  },
  annaelle: {
    url: "https://youtube.com/shorts/gwC2ozYhkAw",
    thumbnailUrl: `${SITE_BASE_URL}/email/per-testimonials/annaelle-wide.jpg`,
    thumbnailCid: "per-testimonial-annaelle"
  },
  dorothee: {
    url: "https://youtube.com/shorts/_X1GVr28qRY",
    thumbnailUrl: `${SITE_BASE_URL}/email/per-testimonials/dorothee-wide.jpg`,
    thumbnailCid: "per-testimonial-dorothee"
  }
};

export type PerLead = {
  prenom: string;
  nom?: string;
  email: string;
  telephone?: string;
  situation?: string;
  retraite?: string;
  jour: number;
  calendlyUrl?: string;
  callbackUrl?: string;
  unsubscribeUrl?: string;
};

export type PerEmail = {
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
    cid: string;
  }>;
};

const videoAttachment = (video: { thumbnailUrl: string; thumbnailCid: string }, filename: string) => ({
  filename,
  path: video.thumbnailUrl,
  cid: video.thumbnailCid
});

const videoCard = (video: { url: string; thumbnailCid: string }, prenom: string, description: string) => `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;border:1px solid #dbe3ef;border-radius:0;font-family:Arial,sans-serif;background:#ffffff;">
  <tr>
    <td width="280" align="center" style="padding:14px 16px;vertical-align:middle;background:#f8fafc;border-right:1px solid #e2e8f0;">
      <a href="${video.url}" target="_blank" style="text-decoration:none;color:#1a56db;">
        <img src="cid:${video.thumbnailCid}" width="300" alt="Témoignage vidéo ${prenom}" style="display:block;width:300px;max-width:100%;height:auto;border:0;border-radius:8px;">
      </a>
    </td>
    <td style="padding:24px 20px 22px;vertical-align:middle;background:#ffffff;">
      <span style="display:inline-block;font-size:11px;color:#3C3489;background:#EEEDFE;padding:2px 8px;border-radius:20px;margin-bottom:6px;">Témoignage client</span>
      <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#0d1b2a;line-height:1.35;">${prenom}</p>
      <p style="margin:0 0 10px;font-size:13px;color:#64748b;line-height:1.5;">${description}</p>
      <a href="${video.url}" target="_blank" style="display:inline-block;background:#1a56db;color:#ffffff;font-size:12px;font-weight:bold;text-decoration:none;padding:8px 12px;border-radius:6px;">Regarder la vidéo</a>
    </td>
  </tr>
	</table>`;

const phoneCallbackBlock = (lead: Partial<PerLead> = {}) => {
  if (!lead.callbackUrl) return "";

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;border:1px solid #dbeafe;border-radius:10px;background:#f8fbff;">
    <tr>
      <td style="padding:18px 18px;text-align:center;">
        <p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:#334155;">
          Vous préférez être rappelé ? Indiquez votre numéro, j'arrête la séquence email et je vous rappelle.
        </p>
        <a href="${lead.callbackUrl}" target="_blank" style="display:inline-block;background:#0d1b2a;color:#ffffff;padding:11px 22px;border-radius:6px;font-size:13px;font-weight:bold;text-decoration:none;">Me faire rappeler</a>
      </td>
    </tr>
  </table>`;
};

const wrap = (contenu: string, lead: Partial<PerLead> = {}) => {
  const unsubscribeUrl = lead.unsubscribeUrl || process.env.UNSUBSCRIBE_URL || "#";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <tr>
        <td style="background:#0d1b2a;padding:20px 32px;">
          <span style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:2px;">GP FINANCES</span>
          &nbsp;&nbsp;
          <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#1a56db;vertical-align:middle;"></span>
          &nbsp;&nbsp;
          <span style="color:#7a8fa0;font-size:12px;">Optimisation fiscale &amp; retraite</span>
        </td>
      </tr>
      <tr>
	        <td style="padding:32px 32px 24px;color:#1e293b;font-size:15px;line-height:1.75;">
	          ${contenu}
	          ${phoneCallbackBlock(lead)}
	          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;">
            <tr>
              <td style="font-size:13px;color:#64748b;">
                <strong style="color:#0d1b2a;">Gabriel PERBOST</strong><br>
                Gérant du cabinet GP FINANCES
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
          Vous recevez cet email suite à votre demande de bilan retraite.
          &nbsp;·&nbsp;
          <a href="${unsubscribeUrl}" style="color:#94a3b8;">Se désinscrire</a>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
};

const highlight = (text: string) => `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;border-left:3px solid #1a56db;border-radius:0 6px 6px 0;background:#EDF2FF;">
    <tr><td style="padding:12px 16px;font-size:13px;color:#1e3a70;line-height:1.65;">${text}</td></tr>
  </table>`;

const cta = (label: string, lead: Partial<PerLead> = {}) => {
  const calendlyUrl = lead.calendlyUrl || DEFAULT_CALENDLY;
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;">
    <tr><td align="center">
      <a href="${calendlyUrl}" target="_blank" style="display:inline-block;background:#1a56db;color:#ffffff;padding:13px 30px;border-radius:6px;font-size:14px;font-weight:bold;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`;
};

const emailJ0 = (lead: PerLead): PerEmail => ({
  subject: `${lead.prenom}, votre bilan retraite est entre de bonnes mains`,
  html: wrap(`
      <p>Bonjour ${lead.prenom},</p>
      <p>Merci d'avoir complété notre questionnaire. J'ai bien reçu <strong>vos réponses</strong>
         et je les analyse personnellement pour vous préparer une étude sur mesure.</p>
      ${highlight(`🎯 <strong>Ce que vous allez découvrir :</strong> combien vous pourriez économiser
        sur vos impôts dès cette année grâce au PER — et comment le mettre en place simplement,
        sans effort de votre côté.`)}
      <p>Frédéric était dans la même situation que vous il y a quelques mois.
         Voici ce qu'il a à dire après son bilan :</p>
      ${videoCard(VIDEOS.frederic, "Frédéric", "Client GP Finances — découvrez son retour d'expérience après son bilan retraite.")}
      <p>Je vous contacte sous 24h. Si vous préférez choisir vous-même votre créneau :</p>
      ${cta("Choisir mon créneau →", lead)}
      <p>À très vite,</p>
    `, lead),
  attachments: [videoAttachment(VIDEOS.frederic, "temoignage-frederic.jpg")]
});

const emailJ2 = (lead: PerLead): PerEmail => ({
  subject: `${lead.prenom}, je n'ai pas réussi à vous joindre`,
  html: wrap(`
      <p>Bonjour ${lead.prenom},</p>
      <p>J'ai essayé de vous appeler pour vous présenter votre étude d'optimisation fiscale
         personnalisée, mais je suis tombé sur votre messagerie.</p>
      <p>Annaëlle hésitait elle aussi à franchir le pas. Regardez ce qu'elle dit après son bilan :</p>
      ${videoCard(VIDEOS.annaelle, "Annaëlle", "Cliente GP Finances — elle hésitait, elle aussi. Écoutez ce qu'elle pense aujourd'hui.")}
      ${cta("Réserver mon créneau gratuit →", lead)}
      ${highlight(`L'échange dure <strong>30 minutes</strong>, c'est <strong>100% gratuit</strong>
        et sans aucun engagement.`)}
      <p>À bientôt,</p>
    `, lead),
  attachments: [videoAttachment(VIDEOS.annaelle, "temoignage-annaelle.jpg")]
});

const emailJ5 = (lead: PerLead): PerEmail => ({
  subject: `${lead.prenom}, ce que le PER peut faire pour vous concrètement`,
  html: wrap(`
      <p>Bonjour ${lead.prenom},</p>
      <p>En tant que <strong>${lead.situation || "actif"}</strong> avec un horizon retraite de
         <strong>${lead.retraite || "quelques années"}</strong>, vous êtes dans une configuration
         particulièrement favorable pour optimiser votre fiscalité via le PER.</p>
      ${highlight(`Chaque euro versé sur un PER est <strong>déduit de votre revenu imposable</strong>.<br><br>
        Exemple : 5 000 € versés → jusqu'à <strong>2 250 € d'impôts en moins</strong> dès l'année suivante.`)}
      <p>Votre profil mérite une simulation précise. C'est ce que je vous prépare lors de notre échange :</p>
      ${cta("Obtenir ma simulation gratuite →", lead)}
      <p>Bonne journée,</p>
    `, lead)
});

const emailJ10 = (lead: PerLead): PerEmail => ({
  subject: `${lead.prenom}, ce que Dorothée a découvert lors de son bilan`,
  html: wrap(`
      <p>Bonjour ${lead.prenom},</p>
      <p>Dorothée aussi avait des doutes avant de réaliser son bilan retraite.
         Elle pensait que ce n'était pas encore le bon moment, que ça pouvait attendre.</p>
      <p>Voici ce qu'elle pense aujourd'hui :</p>
      ${videoCard(VIDEOS.dorothee, "Dorothée", "Cliente GP Finances — elle attendait le bon moment. Voilà ce qu'elle dit maintenant.")}
      ${highlight(`Comme Dorothée, votre situation mérite une analyse personnalisée.
        L'étude est gratuite, sans engagement, et peut changer concrètement
        ce que vous payez en impôts chaque année.`)}
      ${cta("Je veux mon bilan →", lead)}
      <p>À bientôt,</p>
    `, lead),
  attachments: [videoAttachment(VIDEOS.dorothee, "temoignage-dorothee.jpg")]
});

const emailJ15 = (lead: PerLead): PerEmail => ({
  subject: `${lead.prenom}, les 3 erreurs qui coûtent cher à la retraite`,
  html: wrap(`
      <p>Bonjour ${lead.prenom},</p>
      <p>En accompagnant des dizaines de clients chaque année, j'observe toujours les mêmes erreurs.
         Je vous les partage pour que vous puissiez les éviter.</p>
      <p><strong>Erreur n°1 — Attendre "le bon moment".</strong><br>
         Il n'y en a pas. Chaque année sans PER, c'est une déduction fiscale perdue
         et des intérêts composés en moins.</p>
      <p><strong>Erreur n°2 — Choisir le mauvais contrat.</strong><br>
         Les frais de gestion varient du simple au triple selon les établissements.
         Sur 20 ans, cela représente des dizaines de milliers d'euros de différence.</p>
      <p><strong>Erreur n°3 — Ne pas calibrer ses versements.</strong><br>
         Un bon conseiller trouve l'équilibre exact pour votre situation.</p>
      ${highlight(`Mon rôle est précisément d'éviter ces trois erreurs pour vous —
        gratuitement, en 30 minutes.`)}
      ${cta("Prendre rendez-vous →", lead)}
      <p>Bonne journée,</p>
    `, lead)
});

const emailJ21 = (lead: PerLead): PerEmail => ({
  subject: `${lead.prenom}, la fin d'année fiscale approche`,
  html: wrap(`
      <p>Bonjour ${lead.prenom},</p>
      <p>Un rappel important : pour que vos versements PER soient déductibles
         <strong>sur vos impôts de cette année</strong>, ils doivent être effectués
         avant le 31 décembre.</p>
      <p>La mise en place d'un PER prend quelques jours. Plus on attend,
         moins on a de marge pour optimiser sereinement.</p>
      ${highlight(`Il me reste quelques créneaux disponibles cette semaine.
        Un échange de 30 minutes suffit pour tout mettre en place.`)}
      ${cta("Réserver mon créneau →", lead)}
      <p>À très vite,</p>
    `, lead)
});

const emailJ30 = (lead: PerLead): PerEmail => ({
  subject: `${lead.prenom}, c'est mon dernier message`,
  html: wrap(`
      <p>Bonjour ${lead.prenom},</p>
      <p>Je ne veux pas encombrer votre boîte mail.
         C'est le dernier email que je vous envoie.</p>
      <p>Si l'optimisation de votre retraite et de votre fiscalité vous intéresse toujours,
         mon agenda reste ouvert. L'étude est gratuite, sans engagement, et peut changer
         concrètement ce que vous payez en impôts chaque année.</p>
      ${cta("Accéder à mon agenda →", lead)}
      <p>Quoi qu'il arrive, je vous souhaite une excellente préparation retraite.</p>
      <p>Cordialement,</p>
    `, lead)
});

export const PER_SEQUENCE_DAYS = [0, 2, 5, 10, 15, 21, 30] as const;
export type PerSequenceDay = (typeof PER_SEQUENCE_DAYS)[number];

export const getPerEmailByDay = (jour: number, lead: PerLead): PerEmail => {
  const map: Record<number, (lead: PerLead) => PerEmail> = {
    0: emailJ0,
    2: emailJ2,
    5: emailJ5,
    10: emailJ10,
    15: emailJ15,
    21: emailJ21,
    30: emailJ30
  };
  return (map[jour] || emailJ0)(lead);
};

export const getNextPerSequenceDay = (day: number) => {
  const index = PER_SEQUENCE_DAYS.indexOf(day as PerSequenceDay);
  if (index < 0 || index + 1 >= PER_SEQUENCE_DAYS.length) return null;
  return PER_SEQUENCE_DAYS[index + 1];
};

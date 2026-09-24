/**
 * GP FINANCES — Gabriel PERBOST
 * Séquence 7 emails retraite / PER
 * Témoignages vidéo : Frédéric (J0), Annaëlle (J2), Dorothée (J10)
 */

const DEFAULT_CALENDLY =
  process.env.CALENDLY_URL ||
  'https://calendly.com/gabriel-perbost-gp-finances/votre-etude-d-optimisation-fiscale';

const VIDEOS = {
  frederic: {
    url: 'https://youtu.be/guuKhgTjcUI',
  },
  annaelle: {
    url: 'https://youtube.com/shorts/gwC2ozYhkAw',
  },
  dorothee: {
    url: 'https://youtube.com/shorts/_X1GVr28qRY',
  },
};

function getEmailByDay(jour, lead) {
  const map = { 0: emailJ0, 2: emailJ2, 5: emailJ5, 10: emailJ10, 15: emailJ15, 21: emailJ21, 30: emailJ30 };
  return (map[jour] || emailJ0)(lead);
}

// ─── Carte vidéo cliquable ────────────────────────────────────────────────────
function videoCard(video, prenom, description) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;border:1px solid #dbe3ef;border-radius:8px;font-family:Arial,sans-serif;background:#ffffff;">
  <tr>
    <td width="170" align="center" style="padding:18px 14px;vertical-align:middle;background:#f8fafc;border-right:1px solid #e2e8f0;">
      <a href="${video.url}" target="_blank" style="text-decoration:none;color:#1a56db;">
        <table cellpadding="0" cellspacing="0" border="0" align="center">
          <tr>
            <td align="center" style="width:64px;height:64px;border-radius:32px;background:#1a56db;color:#ffffff;font-size:28px;font-weight:bold;line-height:64px;">
              &#9654;
            </td>
          </tr>
        </table>
        <p style="margin:10px 0 0;font-size:12px;line-height:1.35;color:#475569;font-weight:bold;">Témoignage vidéo</p>
      </a>
    </td>
    <td style="padding:14px 16px;vertical-align:middle;background:#ffffff;">
      <span style="display:inline-block;font-size:11px;color:#3C3489;background:#EEEDFE;
                   padding:2px 8px;border-radius:20px;margin-bottom:6px;">Témoignage client</span>
      <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#0d1b2a;line-height:1.35;">${prenom}</p>
      <p style="margin:0 0 10px;font-size:13px;color:#64748b;line-height:1.5;">${description}</p>
      <a href="${video.url}" target="_blank"
         style="display:inline-block;background:#1a56db;color:#ffffff;font-size:12px;font-weight:bold;text-decoration:none;padding:8px 12px;border-radius:6px;">Regarder la vidéo</a>
    </td>
  </tr>
</table>`;
}

// ─── Template HTML commun ─────────────────────────────────────────────────────
function wrap(contenu, lead = {}) {
  const unsubscribeUrl = lead.unsubscribeUrl || process.env.UNSUBSCRIBE_URL || '#';
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0"
           style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

      <!-- En-tête -->
      <tr>
        <td style="background:#0d1b2a;padding:20px 32px;">
          <span style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:2px;">GP FINANCES</span>
          &nbsp;&nbsp;
          <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#1a56db;vertical-align:middle;"></span>
          &nbsp;&nbsp;
          <span style="color:#7a8fa0;font-size:12px;">Optimisation fiscale &amp; retraite</span>
        </td>
      </tr>

      <!-- Corps -->
      <tr>
        <td style="padding:32px 32px 24px;color:#1e293b;font-size:15px;line-height:1.75;">
          ${contenu}

          <!-- Signature -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0"
                 style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;">
            <tr>
              <td style="font-size:13px;color:#64748b;">
                <strong style="color:#0d1b2a;">Gabriel PERBOST</strong><br>
                Gérant du cabinet GP FINANCES
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Pied de page -->
      <tr>
        <td style="padding:14px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;
                   font-size:11px;color:#94a3b8;text-align:center;">
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
}

// ─── Bloc highlight ───────────────────────────────────────────────────────────
function highlight(text) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0"
            style="margin:18px 0;border-left:3px solid #1a56db;border-radius:0 6px 6px 0;background:#EDF2FF;">
    <tr><td style="padding:12px 16px;font-size:13px;color:#1e3a70;line-height:1.65;">${text}</td></tr>
  </table>`;
}

// ─── Bouton CTA ───────────────────────────────────────────────────────────────
function cta(label, lead = {}) {
  const calendlyUrl = lead.calendlyUrl || DEFAULT_CALENDLY;
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;">
    <tr><td align="center">
      <a href="${calendlyUrl}" target="_blank"
         style="display:inline-block;background:#1a56db;color:#ffffff;padding:13px 30px;
                border-radius:6px;font-size:14px;font-weight:bold;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`;
}

// ─── J0 — Confirmation immédiate + Frédéric ───────────────────────────────────
function emailJ0(lead) {
  return {
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
      ${videoCard(VIDEOS.frederic, 'Frédéric', 'Client GP Finances — découvrez son retour d\'expérience après son bilan retraite.')}
      <p>Je vous contacte sous 24h. Si vous préférez choisir vous-même votre créneau :</p>
      ${cta('Choisir mon créneau →', lead)}
      <p>À très vite,</p>
    `, lead),
  };
}

// ─── J2 — Relance + Annaëlle ──────────────────────────────────────────────────
function emailJ2(lead) {
  return {
    subject: `${lead.prenom}, je n'ai pas réussi à vous joindre`,
    html: wrap(`
      <p>Bonjour ${lead.prenom},</p>
      <p>J'ai essayé de vous appeler pour vous présenter votre étude d'optimisation fiscale
         personnalisée, mais je suis tombé sur votre messagerie.</p>
      <p>Annaëlle hésitait elle aussi à franchir le pas. Regardez ce qu'elle dit après son bilan :</p>
      ${videoCard(VIDEOS.annaelle, 'Annaëlle', 'Cliente GP Finances — elle hésitait, elle aussi. Écoutez ce qu\'elle pense aujourd\'hui.')}
      ${cta('Réserver mon créneau gratuit →', lead)}
      ${highlight(`L'échange dure <strong>30 minutes</strong>, c'est <strong>100% gratuit</strong>
        et sans aucun engagement.`)}
      <p>À bientôt,</p>
    `, lead),
  };
}

// ─── J5 — Éducation personnalisée ─────────────────────────────────────────────
function emailJ5(lead) {
  return {
    subject: `${lead.prenom}, ce que le PER peut faire pour vous concrètement`,
    html: wrap(`
      <p>Bonjour ${lead.prenom},</p>
      <p>En tant que <strong>${lead.situation || 'actif'}</strong> avec un horizon retraite de
         <strong>${lead.retraite || 'quelques années'}</strong>, vous êtes dans une configuration
         particulièrement favorable pour optimiser votre fiscalité via le PER.</p>
      ${highlight(`Chaque euro versé sur un PER est <strong>déduit de votre revenu imposable</strong>.<br><br>
        Exemple : 5 000 € versés → jusqu'à <strong>2 250 € d'impôts en moins</strong> dès l'année suivante.`)}
      <p>Votre profil mérite une simulation précise. C'est ce que je vous prépare lors de notre échange :</p>
      ${cta('Obtenir ma simulation gratuite →', lead)}
      <p>Bonne journée,</p>
    `, lead),
  };
}

// ─── J10 — Témoignage Dorothée ────────────────────────────────────────────────
function emailJ10(lead) {
  return {
    subject: `${lead.prenom}, ce que Dorothée a découvert lors de son bilan`,
    html: wrap(`
      <p>Bonjour ${lead.prenom},</p>
      <p>Dorothée aussi avait des doutes avant de réaliser son bilan retraite.
         Elle pensait que ce n'était pas encore le bon moment, que ça pouvait attendre.</p>
      <p>Voici ce qu'elle pense aujourd'hui :</p>
      ${videoCard(VIDEOS.dorothee, 'Dorothée', 'Cliente GP Finances — elle attendait le bon moment. Voilà ce qu\'elle dit maintenant.')}
      ${highlight(`Comme Dorothée, votre situation mérite une analyse personnalisée.
        L'étude est gratuite, sans engagement, et peut changer concrètement
        ce que vous payez en impôts chaque année.`)}
      ${cta('Je veux mon bilan →', lead)}
      <p>À bientôt,</p>
    `, lead),
  };
}

// ─── J15 — Les 3 erreurs ──────────────────────────────────────────────────────
function emailJ15(lead) {
  return {
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
      ${cta('Prendre rendez-vous →', lead)}
      <p>Bonne journée,</p>
    `, lead),
  };
}

// ─── J21 — Urgence fiscale ────────────────────────────────────────────────────
function emailJ21(lead) {
  return {
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
      ${cta('Réserver mon créneau →', lead)}
      <p>À très vite,</p>
    `, lead),
  };
}

// ─── J30 — Dernier message ────────────────────────────────────────────────────
function emailJ30(lead) {
  return {
    subject: `${lead.prenom}, c'est mon dernier message`,
    html: wrap(`
      <p>Bonjour ${lead.prenom},</p>
      <p>Je ne veux pas encombrer votre boîte mail.
         C'est le dernier email que je vous envoie.</p>
      <p>Si l'optimisation de votre retraite et de votre fiscalité vous intéresse toujours,
         mon agenda reste ouvert. L'étude est gratuite, sans engagement, et peut changer
         concrètement ce que vous payez en impôts chaque année.</p>
      ${cta('Accéder à mon agenda →', lead)}
      <p>Quoi qu'il arrive, je vous souhaite une excellente préparation retraite.</p>
      <p>Cordialement,</p>
    `, lead),
  };
}

module.exports = { getEmailByDay };

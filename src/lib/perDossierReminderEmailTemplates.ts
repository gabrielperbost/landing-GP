import { LEGAL } from "@/content/site";
import type { DepotReminderDayOffset } from "@/lib/depotReminderEmailTemplates";
import { PER_AVIS_IMPOSITION_LABEL } from "@/lib/perDossier";

type BuildPerDossierReminderEmailParams = {
  dayOffset: DepotReminderDayOffset;
  clientName: string;
  link: string;
  expiresAt: string;
  siteBaseUrl: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatFrDate = (isoDate: string) => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("fr-FR");
};

const CONTENT_BY_DAY: Record<DepotReminderDayOffset, { subject: string; title: string; body: string }> = {
  2: {
    subject: "GP Finances - Votre étude PER attend votre avis d'imposition",
    title: "Votre analyse PER peut démarrer dès réception du document",
    body: "Votre avis d'imposition nous permet de vérifier le revenu net imposable, l'impôt payé et la tranche marginale d'imposition avant toute recommandation."
  },
  5: {
    subject: "GP Finances - PER : le document qui permet de calculer votre avantage fiscal",
    title: "Le calcul fiscal dépend de votre avis d'imposition",
    body: "Sans ce document, nous ne pouvons pas confirmer si un versement PER est réellement pertinent dans votre situation."
  },
  8: {
    subject: "GP Finances - PER : évitons une recommandation approximative",
    title: "Une étude PER sérieuse part de vos chiffres fiscaux",
    body: "Le PER peut être puissant pour réduire l'impôt, mais seulement si le montant, la tranche fiscale et l'objectif retraite sont cohérents."
  },
  12: {
    subject: "GP Finances - Votre espace PER sécurisé est toujours actif",
    title: "Votre lien de dépôt est encore disponible",
    body: "Déposez votre avis d'imposition depuis l'espace sécurisé pour que nous puissions préparer une analyse claire et personnalisée."
  },
  16: {
    subject: "GP Finances - PER : dernier point avant analyse fiscale",
    title: "Il manque encore l'avis d'imposition",
    body: "Ce document nous évite de travailler sur des hypothèses et nous permet d'identifier le bon niveau de versement envisagé."
  },
  20: {
    subject: "GP Finances - PER : votre dossier peut encore être traité",
    title: "Votre dossier PER reste en attente de document",
    body: "Une fois le document transmis, nous pouvons vérifier l'intérêt fiscal, les points de vigilance et les prochaines étapes de souscription."
  },
  25: {
    subject: "GP Finances - PER : lien de dépôt bientôt expiré",
    title: "Votre lien personnel arrive bientôt à échéance",
    body: "Si vous souhaitez finaliser l'étude, il suffit de déposer votre avis d'imposition depuis l'espace sécurisé."
  },
  30: {
    subject: "GP Finances - PER : dernière relance avant clôture",
    title: "Dernière relance pour votre étude PER",
    body: "Sans retour de votre part, nous clôturerons le dossier. Si votre document a déjà été transmis, vous pouvez ignorer cet email."
  }
};

export const buildPerDossierReminderEmail = ({
  dayOffset,
  clientName,
  link,
  expiresAt,
  siteBaseUrl
}: BuildPerDossierReminderEmailParams) => {
  const config = CONTENT_BY_DAY[dayOffset];
  const formattedExpiry = formatFrDate(expiresAt);

  return {
    subject: config.subject,
    html: `
      <div style="margin:0;padding:28px;background:#eef3fb;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:660px;margin:0 auto;background:#ffffff;border:1px solid #d9e2f2;border-radius:18px;overflow:hidden;">
          <div style="padding:20px 24px;background:linear-gradient(135deg,#1A3C5C,#C8A86B);color:#ffffff;">
            <h1 style="margin:0;font-size:22px;line-height:1.2;">${escapeHtml(config.title)}</h1>
            <p style="margin:8px 0 0;font-size:14px;opacity:.92;">Bonjour ${escapeHtml(clientName || "Client")}, votre espace PER est prêt.</p>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${escapeHtml(config.body)}</p>
            <div style="border:1px solid #d9e2f2;background:#f8fbff;border-radius:12px;padding:14px;margin:0 0 18px;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:700;">Document demandé :</p>
              <p style="margin:0;font-size:14px;">${escapeHtml(PER_AVIS_IMPOSITION_LABEL)}</p>
            </div>
            <div style="margin:20px 0;text-align:center;">
              <a href="${escapeHtml(link)}" style="display:block;width:100%;max-width:360px;box-sizing:border-box;margin:0 auto;background:#1A3C5C;color:#ffffff;text-decoration:none;padding:16px 18px;border-radius:12px;font-weight:800;font-size:16px;text-align:center;">
                Déposer mon avis d'imposition
              </a>
            </div>
            <p style="margin:0 0 8px;font-size:12px;color:#475569;line-height:1.45;">
              Lien personnel disponible jusqu'au ${escapeHtml(formattedExpiry)}.
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#64748b;">
              ${escapeHtml(LEGAL.company)} • ${escapeHtml(LEGAL.status)} • ORIAS ${escapeHtml(LEGAL.orias)} • ${escapeHtml(LEGAL.rcs)} • ${escapeHtml(siteBaseUrl)}
            </p>
          </div>
        </div>
      </div>
    `
  };
};

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { appendWebinarPerRegistration, getWebinarPerParticipants, markWebinarPerReminderSent } from "@/lib/webinarPerSheet";
import { buildWebinarPerEmail } from "@/lib/webinarPerEmails";
import { getBrevoTransactionalConfig, sendBrevoTransactionalEmail } from "@/lib/brevoTransactional";
import { getBrevoSmsConfig, sendBrevoSms } from "@/lib/brevoSms";
import { WEBINAR_PER_SESSIONS, getWebinarPerUnsubscribeUrl } from "@/lib/webinarPerConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* Webinaire du 1er novembre annulé le jour même, reporté au 8 novembre à 15h.
 * Lancé à la main depuis le navigateur, connecté à GPF :
 *   GET                       → comptage à blanc (aucun envoi)
 *   GET ?envoyer=oui          → e-mail de report à chaque inscrit du 1er novembre
 *   GET ?envoyer=oui&sms=oui  → e-mail + SMS (inscrits ayant accepté les SMS)
 * Chaque inscrit est aussi ajouté au Google Sheet du 8 novembre (s'il n'y est pas déjà), pour recevoir les rappels de cette session.
 * Relançable sans risque : la colonne « Rappel 7j » du Sheet du 1er novembre (rappel H-1, non envoyé ce jour) marque les envois faits. */

const SMS_TEXT = "GP Finances : suite à une urgence, le webinaire PER de 15h aujourd'hui est reporté au dimanche 8 novembre à 15h. Nouveau lien par e-mail. Toutes mes excuses, Gabriel. STOP au 06 51 22 42 13.";
const MARQUEUR = "reminder_7d_sent_at" as const;
const ANNULATION = Date.parse("2026-11-01T10:00:00Z"); // marquages antérieurs = ancien rappel H-1, pas un envoi du report

// Jeton à usage unique (seule son empreinte SHA-256 est ici), pour lancer l'envoi sans session GPF dans le navigateur.
const JETON_SHA256 = "e48597939f53a2f883e7b607ce75481f79e2127dbca65f7c0fe1869d27cea5c5";
const jetonValide = (jeton: string | null) => Boolean(jeton) && crypto.createHash("sha256").update(String(jeton)).digest("hex") === JETON_SHA256;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (!jetonValide(url.searchParams.get("jeton")) && !(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const envoyer = url.searchParams.get("envoyer") === "oui";
  const avecSms = url.searchParams.get("sms") === "oui";

  const s1 = WEBINAR_PER_SESSIONS["2026-11-01"];
  const s8 = WEBINAR_PER_SESSIONS["2026-11-08"];
  const debut = Date.parse(s1.campaignStart);
  const [inscrits1, inscrits8] = await Promise.all([getWebinarPerParticipants(s1.sheetEnv), getWebinarPerParticipants(s8.sheetEnv)]);

  const deja8 = new Set(inscrits8.map((p) => p.email.trim().toLowerCase()));
  const cibles = inscrits1
    .filter((p) => p.status.trim().toLowerCase() === "registered")
    .filter((p) => !String(p.source || "").startsWith(s8.sourcePrefix))
    .filter((p) => Date.parse(p.created_at) >= debut);
  const restants = cibles.filter((p) => !(Date.parse(String(p[MARQUEUR] ?? "")) >= ANNULATION));

  const bilan = { inscrits1erNovembre: cibles.length, dejaPrevenus: cibles.length - restants.length, aPrevenir: restants.length, avecTelephoneSms: restants.filter((p) => p.consent_sms && p.telephone).length, dejaInscrits8Novembre: restants.filter((p) => deja8.has(p.email.trim().toLowerCase())).length, emailsEnvoyes: 0, smsEnvoyes: 0, ajoutes8Novembre: 0, erreurs: 0 };
  if (!envoyer) return NextResponse.json({ ok: true, aBlanc: true, ...bilan });

  const emailConfig = getBrevoTransactionalConfig();
  if (!emailConfig) return NextResponse.json({ ok: false, error: "brevo_non_configure" }, { status: 503 });
  const smsConfig = avecSms ? getBrevoSmsConfig() : null;

  for (const p of restants) {
    const email = p.email.trim().toLowerCase();
    const unsubscribeUrl = getWebinarPerUnsubscribeUrl(email, s1);
    try {
      const built = buildWebinarPerEmail("report_8nov", { prenom: p.prenom, email }, { unsubscribeUrl, session: s1 });
      await sendBrevoTransactionalEmail({
        config: emailConfig,
        to: { email, name: [p.prenom, p.nom].filter(Boolean).join(" ") },
        subject: built.subject,
        html: built.html,
        text: built.text,
        unsubscribeUrl,
        tags: ["webinaire-per", "report_8nov", `session-${s1.id}`]
      });
      bilan.emailsEnvoyes += 1;
      await markWebinarPerReminderSent(email, MARQUEUR, undefined, s1.sheetEnv).catch((e) => console.error("[webinar-per] marquage report", email, e instanceof Error ? e.message : e));
    } catch (error) {
      bilan.erreurs += 1;
      console.error("[webinar-per] échec e-mail de report", email, error instanceof Error ? error.message : error);
      continue;
    }

    if (smsConfig && p.consent_sms && p.telephone) {
      try {
        await sendBrevoSms({ config: smsConfig, phone: p.telephone, text: SMS_TEXT, tag: "webinaire-per-report_8nov" });
        bilan.smsEnvoyes += 1;
      } catch (error) {
        bilan.erreurs += 1;
        console.error("[webinar-per] échec SMS de report", email, error instanceof Error ? error.message : error);
      }
    }

    if (!deja8.has(email)) {
      try {
        await appendWebinarPerRegistration({ prenom: p.prenom, nom: p.nom, email, telephone: p.telephone, consentEmail: true, consentSms: Boolean(p.consent_sms), status: "registered", source: `${s8.sourcePrefix}|report-1er-novembre` }, s8.sheetEnv);
        deja8.add(email);
        bilan.ajoutes8Novembre += 1;
      } catch (error) {
        bilan.erreurs += 1;
        console.error("[webinar-per] échec ajout au Sheet du 8 novembre", email, error instanceof Error ? error.message : error);
      }
    }
  }

  return NextResponse.json({ ok: true, ...bilan });
}

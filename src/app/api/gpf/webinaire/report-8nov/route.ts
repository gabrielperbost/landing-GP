import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { appendWebinarPerRegistration, getWebinarPerParticipants, markWebinarPerReminderSent } from "@/lib/webinarPerSheet";
import { buildWebinarPerEmail } from "@/lib/webinarPerEmails";
import { getBrevoTransactionalConfig, sendBrevoTransactionalEmail } from "@/lib/brevoTransactional";
import { getBrevoSmsConfig, sendBrevoSms, toE164FrenchPhone } from "@/lib/brevoSms";
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
  const cronSecret = (process.env.CRON_SECRET ?? "").trim();
  const parCron = Boolean(cronSecret) && request.headers.get("authorization") === `Bearer ${cronSecret}`;
  if (!parCron && !jetonValide(url.searchParams.get("jeton")) && !(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  // E-mail du replay aux inscrits du 8 novembre (à blanc sans envoyer=oui), copie à Gabriel. Anti-doublon : colonne replay_sent_at.
  if (url.searchParams.get("replay") === "oui") {
    const s8r = WEBINAR_PER_SESSIONS["2026-11-08"];
    const replayUrl = "https://youtu.be/fUH6g277TVI";
    const debutR = Date.parse(s8r.campaignStart);
    const vusR = new Set<string>();
    const ciblesR: { prenom: string; nom: string; email: string }[] = [];
    let dejaRecu = 0;
    for (const p of await getWebinarPerParticipants(s8r.sheetEnv)) {
      const email = String(p.email || "").trim().toLowerCase();
      if (!email || String(p.status).trim().toLowerCase() !== "registered" || !(Date.parse(p.created_at) >= debutR) || vusR.has(email)) continue;
      vusR.add(email);
      if (p.replay_sent_at) { dejaRecu += 1; continue; }
      ciblesR.push({ prenom: p.prenom, nom: p.nom, email });
    }
    const copie = "gabriel.perbost@gp-finances.fr";
    const rR = { aEnvoyer: ciblesR.length, dejaRecu, copieA: copie, emailsEnvoyes: 0, erreurs: 0 };
    const test = url.searchParams.get("test") === "oui"; // envoi à Gabriel seul, sans marquage
    if (!test && url.searchParams.get("envoyer") !== "oui") return NextResponse.json({ ok: true, aBlanc: true, ...rR });
    const cfg = getBrevoTransactionalConfig();
    if (!cfg) return NextResponse.json({ ok: false, error: "brevo_non_configure" }, { status: 503 });
    const destinataires = test ? [{ prenom: "Gabriel", nom: "", email: copie }] : [...ciblesR, ...(vusR.has(copie) ? [] : [{ prenom: "Gabriel", nom: "", email: copie }])];
    if (test) rR.aEnvoyer = 1;
    for (const c of destinataires) {
      const unsubscribeUrl = getWebinarPerUnsubscribeUrl(c.email, s8r);
      try {
        const built = buildWebinarPerEmail("replay", { prenom: c.prenom, email: c.email }, { unsubscribeUrl, replayUrl, session: s8r });
        await sendBrevoTransactionalEmail({ config: cfg, to: { email: c.email, name: [c.prenom, c.nom].filter(Boolean).join(" ") }, subject: built.subject, html: built.html, text: built.text, unsubscribeUrl, tags: ["webinaire-per", "replay", `session-${s8r.id}`] });
        rR.emailsEnvoyes += 1;
        if (!test && c.email !== copie) await markWebinarPerReminderSent(c.email, "replay_sent_at", undefined, s8r.sheetEnv).catch(() => undefined);
      } catch {
        rR.erreurs += 1;
      }
    }
    return NextResponse.json({ ok: true, ...rR });
  }
  // SMS « dans 1 heure » aux inscrits SMS du 8 novembre (à blanc sans envoyer=oui). Un seul clic : pas de marqueur anti-doublon.
  if (url.searchParams.get("sms_1h") === "oui") {
    const s8h = WEBINAR_PER_SESSIONS["2026-11-08"];
    const debutH = Date.parse(s8h.campaignStart);
    const smsCfg = getBrevoSmsConfig();
    if (!smsCfg) return NextResponse.json({ ok: false, error: "sms_non_configure" }, { status: 503 });
    const vusH = new Set<string>();
    const ciblesH: string[] = [];
    for (const p of await getWebinarPerParticipants(s8h.sheetEnv)) {
      if (String(p.status).trim().toLowerCase() !== "registered" || !p.consent_sms || !(Date.parse(p.created_at) >= debutH)) continue;
      const tel = p.telephone ? toE164FrenchPhone(p.telephone) : null;
      if (tel && !vusH.has(tel)) (vusH.add(tel), ciblesH.push(tel));
    }
    // Copie à Gabriel pour contrôler la réception.
    if (!vusH.has("+33651224213")) (vusH.add("+33651224213"), ciblesH.push("+33651224213"));
    const rH = { aEnvoyer: ciblesH.length, smsEnvoyes: 0, erreurs: 0 };
    if (url.searchParams.get("envoyer") !== "oui") return NextResponse.json({ ok: true, aBlanc: true, ...rH });
    const moment = url.searchParams.get("moment");
    const texte =
      moment === "10min"
        ? "GP Finances : votre webinaire PER commence dans 10 minutes (15h). Le lien de connexion est dans votre e-mail. STOP au 06 51 22 42 13"
        : moment === "maintenant"
          ? "GP Finances : le webinaire PER commence maintenant ! Rejoignez-nous avec le lien reçu par e-mail. STOP au 06 51 22 42 13"
          : "GP Finances : votre webinaire PER commence dans 1h, à 15h. Le lien de connexion est dans votre e-mail. STOP au 06 51 22 42 13";
    const tagMoment = moment === "10min" ? "reminder_10min" : moment === "maintenant" ? "reminder_live" : "reminder_1h";
    for (const tel of ciblesH) {
      try {
        await sendBrevoSms({ config: smsCfg, phone: tel, text: texte, tag: `webinaire-per-${tagMoment}` });
        rH.smsEnvoyes += 1;
      } catch {
        rH.erreurs += 1;
      }
    }
    return NextResponse.json({ ok: true, ...rH });
  }
  // Liste CSV pour une campagne SMS Brevo : inscrits du 8 novembre ayant accepté les SMS, numéro au format international.
  if (url.searchParams.get("export") === "sms") {
    const s8e = WEBINAR_PER_SESSIONS["2026-11-08"];
    const debut8 = Date.parse(s8e.campaignStart);
    const vus = new Set<string>();
    const lignes = ["SMS;PRENOM;NOM;EMAIL"];
    for (const p of await getWebinarPerParticipants(s8e.sheetEnv)) {
      if (String(p.status).trim().toLowerCase() !== "registered" || !p.consent_sms || !(Date.parse(p.created_at) >= debut8)) continue;
      const tel = p.telephone ? toE164FrenchPhone(p.telephone) : null;
      if (!tel || vus.has(tel)) continue;
      vus.add(tel);
      const c = (v: unknown) => String(v ?? "").replace(/[;\r\n]/g, " ").trim();
      lignes.push([tel.replace(/^\+/, ""), c(p.prenom), c(p.nom), c(p.email)].join(";"));
    }
    return new NextResponse(lignes.join("\n") + "\n", { headers: { "content-type": "text/csv; charset=utf-8", "cache-control": "no-store" } });
  }
  // Diagnostic des SMS du 8 novembre : comptages uniquement, aucune donnée personnelle.
  if (url.searchParams.get("diag") === "sms") {
    const s8d = WEBINAR_PER_SESSIONS["2026-11-08"];
    const liste = await getWebinarPerParticipants(s8d.sheetEnv);
    const compte = (f: (p: (typeof liste)[number]) => string) => liste.reduce<Record<string, number>>((acc, p) => ((acc[f(p)] = (acc[f(p)] ?? 0) + 1), acc), {});
    return NextResponse.json({
      ok: true,
      inscrits: liste.length,
      smsConfigure: Boolean(getBrevoSmsConfig()),
      statut: compte((p) => String(p.status)),
      consentSms: compte((p) => `${typeof p.consent_sms}:${String(p.consent_sms)}`),
      telephone: compte((p) => (p.telephone == null || p.telephone === "" ? "vide" : `${typeof p.telephone}:${toE164FrenchPhone(p.telephone) ? "valide" : "invalide"}`)),
      rappelMatin: compte((p) => (p.reminder_morning_sent_at ? "marque" : "non")),
      rappelVeille: compte((p) => (p.reminder_1d_sent_at ? "marque" : "non"))
    });
  }
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
  // Renvoi du SMS seul aux inscrits déjà prévenus par e-mail dont le numéro est un nombre dans le Sheet
  // (premier envoi en échec sur ces numéros ; ceux enregistrés en texte ont déjà reçu le SMS).
  if (url.searchParams.get("sms_seul") === "oui") {
    const smsConfig = getBrevoSmsConfig();
    if (!smsConfig) return NextResponse.json({ ok: false, error: "sms_non_configure" }, { status: 503 });
    const aRelancer = cibles.filter((p) => Date.parse(String(p[MARQUEUR] ?? "")) >= ANNULATION && p.consent_sms && typeof p.telephone === "number");
    const r = { smsARenvoyer: aRelancer.length, smsEnvoyes: 0, erreurs: 0, detailsErreurs: [] as string[] };
    if (!envoyer) return NextResponse.json({ ok: true, aBlanc: true, ...r });
    for (const p of aRelancer) {
      try {
        await sendBrevoSms({ config: smsConfig, phone: p.telephone, text: SMS_TEXT, tag: "webinaire-per-report_8nov" });
        r.smsEnvoyes += 1;
      } catch (error) {
        r.erreurs += 1;
        r.detailsErreurs.push(error instanceof Error ? error.message.slice(0, 120) : "erreur");
      }
    }
    return NextResponse.json({ ok: true, ...r });
  }

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

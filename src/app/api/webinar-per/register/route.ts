import { NextResponse } from "next/server";
import { appendWebinarPerRegistration, isWebinarPerSheetConfigured } from "@/lib/webinarPerSheet";
import { buildWebinarPerEmail, WEBINAR_PER_GUIDE_URL } from "@/lib/webinarPerEmails";
import { getBrevoTransactionalConfig, sendBrevoTransactionalEmail } from "@/lib/brevoTransactional";
import { getBrevoSmsConfig, sendBrevoSms, toE164FrenchPhone } from "@/lib/brevoSms";
import { getWebinarPerSession, getWebinarPerUnsubscribeUrl } from "@/lib/webinarPerConfig";
import { ingererLead } from "@/lib/gpf/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value: unknown) => String(value ?? "").trim();
const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400, headers });
  }

  const prenom = clean(body.prenom).slice(0, 60);
  const nom = clean(body.nom).slice(0, 60);
  const email = clean(body.email).toLowerCase().slice(0, 160);
  const telephoneRaw = clean(body.telephone).slice(0, 30);
  // Le téléphone est obligatoire : un seul consentement couvre l'e-mail et le SMS.
  const consent = body.consent === true;
  const session = getWebinarPerSession(body.session);
  // La source commence toujours par le préfixe de la session (repère la session dans le Sheet), suivi des UTM.
  const rawSource = clean(body.source).slice(0, 200);
  const source = session.sourcePrefix + (rawSource.includes("|") ? rawSource.slice(rawSource.indexOf("|")) : "");

  if (prenom.length < 2) return NextResponse.json({ ok: false, error: "prenom_invalide" }, { status: 400, headers });
  if (nom.length < 2) return NextResponse.json({ ok: false, error: "nom_invalide" }, { status: 400, headers });
  if (!emailRegex.test(email)) return NextResponse.json({ ok: false, error: "email_invalide" }, { status: 400, headers });
  if (!consent) return NextResponse.json({ ok: false, error: "consentement_requis" }, { status: 400, headers });
  const phone = telephoneRaw ? toE164FrenchPhone(telephoneRaw) : null;
  if (!phone) return NextResponse.json({ ok: false, error: "telephone_invalide" }, { status: 400, headers });
  const consentSms = consent && Boolean(phone);

  if (!isWebinarPerSheetConfigured(session.sheetEnv)) {
    console.warn(`[webinar-per] inscription refusée : Google Sheet non configuré (${session.sheetEnv}_GOOGLE_APPS_SCRIPT_URL/SECRET manquants)`);
    return NextResponse.json({ ok: false, error: "service_indisponible" }, { status: 503, headers });
  }

  try {
    await appendWebinarPerRegistration(
      { prenom, nom, email, telephone: phone || undefined, consentEmail: consent, consentSms, source },
      session.sheetEnv
    );
  } catch (error) {
    console.error("[webinar-per] échec écriture Google Sheet", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "service_indisponible" }, { status: 503, headers });
  }

  // Lead dans le CRM GPF (page Leads) : contact, dossier PER « à traiter », tâche d'appel. Idempotent par
  // session + e-mail. La source dit la session et le canal (« … · meta » est compté en Meta Ads par le CRM).
  const utmSource = /\|utm_source:([^|]+)/.exec(source)?.[1] ?? "direct";
  try {
    const lead = await ingererLead({
      source: `Webinaire PER ${session.dateLabel.replace(/^Dimanche /, "")} · ${utmSource}`,
      sourceRef: `webinaire-per:${session.id}:${email}`,
      prenom,
      nom,
      email,
      telephone: phone,
      produit: "per",
      message: `Inscrit(e) au webinaire PER du ${session.dateLabel}, ${session.timeLabel}. Source : ${source}`
    });
    if (!lead.ok) console.error("[webinar-per] lead CRM non créé", lead.error);
  } catch (error) {
    console.error("[webinar-per] échec création lead CRM", error instanceof Error ? error.message : error);
  }

  // L'échec d'un canal (e-mail ou SMS) ne doit jamais faire échouer l'inscription déjà enregistrée.
  const unsubscribeUrl = getWebinarPerUnsubscribeUrl(email, session);
  const brevoEmailConfig = getBrevoTransactionalConfig();
  if (brevoEmailConfig) {
    try {
      const email_ = buildWebinarPerEmail("confirmation", { prenom, email }, { unsubscribeUrl, session });
      await sendBrevoTransactionalEmail({
        config: brevoEmailConfig,
        to: { email, name: [prenom, nom].filter(Boolean).join(" ") },
        subject: email_.subject,
        html: email_.html,
        text: email_.text,
        unsubscribeUrl,
        tags: ["webinaire-per", "confirmation", `session-${session.id}`],
        attachment: [{ url: WEBINAR_PER_GUIDE_URL, name: "Guide-PER-GP-Finances.pdf" }]
      });
    } catch (error) {
      console.error("[webinar-per] échec e-mail de confirmation", error instanceof Error ? error.message : error);
    }
  } else {
    console.warn("[webinar-per] BREVO_API_KEY manquant : e-mail de confirmation non envoyé");
  }

  if (consentSms && phone) {
    const smsConfig = getBrevoSmsConfig();
    if (smsConfig) {
      try {
        await sendBrevoSms({
          config: smsConfig,
          phone,
          text: `GP Finances : inscription confirmée au webinaire PER du ${session.dateLabel} à ${session.timeLabel.split(" ")[0]}. Lien + guide PER par e-mail. STOP au 06 51 22 42 13.`,
          tag: "webinaire-per-confirmation"
        });
      } catch (error) {
        console.error("[webinar-per] échec SMS de confirmation", error instanceof Error ? error.message : error);
      }
    } else {
      console.warn("[webinar-per] BREVO_API_KEY manquant : SMS de confirmation non envoyé");
    }
  }

  return NextResponse.json({ ok: true }, { headers });
}

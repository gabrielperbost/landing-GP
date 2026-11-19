import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { getWebinarPerParticipants } from "@/lib/webinarPerSheet";
import { getWebinarParticipantsFromSheet } from "@/lib/googleSheetsWebinar";
import { createWebinarUnsubscribeToken } from "@/lib/webinarAvocatsTokens";
import { getBrevoTransactionalConfig, sendBrevoTransactionalEmail } from "@/lib/brevoTransactional";
import { WEBINAR_PER_SESSIONS, getWebinarPerUnsubscribeUrl, type WebinarPerSession } from "@/lib/webinarPerConfig";
import { buildEmailRelance, RELANCE_CALENDRIER, type CampagneRelance } from "@/lib/relanceRdv";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* Campagne de relance « prise de rendez-vous » (voir src/lib/relanceRdv.ts).
 *   Cron (mardi et jeudi 12h, deux passages) → envoie l'e-mail du jour aux deux campagnes.
 *   ?jeton=…&test=oui[&mail=1..8|tous][&campagne=public|avocats] → envoi à Gabriel seul.
 *   ?jeton=…[&mail=n]          → comptage à blanc (destinataires, exclus).
 *   ?jeton=…&mail=n&envoyer=oui → envoi manuel (anti-doublon : un envoi déjà accepté par Brevo n'est jamais refait).
 *   ?jeton=…&stats=oui          → ouvertures et clics rendez-vous par e-mail.
 * Exclus : Catherine SPAGNOL, Thibault GUERIN, désinscrits, inscrits sans accord e-mail, contacts ayant pris rendez-vous sur Calendly. */

const JETON_SHA256 = "e48597939f53a2f883e7b607ce75481f79e2127dbca65f7c0fe1869d27cea5c5";
const jetonValide = (jeton: string | null) => Boolean(jeton) && crypto.createHash("sha256").update(String(jeton)).digest("hex") === JETON_SHA256;
const GABRIEL = "gabriel.perbost@gp-finances.fr";
const DEBUT = "2026-11-19";
const EXCLUS_NOMS: [string, string][] = [
  ["catherine", "spagnol"],
  ["thibault", "guerin"]
];
const EXCLUS_AVOCATS = new Set(["benjamin.valette@vulpi-avocats.com", "sophie-greiner@protonmail.com", "bremant@bremant-associes.com"]);

type Cible = { prenom: string; nom: string; email: string; unsubscribeUrl: string };
type Bilan = { campagne: CampagneRelance; mail: number; cibles: number; dejaEnvoye: number; envoyes: number; erreurs: number; exclus: string[] };

const sansAccent = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const estExcluParNom = (prenom: string, nom: string) => {
  const complet = `${sansAccent(prenom)} ${sansAccent(nom)}`;
  return EXCLUS_NOMS.some(([pr, n]) => complet.includes(pr) && complet.includes(n));
};
const dateParis = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const tag = (c: CampagneRelance, n: number) => `relance-${c}-m${n}`;
const baseUrl = () => (process.env.NEXT_PUBLIC_BASE_URL || "https://gp-finances.fr").replace(/\/+$/, "");

/** E-mails des contacts ayant réservé sur Calendly depuis le webinaire PER grand public (septembre pour les avocats). */
const emailsAvecRendezVous = async () => {
  const set = new Set<string>();
  if (!isSupabaseConfigured) return set;
  const { data: rdv } = await supabaseAdmin.from("gpf_appointments").select("client_id").eq("source", "calendly").gte("created_at", "2026-09-17").is("deleted_at", null);
  const ids = [...new Set((rdv ?? []).map((r) => r.client_id).filter(Boolean))] as string[];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabaseAdmin.from("gpf_clients").select("email").in("id", ids.slice(i, i + 200));
    (data ?? []).forEach((c) => c.email && set.add(String(c.email).trim().toLowerCase()));
  }
  return set;
};

const ciblesPublic = async (rdv: Set<string>) => {
  const exclus: string[] = [];
  const desinscrits = new Set<string>();
  const parEmail = new Map<string, { p: { prenom: string; nom: string; email: string; consent_email: boolean | string }; session: WebinarPerSession }>();
  // Le Sheet du 8 novembre en dernier : il contient aussi les inscrits du 1er (reportés), son lien de désinscription prime.
  for (const session of [WEBINAR_PER_SESSIONS["2026-11-01"], WEBINAR_PER_SESSIONS["2026-11-08"]]) {
    const debut = Date.parse(session.campaignStart);
    for (const p of await getWebinarPerParticipants(session.sheetEnv)) {
      const email = String(p.email || "").trim().toLowerCase();
      if (!email || !(Date.parse(p.created_at) >= debut)) continue;
      if (String(p.status).trim().toLowerCase() !== "registered") desinscrits.add(email);
      else parEmail.set(email, { p: { prenom: p.prenom, nom: p.nom, email, consent_email: p.consent_email }, session });
    }
  }
  const cibles: Cible[] = [];
  for (const [email, { p, session }] of parEmail) {
    const nomComplet = [p.prenom, p.nom].filter(Boolean).join(" ");
    const accord = p.consent_email === true || String(p.consent_email).trim().toLowerCase() === "oui" || String(p.consent_email).trim().toLowerCase() === "true";
    if (email === GABRIEL) continue;
    if (estExcluParNom(p.prenom, p.nom)) exclus.push(`${nomComplet} (exclu à ta demande)`);
    else if (desinscrits.has(email)) exclus.push(`${nomComplet} (désinscrit)`);
    else if (!accord) exclus.push(`${nomComplet} (sans accord e-mail)`);
    else if (rdv.has(email)) exclus.push(`${nomComplet} (a déjà pris rendez-vous)`);
    else cibles.push({ prenom: p.prenom, nom: p.nom, email, unsubscribeUrl: getWebinarPerUnsubscribeUrl(email, session) });
  }
  return { cibles, exclus };
};

const ciblesAvocats = async (rdv: Set<string>) => {
  const exclus: string[] = [];
  const participants = (await getWebinarParticipantsFromSheet()) ?? [];
  const desinscrits = new Set(EXCLUS_AVOCATS);
  participants.filter((p) => p.status.trim().toLowerCase() === "unsubscribed").forEach((p) => desinscrits.add(p.email.trim().toLowerCase()));
  const inscrits = new Map<string, { prenom: string; nom: string }>();
  participants
    .filter((p) => p.status.trim().toLowerCase() === "registered")
    .forEach((p) => {
      const email = p.email.trim().toLowerCase();
      if (email) inscrits.set(email, { prenom: p.prenom, nom: p.nom });
    });
  if (isSupabaseConfigured && inscrits.size) {
    const { data } = await supabaseAdmin.from("webinar_avocats_unsubscribes").select("email").in("email", [...inscrits.keys()]);
    (data ?? []).forEach((r) => desinscrits.add(String(r.email).trim().toLowerCase()));
  }
  const cibles: Cible[] = [];
  for (const [email, p] of inscrits) {
    const nomComplet = [p.prenom, p.nom].filter(Boolean).join(" ");
    if (email === GABRIEL) continue;
    if (estExcluParNom(p.prenom, p.nom)) exclus.push(`${nomComplet} (exclu à ta demande)`);
    else if (desinscrits.has(email)) exclus.push(`${nomComplet} (désinscrit)`);
    else if (rdv.has(email)) exclus.push(`${nomComplet} (a déjà pris rendez-vous)`);
    else cibles.push({ prenom: p.prenom, nom: p.nom, email, unsubscribeUrl: `${baseUrl()}/api/webinar-avocats/unsubscribe?email=${encodeURIComponent(email)}&token=${createWebinarUnsubscribeToken(email)}` });
  }
  return { cibles, exclus };
};

/** Événements Brevo d'un tag (pour l'anti-doublon et le suivi). */
const evenementsBrevo = async (apiKey: string, t: string, event?: string) => {
  const out: { email: string; event: string; link?: string }[] = [];
  for (let offset = 0; offset < 20000; offset += 2500) {
    const q = new URLSearchParams({ tags: t, startDate: DEBUT, endDate: dateParis(), limit: "2500", offset: String(offset), sort: "desc" });
    if (event) q.set("event", event);
    const r = await fetch(`https://api.brevo.com/v3/smtp/statistics/events?${q}`, { headers: { accept: "application/json", "api-key": apiKey }, cache: "no-store" });
    if (!r.ok) throw new Error(`brevo_${r.status}`);
    const page = ((await r.json()) as { events?: typeof out }).events ?? [];
    out.push(...page);
    if (page.length < 2500) break;
  }
  return out;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const cronSecret = (process.env.CRON_SECRET ?? "").trim();
  const parCron = Boolean(cronSecret) && request.headers.get("authorization") === `Bearer ${cronSecret}`;
  if (!parCron && !jetonValide(url.searchParams.get("jeton")) && !(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const cfg = getBrevoTransactionalConfig();
  const campagnes: CampagneRelance[] = url.searchParams.get("campagne") === "public" ? ["public"] : url.searchParams.get("campagne") === "avocats" ? ["avocats"] : ["public", "avocats"];

  // Suivi : par e-mail et par campagne, destinataires, ouvertures, clics rendez-vous.
  if (url.searchParams.get("stats") === "oui") {
    if (!cfg) return NextResponse.json({ ok: false, error: "brevo_non_configure" }, { status: 503 });
    const lignes = [];
    for (const c of campagnes)
      for (let n = 1; n <= 8; n += 1) {
        const ev = await evenementsBrevo(cfg.apiKey, tag(c, n));
        if (!ev.length) continue;
        const u = (f: (e: (typeof ev)[number]) => boolean) => [...new Set(ev.filter(f).map((e) => e.email.toLowerCase()))].filter((e) => e !== GABRIEL);
        lignes.push({
          campagne: c,
          mail: n,
          delivres: u((e) => e.event === "delivered").length,
          ouverts: u((e) => ["opened", "uniqueOpened", "proxyOpen"].includes(e.event)).length,
          clicsRendezVous: u((e) => e.event === "clicks" && /calendly/.test(e.link ?? "")),
          desinscriptions: u((e) => e.event === "clicks" && /unsubscribe|desinscription/.test(e.link ?? "")).length,
          echecs: u((e) => ["hardBounces", "softBounces", "blocked", "invalid", "error"].includes(e.event)).length
        });
      }
    return NextResponse.json({ ok: true, note: "Les ouvertures sont surestimées (Apple Mail) ; les clics sont fiables.", lignes });
  }

  // Envoi test : à Gabriel seul, sans marquage.
  if (url.searchParams.get("test") === "oui") {
    if (!cfg) return NextResponse.json({ ok: false, error: "brevo_non_configure" }, { status: 503 });
    const m = url.searchParams.get("mail");
    const numeros = m === "tous" ? [1, 2, 3, 4, 5, 6, 7, 8] : [Math.min(8, Math.max(1, Number(m) || 1))];
    const envoyes: string[] = [];
    for (const c of campagnes)
      for (const n of numeros) {
        const e = buildEmailRelance(c, n, { prenom: "Gabriel", unsubscribeUrl: `${baseUrl()}/` });
        await sendBrevoTransactionalEmail({ config: cfg, to: { email: GABRIEL, name: "Gabriel PERBOST" }, subject: `[TEST ${c} ${n}/8] ${e.subject}`, html: e.html, text: e.text, tags: ["relance-rdv-test"] });
        envoyes.push(`${c} ${n}/8 : ${e.subject}`);
      }
    return NextResponse.json({ ok: true, test: true, a: GABRIEL, envoyes });
  }

  const mailParam = Number(url.searchParams.get("mail"));
  const numero = mailParam >= 1 && mailParam <= 8 ? mailParam : RELANCE_CALENDRIER[dateParis()];
  if (!numero) return NextResponse.json({ ok: true, rien: "aucun e-mail prévu aujourd'hui", calendrier: RELANCE_CALENDRIER });
  const envoyer = parCron || url.searchParams.get("envoyer") === "oui";
  if (envoyer && !cfg) return NextResponse.json({ ok: false, error: "brevo_non_configure" }, { status: 503 });

  const rdv = await emailsAvecRendezVous();
  const bilans: Bilan[] = [];
  for (const c of campagnes) {
    const { cibles, exclus } = c === "public" ? await ciblesPublic(rdv) : await ciblesAvocats(rdv);
    const deja = cfg ? new Set((await evenementsBrevo(cfg.apiKey, tag(c, numero), "requests")).map((e) => e.email.toLowerCase())) : new Set<string>();
    const aFaire = cibles.filter((x) => !deja.has(x.email));
    const bilan: Bilan = { campagne: c, mail: numero, cibles: aFaire.length, dejaEnvoye: cibles.length - aFaire.length, envoyes: 0, erreurs: 0, exclus };
    if (envoyer && cfg) {
      for (const x of aFaire) {
        try {
          const e = buildEmailRelance(c, numero, { prenom: x.prenom, unsubscribeUrl: x.unsubscribeUrl });
          await sendBrevoTransactionalEmail({ config: cfg, to: { email: x.email, name: [x.prenom, x.nom].filter(Boolean).join(" ") }, subject: e.subject, html: e.html, text: e.text, unsubscribeUrl: x.unsubscribeUrl, tags: ["relance-rdv", tag(c, numero)] });
          bilan.envoyes += 1;
        } catch {
          bilan.erreurs += 1;
        }
      }
      // Copie à Gabriel (une par e-mail et par campagne) pour voir ce qui est parti.
      if (bilan.envoyes > 0 && !deja.has(GABRIEL)) {
        const e = buildEmailRelance(c, numero, { prenom: "Gabriel", unsubscribeUrl: `${baseUrl()}/` });
        await sendBrevoTransactionalEmail({ config: cfg, to: { email: GABRIEL, name: "Gabriel PERBOST" }, subject: `[Copie ${c} ${numero}/8 · ${bilan.envoyes} envois] ${e.subject}`, html: e.html, text: e.text, tags: ["relance-rdv", tag(c, numero)] }).catch(() => undefined);
      }
    }
    bilans.push(bilan);
  }
  return NextResponse.json({ ok: true, aBlanc: !envoyer, bilans });
}

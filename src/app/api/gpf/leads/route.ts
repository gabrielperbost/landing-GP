import { NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { baseUrl } from "@/lib/gpf/leads";
import { normSource } from "@/lib/gpf/sources";
import { GPF_STATUTS_SIGNES, formatNom } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mediane = (v: number[]) => {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/**
 * Arrivée des leads : délai de premier contact (premier appel ou contact
 * enregistré), leads à appeler avec le temps écoulé, répartition par source
 * sur 30 jours, journal des leads reçus et état des connexions.
 */
export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const depuis = new Date(Date.now() - 30 * 86400000).toISOString();
  const [{ data: clients }, { data: appels }, { data: dossiers }, evenements] = await Promise.all([
    supabaseAdmin.from("gpf_clients").select("id, prenom, nom, provenance, source, telephone, created_at, dernier_contact_at, score").is("deleted_at", null).gte("created_at", new Date(Date.now() - 90 * 86400000).toISOString()),
    supabaseAdmin.from("gpf_calls").select("client_id, created_at").gte("created_at", new Date(Date.now() - 90 * 86400000).toISOString()).order("created_at"),
    supabaseAdmin.from("gpf_dossiers").select("client_id, statut, contrat_statut").is("deleted_at", null),
    supabaseAdmin.from("gpf_lead_events").select("*").not("source", "ilike", "webinaire %").order("created_at", { ascending: false }).limit(50)
  ]);
  const premierAppel = new Map<string, string>();
  for (const a of appels ?? []) if (!premierAppel.has(a.client_id)) premierAppel.set(a.client_id, a.created_at);
  const signes = new Set((dossiers ?? []).filter((d) => d.contrat_statut || GPF_STATUTS_SIGNES.has(d.statut)).map((d) => d.client_id));

  // Inscrits aux webinaires : suivis dans la carte « Campagnes », hors délais de rappel et liste « À appeler ».
  const leads = (clients ?? []).filter((c) => !/^webinaire /i.test(c.provenance ?? "")).map((c) => {
    const premier = [premierAppel.get(c.id), c.dernier_contact_at].filter(Boolean).sort()[0] ?? null;
    const delaiMin = premier ? Math.max(0, Math.round((new Date(premier).getTime() - new Date(c.created_at).getTime()) / 60000)) : null;
    return { ...c, nomComplet: formatNom(c), source: normSource(c.provenance ?? c.source), premierContact: premier, delaiMin, signe: signes.has(c.id) };
  });
  const recents = leads.filter((l) => l.created_at >= depuis);
  const delais = recents.map((l) => l.delaiMin).filter((x): x is number => x != null);
  const parSource = new Map<string, { source: string; leads: number; contactes: number; signes: number }>();
  for (const l of recents) {
    const s = parSource.get(l.source) ?? { source: l.source, leads: 0, contactes: 0, signes: 0 };
    s.leads++;
    if (l.premierContact) s.contactes++;
    if (l.signe) s.signes++;
    parSource.set(l.source, s);
  }
  const nomDe = new Map(leads.map((l) => [l.id, l.nomComplet]));
  const secret = process.env.GPF_WEBHOOK_SECRET?.trim();
  const base = baseUrl();

  return NextResponse.json({
    ok: true,
    stats: {
      leads30: recents.length,
      contactes30: recents.filter((l) => l.premierContact).length,
      delaiMoyenMin: delais.length ? Math.round(delais.reduce((s, x) => s + x, 0) / delais.length) : null,
      delaiMedianMin: mediane(delais),
      sousUneHeure: delais.length ? Math.round((delais.filter((d) => d <= 60).length / delais.length) * 100) : null
    },
    aAppeler: leads
      .filter((l) => !l.premierContact && !l.signe)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 50)
      .map((l) => ({ id: l.id, nom: l.nomComplet, source: l.source, telephone: l.telephone, created_at: l.created_at, score: l.score })),
    derniersContactes: recents
      .filter((l) => l.delaiMin != null)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 20)
      .map((l) => ({ id: l.id, nom: l.nomComplet, source: l.source, delaiMin: l.delaiMin })),
    parSource: Array.from(parSource.values()).sort((a, b) => b.leads - a.leads),
    evenements: evenements.error ? [] : (evenements.data ?? []).map((e) => ({ ...e, client: e.client_id ? nomDe.get(e.client_id) ?? null : null })),
    connexions: {
      secretConfigure: Boolean(secret),
      tally: secret ? `${base}/api/gpf/webhooks/tally?secret=${secret}` : null,
      calendly: secret ? `${base}/api/gpf/webhooks/calendly?secret=${secret}` : null,
      meta: `${base}/api/gpf/webhooks/meta`,
      metaVerifyToken: secret ?? null,
      metaPret: Boolean(process.env.META_APP_SECRET && process.env.META_PAGE_ACCESS_TOKEN),
      calendlySigne: Boolean(process.env.CALENDLY_SIGNING_KEY)
    }
  });
}

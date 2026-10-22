import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { membresSegment, type Filtres } from "@/lib/gpf/segments";
import { envoyerLot } from "@/lib/gpf/campagnes";
import { baseUrl, personnaliser } from "@/lib/gpf/leads";
import { cabinetEmail, sendGpfMail } from "@/lib/gpf/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Actions sur une campagne : test (envoi au cabinet), modifier (brouillon),
 * lancer (fige la liste des destinataires joignables et non désabonnés),
 * envoyer un lot (appelé par l'écran tant qu'il reste des e-mails), annuler.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const { data: c } = await supabaseAdmin.from("gpf_campagnes").select("*").eq("id", params.id).single();
  if (!c) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });

  switch (body?.action) {
    case "test": {
      const { texte, html } = personnaliser(c.corps, { prenom: "Gabriel", nom: "PERBOST", desabo_token: null }, baseUrl());
      await sendGpfMail({ to: cabinetEmail(), subject: `[Test] ${c.sujet.replace(/\{prenom\}/gi, "Gabriel")}`, text: texte, html });
      return NextResponse.json({ ok: true });
    }
    case "modifier": {
      if (c.statut !== "brouillon") return NextResponse.json({ ok: false, error: "deja_lancee" }, { status: 409 });
      const patch: Record<string, unknown> = {};
      for (const k of ["nom", "sujet", "corps", "filtres"]) if (k in body) patch[k] = body[k];
      await supabaseAdmin.from("gpf_campagnes").update(patch).eq("id", params.id);
      return NextResponse.json({ ok: true });
    }
    case "lancer": {
      if (c.statut !== "brouillon") return NextResponse.json({ ok: false, error: "deja_lancee" }, { status: 409 });
      const membres = (await membresSegment(c.filtres as Filtres)).filter((m) => m.email && !m.desabonne);
      if (!membres.length) return NextResponse.json({ ok: false, error: "aucun_destinataire" }, { status: 400 });
      for (let i = 0; i < membres.length; i += 500) {
        await supabaseAdmin.from("gpf_campagne_envois").upsert(
          membres.slice(i, i + 500).map((m) => ({ campagne_id: c.id, client_id: m.id, email: m.email! })),
          { onConflict: "campagne_id,client_id", ignoreDuplicates: true }
        );
      }
      await supabaseAdmin.from("gpf_campagnes").update({ statut: "en_cours", nb_destinataires: membres.length, lancee_at: new Date().toISOString() }).eq("id", c.id);
      return NextResponse.json({ ok: true, destinataires: membres.length });
    }
    case "envoyer":
      return NextResponse.json({ ok: true, ...(await envoyerLot(c.id, 20)) });
    case "annuler":
      await supabaseAdmin.from("gpf_campagnes").update({ statut: "annulee", terminee_at: new Date().toISOString() }).eq("id", c.id);
      return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "action_invalide" }, { status: 400 });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data: c } = await supabaseAdmin.from("gpf_campagnes").select("statut").eq("id", params.id).single();
  if (c?.statut !== "brouillon") return NextResponse.json({ ok: false, error: "seul_un_brouillon" }, { status: 409 });
  await supabaseAdmin.from("gpf_campagnes").delete().eq("id", params.id);
  return NextResponse.json({ ok: true });
}

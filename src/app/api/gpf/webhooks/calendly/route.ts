import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ingererLead } from "@/lib/gpf/leads";
import { notify } from "@/lib/gpf/notify";
import { egalConstant, secretValide } from "@/lib/gpf/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Signature Calendly : en-tête « t=…,v1=… », HMAC-SHA256 de « t.corps ». */
function signatureCalendly(request: NextRequest, brut: string) {
  const cle = process.env.CALENDLY_SIGNING_KEY?.trim();
  if (!cle) return secretValide(request);
  const h = request.headers.get("calendly-webhook-signature") ?? "";
  const t = h.match(/t=([^,]+)/)?.[1];
  const v1 = h.match(/v1=([^,]+)/)?.[1];
  if (!t || !v1) return false;
  return egalConstant(v1, crypto.createHmac("sha256", cle).update(`${t}.${brut}`).digest("hex"));
}

/**
 * Webhook Calendly (invitee.created / invitee.canceled) : le rendez-vous est
 * ajouté à l'agenda, le contact créé ou retrouvé (score chaud).
 */
export async function POST(request: NextRequest) {
  const brut = await request.text();
  if (!signatureCalendly(request, brut)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = JSON.parse(brut || "{}");
  const p = body.payload ?? {};
  const ref = String(p.uri ?? p.invitee?.uri ?? "");
  if (!ref) return NextResponse.json({ ok: false, error: "payload" }, { status: 400 });

  if (body.event === "invitee.canceled") {
    await supabaseAdmin.from("gpf_appointments").update({ statut: "annule" }).eq("source", "calendly").eq("source_ref", ref);
    await notify("info", `RDV Calendly annulé : ${p.name ?? ""}`.trim(), p.cancellation?.reason ?? undefined, "/gpf/agenda");
    return NextResponse.json({ ok: true });
  }
  if (body.event !== "invitee.created") return NextResponse.json({ ok: true, ignore: body.event });

  const ev = p.scheduled_event ?? {};
  const telephone = (p.questions_and_answers ?? []).find((q: { question: string }) => /t[ée]l[ée]phone|phone|portable/i.test(q.question))?.answer ?? p.text_reminder_number ?? null;
  const r = await ingererLead({ source: "Calendly", sourceRef: ref, prenom: p.first_name ?? p.name, nom: p.last_name ?? null, email: p.email, telephone, produit: ev.name ?? null });
  if (!r.ok || !r.client_id) return NextResponse.json(r, { status: 400 });

  const debut = ev.start_time ? new Date(ev.start_time) : null;
  const fin = ev.end_time ? new Date(ev.end_time) : null;
  if (debut) {
    await supabaseAdmin.from("gpf_appointments").insert({
      client_id: r.client_id,
      titre: ev.name ?? "Rendez-vous Calendly",
      debut: debut.toISOString(),
      duree_min: fin ? Math.round((fin.getTime() - debut.getTime()) / 60000) : 30,
      lien_visio: ev.location?.join_url ?? null,
      lieu: ev.location?.location ?? null,
      source: "calendly",
      source_ref: ref
    });
    await supabaseAdmin.from("gpf_clients").update({ score: "chaud" }).eq("id", r.client_id).eq("score_manuel", false);
    await notify("info", `Nouveau RDV Calendly : ${p.name ?? ""}`.trim(), debut.toLocaleString("fr-FR", { timeZone: "Europe/Paris" }), `/gpf/contacts/${r.client_id}`);
  }
  return NextResponse.json({ ok: true, client_id: r.client_id });
}

import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { appelClaude, iaDisponible, MODELE_ASSISTANT, type Message } from "@/lib/gpf/anthropic";
import { executerOutil, OUTILS, type Proposition, type Source } from "@/lib/gpf/assistant";
import { CABINET } from "@/lib/gpf/cabinet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_TOURS = 6;

function systeme(page: string, contactId: string | null) {
  const aujourdhui = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `Tu es l'assistant du CRM de ${CABINET.nom}, cabinet de courtage en assurance de ${CABINET.dirigeant} (assurance emprunteur surtout, puis PER, mutuelle, prévoyance, regroupement de crédits). Nous sommes le ${aujourdhui}.

Règles :
- Réponds en français, de façon brève et concrète. Formats français : JJ/MM/AAAA, 1 234,56 €.
- Tu lis les données uniquement via les outils (lecture seule). N'invente jamais un chiffre, un nom ou une date : si l'information manque, dis-le.
- Pour toute modification (fiche, dossier, note, tâche), utilise l'outil proposer_modification : l'utilisateur valide d'un clic. N'écris jamais que c'est fait.
- Ne demande ni ne traite jamais de données de santé ni de pièces d'identité. Si on t'en donne, ignore-les.
- Pour rédiger un e-mail ou un SMS, fournis directement le texte prêt à copier (SMS : 300 caractères maximum), signé « Gabriel – ${CABINET.nom} ».
- Page ouverte : ${page || "inconnue"}.${contactId ? ` Fiche contact ouverte : id ${contactId} (utilise fiche_contact pour la lire).` : ""}`;
}

/**
 * Assistant : conversation avec outils en lecture seule. Renvoie la réponse,
 * les sources consultées et les propositions de modification à valider.
 */
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!iaDisponible()) return NextResponse.json({ ok: false, error: "assistant_non_configure" });
  const body = await request.json().catch(() => null);
  const historique: { role: "user" | "assistant"; texte: string }[] = Array.isArray(body?.messages) ? body.messages.slice(-20) : [];
  if (!historique.length || historique[historique.length - 1].role !== "user") return NextResponse.json({ ok: false, error: "message_requis" }, { status: 400 });
  const contactId: string | null = typeof body.contactId === "string" && /^[0-9a-f-]{36}$/.test(body.contactId) ? body.contactId : null;

  const ctx: { sources: Source[]; propositions: Proposition[] } = { sources: [], propositions: [] };
  const messages: Message[] = historique.map((m) => ({ role: m.role, content: String(m.texte).slice(0, 8000) }));
  let reponse = "";
  let entree = 0;
  let sortie = 0;

  try {
    for (let tour = 0; tour < MAX_TOURS; tour++) {
      const r = await appelClaude({ model: MODELE_ASSISTANT, system: systeme(String(body.page ?? ""), contactId), messages, tools: OUTILS, maxTokens: 1500 });
      entree += r.usage?.input_tokens ?? 0;
      sortie += r.usage?.output_tokens ?? 0;
      const appels = r.content.filter((c) => c.type === "tool_use") as { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }[];
      reponse = r.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("\n").trim();
      if (r.stop_reason !== "tool_use" || !appels.length) break;
      messages.push({ role: "assistant", content: r.content as unknown as Record<string, unknown>[] });
      const resultats = [];
      for (const a of appels) {
        const res = await executerOutil(a.name, a.input ?? {}, ctx).catch((e) => ({ erreur: e instanceof Error ? e.message : "erreur" }));
        resultats.push({ type: "tool_result", tool_use_id: a.id, content: JSON.stringify(res).slice(0, 30000) });
      }
      messages.push({ role: "user", content: resultats });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erreur";
    return NextResponse.json({ ok: false, error: msg === "assistant_non_configure" ? msg : "erreur_ia", detail: msg }, { status: msg === "assistant_non_configure" ? 200 : 502 });
  }

  // Sources dédoublonnées, dans l'ordre de consultation.
  const vues = new Set<string>();
  const sources = ctx.sources.filter((s) => (vues.has(s.label) ? false : (vues.add(s.label), true)));
  if (!reponse) reponse = ctx.propositions.length ? "Voici ma proposition, à valider ci-dessous." : "Je n'ai pas trouvé de réponse.";

  // Conversation conservée (par fiche quand une fiche est ouverte).
  let conversationId: string | null = typeof body.conversationId === "string" ? body.conversationId : null;
  const enregistres = [...historique, { role: "assistant", texte: reponse, sources: sources.map((s) => s.label) }];
  if (conversationId) {
    const { data: prev } = await supabaseAdmin.from("gpf_assistant_conversations").select("tokens_entree, tokens_sortie").eq("id", conversationId).single();
    await supabaseAdmin
      .from("gpf_assistant_conversations")
      .update({ messages: enregistres, tokens_entree: (prev?.tokens_entree ?? 0) + entree, tokens_sortie: (prev?.tokens_sortie ?? 0) + sortie, updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  } else {
    const { data } = await supabaseAdmin
      .from("gpf_assistant_conversations")
      .insert({ client_id: contactId, titre: historique[0].texte.slice(0, 80), messages: enregistres, tokens_entree: entree, tokens_sortie: sortie })
      .select("id")
      .single();
    conversationId = data?.id ?? null;
  }

  return NextResponse.json({ ok: true, reponse, sources, propositions: ctx.propositions, conversationId });
}

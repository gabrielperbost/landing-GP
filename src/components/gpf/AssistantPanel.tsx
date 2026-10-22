"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Proposition = {
  id: string;
  titre: string;
  description: string;
  champs: { cle: string; label: string; avant: string | null; apres: string }[];
  action: { cible: string; id: string | null; client_id?: string | null; champs: Record<string, unknown> };
};
type Source = { label: string; lien?: string };
type Message = { role: "user" | "assistant"; texte: string; sources?: (Source | string)[]; propositions?: Proposition[] };

const SUGGESTIONS_GENERALES = ["Quels leads relancer aujourd'hui ?", "Qu'est-ce que j'ai à faire aujourd'hui ?", "Quels clients ont une pièce d'identité expirée ?", "Où en sont mes commissions ?"];
const SUGGESTIONS_FICHE = [
  "Résume-moi ce client en 5 lignes",
  "Prépare mon rendez-vous avec ce client",
  "Rédige un SMS de relance pour ce client",
  "Rédige un e-mail de relance pour le devis",
  "Que manque-t-il pour la conformité ?"
];
const ERREURS: Record<string, string> = {
  assistant_non_configure: "L'assistant n'est pas encore activé : il faut ajouter une clé d'API Anthropic (voir la page Assistant IA).",
  audio_non_pris_en_charge: "Les fichiers audio ne sont pas lus directement (la transcription audio est un service payant). Dans Zoom, activez la transcription automatique et déposez le fichier .vtt ou .txt.",
  aucun_dossier_emprunteur: "Aucun dossier d'assurance de prêt sur cette fiche : créez-le d'abord.",
  format_pdf_ou_image: "Déposez un PDF ou une photo du document.",
  fichier_trop_gros: "Fichier trop volumineux (15 Mo maximum).",
  lecture_impossible: "Je n'ai pas réussi à lire ce document."
};

/**
 * Assistant GP Finances : panneau à droite qui pousse la page (ne la recouvre
 * pas) et connaît la fiche ouverte. Il propose ; rien n'est modifié sans un
 * clic de confirmation, champ par champ.
 */
export function AssistantPanel({ pathname, pageTitle, contexte, onClose }: { pathname: string; pageTitle: string | null; contexte?: string; onClose: () => void }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState(contexte ?? "");
  const [loading, setLoading] = useState(false);
  const [decoches, setDecoches] = useState<Record<string, Set<string>>>({});
  const [appliquees, setAppliquees] = useState<Set<string>>(new Set());
  const [typeDoc, setTypeDoc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const contactId = pathname.match(/^\/gpf\/contacts\/([0-9a-f-]{36})/)?.[1] ?? null;

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  // Reprend la dernière conversation de la fiche ouverte.
  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    if (!contactId) return;
    fetch(`/api/gpf/assistant/conversations?client_id=${contactId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.conversation) {
          setMessages(d.conversation.messages ?? []);
          setConversationId(d.conversation.id);
        }
      })
      .catch(() => null);
  }, [contactId]);

  const ajouterErreur = (code?: string) => setMessages((m) => [...m, { role: "assistant", texte: ERREURS[code ?? ""] ?? "Je n'ai pas pu répondre. Réessayez dans un instant." }]);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    const history = [...messages, { role: "user" as const, texte: question.trim() }];
    setMessages(history);
    setInput("");
    setLoading(true);
    const res = await fetch("/api/gpf/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.map(({ role, texte }) => ({ role, texte })), page: pathname, contactId, conversationId })
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setLoading(false);
    if (!data?.ok) return ajouterErreur(data?.error);
    if (data.conversationId) setConversationId(data.conversationId);
    setMessages((m) => [...m, { role: "assistant", texte: data.reponse, sources: data.sources, propositions: data.propositions }]);
  };

  const lireDocument = async (file: File) => {
    if (!contactId || !typeDoc) return;
    const libelle = typeDoc === "offre_pret" ? "l'offre de prêt" : typeDoc === "avis_imposition" ? "l'avis d'imposition" : "la transcription du rendez-vous";
    setMessages((m) => [...m, { role: "user", texte: `Lis ${libelle} : ${file.name}` }]);
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", typeDoc);
    fd.append("client_id", contactId);
    const res = await fetch("/api/gpf/assistant/document", { method: "POST", body: fd }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setLoading(false);
    setTypeDoc(null);
    if (!data?.ok) return ajouterErreur(data?.error);
    setMessages((m) => [...m, { role: "assistant", texte: data.reponse, propositions: data.propositions }]);
  };

  const basculer = (p: Proposition, cle: string) =>
    setDecoches((d) => {
      const s = new Set(d[p.id] ?? []);
      if (s.has(cle)) s.delete(cle);
      else s.add(cle);
      return { ...d, [p.id]: s };
    });

  const appliquer = async (p: Proposition) => {
    const exclus = decoches[p.id] ?? new Set<string>();
    const champs = Object.fromEntries(Object.entries(p.action.champs).filter(([k]) => !exclus.has(k) || (p.action.cible !== "client" && p.action.cible !== "dossier")));
    if (!Object.keys(champs).length) return;
    const res = await fetch("/api/gpf/assistant/appliquer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: { ...p.action, champs } }) }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (data?.ok) {
      setAppliquees((s) => new Set(s).add(p.id));
      router.refresh();
      window.dispatchEvent(new Event("gpf:fiche-modifiee"));
    } else ajouterErreur();
  };

  const suggestions = contactId ? SUGGESTIONS_FICHE : SUGGESTIONS_GENERALES;
  const source = (s: Source | string) => (typeof s === "string" ? { label: s } : s);

  return (
    <aside className="fixed inset-0 z-40 md:static md:inset-auto md:z-auto md:w-[380px] md:shrink-0 md:h-dvh md:sticky md:top-0 flex flex-col bg-[var(--gpf-surface)] border-l border-[var(--gpf-border)]">
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--gpf-border-soft)]">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--gpf-ink)]">Assistant GP Finances</div>
          {pageTitle ? <div className="text-[11px] text-[var(--gpf-subtle)] truncate">Fiche ouverte : {pageTitle}</div> : null}
        </div>
        <div className="flex items-center gap-1">
          {messages.length ? (
            <button
              onClick={() => {
                setMessages([]);
                setConversationId(null);
              }}
              className="text-[11px] text-[var(--gpf-muted)] px-2"
            >
              Nouvelle
            </button>
          ) : null}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[var(--gpf-muted)]" aria-label="Fermer l'assistant">
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div>
            <p className="text-lg text-[var(--gpf-ink)] mb-3" style={{ fontFamily: "var(--font-gpf-serif)" }}>
              Par où voulez-vous commencer ?
            </p>
            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => ask(s)} className="text-left text-sm rounded-lg border border-[var(--gpf-border)] px-3 py-2 text-[var(--gpf-ink)] hover:bg-[var(--gpf-surface-alt)]">
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--gpf-subtle)] mt-4">
              L&apos;assistant lit vos données en lecture seule et propose des actions : rien n&apos;est modifié sans votre clic. Aucune donnée de santé ni pièce d&apos;identité ne lui est transmise.
            </p>
          </div>
        ) : null}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[95%]"}>
            <div
              className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-[#071C2C] text-white" : "bg-[var(--gpf-surface-alt)] text-[var(--gpf-ink)] border border-[var(--gpf-border-soft)]"
              }`}
            >
              {m.texte}
            </div>
            {m.role === "assistant" ? (
              <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--gpf-subtle)] flex-wrap">
                {m.sources?.length ? (
                  <span>
                    Source :{" "}
                    {m.sources.map(source).map((s, j) => (
                      <span key={s.label}>
                        {j ? ", " : ""}
                        {s.lien ? (
                          <Link href={s.lien} className="underline hover:text-[var(--gpf-ink)]">
                            {s.label}
                          </Link>
                        ) : (
                          s.label
                        )}
                      </span>
                    ))}
                  </span>
                ) : null}
                <button onClick={() => navigator.clipboard?.writeText(m.texte)} className="hover:text-[var(--gpf-ink)]">
                  Copier
                </button>
              </div>
            ) : null}
            {m.propositions?.map((p) => {
              const fait = appliquees.has(p.id);
              const editable = p.action.cible === "client" || p.action.cible === "dossier";
              return (
                <div key={p.id} className="mt-2 rounded-lg border border-[#CDAA5A]/60 p-3">
                  <div className="text-sm font-semibold text-[var(--gpf-ink)]">{p.titre}</div>
                  {p.description ? <div className="text-xs text-[var(--gpf-muted)] mt-0.5">{p.description}</div> : null}
                  <table className="w-full text-xs mt-2">
                    <tbody>
                      {p.champs.map((c) => (
                        <tr key={c.cle} className="border-t border-[var(--gpf-border-soft)] align-top">
                          {editable ? (
                            <td className="py-1 pr-1">
                              <input type="checkbox" disabled={fait} checked={!decoches[p.id]?.has(c.cle)} onChange={() => basculer(p, c.cle)} aria-label={`Garder ${c.label}`} />
                            </td>
                          ) : null}
                          <td className="py-1 pr-2 text-[var(--gpf-subtle)]">{c.label}</td>
                          {editable ? <td className="py-1 pr-2 text-[var(--gpf-subtle)] line-through">{c.avant ?? "—"}</td> : null}
                          <td className="py-1 text-[var(--gpf-ink)] font-medium whitespace-pre-wrap">{c.apres}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {fait ? (
                    <div className="mt-2 text-xs text-[#2f9e6e]">Appliqué ✓</div>
                  ) : (
                    <button onClick={() => appliquer(p)} className="mt-2 rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-3 py-1.5">
                      Valider et appliquer
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {loading ? <div className="self-start text-sm text-[var(--gpf-subtle)] animate-pulse">L&apos;assistant réfléchit…</div> : null}
        <div ref={endRef} />
      </div>

      {contactId ? (
        <div className="px-3 pt-2 flex gap-1.5 flex-wrap border-t border-[var(--gpf-border-soft)]">
          {[
            ["offre_pret", "Lire une offre de prêt"],
            ["avis_imposition", "Lire un avis d'imposition"],
            ["transcription", "Analyser un rendez-vous Zoom"]
          ].map(([t, l]) => (
            <button
              key={t}
              disabled={loading}
              onClick={() => {
                setTypeDoc(t);
                if (fileRef.current) {
                  fileRef.current.accept = t === "transcription" ? ".vtt,.txt,.srt" : ".pdf,image/*";
                  fileRef.current.value = "";
                  fileRef.current.click();
                }
              }}
              className="text-[11px] rounded-full border border-[var(--gpf-border)] px-2.5 py-1 text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]"
            >
              {l}
            </button>
          ))}
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && lireDocument(e.target.files[0])} />
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="p-3 flex gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          rows={2}
          placeholder="Demander à l'assistant…"
          className="flex-1 rounded-lg border px-3 py-2 text-sm resize-none"
        />
        <button type="submit" disabled={loading || !input.trim()} className="rounded-lg bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-3 disabled:opacity-40">
          Envoyer
        </button>
      </form>
    </aside>
  );
}

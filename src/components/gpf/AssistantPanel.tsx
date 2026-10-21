"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Proposition = { id: string; titre: string; description: string; champs: { label: string; avant: string | null; apres: string }[]; action: unknown };
type Message = { role: "user" | "assistant"; texte: string; sources?: string[]; propositions?: Proposition[] };

const SUGGESTIONS_GENERALES = [
  "Quels leads relancer aujourd'hui ?",
  "Quels clients ont une pièce d'identité expirée ?",
  "Où en sont mes commissions ce mois-ci ?"
];
const SUGGESTIONS_FICHE = ["Prépare mon rendez-vous avec ce client", "Rédige la relance SMS pour ce NRP", "Quels documents manquent à ce client ?"];

/**
 * Assistant GP Finances : panneau à droite qui pousse la page (ne la recouvre
 * pas) et connaît la fiche ouverte. Il propose ; rien n'est modifié sans un
 * clic de confirmation, champ par champ.
 */
export function AssistantPanel({
  pathname,
  pageTitle,
  contexte,
  onClose
}: {
  pathname: string;
  pageTitle: string | null;
  contexte?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(contexte ?? "");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const contactId = pathname.match(/^\/gpf\/contacts\/([0-9a-f-]{36})/)?.[1] ?? null;

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    const history = [...messages, { role: "user" as const, texte: question.trim() }];
    setMessages(history);
    setInput("");
    setLoading(true);
    const res = await fetch("/api/gpf/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.map(({ role, texte }) => ({ role, texte })), page: pathname, contactId })
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setLoading(false);
    if (!data?.ok) {
      const texte =
        data?.error === "assistant_non_configure"
          ? "L'assistant n'est pas encore activé : il faut ajouter une clé d'API Anthropic (voir Paramètres)."
          : "Je n'ai pas pu répondre. Réessayez dans un instant.";
      setMessages((m) => [...m, { role: "assistant", texte }]);
      return;
    }
    setMessages((m) => [...m, { role: "assistant", texte: data.reponse, sources: data.sources, propositions: data.propositions }]);
  };

  const appliquer = async (p: Proposition) => {
    const res = await fetch("/api/gpf/assistant/appliquer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: p.action })
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setMessages((m) => [...m, { role: "assistant", texte: data?.ok ? `C'est fait : ${p.titre}.` : "La modification n'a pas pu être appliquée." }]);
    if (data?.ok) router.refresh();
  };

  const suggestions = contactId ? [...SUGGESTIONS_FICHE, ...SUGGESTIONS_GENERALES.slice(0, 1)] : SUGGESTIONS_GENERALES;

  return (
    <aside className="fixed inset-0 z-40 md:static md:inset-auto md:z-auto md:w-[380px] md:shrink-0 md:h-dvh md:sticky md:top-0 flex flex-col bg-[var(--gpf-surface)] border-l border-[var(--gpf-border)]">
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--gpf-border-soft)]">
        <div>
          <div className="text-sm font-semibold text-[var(--gpf-ink)]">Assistant GP Finances</div>
          {pageTitle ? <div className="text-[11px] text-[var(--gpf-subtle)]">Fiche ouverte : {pageTitle}</div> : null}
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[var(--gpf-muted)]" aria-label="Fermer l'assistant">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div>
            <p className="text-lg text-[var(--gpf-ink)] mb-3" style={{ fontFamily: "var(--font-gpf-serif)" }}>
              Par où voulez-vous commencer ?
            </p>
            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="text-left text-sm rounded-lg border border-[var(--gpf-border)] px-3 py-2 text-[var(--gpf-ink)] hover:bg-[var(--gpf-surface-alt)]"
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--gpf-subtle)] mt-4">
              L&apos;assistant lit vos données en lecture seule et propose des actions : rien n&apos;est modifié sans votre clic. Aucune donnée de
              santé ni pièce d&apos;identité ne lui est transmise.
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
            {m.sources?.length ? <div className="text-[11px] text-[var(--gpf-subtle)] mt-1">Source : {m.sources.join(", ")}</div> : null}
            {m.propositions?.map((p) => (
              <div key={p.id} className="mt-2 rounded-lg border border-[#CDAA5A]/60 p-3">
                <div className="text-sm font-semibold text-[var(--gpf-ink)]">{p.titre}</div>
                <div className="text-xs text-[var(--gpf-muted)] mt-0.5">{p.description}</div>
                <table className="w-full text-xs mt-2">
                  <tbody>
                    {p.champs.map((c) => (
                      <tr key={c.label} className="border-t border-[var(--gpf-border-soft)]">
                        <td className="py-1 pr-2 text-[var(--gpf-subtle)]">{c.label}</td>
                        <td className="py-1 pr-2 text-[var(--gpf-subtle)] line-through">{c.avant ?? "—"}</td>
                        <td className="py-1 text-[var(--gpf-ink)] font-medium">{c.apres}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => appliquer(p)} className="mt-2 rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-3 py-1.5">
                  Valider et appliquer
                </button>
              </div>
            ))}
          </div>
        ))}
        {loading ? <div className="self-start text-sm text-[var(--gpf-subtle)] animate-pulse">L&apos;assistant réfléchit…</div> : null}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="p-3 border-t border-[var(--gpf-border-soft)] flex gap-2"
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

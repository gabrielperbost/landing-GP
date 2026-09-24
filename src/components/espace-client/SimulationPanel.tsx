"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { isLikelySimulationUrl } from "@/lib/simulationUrl";

type SimulationPanelProps = {
  initialSimulationUrl?: string;
  initialSimulationName?: string;
  onAccepted?: () => void;
  onQuestion?: (note: string) => void;
};

type Feedback = {
  tone: "success" | "info" | "warning";
  message: string;
};

type Decision = "none" | "accepted" | "question";

export function SimulationPanel({ initialSimulationUrl, initialSimulationName, onAccepted, onQuestion }: SimulationPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const simulationUrl = initialSimulationUrl ?? "";
  const simulationName = initialSimulationName ?? (initialSimulationUrl ? "Simulation client" : "");
  const hasSimulation = isLikelySimulationUrl(simulationUrl);
  const canUseSimulation = hasSimulation;
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [decision, setDecision] = useState<Decision>("none");
  const [questionMode, setQuestionMode] = useState(false);
  const [submitting, setSubmitting] = useState<"accepted" | "question" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const readableSimulationName = useMemo(() => {
    const trimmed = simulationName.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return "";
    return trimmed;
  }, [simulationName]);

  const viewerUrl = useMemo(() => {
    if (!canUseSimulation) return "";
    return "/api/session/simulation?mode=inline";
  }, [canUseSimulation]);

  const downloadUrl = useMemo(() => {
    if (!canUseSimulation) return "";
    return "/api/session/simulation?mode=download";
  }, [canUseSimulation]);

  const statusClass =
    decision === "accepted"
      ? "bg-emerald-100 text-emerald-700"
      : decision === "question"
        ? "bg-blue-100 text-blue-700"
        : hasSimulation
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700";

  const statusLabel =
    decision === "accepted"
      ? "Proposition acceptée"
      : decision === "question"
        ? "Question transmise"
      : hasSimulation
          ? "Simulation disponible"
          : "Simulation en attente";

  const iframeInlineHeight = isFullscreen ? "96vh" : "clamp(460px, 65vh, 980px)";

  useEffect(() => {
    const onFullscreenChange = () => {
      if (typeof document === "undefined") return;
      const webkitElement = (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement;
      setIsFullscreen(Boolean(document.fullscreenElement || webkitElement));
    };

    onFullscreenChange();
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
    };
  }, []);

  const handleOpenSimulation = () => {
    if (!canUseSimulation) {
      setFeedback({
        tone: "warning",
        message: "La simulation n'est pas encore disponible."
      });
      return;
    }
    viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleToggleFullscreen = async () => {
    if (!canUseSimulation) {
      setFeedback({
        tone: "warning",
        message: "La simulation n'est pas encore disponible."
      });
      return;
    }

    if (typeof document === "undefined") return;
    const webkitDocument = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    const currentFullscreenElement = document.fullscreenElement || webkitDocument.webkitFullscreenElement;

    try {
      if (currentFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          return;
        }
        if (webkitDocument.webkitExitFullscreen) {
          await webkitDocument.webkitExitFullscreen();
        }
        return;
      }

      const element = viewerContainerRef.current;
      if (!element) return;
      const fullscreenElement = element as HTMLDivElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };

      if (element.requestFullscreen) {
        await element.requestFullscreen();
        return;
      }
      if (fullscreenElement.webkitRequestFullscreen) {
        await fullscreenElement.webkitRequestFullscreen();
        return;
      }

      window.open(downloadUrl || viewerUrl, "_blank", "noopener,noreferrer");
    } catch {
      setFeedback({
        tone: "warning",
        message: "Impossible d'agrandir la simulation sur ce navigateur."
      });
    }
  };

  const submitDecision = async (nextDecision: "accepted" | "question") => {
    if (!hasSimulation) {
      setFeedback({
        tone: "warning",
        message: "La simulation n'est pas encore disponible."
      });
      return;
    }

    if (nextDecision === "question" && note.trim().length < 3) {
      setFeedback({
        tone: "warning",
        message: "Merci de préciser votre question avant de valider."
      });
      return;
    }

    setSubmitting(nextDecision);
    try {
      const response = await fetch("/api/session/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          decision: nextDecision,
          note: note.trim()
        })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setFeedback({
          tone: "warning",
          message: payload.error ?? "Impossible d'envoyer votre réponse pour le moment."
        });
        return;
      }

      if (nextDecision === "accepted") {
        setFeedback({
          tone: "success",
          message: "Merci. Votre acceptation a bien été transmise à GP FINANCES."
        });
        setDecision("accepted");
        setQuestionMode(false);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("token");
        params.delete("firstLogin");
        params.set("stage", "proposal_accepted");
        router.replace(`/espace-client/portail?${params.toString()}`, { scroll: false });
        onAccepted?.();
        return;
      }

      setFeedback({
        tone: "info",
        message: "Votre question a bien été transmise à GP FINANCES."
      });
      setDecision("question");
      setQuestionMode(false);
      onQuestion?.(note.trim());
    } catch {
      setFeedback({
        tone: "warning",
        message: "Erreur réseau. Merci de réessayer."
      });
    } finally {
      setSubmitting(null);
    }
  };

  const handleAccept = () => {
    void submitDecision("accepted");
  };

  const handleQuestionMode = () => {
    if (!hasSimulation) {
      setFeedback({
        tone: "warning",
        message: "La simulation n'est pas encore disponible."
      });
      return;
    }
    setQuestionMode(true);
    setFeedback({
      tone: "info",
      message: "Saisissez votre question dans la zone de notes puis cliquez sur Valider."
    });
  };

  const handleValidateQuestion = () => {
    void submitDecision("question");
  };

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.3)] sm:rounded-[32px] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl" style={{ lineHeight: 1.15 }}>
            Votre simulation
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base" style={{ lineHeight: 1.65 }}>
            Retrouvez ici votre proposition, ajoutez une note et indiquez votre décision.
          </p>
        </div>
        <span
          className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold sm:h-9 sm:px-4 sm:text-sm ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50 p-3 sm:mt-6 sm:rounded-[28px] sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenSimulation}
            disabled={!canUseSimulation}
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
          >
            Ouvrir la simulation
          </button>
        </div>

        {canUseSimulation ? (
          <div ref={viewerRef} className="mt-5 sm:mt-6">
            <div
              ref={viewerContainerRef}
              className={`relative overflow-hidden border border-slate-200 bg-white ${isFullscreen ? "" : "rounded-[20px]"}`}
            >
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="absolute left-3 top-3 z-10 inline-flex h-9 items-center rounded-full border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:left-5 sm:top-5 sm:h-10 sm:px-4 sm:text-sm"
              >
                {isFullscreen ? "🗕 Réduire" : "⤢ Agrandir"}
              </button>
              <iframe
                src={viewerUrl}
                title="Simulation client"
                className="w-full"
                style={{ height: iframeInlineHeight }}
                loading="lazy"
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Gabriel PERBOST vous communiquera la meilleure proposition ci-dessous dès la réception de l&apos;offre de prêt et du tableau d&apos;amortissement.
          </p>
        )}

        {readableSimulationName ? <p className="mt-3 text-sm text-slate-600">{readableSimulationName}</p> : null}

        <div className="mt-5 w-full">
          {canUseSimulation ? (
            <div className="flex justify-stretch sm:justify-end">
              <a
                href={downloadUrl}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:h-14 sm:w-auto sm:min-w-[340px] sm:px-8"
              >
                Télécharger la simulation
              </a>
            </div>
          ) : (
            <span
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-400 sm:h-14 sm:w-auto sm:min-w-[340px] sm:px-8"
            >
              Télécharger la simulation
            </span>
          )}
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="simulation-note" className="mb-2 block text-sm font-semibold text-slate-700">
          Notes sur la simulation
        </label>
        <textarea
          id="simulation-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Exemple : Je souhaite confirmer la proposition, ou poser une question précise."
          className="min-h-24 w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 sm:min-h-28 sm:rounded-[20px] sm:px-5"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={handleAccept}
          disabled={submitting !== null}
          className="inline-flex h-12 w-full items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-200"
        >
          {submitting === "accepted" ? "Envoi..." : "Je valide la proposition"}
        </button>

        <button
          type="button"
          onClick={handleQuestionMode}
          disabled={submitting !== null}
          className="inline-flex h-12 w-full items-center justify-center rounded-full border border-blue-300 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          J&apos;ai des questions concernant la proposition
        </button>

        <Link
          href="/espace-client/contact"
          className="inline-flex h-12 w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Contacter GP FINANCES
        </Link>

        <button
          type="button"
          onClick={handleValidateQuestion}
          disabled={!questionMode || submitting !== null}
          className="inline-flex h-12 w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting === "question" ? "Envoi..." : "Valider la question"}
        </button>
      </div>

      {feedback ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2 text-sm ${
            feedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : feedback.tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-blue-200 bg-blue-50 text-blue-700"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

    </section>
  );
}

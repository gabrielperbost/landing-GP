"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { Footer } from "@/components/sections/Footer";
import { track, trackCTA, trackLead } from "@/lib/tracking";

const PER_BLUE = "#1A3C5C";
const PER_GOLD = "#C8A86B";
const PER_CALENDLY_URL =
  process.env.NEXT_PUBLIC_PER_CALENDLY_URL ||
  "https://calendly.com/gabriel-perbost-gp-finances/votre-etude-d-optimisation-fiscale";
const PER_LEAD_MAGNET_URL =
  process.env.NEXT_PUBLIC_PER_LEAD_MAGNET_URL || "/lead-magnets/per/guide-per-7-erreurs.pdf";

type SimplePerForm = {
  firstName: string;
  phone: string;
  email: string;
  objective: string;
  wantsLeadMagnet: boolean;
};

const EMPTY_FORM: SimplePerForm = {
  firstName: "",
  phone: "",
  email: "",
  objective: "",
  wantsLeadMagnet: true
};

const OBJECTIVES = [
  "Réduire mon impôt",
  "Préparer ma retraite",
  "Comparer avec l'assurance-vie",
  "Avoir un avis expert"
];

const FAQ_ITEMS = [
  {
    q: "L’appel est-il gratuit ?",
    a: "Oui, l’appel de conseil est gratuit et sans engagement."
  },
  {
    q: "Le PER est-il adapté à tout le monde ?",
    a: "Non. Cela dépend de votre fiscalité, de vos objectifs et de votre horizon."
  },
  {
    q: "Combien puis-je potentiellement déduire ?",
    a: "Le montant dépend de votre plafond disponible et de votre situation fiscale."
  },
  {
    q: "Le PER est-il bloqué jusqu’à la retraite ?",
    a: "Le PER est orienté retraite, avec des cas de déblocage anticipé prévus par la loi."
  },
  {
    q: "Quelle différence avec l’assurance-vie ?",
    a: "Le PER est souvent fiscalement intéressant pour les personnes imposées; l’assurance-vie est plus souple sur la disponibilité."
  },
  {
    q: "Y a-t-il des frais ?",
    a: "Oui, selon les contrats (gestion, versement, arbitrage). Ils sont comparés avant toute décision."
  },
  {
    q: "Dois-je signer quelque chose pendant l’appel ?",
    a: "Non. L’appel sert à analyser et expliquer. Vous décidez ensuite à votre rythme."
  },
  {
    q: "La simulation m’engage-t-elle ?",
    a: "Non, aucune obligation. Vous recevez un avis personnalisé sans engagement."
  }
];

export function PerLandingPage() {
  const [form, setForm] = useState<SimplePerForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");
    setMessage("");
    setDownloadUrl(null);

    if (!form.firstName.trim()) {
      setStatus("error");
      setMessage("Le nom complet est obligatoire.");
      trackLead("error", { form: "per_mobile", reason: "missing_full_name" });
      return;
    }

    if (!form.phone.trim()) {
      setStatus("error");
      setMessage("Le téléphone est obligatoire.");
      trackLead("error", { form: "per_mobile", reason: "missing_phone" });
      return;
    }

    if (!form.email.trim()) {
      setStatus("error");
      setMessage("L’email est obligatoire.");
      trackLead("error", { form: "per_mobile", reason: "missing_email" });
      return;
    }

    setLoading(true);
    const requestedLeadMagnet = form.wantsLeadMagnet;

    try {
      const sourcePayload = {
        form: "per_mobile_short",
        path: typeof window !== "undefined" ? window.location.pathname : "/per",
        objective: form.objective || "non_renseigne",
        lead_magnet: form.wantsLeadMagnet
      };

      const response = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.firstName.trim() || "Prospect PER",
          phone: form.phone,
          email: form.email,
          source: JSON.stringify(sourcePayload)
        })
      });

      if (!response.ok) throw new Error(`submit_failed_${response.status}`);

      trackLead("submitted", {
        form: "per_mobile",
        objective: form.objective || "non_renseigne",
        lead_magnet: form.wantsLeadMagnet
      });

      if (form.wantsLeadMagnet) {
        track("gp_per_lead_magnet_optin", { asset: "guide-per-7-erreurs" });
      }

      setStatus("ok");
      setMessage("Votre demande d’informations PER a bien été prise en compte.");
      setDownloadUrl(PER_LEAD_MAGNET_URL);
      setForm(EMPTY_FORM);
    } catch {
      setStatus("error");
      setMessage("Envoi impossible pour le moment. Appelez le 06 51 22 42 13.");
      trackLead("error", { form: "per_mobile", reason: "submit_exception" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6f8] text-slate-900">
      <main className="mx-auto max-w-md px-4 pb-28 pt-5 sm:max-w-lg sm:pb-12">
        <section
          id="per-mobile-hero"
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(26,60,92,0.10)]"
        >
          <p
            className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide"
            style={{ borderColor: `${PER_GOLD}77`, color: PER_BLUE }}
          >
            Étude PER personnalisée
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <div
              className="relative flex-shrink-0 overflow-hidden border border-slate-200 shadow-sm"
              style={{ width: 84, height: 84, borderRadius: "9999px" }}
            >
              <Image
                src="/images/gabriel-perbost-per-v4.png"
                alt="Gabriel PERBOST"
                fill
                sizes="84px"
                className="object-cover object-center"
                priority
              />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">Gabriel PERBOST</p>
              <p className="text-xs text-slate-600">Gérant du cabinet</p>
            </div>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold leading-tight" style={{ color: PER_BLUE }}>
            Un appel simple pour savoir si le PER est intéressant pour vous
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            En 20 minutes : fiscalité, retraite, et avis clair selon votre situation.
          </p>

          <div className="mt-4 grid gap-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Sans engagement
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Approche humaine et personnalisée
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Réponse rapide
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <a
              id="per-mobile-cta-calendly-hero"
              href={PER_CALENDLY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: PER_BLUE }}
              onClick={() => {
                trackCTA("per_mobile_calendly_hero");
                track("gp_per_book_call", { location: "hero" });
              }}
            >
              Je réserve mon appel
            </a>
            <a
              id="per-mobile-cta-scroll-form"
              href="#per-mobile-form"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold text-slate-900"
              style={{ borderColor: `${PER_BLUE}44` }}
              onClick={() => trackCTA("per_mobile_scroll_form")}
            >
              Me faire rappeler
            </a>
          </div>
        </section>

        <section id="per-mobile-form" className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold" style={{ color: PER_BLUE }}>
            Demande de rappel
          </h2>
          <p className="mt-1 text-xs text-slate-600">Formulaire court, confidentiel.</p>

          <form id="per-mobile-lead-form" className="mt-4 space-y-2.5" onSubmit={handleSubmit}>
            <input
              id="per-mobile-first-name"
              required
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              placeholder="Nom complet"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <input
              id="per-mobile-phone"
              required
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Téléphone (obligatoire)"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <input
              id="per-mobile-email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email (obligatoire)"
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <select
              id="per-mobile-objective"
              value={form.objective}
              onChange={(event) => setForm((prev) => ({ ...prev, objective: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="">Objectif (optionnel)</option>
              {OBJECTIVES.map((objective) => (
                <option key={objective} value={objective}>
                  {objective}
                </option>
              ))}
            </select>

            <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <input
                id="per-mobile-lead-magnet"
                type="checkbox"
                checked={form.wantsLeadMagnet}
                onChange={(event) => setForm((prev) => ({ ...prev, wantsLeadMagnet: event.target.checked }))}
                className="mt-0.5"
              />
              <span>Recevoir le guide offert : 7 erreurs PER à éviter</span>
            </label>

            <p className="text-[11px] text-slate-500">
              Si vous cochez la case, le guide est envoyé par email et disponible en téléchargement immédiat après validation.
            </p>

            <button
              id="per-mobile-cta-submit"
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-70"
              style={{ backgroundColor: PER_BLUE }}
              onClick={() => trackCTA("per_mobile_submit")}
            >
              {loading ? "Envoi..." : "Me faire rappeler"}
            </button>

            {status === "error" && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
            )}

            {status === "ok" && (
              <div
                id="per-mobile-success-panel"
                className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4"
              >
                <p className="text-base font-semibold text-emerald-900">
                  Votre demande d’informations PER a bien été prise en compte.
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Merci. Nous vous rappelons rapidement.
                </p>

                {downloadUrl && (
                  <a
                    id="per-mobile-cta-download-lead-magnet"
                    href={downloadUrl}
                    download
                    className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border bg-white text-sm font-semibold"
                    style={{ borderColor: `${PER_BLUE}44`, color: PER_BLUE }}
                    onClick={() => track("gp_per_lead_magnet_download_click", { location: "submit_success" })}
                  >
                    Je télécharge mon guide PER
                  </a>
                )}
              </div>
            )}
          </form>
        </section>

        <section id="per-mobile-quick-faq" className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold" style={{ color: PER_BLUE }}>
            Questions rapides
          </h2>
          <div className="mt-3 space-y-2">
            {FAQ_ITEMS.map((item, index) => (
              <details
                key={item.q}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                onToggle={(event) => {
                  if ((event.currentTarget as HTMLDetailsElement).open) {
                    track("gp_per_mobile_faq_open", { question_id: `per_mobile_faq_${index + 1}` });
                  }
                }}
              >
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">{item.q}</summary>
                <p className="mt-1 text-xs text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-4 sm:hidden">
          <div className="sticky-cta">
            <div className="mx-auto grid max-w-md grid-cols-2 gap-2 px-4">
              <a
                id="per-mobile-sticky-calendly"
                href={PER_CALENDLY_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: PER_BLUE }}
                onClick={() => {
                  trackCTA("per_mobile_sticky_calendly");
                  track("gp_per_book_call", { location: "sticky" });
                }}
              >
                Je réserve mon appel
              </a>
              <a
                id="per-mobile-sticky-callback"
                href="#per-mobile-form"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                style={{ borderColor: `${PER_BLUE}44` }}
                onClick={() => trackCTA("per_mobile_sticky_callback")}
              >
                Être rappelé
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer includeLoan92Link={false} />
    </div>
  );
}

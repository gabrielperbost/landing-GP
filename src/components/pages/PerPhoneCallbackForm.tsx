"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type PerPhoneCallbackFormProps = {
  itemId: string;
  email: string;
  token: string;
};

type SubmitState = "idle" | "loading" | "success" | "error";

const normalizePhone = (value: string) => value.replace(/[^\d+]/g, "").trim();

export function PerPhoneCallbackForm({ itemId, email, token }: PerPhoneCallbackFormProps) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const isLinkValid = Boolean(itemId && email && token);

  const submitPhone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.replace(/\D/g, "").length < 9) {
      setState("error");
      setMessage("Indiquez un numéro de téléphone valide.");
      return;
    }

    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/tally/per-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          item: itemId,
          email,
          token,
          phone: normalizedPhone
        })
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "request_failed");
      }

      setState("success");
      setMessage("C'est noté. Votre numéro a bien été transmis à Gabriel PERBOST.");
    } catch {
      setState("error");
      setMessage("Impossible d'enregistrer le numéro pour le moment. Répondez directement à l'email avec votre téléphone.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f7ff] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl shadow-blue-950/10 sm:p-8 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Questionnaire PER</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Vous préférez être rappelé ?
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Indiquez votre numéro. La séquence email sera stoppée automatiquement et Gabriel PERBOST vous rappellera en
            priorité.
          </p>

          {isLinkValid ? (
            <form onSubmit={submitPhone} className="mt-8 space-y-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-slate-800">
                  Numéro de téléphone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="06 12 34 56 78"
                  autoComplete="tel"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  disabled={state === "loading" || state === "success"}
                />
              </div>

              <button
                type="submit"
                disabled={state === "loading" || state === "success"}
                className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-blue-700 px-7 py-4 text-center text-base font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {state === "loading" ? "Enregistrement..." : "Me faire rappeler"}
              </button>

              {message ? (
                <p
                  className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                    state === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                  }`}
                >
                  {message}
                </p>
              ) : null}
            </form>
          ) : (
            <div className="mt-8 rounded-2xl bg-red-50 p-5 text-sm font-medium text-red-800">
              Ce lien de rappel est incomplet. Répondez directement à l&apos;email reçu avec votre numéro.
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/per"
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Retour à la page PER
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

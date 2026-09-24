"use client";

import Link from "next/link";
import { useState } from "react";

const CALENDLY_URL = "https://calendly.com/gabriel-perbost-gp-finances/votre-etude-d-optimisation-fiscale";

export function MonPerThankYouOverlay() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-slate-100">
      <iframe src="/per" title="Landing PER" className="absolute inset-0 h-full w-full border-0" />

      {isOpen ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/45 p-4 sm:p-6">
          <section className="relative w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-2xl sm:p-10 md:p-12">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Questionnaire PER</p>
            <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">Merci pour votre demande PER</h1>
            <p className="mx-auto mt-5 max-w-3xl text-xl leading-relaxed text-slate-600 sm:text-2xl">
              Votre questionnaire a bien été reçu. Gabriel PERBOST va vous contacter rapidement pour finaliser votre
              étude personnalisée.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={CALENDLY_URL}
                className="inline-flex min-w-[250px] items-center justify-center rounded-2xl bg-blue-700 px-8 py-3 text-base font-semibold text-white transition hover:bg-blue-800"
              >
                Prendre un rendez-vous
              </Link>
              <Link
                href="/per"
                className="inline-flex min-w-[250px] items-center justify-center rounded-2xl border border-slate-300 px-8 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

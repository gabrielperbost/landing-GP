"use client";

import { FormEvent, useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

export function WebinarAvocatsSignupForm() {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("submitting");
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/webinar-avocats/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Inscription impossible pour le moment.");
      }
      setState("success");
      window.location.href = "/webinaire-per-avocats/merci";
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erreur inconnue.");
      setState("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Prénom
          <input name="prenom" className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none ring-blue-100 focus:ring-4" autoComplete="given-name" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Nom
          <input name="nom" className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none ring-blue-100 focus:ring-4" autoComplete="family-name" />
        </label>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
        Email professionnel
        <input
          required
          name="email"
          type="email"
          className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none ring-blue-100 focus:ring-4"
          autoComplete="email"
          placeholder="prenom.nom@cabinet.fr"
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Barreau
          <input name="barreau" className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none ring-blue-100 focus:ring-4" placeholder="Lyon..." />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Cabinet
          <input name="cabinet" className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none ring-blue-100 focus:ring-4" autoComplete="organization" />
        </label>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
        Téléphone
        <input
          required
          name="telephone"
          type="tel"
          className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none ring-blue-100 focus:ring-4"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
        />
        <span className="text-xs font-normal leading-5 text-slate-500">
          Simplement pour vous rappeler par SMS le webinaire, pas de démarchage.
        </span>
      </label>

      <label className="mt-4 flex gap-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        <input required type="checkbox" name="consent" value="true" className="mt-1 h-4 w-4 rounded border-slate-300" />
        <span>
          Je souhaite m’inscrire au webinaire PER pour avocats et recevoir les informations pratiques liées à cet événement.
        </span>
      </label>

      {state === "error" ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={state === "submitting" || state === "success"}
        className="mt-5 w-full rounded-xl px-5 py-4 text-sm font-extrabold uppercase tracking-wide shadow-lg shadow-blue-950/20 transition disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          backgroundColor: "#1A3C5C",
          color: "#ffffff",
          border: "1px solid #143047",
          minHeight: 56
        }}
      >
        {state === "submitting" ? "Inscription en cours..." : "Valider mon inscription gratuite"}
      </button>

      <p className="mt-3 text-center text-xs text-slate-400">Aucun email de prospection supplémentaire ne sera envoyé sans lien de désinscription.</p>
    </form>
  );
}

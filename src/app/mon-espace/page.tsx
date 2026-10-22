"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function Connexion() {
  const erreurLien = useSearchParams().get("erreur") === "lien";
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<"saisie" | "envoi" | "envoye" | "erreur">("saisie");

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setEtat("envoi");
    const r = await fetch("/api/portail/demande-lien", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
    setEtat(r?.ok ? "envoye" : "erreur");
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#071C2C]/10 p-6 sm:p-8">
      <h1 className="text-2xl" style={{ fontFamily: "var(--font-portail-serif)" }}>
        Accéder à mon espace
      </h1>
      <p className="text-sm text-[#071C2C]/70 mt-2">Vos contrats, vos documents et les pièces à nous transmettre, au même endroit. Pas de mot de passe : nous vous envoyons un lien personnel par e-mail.</p>
      {erreurLien ? <p className="mt-4 text-sm rounded-lg bg-[#b3463f]/10 text-[#b3463f] px-3 py-2">Ce lien a expiré ou a déjà servi. Demandez-en un nouveau ci-dessous.</p> : null}
      {etat === "envoye" ? (
        <p className="mt-6 text-sm rounded-lg bg-[#2f9e6e]/10 text-[#1f6e4c] px-3 py-3">
          Si cette adresse correspond à un dossier chez nous, vous allez recevoir un e-mail avec votre lien d&apos;accès (valable 7 jours). Pensez à regarder dans les indésirables.
        </p>
      ) : (
        <form onSubmit={envoyer} className="mt-6 flex flex-col gap-3">
          <label className="text-xs text-[#071C2C]/70 flex flex-col gap-1">
            Votre adresse e-mail
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-[#071C2C]/20 px-3 py-2.5 text-base text-[#071C2C]" autoComplete="email" />
          </label>
          <button type="submit" disabled={etat === "envoi"} className="rounded-full bg-[#071C2C] text-white text-sm font-semibold py-3 disabled:opacity-50">
            {etat === "envoi" ? "Envoi…" : "Recevoir mon lien d'accès"}
          </button>
          {etat === "erreur" ? <p className="text-sm text-[#b3463f]">Trop de demandes ou adresse invalide. Réessayez dans quelques minutes.</p> : null}
        </form>
      )}
    </div>
  );
}

export default function PortailConnexionPage() {
  return (
    <Suspense fallback={null}>
      <Connexion />
    </Suspense>
  );
}

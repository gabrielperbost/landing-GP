"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FirstLoginPasswordSetupProps = {
  email?: string;
  token?: string;
  redirectHref: string;
};

export function FirstLoginPasswordSetup({ email, token, redirectHref }: FirstLoginPasswordSetupProps) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const normalizedEmail = useMemo(() => (email ?? "").trim().toLowerCase(), [email]);
  const isStrongPassword = (value: string) => {
    if (value.trim().length < 8) return false;
    if (!/[a-z]/i.test(value)) return false;
    if (!/\d/.test(value)) return false;
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!normalizedEmail) {
      setErrorMessage("Email introuvable. Utilisez le lien reçu par email.");
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caractères avec lettres et chiffres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    try {
      if (token) {
        const response = await fetch("/api/session/password-set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            token,
            email: normalizedEmail,
            newPassword,
            confirmPassword
          })
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          setErrorMessage(payload.error ?? "Impossible de finaliser la première connexion.");
          return;
        }
      } else {
        setErrorMessage("Lien invalide. Utilisez le lien reçu par email.");
        return;
      }
    } catch {
      setErrorMessage("Impossible de finaliser la première connexion.");
      return;
    } finally {
      setSubmitting(false);
    }

    router.push(redirectHref);
  };

  return (
    <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">
          Nouveau mot de passe
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="********"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700"
          autoComplete="new-password"
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">
          Confirmer le mot de passe
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="********"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700"
          autoComplete="new-password"
        />
      </div>

      <p className="md:col-span-2 text-base font-medium text-slate-700">
        Votre email sera votre identifiant{normalizedEmail ? ` : ${normalizedEmail}` : "."}
      </p>

      <div className="md:col-span-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center rounded-full bg-blue-700 px-6 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Enregistrement..." : "Enregistrer mon mot de passe"}
        </button>
      </div>

      {errorMessage ? <p className="md:col-span-2 text-sm font-semibold text-rose-700">{errorMessage}</p> : null}
    </form>
  );
}

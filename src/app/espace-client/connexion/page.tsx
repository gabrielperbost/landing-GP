"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export default function EspaceClientConnexionPage() {
  return (
    <Suspense
      fallback={
        <main className="relative overflow-hidden py-6 sm:py-12">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-cyan-100/70 blur-3xl sm:h-96 sm:w-96" />
            <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
          </div>
          <div className="container">
            <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6 text-base text-slate-600 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)] sm:rounded-[34px] sm:p-10">
              Chargement de la page de connexion...
            </div>
          </div>
        </main>
      }
    >
      <EspaceClientConnexionContent />
    </Suspense>
  );
}

function EspaceClientConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const logoutRequested = useMemo(() => searchParams.get("logout") === "1", [searchParams]);
  const initialEmail = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const errorCode = useMemo(() => searchParams.get("error")?.trim() ?? "", [searchParams]);

  useEffect(() => {
    if (!initialEmail) return;
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (!logoutRequested) return;
    void fetch("/api/portal-auth/logout", {
      method: "POST",
      credentials: "include"
    }).finally(() => {
      setInfoMessage("Déconnexion effectuée.");
    });
  }, [logoutRequested]);

  useEffect(() => {
    if (!errorCode) return;
    if (errorCode === "invalid_link") {
      setErrorMessage("Lien invalide ou expiré. Utilisez un lien récent envoyé par email.");
      return;
    }
    if (errorCode === "config") {
      setErrorMessage("Configuration serveur incomplète. Merci de contacter GP FINANCES.");
      return;
    }
    setErrorMessage("Une erreur est survenue. Merci de réessayer.");
  }, [errorCode]);

  const handleEnterPortal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("Entrez un email valide.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Renseignez votre mot de passe.");
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await fetch("/api/portal-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          password
        })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        redirect?: string;
        code?: string;
      };
      if (!response.ok) {
        if (payload.code === "activation_required") {
          setErrorMessage("Compte non activé. Cliquez sur « Recevoir un nouveau lien ».");
          return;
        }
        setErrorMessage(payload.error ?? "Connexion impossible. Vérifiez vos identifiants.");
        return;
      }

      router.push(payload.redirect ?? "/espace-client/portail");
    } catch {
      setErrorMessage("Erreur réseau. Merci de réessayer.");
    } finally {
      setBusy(false);
    }
  };

  const handleResendLink = async () => {
    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("Entrez votre email puis cliquez sur « Recevoir un nouveau lien ».");
      return;
    }

    setResendBusy(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await fetch("/api/portal-auth/resend-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; sent?: boolean };

      if (!response.ok) {
        setErrorMessage(payload.error ?? "Impossible d'envoyer le lien pour le moment.");
        return;
      }

      setInfoMessage("Si un dossier existe pour cet email, un lien sécurisé vient d'être envoyé.");
    } catch {
      setErrorMessage("Erreur réseau. Merci de réessayer.");
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <main className="relative overflow-hidden py-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-28 top-8 h-72 w-72 rounded-full bg-cyan-100/70 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="absolute -right-24 top-2 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl sm:h-[32rem] sm:w-[32rem]" />
      </div>

      <div className="container">
        <section className="mx-auto max-w-6xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_28px_70px_-38px_rgba(15,23,42,0.5)] sm:rounded-[38px]">
          <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
            <aside className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 px-6 py-8 text-white sm:px-9 sm:py-10 lg:px-10 lg:py-12">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-200/20 blur-2xl sm:h-56 sm:w-56" />
              <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-blue-300/20 blur-2xl sm:h-64 sm:w-64" />

              <p className="relative inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
                Connexion
              </p>
              <h1 className="relative mt-5 text-[clamp(1.95rem,5vw,2.8rem)] font-semibold leading-[1.05] tracking-tight">
                Accès à votre espace client
              </h1>
              <p className="relative mt-4 max-w-md text-base leading-relaxed text-blue-50/90 sm:text-lg">
                Retrouvez votre dossier, vos documents et votre simulation depuis un espace sécurisé GP FINANCES.
              </p>

              <ul className="relative mt-8 space-y-3">
                <li className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm leading-relaxed">
                  <span className="font-semibold text-white">Identifiant :</span> votre email
                </li>
                <li className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm leading-relaxed">
                  <span className="font-semibold text-white">Mot de passe :</span> celui choisi à la première connexion
                </li>
                <li className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm leading-relaxed">
                  Besoin d&apos;aide ? Contactez GP FINANCES directement depuis l&apos;espace contact.
                </li>
              </ul>
            </aside>

            <div className="bg-white px-6 py-8 sm:px-9 sm:py-10 lg:px-10 lg:py-12">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">Connexion sécurisée</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                Entrez votre email et votre mot de passe pour accéder à votre portail.
              </p>

              {infoMessage ? (
                <p className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{infoMessage}</p>
              ) : null}
              {errorMessage ? (
                <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{errorMessage}</p>
              ) : null}

              <form
                className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50/70 p-4 shadow-[0_14px_34px_-26px_rgba(15,23,42,0.35)] sm:p-7"
                onSubmit={handleEnterPortal}
              >
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="vous@email.com"
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                      Mot de passe
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Entrez votre mot de passe"
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-700 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:h-14"
                >
                  {busy ? "Connexion..." : "Se connecter"}
                </button>

                <button
                  type="button"
                  onClick={handleResendLink}
                  disabled={resendBusy}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendBusy ? "Envoi du lien..." : "Recevoir un nouveau lien"}
                </button>
              </form>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:h-12"
                >
                  Retour à l&apos;accueil
                </Link>
                <Link
                  href="/espace-client/contact"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:h-12"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

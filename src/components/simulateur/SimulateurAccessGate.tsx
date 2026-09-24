"use client";

import { type FormEvent, useState } from "react";
import styles from "@/components/simulateur/SimulateurAccessGate.module.css";

type SimulateurAccessGateProps = {
  isConfigured: boolean;
};

export const SimulateurAccessGate = ({ isConfigured }: SimulateurAccessGateProps) => {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = isConfigured && password.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/simulateur-auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        if (payload.error === "invalid_credentials") {
          setError("Mot de passe incorrect.");
          return;
        }
        if (payload.error === "password_not_configured") {
          setError("Configuration serveur manquante: SIMULATEUR_GP_PASSWORD.");
          return;
        }
        setError("Connexion impossible. Reessaie.");
        return;
      }

      window.location.reload();
    } catch (reason) {
      console.error("simulateur_access_gate_login_failed", reason);
      setError("Connexion impossible. Verifie le reseau puis recommence.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>GP Finances - Outil interne</p>
        <h1 className={styles.title}>Acces prive au logiciel de simulation</h1>
        <p className={styles.description}>
          Outil reserve au cabinet: integration des donnees assureur puis generation d&apos;une simulation personnalisee
          en marque GP Finances.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Mot de passe interne</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Entrer le mot de passe"
              disabled={!isConfigured || isSubmitting}
            />
          </label>

          <button type="submit" className={styles.submitButton} disabled={!canSubmit}>
            {isSubmitting ? "Connexion..." : "Acceder au simulateur"}
          </button>
        </form>

        {!isConfigured ? (
          <p className={styles.warningText}>Configuration requise: variable SIMULATEUR_GP_PASSWORD absente.</p>
        ) : null}
        {error ? <p className={styles.errorText}>{error}</p> : null}
      </div>
    </main>
  );
};

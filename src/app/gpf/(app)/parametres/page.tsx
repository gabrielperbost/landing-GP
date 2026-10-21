"use client";
import { useEffect, useState } from "react";
import { Carte, PageHeader } from "@/components/gpf/PageHeader";
import { CABINET } from "@/lib/gpf/cabinet";

type MigrationStatus = {
  bootstrap: boolean;
  bootstrapError: string | null;
  applied: { name: string; applied_at: string }[];
  pending: { name: string; description: string }[];
};

export default function ParametresPage() {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationMsg, setMigrationMsg] = useState<string | null>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  const loadStatus = async () => {
    const res = await fetch("/api/gpf/admin/migrations");
    const data = await res.json();
    if (data.ok) setStatus(data);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const migrate = async () => {
    setMigrating(true);
    setMigrationMsg(null);
    const res = await fetch("/api/gpf/admin/migrations", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setMigrating(false);
    setMigrationMsg(
      data.ok
        ? `Mises à jour appliquées : ${data.results.map((r: { name: string }) => r.name).join(", ") || "aucune"}.`
        : `Échec : ${data.error ?? data.results?.find((r: { ok: boolean }) => !r.ok)?.error ?? "erreur inconnue"}`
    );
    loadStatus();
  };

  const backup = async () => {
    setBackingUp(true);
    setBackupMsg(null);
    const res = await fetch("/api/gpf/admin/backup", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBackingUp(false);
    setBackupMsg(data.ok ? `Sauvegarde envoyée à ${data.destinataire} (${Math.round(data.taille / 1024)} Ko).` : `Échec : ${data.error ?? "erreur inconnue"}`);
  };

  const ligne = (label: string, valeur: string) => (
    <div className="flex justify-between gap-4 px-4 py-2.5 border-b border-[var(--gpf-border-soft)] last:border-0 text-sm">
      <span className="text-[var(--gpf-muted)]">{label}</span>
      <span className="text-[var(--gpf-ink)] text-right">{valeur}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Paramètres" />

      <Carte titre="Cabinet">
        {ligne("Raison sociale", CABINET.nom)}
        {ligne("Dirigeant", CABINET.dirigeant)}
        {ligne("ORIAS", CABINET.orias)}
        {ligne("SIREN", CABINET.siren)}
        {ligne("RCS", CABINET.rcs)}
        {ligne("Ville", CABINET.ville)}
        {ligne("E-mail", CABINET.email)}
      </Carte>

      <Carte titre="Sécurité">
        {ligne("Double authentification", "Active et obligatoire")}
        {ligne("Durée de session", "24 heures")}
        {ligne("Suppressions", "Corbeille 30 jours, puis purge automatique")}
        {ligne("Données de santé", "Aucune catégorie prévue, aucun stockage")}
      </Carte>

      <Carte titre="Sauvegardes">
        <div className="px-4 py-3 text-sm text-[var(--gpf-muted)]">
          Chaque lundi, un export chiffré de toutes les données du CRM est envoyé à l&apos;adresse du cabinet. Il ne s&apos;ouvre qu&apos;avec la clé
          de sauvegarde rangée dans votre gestionnaire de mots de passe.
        </div>
        <div className="px-4 pb-4 flex items-center gap-3 flex-wrap">
          <button onClick={backup} disabled={backingUp} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-4 py-2 disabled:opacity-50">
            {backingUp ? "Envoi…" : "Envoyer une sauvegarde maintenant"}
          </button>
          {backupMsg ? <span className="text-xs text-[var(--gpf-muted)]">{backupMsg}</span> : null}
        </div>
      </Carte>

      <Carte titre="Base de données">
        {!status ? (
          <div className="px-4 py-3 text-sm text-[var(--gpf-subtle)]">Lecture de l&apos;état…</div>
        ) : !status.bootstrap ? (
          <div className="px-4 py-3 text-sm text-[#b3463f]">
            Les mises à jour automatiques ne sont pas encore activées : le script SQL « migration 005 » doit être exécuté une fois dans Supabase.
          </div>
        ) : (
          <>
            <div className="px-4 py-3 text-sm text-[var(--gpf-muted)]">
              {status.pending.length === 0
                ? "La base est à jour."
                : `${status.pending.length} mise(s) à jour en attente : ${status.pending.map((p) => p.description).join(" ; ")}`}
            </div>
            <div className="px-4 pb-4 flex items-center gap-3 flex-wrap">
              <button
                onClick={migrate}
                disabled={migrating || status.pending.length === 0}
                className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-4 py-2 disabled:opacity-40"
              >
                {migrating ? "Application…" : "Appliquer les mises à jour"}
              </button>
              {migrationMsg ? <span className="text-xs text-[var(--gpf-muted)]">{migrationMsg}</span> : null}
            </div>
            <div className="px-4 pb-3 text-[11px] text-[var(--gpf-subtle)]">
              Déjà appliquées : {status.applied.map((a) => a.name).join(", ") || "—"}
            </div>
          </>
        )}
      </Carte>
    </div>
  );
}

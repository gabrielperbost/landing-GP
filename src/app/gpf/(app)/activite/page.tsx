"use client";
import { SkeletonPage } from "@/components/gpf/Skeleton";
import { useEffect, useState } from "react";

type LogEntry = {
  id: string;
  action: "create" | "update" | "delete" | "restore";
  entity_type: "client" | "dossier" | "document";
  entity_id: string;
  resume: string | null;
  created_at: string;
};

const ACTION_LABEL: Record<LogEntry["action"], string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  restore: "Restauration"
};

const ACTION_COLOR: Record<LogEntry["action"], string> = {
  create: "#2f9e6e",
  update: "#579bfc",
  delete: "#b3463f",
  restore: "#c98a1f"
};

const ENTITY_LABEL: Record<LogEntry["entity_type"], string> = {
  client: "Client",
  dossier: "Dossier",
  document: "Document"
};

const frDateTime = (v: string) => new Date(v).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function GpfActivitePage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gpf/activite")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setEntries(data.entries);
        setLoading(false);
      });
  }, []);

  if (loading) return <SkeletonPage />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl text-[var(--gpf-ink)]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
          Journal d&apos;activité
        </h1>
        <p className="text-sm text-[var(--gpf-muted)] mt-1">Les 200 dernières actions sur les clients, dossiers et documents.</p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-[var(--gpf-subtle)]">Aucune activité enregistrée pour l&apos;instant.</p>
      ) : (
        <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl overflow-hidden">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--gpf-border-soft)] last:border-0">
              <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5 shrink-0" style={{ background: ACTION_COLOR[e.action] }}>
                {ACTION_LABEL[e.action]}
              </span>
              <span className="text-sm text-[var(--gpf-ink)] flex-1 truncate">
                {ENTITY_LABEL[e.entity_type]}
                {e.resume ? ` — ${e.resume}` : ""}
              </span>
              <span className="text-xs text-[var(--gpf-subtle)] shrink-0">{frDateTime(e.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

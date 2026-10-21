"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GPF_PRODUIT_LABEL, GPF_STATUT_COLOR, GPF_STATUT_LABEL, formatNom, type GpfProduit, type GpfStatut } from "@/lib/gpf/types";
import { SkeletonLines } from "@/components/gpf/Skeleton";

type ClientMember = {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  ville: string | null;
  created_at: string;
  nbDossiers: number;
};
type DossierMember = {
  id: string;
  produit: GpfProduit;
  statut: GpfStatut;
  assureur_nom: string | null;
  date_effet: string | null;
  prime_mensuelle: number | null;
  montant_pret: number | null;
  precompte_lineaire_1ere_annee: number | null;
  lineaire_n1: number | null;
  created_at: string;
};
type ClientGroup = { key: string; raisons: string[]; members: ClientMember[] };
type DossierGroup = { key: string; client: { id: string; prenom: string; nom: string } | null; members: DossierMember[] };
type Merge = { id: string; entity_type: "client" | "dossier"; label: string; created_at: string };

const IGNORED_KEY = "gpf-doublons-ignores";
const readIgnored = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(IGNORED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
};
const writeIgnored = (s: Set<string>) => {
  try {
    localStorage.setItem(IGNORED_KEY, JSON.stringify([...s]));
  } catch {
    // stockage indisponible (navigation privée) : l'ignoré ne sera pas mémorisé
  }
};

const frDate = (v: string | null) => (v ? new Date(v.length === 10 ? v + "T00:00:00" : v).toLocaleDateString("fr-FR") : "—");
const euro = (v: number | null) => (v == null ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v));

export default function GpfDoublonsPage() {
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([]);
  const [dossierGroups, setDossierGroups] = useState<DossierGroup[]>([]);
  const [merges, setMerges] = useState<Merge[]>([]);
  const [mergesDisponibles, setMergesDisponibles] = useState(true);
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/gpf/doublons");
    const data = await res.json();
    if (data.ok) {
      setClientGroups(data.clientGroups);
      setDossierGroups(data.dossierGroups);
      setMerges(data.merges);
      setMergesDisponibles(data.mergesDisponibles);
    }
    setLoading(false);
  };

  useEffect(() => {
    setIgnored(readIgnored());
    load();
  }, []);

  const ignore = (key: string) => {
    const next = new Set(ignored);
    next.add(key);
    setIgnored(next);
    writeIgnored(next);
  };

  const merge = async (type: "client" | "dossier", keepId: string, mergeIds: string[]) => {
    for (const mergeId of mergeIds) {
      const res = await fetch("/api/gpf/doublons/fusionner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, keepId, mergeId })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`La fusion a échoué : ${data.error ?? "erreur inconnue"}`);
        break;
      }
    }
    load();
  };

  const undo = async (m: Merge) => {
    if (!confirm(`Annuler la fusion « ${m.label} » ? La fiche fusionnée et ce qui lui appartenait seront remis comme avant.`)) return;
    const res = await fetch("/api/gpf/doublons/annuler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mergeLogId: m.id })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error === "fiche_purgee" ? "Impossible : la fiche fusionnée a été définitivement purgée (plus de 30 jours)." : "L'annulation a échoué.");
    }
    load();
  };

  const visibleClients = clientGroups.filter((g) => !ignored.has(g.key));
  const visibleDossiers = dossierGroups.filter((g) => !ignored.has(g.key));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-[var(--gpf-ink)]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
          Doublons possibles
        </h1>
        <p className="text-sm text-[var(--gpf-muted)] mt-1">
          Rien n&apos;est fusionné automatiquement. Choisissez la fiche à garder : ses informations sont conservées, ses champs vides sont
          complétés par l&apos;autre, et la fiche en double part en corbeille. Chaque fusion peut être annulée ci-dessous.
        </p>
      </div>

      {!mergesDisponibles && !loading ? (
        <p className="text-sm text-[#b3463f] bg-[var(--gpf-danger-tint)] border border-[#f3d4d1] rounded-lg px-4 py-3">
          La fusion n&apos;est pas encore disponible : la migration SQL 004 doit d&apos;abord être exécutée dans Supabase.
        </p>
      ) : null}

      {loading ? (
        <SkeletonLines rows={6} />
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-[var(--gpf-ink)]">
              Fiches client en double <span className="text-[var(--gpf-subtle)] font-normal">({visibleClients.length})</span>
            </h2>
            {visibleClients.length === 0 ? <p className="text-sm text-[var(--gpf-subtle)]">Aucune fiche en double détectée.</p> : null}
            {visibleClients.map((g) => (
              <ClientGroupCard
                key={g.key}
                group={g}
                disabled={!mergesDisponibles}
                onIgnore={() => ignore(g.key)}
                onMerge={(keepId, mergeIds) => merge("client", keepId, mergeIds)}
              />
            ))}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-[var(--gpf-ink)]">
              Dossiers en double <span className="text-[var(--gpf-subtle)] font-normal">({visibleDossiers.length})</span>
            </h2>
            <p className="text-xs text-[var(--gpf-subtle)] -mt-2">
              Même client, même produit, même assureur (ou assureur vide) et même date d&apos;effet. Plusieurs dossiers légitimes (prêts
              différents, devis chez plusieurs assureurs) peuvent être ignorés.
            </p>
            {visibleDossiers.length === 0 ? <p className="text-sm text-[var(--gpf-subtle)]">Aucun dossier en double détecté.</p> : null}
            {visibleDossiers.map((g) => (
              <DossierGroupCard
                key={g.key}
                group={g}
                disabled={!mergesDisponibles}
                onIgnore={() => ignore(g.key)}
                onMerge={(keepId, mergeIds) => merge("dossier", keepId, mergeIds)}
              />
            ))}
          </section>

          {merges.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-[var(--gpf-ink)]">Fusions récentes</h2>
              <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl overflow-hidden">
                {merges.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--gpf-border-soft)] last:border-0">
                    <span className="text-sm text-[var(--gpf-ink)]">
                      {m.entity_type === "client" ? "Fiche" : "Dossier"} « {m.label} » fusionné{m.entity_type === "client" ? "e" : ""} le{" "}
                      {frDate(m.created_at)}
                    </span>
                    <button onClick={() => undo(m)} className="text-xs font-medium text-[var(--gpf-muted)] border border-[var(--gpf-border)] rounded-full px-3 py-1 hover:bg-[var(--gpf-surface-alt)]">
                      Annuler la fusion
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function MergeBar({
  disabled,
  keepId,
  others,
  onIgnore,
  onMerge,
  label
}: {
  disabled: boolean;
  keepId: string | null;
  others: string[];
  onIgnore: () => void;
  onMerge: (keepId: string, mergeIds: string[]) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3 px-4 py-2.5 bg-[var(--gpf-surface-alt)] border-t border-[var(--gpf-border-soft)]">
      <button onClick={onIgnore} className="text-xs text-[var(--gpf-subtle)] hover:text-[var(--gpf-muted)]">
        Ce ne sont pas des doublons
      </button>
      <button
        disabled={disabled || !keepId}
        onClick={() => {
          if (!keepId) return;
          if (!confirm(`Fusionner ${others.length} ${label} dans celle que vous gardez ? Vous pourrez annuler.`)) return;
          onMerge(keepId, others);
        }}
        className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-3 py-1.5 disabled:opacity-40"
      >
        Fusionner dans la sélection
      </button>
    </div>
  );
}

function ClientGroupCard({
  group,
  disabled,
  onIgnore,
  onMerge
}: {
  group: ClientGroup;
  disabled: boolean;
  onIgnore: () => void;
  onMerge: (keepId: string, mergeIds: string[]) => void;
}) {
  // Par défaut on propose de garder la fiche qui porte le plus de dossiers.
  const [keepId, setKeepId] = useState<string | null>([...group.members].sort((a, b) => b.nbDossiers - a.nbDossiers)[0]?.id ?? null);
  return (
    <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl overflow-hidden">
      <div className="px-4 py-2 text-[11px] text-[#c98a1f] bg-[var(--gpf-warning-tint)]">{group.raisons.join(" · ")}</div>
      <div className="grid gap-px bg-[var(--gpf-fill)]" style={{ gridTemplateColumns: `repeat(${group.members.length}, minmax(0, 1fr))` }}>
        {group.members.map((m) => (
          <label key={m.id} className={`bg-[var(--gpf-surface)] p-4 cursor-pointer ${keepId === m.id ? "ring-2 ring-inset ring-[#CDAA5A]" : ""}`}>
            <div className="flex items-center gap-2">
              <input type="radio" checked={keepId === m.id} onChange={() => setKeepId(m.id)} />
              <span className="text-xs text-[var(--gpf-subtle)]">{keepId === m.id ? "Fiche gardée" : "Garder celle-ci"}</span>
            </div>
            <Link href={`/gpf/contacts/${m.id}`} className="block text-sm font-semibold text-[var(--gpf-ink)] mt-2 hover:underline">
              {formatNom(m)}
            </Link>
            <dl className="text-xs text-[var(--gpf-muted)] mt-2 space-y-1">
              <div>E-mail : {m.email ?? "—"}</div>
              <div>Téléphone : {m.telephone ?? "—"}</div>
              <div>Ville : {m.ville ?? "—"}</div>
              <div>Dossiers : {m.nbDossiers}</div>
              <div>Créée le {frDate(m.created_at)}</div>
            </dl>
          </label>
        ))}
      </div>
      <MergeBar
        disabled={disabled}
        keepId={keepId}
        others={group.members.filter((m) => m.id !== keepId).map((m) => m.id)}
        onIgnore={onIgnore}
        onMerge={onMerge}
        label="fiche(s)"
      />
    </div>
  );
}

function DossierGroupCard({
  group,
  disabled,
  onIgnore,
  onMerge
}: {
  group: DossierGroup;
  disabled: boolean;
  onIgnore: () => void;
  onMerge: (keepId: string, mergeIds: string[]) => void;
}) {
  const [keepId, setKeepId] = useState<string | null>(group.members[0]?.id ?? null);
  return (
    <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl overflow-hidden">
      <div className="px-4 py-2 text-xs text-[var(--gpf-muted)] border-b border-[var(--gpf-border-soft)]">
        {group.client ? (
          <Link href={`/gpf/contacts/${group.client.id}`} className="font-semibold text-[var(--gpf-ink)] hover:underline">
            {formatNom(group.client)}
          </Link>
        ) : (
          "Client inconnu"
        )}{" "}
        · {GPF_PRODUIT_LABEL[group.members[0].produit]}
      </div>
      <div className="grid gap-px bg-[var(--gpf-fill)]" style={{ gridTemplateColumns: `repeat(${group.members.length}, minmax(0, 1fr))` }}>
        {group.members.map((m) => (
          <label key={m.id} className={`bg-[var(--gpf-surface)] p-4 cursor-pointer ${keepId === m.id ? "ring-2 ring-inset ring-[#CDAA5A]" : ""}`}>
            <div className="flex items-center gap-2">
              <input type="radio" checked={keepId === m.id} onChange={() => setKeepId(m.id)} />
              <span className="text-xs text-[var(--gpf-subtle)]">{keepId === m.id ? "Dossier gardé" : "Garder celui-ci"}</span>
            </div>
            <span className="inline-block text-xs font-semibold text-white rounded-full px-2 py-0.5 mt-2" style={{ background: GPF_STATUT_COLOR[m.statut] }}>
              {GPF_STATUT_LABEL[m.statut]}
            </span>
            <dl className="text-xs text-[var(--gpf-muted)] mt-2 space-y-1">
              <div>Assureur : {m.assureur_nom ?? "—"}</div>
              <div>Date d&apos;effet : {frDate(m.date_effet)}</div>
              <div>Prime : {m.prime_mensuelle != null ? `${euro(m.prime_mensuelle)}/mois` : "—"}</div>
              <div>Montant emprunté : {euro(m.montant_pret)}</div>
              <div>Commission : {euro((m.precompte_lineaire_1ere_annee ?? 0) + (m.lineaire_n1 ?? 0) || null)}</div>
              <div>Créé le {frDate(m.created_at)}</div>
            </dl>
          </label>
        ))}
      </div>
      <MergeBar
        disabled={disabled}
        keepId={keepId}
        others={group.members.filter((m) => m.id !== keepId).map((m) => m.id)}
        onIgnore={onIgnore}
        onMerge={onMerge}
        label="dossier(s)"
      />
    </div>
  );
}

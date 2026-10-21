"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  GPF_CONTRAT_STATUTS,
  GPF_CONTRAT_STATUT_COLOR,
  GPF_CONTRAT_STATUT_LABEL,
  GPF_PRODUIT_LABEL,
  GPF_PRODUITS,
  GPF_STATUT_COLOR,
  GPF_STATUT_LABEL,
  formatNom,
  type GpfContratStatut,
  type GpfDossierWithClient
} from "@/lib/gpf/types";
import { SkeletonLines, SkeletonTiles } from "@/components/gpf/Skeleton";
import { prochaineEcheance, primeAnnuelle, resiliationPossible } from "@/lib/gpf/contrats";

const PAGE_SIZE = 50;
const EN_SIGNATURE = new Set(["en_cours_souscription", "attente_accord_banque", "attente_prise_effet"]);

const euro = (v: number | null | undefined) =>
  v == null ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
const frDate = (v: string | null | undefined) => (v ? new Date(v.length === 10 ? v + "T00:00:00" : v).toLocaleDateString("fr-FR") : "—");

type Onglet = "tous" | GpfContratStatut | "en_signature";

export default function GpfContratsPage() {
  const [contrats, setContrats] = useState<GpfDossierWithClient[]>([]);
  const [enSignature, setEnSignature] = useState<GpfDossierWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState<Onglet>("tous");
  const [produit, setProduit] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    const [c, a] = await Promise.all([
      fetch("/api/gpf/dossiers?vue=contrats&pageSize=2000").then((r) => r.json()),
      fetch("/api/gpf/dossiers?vue=affaires&pageSize=2000").then((r) => r.json())
    ]);
    if (c.ok) setContrats(c.dossiers);
    if (a.ok) setEnSignature(a.dossiers.filter((d: GpfDossierWithClient) => EN_SIGNATURE.has(d.statut)));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const actifs = contrats.filter((d) => d.contrat_statut === "actif");
    return {
      total: contrats.length,
      actifs: actifs.length,
      aRelancer: contrats.filter((d) => d.contrat_statut === "a_relancer").length,
      resilies: contrats.filter((d) => d.contrat_statut === "resilie").length,
      enSignature: enSignature.length,
      primes: actifs.reduce((s, d) => s + (primeAnnuelle(d) ?? 0), 0)
    };
  }, [contrats, enSignature]);

  const rows = useMemo(() => {
    const base = onglet === "en_signature" ? enSignature : onglet === "tous" ? contrats : contrats.filter((d) => d.contrat_statut === onglet);
    const needle = q.trim().toLowerCase();
    return base.filter((d) => {
      if (produit && d.produit !== produit) return false;
      if (!needle) return true;
      return (
        formatNom(d.client).toLowerCase().includes(needle) ||
        (d.assureur_nom ?? "").toLowerCase().includes(needle) ||
        (d.reference_contrat ?? "").toLowerCase().includes(needle)
      );
    });
  }, [onglet, contrats, enSignature, produit, q]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const open = [...contrats, ...enSignature].find((d) => d.id === openId) ?? null;

  const tabs: [Onglet, string, number][] = [
    ["tous", "Tous", stats.total],
    ["actif", "Actif", stats.actifs],
    ["en_signature", "En signature", stats.enSignature],
    ["a_relancer", "À relancer", stats.aRelancer],
    ["resilie", "Résilié", stats.resilies]
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl text-[var(--gpf-ink)]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
        Contrats
      </h1>

      {loading ? (
        <SkeletonTiles />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tile label="Contrats" value={String(stats.total)} />
          <Tile label="Actifs" value={String(stats.actifs)} accent="#2f9e6e" />
          <Tile label="En signature" value={String(stats.enSignature)} accent="#c98a1f" />
          <Tile label="Primes annualisées" value={euro(stats.primes)} />
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map(([key, label, n]) => (
          <button
            key={key}
            onClick={() => {
              setOnglet(key);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
              onglet === key ? "bg-[#CDAA5A] text-[#071c2c] border-transparent" : "text-[var(--gpf-muted)] border-[var(--gpf-border)] bg-[var(--gpf-surface)]"
            }`}
          >
            {label} ({n})
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Rechercher (client, compagnie, n° de contrat)…"
          className="rounded-lg border px-3 py-2 text-sm w-72"
        />
        <select
          value={produit}
          onChange={(e) => {
            setProduit(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border px-3 py-2 text-xs"
        >
          <option value="">Tous les produits</option>
          {GPF_PRODUITS.map((p) => (
            <option key={p} value={p}>
              {GPF_PRODUIT_LABEL[p]}
            </option>
          ))}
        </select>
        <span className="text-xs text-[var(--gpf-subtle)]">{rows.length} ligne(s)</span>
      </div>

      {loading ? (
        <SkeletonLines rows={8} />
      ) : (
        <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--gpf-subtle)] bg-[var(--gpf-surface-alt)] border-b border-[var(--gpf-border)]">
                {["Contrat", "Client", "Compagnie", "Prime", "Commission", "Date d'effet", "Échéance", "Statut"].map((h) => (
                  <th key={h} className="text-left font-normal px-3 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-[var(--gpf-subtle)]">
                    Aucun contrat pour ces filtres.
                  </td>
                </tr>
              ) : (
                pageRows.map((d) => {
                  const commission = (d.precompte_lineaire_1ere_annee ?? 0) + (d.lineaire_n1 ?? 0);
                  const pa = primeAnnuelle(d);
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setOpenId(d.id)}
                      className="border-b border-[var(--gpf-border-soft)] last:border-0 hover:bg-[var(--gpf-surface-alt)] cursor-pointer"
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-[var(--gpf-ink)]">{GPF_PRODUIT_LABEL[d.produit]}</div>
                        <div className="text-xs text-[var(--gpf-subtle)]">{d.reference_contrat ? `n° ${d.reference_contrat}` : "n° non renseigné"}</div>
                      </td>
                      <td className="px-3 py-2.5 text-[var(--gpf-ink)]">{formatNom(d.client)}</td>
                      <td className="px-3 py-2.5 text-[var(--gpf-muted)]">{d.assureur_nom ?? "—"}</td>
                      <td className="px-3 py-2.5 text-[var(--gpf-muted)] tabular-nums">{pa != null ? `${euro(pa)}/an` : "—"}</td>
                      <td className="px-3 py-2.5 text-[var(--gpf-ink)] tabular-nums">{commission > 0 ? euro(commission) : "—"}</td>
                      <td className="px-3 py-2.5 text-[var(--gpf-muted)]">{frDate(d.date_effet)}</td>
                      <td className="px-3 py-2.5 text-[var(--gpf-muted)]">{frDate(prochaineEcheance(d))}</td>
                      <td className="px-3 py-2.5">
                        {d.contrat_statut ? (
                          <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5" style={{ background: GPF_CONTRAT_STATUT_COLOR[d.contrat_statut] }}>
                            {GPF_CONTRAT_STATUT_LABEL[d.contrat_statut]}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5" style={{ background: GPF_STATUT_COLOR[d.statut] }}>
                            {GPF_STATUT_LABEL[d.statut]}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="text-xs rounded-full border border-[var(--gpf-border)] px-3 py-1.5 disabled:opacity-30">
            ← Précédent
          </button>
          <span className="text-xs text-[var(--gpf-subtle)]">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs rounded-full border border-[var(--gpf-border)] px-3 py-1.5 disabled:opacity-30"
          >
            Suivant →
          </button>
        </div>
      ) : null}

      {open ? <ContratPanel contrat={open} onClose={() => setOpenId(null)} onSaved={load} /> : null}
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] border-t-2 rounded-xl p-4" style={{ borderTopColor: "#CDAA5A" }}>
      <div className="text-xs text-[var(--gpf-muted)] mb-1">{label}</div>
      <div className="text-2xl font-semibold tabular-nums" style={{ color: accent ?? "var(--gpf-ink)" }}>
        {value}
      </div>
    </div>
  );
}

function ContratPanel({ contrat, onClose, onSaved }: { contrat: GpfDossierWithClient; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    contrat_statut: contrat.contrat_statut ?? "",
    reference_contrat: contrat.reference_contrat ?? "",
    assureur_nom: contrat.assureur_nom ?? "",
    date_effet: contrat.date_effet ?? "",
    date_echeance: contrat.date_echeance ?? "",
    prime_mensuelle: contrat.prime_mensuelle?.toString() ?? "",
    prime_annuelle: contrat.prime_annuelle?.toString() ?? "",
    frais_dossier: contrat.frais_dossier?.toString() ?? "",
    precompte_lineaire_1ere_annee: contrat.precompte_lineaire_1ere_annee?.toString() ?? "",
    lineaire_n1: contrat.lineaire_n1?.toString() ?? ""
  });
  const [saving, setSaving] = useState(false);
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    await fetch(`/api/gpf/dossiers/${contrat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(contrat.contrat_statut ? { contrat_statut: form.contrat_statut || null } : {}),
        reference_contrat: form.reference_contrat.trim() || null,
        assureur_nom: form.assureur_nom.trim() || null,
        date_effet: form.date_effet || null,
        date_echeance: form.date_echeance || null,
        prime_mensuelle: num(form.prime_mensuelle),
        prime_annuelle: num(form.prime_annuelle),
        frais_dossier: num(form.frais_dossier),
        precompte_lineaire_1ere_annee: num(form.precompte_lineaire_1ere_annee),
        lineaire_n1: num(form.lineaire_n1)
      })
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  const resil = resiliationPossible(contrat);
  const field = (label: string, el: React.ReactNode) => (
    <label className="text-xs text-[var(--gpf-muted)] flex flex-col gap-1">
      {label}
      {el}
    </label>
  );
  const input = "rounded-lg border px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={onClose}>
      <div className="bg-[var(--gpf-surface)] w-full max-w-md h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--gpf-border-soft)] sticky top-0 bg-[var(--gpf-surface)]">
          <div>
            {contrat.client ? (
              <Link href={`/gpf/contacts/${contrat.client.id}`} className="text-sm text-[var(--gpf-muted)] underline">
                {formatNom(contrat.client)}
              </Link>
            ) : null}
            <h3 className="text-base font-semibold text-[var(--gpf-ink)] mt-0.5">{GPF_PRODUIT_LABEL[contrat.produit]}</h3>
          </div>
          <button onClick={onClose} className="text-[var(--gpf-muted)] rounded-lg w-8 h-8 flex items-center justify-center">
            ✕
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          {resil ? (
            <div className="text-xs rounded-lg px-3 py-2 bg-[var(--gpf-warning-tint)] text-[var(--gpf-ink)]">
              <strong>Résiliation : </strong>
              {resil}
            </div>
          ) : null}
          {contrat.contrat_statut
            ? field(
                "Statut du contrat",
                <select value={form.contrat_statut} onChange={set("contrat_statut")} className={input}>
                  {GPF_CONTRAT_STATUTS.map((s) => (
                    <option key={s} value={s}>
                      {GPF_CONTRAT_STATUT_LABEL[s]}
                    </option>
                  ))}
                </select>
              )
            : null}
          {field("N° de contrat", <input value={form.reference_contrat} onChange={set("reference_contrat")} className={input} />)}
          {field("Compagnie", <input value={form.assureur_nom} onChange={set("assureur_nom")} className={input} />)}
          <div className="grid grid-cols-2 gap-3">
            {field("Date d'effet", <input type="date" value={form.date_effet} onChange={set("date_effet")} className={input} />)}
            {field("Échéance", <input type="date" value={form.date_echeance} onChange={set("date_echeance")} className={input} />)}
            {field("Prime mensuelle (€)", <input inputMode="decimal" value={form.prime_mensuelle} onChange={set("prime_mensuelle")} className={input} />)}
            {field("Prime annuelle (€)", <input inputMode="decimal" value={form.prime_annuelle} onChange={set("prime_annuelle")} className={input} />)}
            {field("Frais de dossier (€)", <input inputMode="decimal" value={form.frais_dossier} onChange={set("frais_dossier")} className={input} />)}
            {field("Précompte (€)", <input inputMode="decimal" value={form.precompte_lineaire_1ere_annee} onChange={set("precompte_lineaire_1ere_annee")} className={input} />)}
            {field("Linéaire N+1 (€)", <input inputMode="decimal" value={form.lineaire_n1} onChange={set("lineaire_n1")} className={input} />)}
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={save} disabled={saving} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-4 py-2 disabled:opacity-50">
              {saving ? "..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

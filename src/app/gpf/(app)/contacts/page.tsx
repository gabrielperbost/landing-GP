"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GPF_PRODUIT_LABEL,
  GPF_PRODUITS,
  GPF_PROVENANCES,
  GPF_SCORE_COLOR,
  GPF_SCORE_LABEL,
  GPF_TYPE_CONTACT_LABEL,
  type GpfClientListItem,
  type GpfScore,
  type GpfTypeContact
} from "@/lib/gpf/types";
import { SkeletonLines } from "@/components/gpf/Skeleton";
import { PageHeader } from "@/components/gpf/PageHeader";
import { NewContactPanel } from "@/components/gpf/NewContactPanel";

type Segment = "tous" | "client" | "lead";
type Row = GpfClientListItem & Record<string, unknown>;
const PAGE_SIZE = 50;

const frDate = (v: unknown) => (v ? new Date(String(v).length === 10 ? `${v}T00:00:00` : String(v)).toLocaleDateString("fr-FR") : "—");
const initiales = (c: { prenom: string; nom: string }) => `${c.prenom?.[0] ?? ""}${c.nom?.[0] ?? ""}`.toUpperCase();

export default function ContactsPageWrapper() {
  return (
    <Suspense fallback={<SkeletonLines rows={10} />}>
      <ContactsPage />
    </Suspense>
  );
}

function ContactsPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<{ tous: number; client: number; lead: number } | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [segment, setSegment] = useState<Segment>("tous");
  const [q, setQ] = useState("");
  const [produit, setProduit] = useState("");
  const [provenance, setProvenance] = useState("");
  const [type, setType] = useState("");
  const [du, setDu] = useState("");
  const [au, setAu] = useState("");
  const [nrp, setNrp] = useState(false);
  const [sansAction, setSansAction] = useState(false);
  const [tri, setTri] = useState<{ col: string; sens: "asc" | "desc" }>({ col: "created_at", sens: "desc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nouveau, setNouveau] = useState<"lead" | "client" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const n = search.get("nouveau");
    if (n === "lead" || n === "client") setNouveau(n);
  }, [search]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (produit) p.set("produit", produit);
    if (provenance) p.set("provenance", provenance);
    if (type) p.set("type", type);
    if (du) p.set("du", du);
    if (au) p.set("au", au);
    if (nrp) p.set("nrp", "1");
    if (sansAction) p.set("sans_action", "1");
    if (segment !== "tous") p.set("segment", segment);
    p.set("tri", tri.col);
    p.set("sens", tri.sens);
    return p;
  }, [q, produit, provenance, type, du, au, nrp, sansAction, segment, tri]);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams(params);
    p.set("page", String(page));
    p.set("pageSize", String(PAGE_SIZE));
    const res = await fetch(`/api/gpf/clients?${p}`);
    const data = await res.json();
    if (data.ok) {
      setRows(data.clients);
      setCounts(data.counts);
      setTotal(data.total);
    }
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, page]);

  const filtre = (fn: () => void) => {
    fn();
    setPage(1);
    setSelected(new Set());
  };
  const trier = (col: string) => filtre(() => setTri((t) => ({ col, sens: t.col === col && t.sens === "asc" ? "desc" : "asc" })));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const tousCoches = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const relanceGroupee = async () => {
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    demain.setHours(9, 0, 0, 0);
    const ids = [...selected];
    await Promise.all(
      ids.map((id) => {
        const c = rows.find((r) => r.id === id);
        return fetch("/api/gpf/taches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: id, titre: `Relancer ${c ? `${c.prenom} ${c.nom}` : "le contact"}`, categorie: "relance", echeance: demain.toISOString() })
        });
      })
    );
    setMessage(`${ids.length} relance(s) créée(s) pour demain 9 h.`);
    setSelected(new Set());
  };

  const provenanceGroupee = async (valeur: string) => {
    if (!valeur) return;
    await Promise.all([...selected].map((id) => fetch(`/api/gpf/clients/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provenance: valeur }) })));
    setMessage(`Provenance « ${valeur} » appliquée à ${selected.size} contact(s).`);
    setSelected(new Set());
    load();
  };

  const supprimerGroupe = async () => {
    if (!confirm(`Déplacer ${selected.size} contact(s) vers la corbeille ? Restaurables pendant 30 jours. Les contacts qui ont encore des dossiers actifs seront conservés.`)) return;
    const res = await Promise.all([...selected].map((id) => fetch(`/api/gpf/clients/${id}`, { method: "DELETE" })));
    const ok = res.filter((r) => r.ok).length;
    setMessage(`${ok} contact(s) déplacé(s) en corbeille${ok < res.length ? `, ${res.length - ok} conservé(s) car ils ont des dossiers actifs` : ""}.`);
    setSelected(new Set());
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tab = (key: Segment, label: string, n?: number) => (
    <button
      key={key}
      onClick={() => filtre(() => setSegment(key))}
      className={`rounded-full px-3 py-1.5 text-xs font-medium border ${
        segment === key ? "bg-[#CDAA5A] text-[#071c2c] border-transparent" : "text-[var(--gpf-muted)] border-[var(--gpf-border)] bg-[var(--gpf-surface)]"
      }`}
    >
      {label}
      {n != null ? ` (${n})` : ""}
    </button>
  );
  const th = (col: string | null, label: string) => (
    <th className="text-left font-normal px-3 py-2 whitespace-nowrap">
      {col ? (
        <button onClick={() => trier(col)} className="uppercase tracking-wide hover:text-[var(--gpf-ink)]">
          {label}
          {tri.col === col ? (tri.sens === "asc" ? " ↑" : " ↓") : ""}
        </button>
      ) : (
        label
      )}
    </th>
  );
  const champ = "rounded-lg border px-2.5 py-1.5 text-xs";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        titre="Contacts"
        actions={
          <>
            <a href={`/api/gpf/clients/export?${params}`} className="rounded-full border border-[var(--gpf-border)] text-[var(--gpf-ink)] text-xs font-medium px-3 py-2">
              Export CSV
            </a>
            <button onClick={() => setNouveau("client")} className="rounded-full border border-[#CDAA5A] text-[var(--gpf-ink)] text-xs font-semibold px-3 py-2">
              Nouveau client
            </button>
            <button onClick={() => setNouveau("lead")} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-3 py-2">
              Nouveau lead
            </button>
          </>
        }
      />

      {search.get("note") === "1" ? (
        <div className="text-sm rounded-lg px-4 py-2.5 bg-[var(--gpf-warning-tint)] text-[var(--gpf-ink)]">Choisissez le contact sur lequel ajouter la note.</div>
      ) : null}
      {message ? (
        <div className="text-sm rounded-lg px-4 py-2.5 bg-[var(--gpf-surface)] border border-[var(--gpf-border)] text-[var(--gpf-ink)] flex justify-between">
          {message}
          <button onClick={() => setMessage(null)} className="text-[var(--gpf-subtle)]">
            ✕
          </button>
        </div>
      ) : null}

      <div className="flex gap-2 flex-wrap">
        {tab("tous", "Tous", counts?.tous)}
        {tab("client", "Clients", counts?.client)}
        {tab("lead", "Leads", counts?.lead)}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <input value={q} onChange={(e) => filtre(() => setQ(e.target.value))} placeholder="Rechercher (nom, e-mail, téléphone)…" className="rounded-lg border px-3 py-1.5 text-sm w-64" />
        <select value={provenance} onChange={(e) => filtre(() => setProvenance(e.target.value))} className={champ}>
          <option value="">Toutes provenances</option>
          {GPF_PROVENANCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={produit} onChange={(e) => filtre(() => setProduit(e.target.value))} className={champ}>
          <option value="">Tous produits</option>
          {GPF_PRODUITS.map((p) => (
            <option key={p} value={p}>
              {GPF_PRODUIT_LABEL[p]}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => filtre(() => setType(e.target.value))} className={champ}>
          <option value="">Tous types</option>
          {Object.entries(GPF_TYPE_CONTACT_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <label className="text-xs text-[var(--gpf-muted)] flex items-center gap-1">
          Créé du <input type="date" value={du} onChange={(e) => filtre(() => setDu(e.target.value))} className={champ} />
        </label>
        <label className="text-xs text-[var(--gpf-muted)] flex items-center gap-1">
          au <input type="date" value={au} onChange={(e) => filtre(() => setAu(e.target.value))} className={champ} />
        </label>
        <label className="text-xs text-[var(--gpf-muted)] flex items-center gap-1.5">
          <input type="checkbox" checked={nrp} onChange={(e) => filtre(() => setNrp(e.target.checked))} /> NRP
        </label>
        <label className="text-xs text-[var(--gpf-muted)] flex items-center gap-1.5">
          <input type="checkbox" checked={sansAction} onChange={(e) => filtre(() => setSansAction(e.target.checked))} /> Sans prochaine action
        </label>
      </div>

      {selected.size > 0 ? (
        <div className="flex items-center gap-2 flex-wrap rounded-lg px-3 py-2 bg-[var(--gpf-surface)] border border-[#CDAA5A]/60">
          <span className="text-xs text-[var(--gpf-ink)] font-medium">{selected.size} sélectionné(s)</span>
          <button onClick={relanceGroupee} className="text-xs rounded-full border border-[var(--gpf-border)] px-3 py-1 text-[var(--gpf-ink)]">
            Créer une relance
          </button>
          <select defaultValue="" onChange={(e) => provenanceGroupee(e.target.value)} className={champ}>
            <option value="">Changer la provenance…</option>
            {GPF_PROVENANCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button onClick={supprimerGroupe} className="text-xs rounded-full px-3 py-1 text-white bg-[#b3463f] ml-auto">
            Supprimer
          </button>
        </div>
      ) : null}

      {loading ? (
        <SkeletonLines rows={10} />
      ) : (
        <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--gpf-subtle)] bg-[var(--gpf-surface-alt)] border-b border-[var(--gpf-border)]">
                <th className="px-3 py-2 w-8">
                  <input type="checkbox" checked={tousCoches} onChange={() => setSelected(tousCoches ? new Set() : new Set(rows.map((r) => r.id)))} />
                </th>
                {th("nom", "Contact")}
                {th("type_contact", "Type")}
                {th(null, "Statut")}
                {th("provenance", "Provenance")}
                {th(null, "Produit")}
                {th("dernier_contact_at", "Dernier contact")}
                {th("prochaine_action_date", "Prochaine action")}
                {th("created_at", "Créé le")}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-[var(--gpf-subtle)]">
                    Aucun contact pour ces filtres.
                  </td>
                </tr>
              ) : (
                rows.map((c) => {
                  const score = c.score as GpfScore | null | undefined;
                  const sansProchaine = !c.prochaine_action && !c.est_client;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/gpf/contacts/${c.id}`)}
                      className="border-b border-[var(--gpf-border-soft)] last:border-0 hover:bg-[var(--gpf-surface-alt)] cursor-pointer"
                    >
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-[var(--gpf-chip)] text-[var(--gpf-ink)] text-[11px] font-semibold flex items-center justify-center shrink-0">
                            {initiales(c)}
                          </span>
                          <span className="min-w-0">
                            <Link href={`/gpf/contacts/${c.id}`} onClick={(e) => e.stopPropagation()} className="block font-medium text-[var(--gpf-ink)] truncate">
                              {c.prenom} {c.nom.toUpperCase()}
                            </Link>
                            <span className="block text-xs text-[var(--gpf-subtle)] truncate">{c.email ?? c.telephone ?? "—"}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-[var(--gpf-muted)]">{GPF_TYPE_CONTACT_LABEL[(c.type_contact as GpfTypeContact) ?? "particulier"]}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wide text-white rounded-full px-2 py-0.5"
                            style={{ background: c.est_client ? "#2f9e6e" : "#c98a1f" }}
                          >
                            {c.est_client ? "Client" : "Lead"}
                          </span>
                          {score ? (
                            <span className="text-[10px] rounded-full px-1.5 py-0.5 border" style={{ color: GPF_SCORE_COLOR[score], borderColor: GPF_SCORE_COLOR[score] }}>
                              {GPF_SCORE_LABEL[score]}
                            </span>
                          ) : null}
                          {Number(c.nrp_count ?? 0) > 0 ? (
                            <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-[var(--gpf-danger-tint)] text-[#b3463f]">NRP ×{String(c.nrp_count)}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-[var(--gpf-muted)] max-w-[160px] truncate">{(c.provenance as string) ?? "—"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {c.produits.length === 0 ? (
                            <span className="text-xs text-[var(--gpf-subtle)]">—</span>
                          ) : (
                            c.produits.map((p) => (
                              <span key={p} className="text-[10px] rounded-full px-2 py-0.5 bg-[var(--gpf-chip)] text-[var(--gpf-ink)] whitespace-nowrap">
                                {GPF_PRODUIT_LABEL[p]}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-[var(--gpf-muted)] whitespace-nowrap">{frDate(c.dernier_contact_at)}</td>
                      <td className="px-3 py-2 text-xs max-w-[180px]">
                        {c.prochaine_action ? (
                          <span className="text-[var(--gpf-ink)]">
                            {String(c.prochaine_action)}
                            {c.prochaine_action_date ? <span className="text-[var(--gpf-subtle)]"> · {frDate(c.prochaine_action_date)}</span> : null}
                          </span>
                        ) : sansProchaine ? (
                          <span className="text-[#b3463f]">À définir</span>
                        ) : (
                          <span className="text-[var(--gpf-subtle)]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-[var(--gpf-muted)] whitespace-nowrap">{frDate(c.created_at)}</td>
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
            Page {page} / {totalPages} · {total} contact(s)
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

      {nouveau ? (
        <NewContactPanel
          mode={nouveau}
          onClose={() => {
            setNouveau(null);
            if (search.get("nouveau")) router.replace("/gpf/contacts");
          }}
          onCreated={(id) => router.push(`/gpf/contacts/${id}`)}
        />
      ) : null}
    </div>
  );
}

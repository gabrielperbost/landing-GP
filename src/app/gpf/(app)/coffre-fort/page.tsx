"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Carte } from "@/components/gpf/PageHeader";
import { SkeletonLines } from "@/components/gpf/Skeleton";
import { api, Panneau, Vide, frDate, frDateHeure } from "@/components/gpf/fiche/shared";
import { Onglets, Tableau, tdCls } from "@/components/gpf/commissions/commun";

type Doc = { id: string; client_id: string | null; client: string; type: string; nom_fichier: string | null; taille_octets: number | null; date_reception: string | null; date_expiration: string | null; created_at: string };
type Acces = { id: string; action: string; created_at: string; document: { nom_fichier: string | null; type: string } | null };
type Filtre = "tous" | "generes" | "expires";

const taille = (o: number | null) => (o == null ? "—" : o > 1048576 ? `${(o / 1048576).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo` : `${Math.max(1, Math.round(o / 1024))} Ko`);
const ACTION: Record<string, string> = { consultation: "Consultation", export_acpr: "Export ACPR" };

export default function CoffreFortPage() {
  const [data, setData] = useState<{ total: number; pageSize: number; types: string[]; documents: Doc[]; tailleTotale: number } | null>(null);
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [apercu, setApercu] = useState<{ doc: Doc; url: string } | null>(null);
  const [journal, setJournal] = useState<Acces[] | null>(null);
  const [voirJournal, setVoirJournal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ page: String(page), filtre, type, q });
      api(`/api/gpf/coffre-fort?${p}`, "GET").then((r) => r.ok && setData(r.data));
    }, 200);
    return () => clearTimeout(t);
  }, [filtre, type, q, page]);

  const ouvrir = async (doc: Doc) => {
    const r = await api(`/api/gpf/documents/${doc.id}`, "GET");
    if (!r.ok) return alert("Document introuvable.");
    setApercu({ doc, url: r.data.url });
    const j = await api(`/api/gpf/coffre-fort/acces?document_id=${doc.id}`, "GET");
    setJournal(j.ok ? j.data.acces : []);
  };
  const journalGlobal = async () => {
    setVoirJournal(true);
    const j = await api("/api/gpf/coffre-fort/acces", "GET");
    setJournal(j.ok ? j.data.acces : []);
  };

  const ext = (n: string | null) => (n ?? "").toLowerCase().split(".").pop() ?? "";
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        titre="Coffre-fort"
        sousTitre={data ? `${data.total} document(s) · ${taille(data.tailleTotale)} stockés de façon privée` : "Tous les documents du cabinet"}
        actions={
          <button onClick={journalGlobal} className="rounded-full border border-[var(--gpf-border)] text-xs px-4 py-2 text-[var(--gpf-muted)] bg-[var(--gpf-surface)]">
            Journal des accès
          </button>
        }
      />
      <div className="flex gap-3 flex-wrap items-center justify-between">
        <Onglets
          valeur={filtre}
          onChange={(f) => {
            setFiltre(f);
            setPage(1);
          }}
          items={[
            ["tous", "Tous"],
            ["generes", "Générés par le cabinet"],
            ["expires", "Expirés ou bientôt"]
          ]}
        />
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border px-3 py-2 text-sm bg-[var(--gpf-surface)]"
          >
            <option value="">Tous les types</option>
            {(data?.types ?? []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Client, fichier…"
            className="rounded-lg border px-3 py-2 text-sm bg-[var(--gpf-surface)] flex-1 sm:w-56"
          />
        </div>
      </div>

      {!data ? (
        <SkeletonLines />
      ) : (
        <Carte>
          {data.documents.length === 0 ? (
            <Vide>Aucun document.</Vide>
          ) : (
            <Tableau entetes={["Document", "Type", "Client", "Reçu le", "Expire le", "Taille"]}>
              {data.documents.map((d) => {
                const expire = d.date_expiration && d.date_expiration < new Date().toISOString().slice(0, 10);
                return (
                  <tr key={d.id} className="cursor-pointer hover:bg-[var(--gpf-surface-alt)]" onClick={() => ouvrir(d)}>
                    <td className={`${tdCls} max-w-[280px] truncate`}>{d.nom_fichier ?? "—"}</td>
                    <td className={tdCls}>{d.type}</td>
                    <td className={tdCls}>
                      {d.client_id ? (
                        <Link href={`/gpf/contacts/${d.client_id}?onglet=documents`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                          {d.client}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={tdCls}>{frDate(d.date_reception ?? d.created_at)}</td>
                    <td className={tdCls} style={{ color: expire ? "#b3463f" : undefined }}>
                      {frDate(d.date_expiration) ?? "—"}
                    </td>
                    <td className={tdCls}>{taille(d.taille_octets)}</td>
                  </tr>
                );
              })}
            </Tableau>
          )}
          {pages > 1 ? (
            <div className="flex items-center justify-between px-4 py-3 text-xs text-[var(--gpf-muted)]">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="disabled:opacity-30">
                ← Précédent
              </button>
              <span>
                Page {page} / {pages}
              </span>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="disabled:opacity-30">
                Suivant →
              </button>
            </div>
          ) : null}
        </Carte>
      )}

      {apercu ? (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3" onClick={() => setApercu(null)}>
          <div className="bg-[var(--gpf-surface)] rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--gpf-border-soft)]">
              <p className="text-sm font-medium text-[var(--gpf-ink)] flex-1 truncate">{apercu.doc.nom_fichier}</p>
              <a href={apercu.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]">
                Télécharger
              </a>
              <button onClick={() => setApercu(null)} className="text-[var(--gpf-muted)] w-8 h-8" aria-label="Fermer">
                ✕
              </button>
            </div>
            <div className="flex-1 bg-[var(--gpf-fill)] min-h-0">
              {["png", "jpg", "jpeg", "webp", "gif"].includes(ext(apercu.doc.nom_fichier)) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={apercu.url} alt={apercu.doc.nom_fichier ?? ""} className="w-full h-full object-contain" />
              ) : ext(apercu.doc.nom_fichier) === "pdf" ? (
                <iframe src={apercu.url} title="Aperçu" className="w-full h-full" />
              ) : (
                <Vide>Aperçu indisponible pour ce format : utilisez « Télécharger ».</Vide>
              )}
            </div>
            <div className="px-4 py-2 border-t border-[var(--gpf-border-soft)] text-[11px] text-[var(--gpf-subtle)] max-h-24 overflow-y-auto">
              Accès : {journal === null ? "…" : journal.length ? journal.map((a) => `${ACTION[a.action] ?? a.action} le ${frDateHeure(a.created_at)}`).join(" · ") : "aucun"}
            </div>
          </div>
        </div>
      ) : null}

      {voirJournal ? (
        <Panneau titre="Journal des accès" onClose={() => setVoirJournal(false)}>
          {journal === null ? (
            <Vide>Chargement…</Vide>
          ) : journal.length === 0 ? (
            <Vide>Aucun accès enregistré.</Vide>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--gpf-border-soft)]">
              {journal.map((a) => (
                <div key={a.id} className="py-2.5">
                  <p className="text-sm text-[var(--gpf-ink)] truncate">{a.document?.nom_fichier ?? "Document supprimé"}</p>
                  <p className="text-[11px] text-[var(--gpf-subtle)]">
                    {ACTION[a.action] ?? a.action} · {frDateHeure(a.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panneau>
      ) : null}
    </div>
  );
}

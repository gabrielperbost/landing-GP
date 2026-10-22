"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GPF_TASK_CATEGORIE_LABEL, GPF_TASK_ETAT_LABEL, formatNom, type GpfTask, type GpfTaskEtat } from "@/lib/gpf/types";
import { PageHeader } from "@/components/gpf/PageHeader";
import { SkeletonLines } from "@/components/gpf/Skeleton";
import { ContactPicker } from "@/components/gpf/ContactPicker";
import { api, BoutonOr, Field, frDateHeure, inputCls, Panneau } from "@/components/gpf/fiche/shared";
import { toLocalInput } from "@/components/gpf/fiche/Actions";

type Periode = "toutes" | "retard" | "aujourdhui" | "semaine";

export default function TachesPageWrapper() {
  return (
    <Suspense fallback={<SkeletonLines rows={10} />}>
      <TachesPage />
    </Suspense>
  );
}

function TachesPage() {
  const search = useSearchParams();
  const [taches, setTaches] = useState<GpfTask[] | null>(null);
  const [compteurs, setCompteurs] = useState({ a_faire: 0, en_cours: 0, en_attente: 0 });
  const [etat, setEtat] = useState<GpfTaskEtat | "ouvertes" | "terminee">("ouvertes");
  const [categorie, setCategorie] = useState("");
  const [periode, setPeriode] = useState<Periode>("toutes");
  const [nouvelle, setNouvelle] = useState(search.get("nouvelle") === "1");
  const [indispo, setIndispo] = useState(false);

  const load = async () => {
    const p = new URLSearchParams();
    if (etat === "ouvertes") p.set("ouvertes", "1");
    else p.set("etat", etat);
    const r = await api(`/api/gpf/taches?${p}`, "GET");
    if (r.ok) {
      setTaches(r.data.taches);
      setCompteurs(r.data.compteurs);
      setIndispo(false);
    } else {
      setTaches([]);
      setIndispo(true);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat]);

  const liste = useMemo(() => {
    const now = new Date();
    const finJour = new Date(now);
    finJour.setHours(23, 59, 59, 999);
    const finSemaine = new Date(finJour);
    finSemaine.setDate(finSemaine.getDate() + 7);
    return (taches ?? []).filter((t) => {
      if (categorie && t.categorie !== categorie) return false;
      const e = t.echeance ? new Date(t.echeance) : null;
      if (periode === "retard") return e != null && e < now && t.etat !== "terminee";
      if (periode === "aujourdhui") return e != null && e <= finJour;
      if (periode === "semaine") return e != null && e <= finSemaine;
      return true;
    });
  }, [taches, categorie, periode]);

  const changerEtat = async (id: string, nouvelEtat: string) => {
    await api(`/api/gpf/taches/${id}`, "PATCH", { etat: nouvelEtat });
    load();
  };
  const supprimer = async (id: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    await api(`/api/gpf/taches/${id}`, "DELETE");
    load();
  };

  const compteur = (label: string, n: number, cle: GpfTaskEtat) => (
    <button
      onClick={() => setEtat(cle)}
      className={`bg-[var(--gpf-surface)] border rounded-xl p-4 text-left border-t-2 ${etat === cle ? "border-[#CDAA5A]" : "border-[var(--gpf-border)]"}`}
      style={{ borderTopColor: "#CDAA5A" }}
    >
      <div className="text-xs text-[var(--gpf-muted)]">{label}</div>
      <div className="text-2xl font-semibold tabular-nums text-[var(--gpf-ink)] mt-1">{n}</div>
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader titre="Tâches" sousTitre="Ce qui vous attend, toutes fiches confondues." actions={<BoutonOr onClick={() => setNouvelle(true)}>Nouvelle tâche</BoutonOr>} />
      {indispo ? (
        <div className="text-sm rounded-lg px-4 py-2.5 bg-[var(--gpf-warning-tint)] text-[var(--gpf-ink)]">Les tâches seront disponibles dès que la mise à jour de la base sera appliquée (Paramètres).</div>
      ) : null}
      <div className="grid grid-cols-3 gap-3">
        {compteur("À faire", compteurs.a_faire, "a_faire")}
        {compteur("En cours", compteurs.en_cours, "en_cours")}
        {compteur("En attente", compteurs.en_attente, "en_attente")}
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <select value={etat} onChange={(e) => setEtat(e.target.value as typeof etat)} className="rounded-lg border px-2.5 py-1.5 text-xs">
          <option value="ouvertes">Toutes les tâches ouvertes</option>
          {Object.entries(GPF_TASK_ETAT_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className="rounded-lg border px-2.5 py-1.5 text-xs">
          <option value="">Toutes catégories</option>
          {Object.entries(GPF_TASK_CATEGORIE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        {(
          [
            ["toutes", "Toutes échéances"],
            ["retard", "En retard"],
            ["aujourdhui", "Aujourd'hui"],
            ["semaine", "7 jours"]
          ] as [Periode, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setPeriode(k)}
            className={`rounded-full px-3 py-1 text-xs border ${periode === k ? "bg-[#CDAA5A] text-[#071c2c] border-transparent" : "text-[var(--gpf-muted)] border-[var(--gpf-border)] bg-[var(--gpf-surface)]"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {!taches ? (
        <SkeletonLines rows={8} />
      ) : (
        <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--gpf-subtle)] bg-[var(--gpf-surface-alt)] border-b border-[var(--gpf-border)]">
                {["Tâche", "Client", "Échéance", "Catégorie", "État", ""].map((h) => (
                  <th key={h} className="text-left font-normal px-3 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liste.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[var(--gpf-subtle)]">
                    Aucune tâche.
                  </td>
                </tr>
              ) : (
                liste.map((t) => {
                  const retard = t.echeance && new Date(t.echeance) < new Date() && t.etat !== "terminee";
                  return (
                    <tr key={t.id} className="border-b border-[var(--gpf-border-soft)] last:border-0">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={t.etat === "terminee"} onChange={() => changerEtat(t.id, t.etat === "terminee" ? "a_faire" : "terminee")} title="Terminée" />
                          <span className={t.etat === "terminee" ? "line-through text-[var(--gpf-subtle)]" : "text-[var(--gpf-ink)]"}>{t.titre}</span>
                          {t.auto ? <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-[var(--gpf-chip)] text-[var(--gpf-muted)]">auto</span> : null}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {t.client ? (
                          <Link href={`/gpf/contacts/${t.client.id}`} className="text-[var(--gpf-ink)] hover:underline">
                            {formatNom(t.client)}
                          </Link>
                        ) : (
                          <span className="text-[var(--gpf-subtle)]">—</span>
                        )}
                      </td>
                      <td className={`px-3 py-2.5 text-xs whitespace-nowrap ${retard ? "text-[#b3463f] font-medium" : "text-[var(--gpf-muted)]"}`}>{frDateHeure(t.echeance) ?? "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-[var(--gpf-muted)]">{GPF_TASK_CATEGORIE_LABEL[t.categorie]}</td>
                      <td className="px-3 py-2.5">
                        <select value={t.etat} onChange={(e) => changerEtat(t.id, e.target.value)} className="rounded-lg border px-2 py-1 text-xs">
                          {Object.entries(GPF_TASK_ETAT_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button onClick={() => supprimer(t.id)} className="text-xs text-[#b3463f]" aria-label="Supprimer la tâche">
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {nouvelle ? <NouvelleTache onClose={() => setNouvelle(false)} onDone={load} /> : null}
    </div>
  );
}

function NouvelleTache({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  demain.setHours(9, 0, 0, 0);
  const [contact, setContact] = useState<{ id: string; label: string } | null>(null);
  const [titre, setTitre] = useState("");
  const [categorie, setCategorie] = useState("appel");
  const [echeance, setEcheance] = useState(toLocalInput(demain));
  const [saving, setSaving] = useState(false);
  return (
    <Panneau titre="Nouvelle tâche" onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          const r = await api("/api/gpf/taches", "POST", { client_id: contact?.id ?? null, titre, categorie, echeance: new Date(echeance).toISOString() });
          setSaving(false);
          if (r.ok) {
            onDone();
            onClose();
          }
        }}
      >
        <Field label="Contact">
          <ContactPicker value={contact} onChange={setContact} />
        </Field>
        <Field label="Tâche">
          <input required value={titre} onChange={(e) => setTitre(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Catégorie">
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className={inputCls}>
              {Object.entries(GPF_TASK_CATEGORIE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Échéance">
            <input type="datetime-local" value={echeance} onChange={(e) => setEcheance(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <BoutonOr type="submit" disabled={saving || !titre.trim()}>
          {saving ? "…" : "Créer la tâche"}
        </BoutonOr>
      </form>
    </Panneau>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GPF_PRODUIT_LABEL, formatNom, type GpfProduit } from "@/lib/gpf/types";
import { SkeletonLines } from "@/components/gpf/Skeleton";

type Row = {
  id: string;
  client_id: string;
  produit: GpfProduit;
  assureur_nom: string | null;
  date_effet: string | null;
  prime_mensuelle: number | null;
  placement_initial: number | null;
  frais_dossier: number | null;
  precompte_lineaire_1ere_annee: number | null;
  lineaire_n1: number | null;
  manque: string[];
  client: { id: string; prenom: string; nom: string } | null;
};

const EPARGNE: GpfProduit[] = ["per", "assurance_vie"];

export default function GpfDonneesIncompletesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/gpf/donnees-incompletes");
    const data = await res.json();
    if (data.ok) {
      setRows(data.dossiers);
      setErreur(null);
    } else {
      setErreur(data.error ?? "Erreur de chargement");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl text-[#071C2C]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
          Données incomplètes
        </h1>
        <p className="text-sm text-[#64717d] mt-1">
          Dossiers effectifs auxquels il manque l&apos;assureur, la prime, la date d&apos;effet ou la commission. Les cases à compléter sont
          entourées en rouge.
        </p>
      </div>

      {loading ? (
        <SkeletonLines rows={8} />
      ) : erreur ? (
        <p className="text-sm text-[#b3463f] bg-[#fdf3f2] border border-[#f3d4d1] rounded-lg px-4 py-3">
          Page indisponible : la migration SQL 004 doit d&apos;abord être exécutée dans Supabase. ({erreur})
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#2f9e6e]">Tous les dossiers effectifs sont complets.</p>
      ) : (
        <>
          <p className="text-xs text-[#9aa3ab]">{rows.length} dossier{rows.length > 1 ? "s" : ""} à compléter</p>
          <div className="bg-white border border-[#e2e5e9] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[#9aa3ab] bg-[#fafbfc] border-b border-[#e2e5e9]">
                  <th className="text-left font-normal px-3 py-2">Client</th>
                  <th className="text-left font-normal px-3 py-2">Assureur</th>
                  <th className="text-left font-normal px-3 py-2">Date d&apos;effet</th>
                  <th className="text-left font-normal px-3 py-2">Prime / versement</th>
                  <th className="text-left font-normal px-3 py-2">Frais de dossier</th>
                  <th className="text-left font-normal px-3 py-2">Précompte</th>
                  <th className="text-left font-normal px-3 py-2">Linéaire N+1</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <EditableRow key={r.id} row={r} onSaved={load} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function EditableRow({ row, onSaved }: { row: Row; onSaved: () => void }) {
  const epargne = EPARGNE.includes(row.produit);
  const primeKey = epargne ? "placement_initial" : "prime_mensuelle";
  const initial = {
    assureur_nom: row.assureur_nom ?? "",
    date_effet: row.date_effet ?? "",
    prime: String((epargne ? row.placement_initial : row.prime_mensuelle) ?? ""),
    frais_dossier: String(row.frais_dossier ?? ""),
    precompte_lineaire_1ere_annee: String(row.precompte_lineaire_1ere_annee ?? ""),
    lineaire_n1: String(row.lineaire_n1 ?? "")
  };
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

  const save = async () => {
    setSaving(true);
    await fetch(`/api/gpf/dossiers/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assureur_nom: form.assureur_nom.trim() || null,
        date_effet: form.date_effet || null,
        [primeKey]: num(form.prime),
        frais_dossier: num(form.frais_dossier),
        precompte_lineaire_1ere_annee: num(form.precompte_lineaire_1ere_annee),
        lineaire_n1: num(form.lineaire_n1)
      })
    });
    setSaving(false);
    onSaved();
  };

  const missing = (key: string) => row.manque.includes(key);
  const cls = (isMissing: boolean) =>
    `w-full rounded-md border px-2 py-1.5 text-sm ${isMissing ? "border-[#e8a39d] bg-[#fdf3f2]" : "border-[#e2e5e9]"}`;
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <tr className="border-b border-[#f1f2f4] last:border-0 align-top">
      <td className="px-3 py-2 min-w-[160px]">
        {row.client ? (
          <Link href={`/gpf/clients/${row.client.id}`} className="font-medium text-[#071C2C] hover:underline">
            {formatNom(row.client)}
          </Link>
        ) : (
          "—"
        )}
        <div className="text-xs text-[#9aa3ab]">{GPF_PRODUIT_LABEL[row.produit]}</div>
      </td>
      <td className="px-3 py-2 min-w-[130px]">
        <input value={form.assureur_nom} onChange={set("assureur_nom")} className={cls(missing("assureur"))} placeholder="Alptis, April…" />
      </td>
      <td className="px-3 py-2 min-w-[140px]">
        <input type="date" value={form.date_effet} onChange={set("date_effet")} className={cls(missing("date_effet"))} />
      </td>
      <td className="px-3 py-2 min-w-[120px]">
        <input inputMode="decimal" value={form.prime} onChange={set("prime")} className={cls(missing("prime"))} placeholder={epargne ? "Versement €" : "€/mois"} />
      </td>
      <td className="px-3 py-2 min-w-[100px]">
        <input inputMode="decimal" value={form.frais_dossier} onChange={set("frais_dossier")} className={cls(false)} placeholder="€" />
      </td>
      <td className="px-3 py-2 min-w-[100px]">
        <input
          inputMode="decimal"
          value={form.precompte_lineaire_1ere_annee}
          onChange={set("precompte_lineaire_1ere_annee")}
          className={cls(missing("commission"))}
          placeholder="€"
        />
      </td>
      <td className="px-3 py-2 min-w-[100px]">
        <input inputMode="decimal" value={form.lineaire_n1} onChange={set("lineaire_n1")} className={cls(missing("commission"))} placeholder="€" />
      </td>
      <td className="px-3 py-2">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="rounded-full bg-[#CDAA5A] text-[#071C2C] text-xs font-semibold px-3 py-1.5 disabled:opacity-40 whitespace-nowrap"
        >
          {saving ? "..." : "Enregistrer"}
        </button>
      </td>
    </tr>
  );
}

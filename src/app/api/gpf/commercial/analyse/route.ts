import { NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { GPF_STATUTS_SIGNES } from "@/lib/gpf/types";
import { indexEtape, PIPELINE_COLONNES } from "@/lib/gpf/pipeline";
import { normSource } from "@/lib/gpf/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Analyse du pipeline : taux de passage d'une étape à l'autre, délai moyen
 * par étape, conversion par source et motifs de perte.
 */
export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const [{ data: dossiers }, { data: history }, { data: clients }] = await Promise.all([
    supabaseAdmin.from("gpf_dossiers").select("id, client_id, statut, source, produit, motif_refus, created_at").is("deleted_at", null),
    supabaseAdmin.from("gpf_status_history").select("dossier_id, ancien_statut, nouveau_statut, changed_at").order("changed_at"),
    supabaseAdmin.from("gpf_clients").select("*").is("deleted_at", null)
  ]);
  const provenanceBy = new Map((clients ?? []).map((c) => [c.id, c.provenance as string | null]));

  const histBy = new Map<string, { nouveau_statut: string; changed_at: string }[]>();
  for (const h of history ?? []) {
    if (!histBy.has(h.dossier_id)) histBy.set(h.dossier_id, []);
    histBy.get(h.dossier_id)!.push(h);
  }

  // Étape la plus avancée atteinte par chaque dossier (historique + statut actuel).
  const atteint = PIPELINE_COLONNES.map(() => 0);
  const dureesParEtape = PIPELINE_COLONNES.map(() => [] as number[]);
  for (const d of dossiers ?? []) {
    const h = histBy.get(d.id) ?? [];
    const indexes = [...h.map((x) => indexEtape(x.nouveau_statut)), indexEtape(d.statut)].filter((i) => i >= 0);
    const max = indexes.length ? Math.max(...indexes) : 0;
    for (let i = 0; i <= max; i++) atteint[i]++;
    for (let i = 0; i < h.length - 1; i++) {
      const idx = indexEtape(h[i].nouveau_statut);
      if (idx >= 0) dureesParEtape[idx].push((new Date(h[i + 1].changed_at).getTime() - new Date(h[i].changed_at).getTime()) / 86400000);
    }
  }
  const etapes = PIPELINE_COLONNES.map((c, i) => ({
    label: c.label,
    atteint: atteint[i],
    passage: i < PIPELINE_COLONNES.length - 1 && atteint[i] > 0 ? Math.round((atteint[i + 1] / atteint[i]) * 100) : null,
    delaiMoyenJours: dureesParEtape[i].length ? Math.round((dureesParEtape[i].reduce((s, v) => s + v, 0) / dureesParEtape[i].length) * 10) / 10 : null
  }));

  const parSource = new Map<string, { total: number; signes: number; perdus: number }>();
  for (const d of dossiers ?? []) {
    const s = normSource(provenanceBy.get(d.client_id) ?? d.source);
    if (!parSource.has(s)) parSource.set(s, { total: 0, signes: 0, perdus: 0 });
    const v = parSource.get(s)!;
    v.total++;
    if (GPF_STATUTS_SIGNES.has(d.statut)) v.signes++;
    if (d.statut === "refuse" || d.statut === "sans_suite") v.perdus++;
  }
  const sources = [...parSource.entries()]
    .map(([source, v]) => ({ source, ...v, conversion: v.total ? Math.round((v.signes / v.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);

  const motifs = new Map<string, number>();
  for (const d of (dossiers ?? []).filter((x) => x.statut === "refuse" || x.statut === "sans_suite")) {
    const m = d.motif_refus ?? (d.statut === "sans_suite" ? "Sans suite" : "Non renseigné");
    motifs.set(m, (motifs.get(m) ?? 0) + 1);
  }

  const total = (dossiers ?? []).length;
  const signes = (dossiers ?? []).filter((d) => GPF_STATUTS_SIGNES.has(d.statut)).length;
  return NextResponse.json({
    ok: true,
    total,
    signes,
    conversionGlobale: total ? Math.round((signes / total) * 100) : 0,
    etapes,
    sources,
    motifs: [...motifs.entries()].map(([motif, n]) => ({ motif, n })).sort((a, b) => b.n - a.n)
  });
}

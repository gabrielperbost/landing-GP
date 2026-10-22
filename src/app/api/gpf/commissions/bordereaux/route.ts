import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { CHAMPS, normaliserLigne, parseCsv, parseXlsx, proposerMapping, type LigneNormalisee, type Mapping, type Table } from "@/lib/gpf/bordereaux";
import { chargerContexte, majCompteurs, rapprocher } from "@/lib/gpf/rapprochement";
import { appelClaude, extraireJson, iaDisponible } from "@/lib/gpf/anthropic";
import { notify } from "@/lib/gpf/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "gpf-documents";

export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [{ data, error }, { data: insurers }] = await Promise.all([
    supabaseAdmin.from("gpf_bordereaux").select("*").order("created_at", { ascending: false }).limit(200),
    supabaseAdmin.from("gpf_insurers").select("id, nom")
  ]);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const nom = new Map((insurers ?? []).map((i) => [i.id, i.nom]));
  return NextResponse.json({ ok: true, bordereaux: (data ?? []).map((b) => ({ ...b, compagnie: b.insurer_id ? nom.get(b.insurer_id) ?? null : null })), iaDisponible: iaDisponible() });
}

const extension = (nom: string) => nom.toLowerCase().split(".").pop() ?? "";

async function lireTable(file: File): Promise<Table> {
  const ext = extension(file.name);
  const buf = Buffer.from(await file.arrayBuffer());
  if (ext === "csv" || ext === "txt") return parseCsv(buf.toString("utf8"));
  if (ext === "xlsx") return parseXlsx(buf);
  if (ext === "xls") throw new Error("format_xls");
  throw new Error("format_inconnu");
}

/** Bordereau PDF : l'IA en extrait les lignes (aucune donnée de santé n'y figure). */
async function lirePdf(file: File): Promise<LigneNormalisee[]> {
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const rep = await appelClaude({
    maxTokens: 8000,
    system:
      "Tu extrais les lignes de commission d'un bordereau d'assureur français. Réponds uniquement par un tableau JSON. Une entrée par ligne de commission (par contrat et par période), sans les totaux.",
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data } },
          {
            type: "text",
            text: 'Extrais chaque ligne sous la forme {"client": "NOM Prénom", "reference_contrat": "…ou null", "date_effet": "AAAA-MM-JJ ou null", "periode_debut": "AAAA-MM-JJ ou null", "periode_fin": "AAAA-MM-JJ ou null", "base": nombre ou null, "taux": nombre décimal (0.15 pour 15 %) ou null, "montant": nombre (négatif si reprise), "type": "nouvelle_affaire" | "recurrent_lineaire" | "frais_dossier" | "decommission"}. Une affaire nouvelle / précompte = nouvelle_affaire ; commission de suivi, récurrent, stock, linéaire = recurrent_lineaire.'
          }
        ]
      }
    ]
  });
  const texte = rep.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("\n");
  const lignes = extraireJson<Record<string, unknown>[]>(texte) ?? [];
  return lignes
    .filter((l) => typeof l.montant === "number")
    .map((l) => ({
      client_nom_brut: String(l.client ?? ""),
      reference_contrat: (l.reference_contrat as string) || null,
      date_effet: (l.date_effet as string) || null,
      periode_debut: (l.periode_debut as string) || null,
      periode_fin: (l.periode_fin as string) || (l.periode_debut as string) || null,
      base_commission: typeof l.base === "number" ? l.base : null,
      taux: typeof l.taux === "number" ? l.taux : null,
      montant: l.montant as number,
      type_commission: (["nouvelle_affaire", "recurrent_lineaire", "frais_dossier", "decommission"].includes(String(l.type)) ? l.type : "nouvelle_affaire") as LigneNormalisee["type_commission"],
      brut: Object.fromEntries(Object.entries(l).map(([k, v]) => [k, v == null ? "" : String(v)]))
    }));
}

/**
 * Import d'un bordereau en deux temps :
 *  - etape=analyser : lit le fichier, propose (ou reprend) le mappage des colonnes ;
 *  - etape=importer : crée le bordereau, rapproche chaque ligne, le tout « À vérifier »
 *    jusqu'à la validation explicite.
 */
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const etape = String(form?.get("etape") ?? "analyser");
  const insurerId = (form?.get("insurer_id") as string) || null;
  if (!file || !(file instanceof File)) return NextResponse.json({ ok: false, error: "fichier_requis" }, { status: 400 });
  const estPdf = extension(file.name) === "pdf";

  try {
    if (etape === "analyser") {
      if (estPdf) {
        if (!iaDisponible()) return NextResponse.json({ ok: false, error: "ia_requise" }, { status: 400 });
        const lignes = await lirePdf(file);
        return NextResponse.json({ ok: true, mode: "pdf", lignes, nbLignes: lignes.length });
      }
      const table = await lireTable(file);
      let mapping: Mapping = proposerMapping(table.colonnes);
      if (insurerId) {
        const { data: ins } = await supabaseAdmin.from("gpf_insurers").select("mapping").eq("id", insurerId).single();
        const memo = ins?.mapping as Mapping | null;
        if (memo && Object.values(memo).every((c) => !c || table.colonnes.includes(c))) mapping = memo;
      }
      return NextResponse.json({ ok: true, mode: "tableau", colonnes: table.colonnes, apercu: table.lignes.slice(0, 8), nbLignes: table.lignes.length, mapping, champs: CHAMPS });
    }

    // etape === "importer"
    let lignes: LigneNormalisee[];
    let mapping: Mapping | null = null;
    if (estPdf) {
      lignes = JSON.parse(String(form?.get("lignes") ?? "[]"));
    } else {
      mapping = JSON.parse(String(form?.get("mapping") ?? "{}")) as Mapping;
      const table = await lireTable(file);
      lignes = table.lignes.map((l) => normaliserLigne(table.colonnes, l, mapping!)).filter((x): x is LigneNormalisee => Boolean(x));
    }
    if (!lignes.length) return NextResponse.json({ ok: false, error: "aucune_ligne" }, { status: 400 });

    if (insurerId && mapping) await supabaseAdmin.from("gpf_insurers").update({ mapping }).eq("id", insurerId);

    const storagePath = `bordereaux/${insurerId ?? "inconnu"}/${crypto.randomUUID()}.${extension(file.name)}`;
    await supabaseAdmin.storage.from(BUCKET).upload(storagePath, Buffer.from(await file.arrayBuffer()), { contentType: file.type || "application/octet-stream" });

    const dates = lignes.flatMap((l) => [l.periode_debut, l.periode_fin]).filter(Boolean).sort() as string[];
    const { data: b, error } = await supabaseAdmin
      .from("gpf_bordereaux")
      .insert({
        insurer_id: insurerId,
        fichier_nom: file.name,
        storage_path: storagePath,
        fichier_source: storagePath,
        periode_debut: dates[0] ?? null,
        periode_fin: dates[dates.length - 1] ?? null,
        import_statut: "a_verifier",
        mapping
      })
      .select("*")
      .single();
    if (error || !b) return NextResponse.json({ ok: false, error: error?.message ?? "creation_impossible" }, { status: 500 });

    const ctx = await chargerContexte(insurerId);
    const rows = lignes.map((l) => ({
      bordereau_id: b.id,
      client_nom_brut: l.client_nom_brut || "(sans nom)",
      reference_contrat: l.reference_contrat,
      date_effet: l.date_effet,
      type_commission: l.type_commission,
      periode_debut: l.periode_debut,
      periode_fin: l.periode_fin,
      base_commission: l.base_commission,
      taux: l.taux,
      montant: l.montant,
      brut: l.brut,
      ...rapprocher(l, ctx)
    }));
    const { error: errLignes } = await supabaseAdmin.from("gpf_commission_lines").insert(rows);
    if (errLignes) return NextResponse.json({ ok: false, error: errLignes.message }, { status: 500 });
    await majCompteurs(b.id);

    const ok = rows.filter((r) => r.rapprochement === "rapproche").length;
    const sans = rows.filter((r) => r.rapprochement === "sans_contrat").length;
    const ecarts = rows.filter((r) => r.rapprochement === "ecart").length;
    await notify(
      "bordereau",
      `Bordereau ${ctx.insurerNom ?? ""} importé : ${ok} ligne(s) rapprochée(s)`.replace("  ", " "),
      `${sans} sans correspondance, ${ecarts} écart(s) — à vérifier avant validation`,
      `/gpf/commissions?onglet=bordereaux&id=${b.id}`
    );
    return NextResponse.json({ ok: true, id: b.id, lignes: rows.length, rapprochees: ok, sansContrat: sans, ecarts });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erreur";
    return NextResponse.json({ ok: false, error: msg }, { status: msg === "assistant_non_configure" ? 400 : 500 });
  }
}

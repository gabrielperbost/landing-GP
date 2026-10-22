import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { parseCsv, parseXlsx, type Table } from "@/lib/gpf/bordereaux";
import { findDuplicate } from "@/lib/gpf/contacts";
import { ingererLead } from "@/lib/gpf/leads";
import { notify } from "@/lib/gpf/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const COLONNES: Record<string, RegExp[]> = {
  prenom: [/prenom/, /first/],
  nom: [/^nom$/, /^nom /, /last/, /(^|\s)nom($|\s)/],
  complet: [/nom complet/, /full ?name/, /^name$/, /^contact$/],
  email: [/mail/],
  telephone: [/tel/, /phone/, /portable/, /mobile/],
  code_postal: [/code.?postal/, /^cp$/, /zip/],
  ville: [/ville/, /city/],
  produit: [/produit/, /besoin/, /projet/, /campagne/, /offre/]
};

function mapper(t: Table) {
  const idx: Record<string, number> = {};
  t.colonnes.forEach((c, i) => {
    const n = norm(c);
    for (const [champ, motifs] of Object.entries(COLONNES)) if (idx[champ] == null && motifs.some((m) => m.test(n))) idx[champ] = i;
  });
  return t.lignes
    .map((l) => {
      const v = (k: string) => (idx[k] != null ? (l[idx[k]] ?? "").trim() || null : null);
      return { prenom: v("prenom") ?? v("complet"), nom: v("nom"), email: v("email"), telephone: v("telephone"), code_postal: v("code_postal"), ville: v("ville"), produit: v("produit") };
    })
    .filter((x) => x.email || x.telephone);
}

async function lire(file: File): Promise<Table> {
  const buf = Buffer.from(await file.arrayBuffer());
  return /\.xlsx$/i.test(file.name) ? parseXlsx(buf) : parseCsv(buf.toString("utf8"));
}

/**
 * Import d'un fichier de leads Masterleads (CSV ou XLSX) en deux temps :
 * aperçu (doublons repérés) puis import confirmé. Chaque lead reçoit sa tâche
 * « Appeler dans l'heure » ; une seule notification récapitulative.
 */
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const etape = String(form?.get("etape") ?? "analyser");
  const source = String(form?.get("source") ?? "Masterleads").slice(0, 40) || "Masterleads";
  if (!file || !(file instanceof File)) return NextResponse.json({ ok: false, error: "fichier_requis" }, { status: 400 });
  const leads = mapper(await lire(file).catch(() => ({ colonnes: [], lignes: [] })));
  if (!leads.length) return NextResponse.json({ ok: false, error: "aucun_lead" }, { status: 400 });
  if (leads.length > 1000) return NextResponse.json({ ok: false, error: "trop_de_lignes" }, { status: 400 });

  if (etape === "analyser") {
    let doublons = 0;
    for (const l of leads.slice(0, 300)) if (await findDuplicate(l.email, l.telephone)) doublons++;
    return NextResponse.json({ ok: true, total: leads.length, doublons, apercu: leads.slice(0, 10) });
  }

  let crees = 0;
  let connus = 0;
  for (const l of leads) {
    const r = await ingererLead({ ...l, source, sourceRef: `${source}:${(l.email ?? l.telephone ?? "").toLowerCase()}` }, { silencieux: true });
    if (r.ok && r.cree) crees++;
    else if (r.ok) connus++;
  }
  await notify("nouveau_lead", `Import ${source} : ${crees} nouveau(x) lead(s)`, `${connus} déjà connu(s) — tâches d'appel créées`, "/gpf/taches");
  return NextResponse.json({ ok: true, crees, connus });
}

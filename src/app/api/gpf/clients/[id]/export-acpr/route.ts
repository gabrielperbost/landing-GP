import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BUCKET } from "@/lib/gpf/documentsStore";
import { genererPdf, type Bloc } from "@/lib/gpf/pdf";
import { creerZip } from "@/lib/gpf/zip";
import { GPF_COMPLIANCE_ITEMS, GPF_PRODUIT_LABEL, GPF_STATUT_LABEL, type GpfProduit, type GpfStatut } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const date = (v: string | null | undefined) => (v ? new Date(v.length === 10 ? `${v}T00:00:00` : v).toLocaleDateString("fr-FR") : "—");
const CONF_STATUT: Record<string, string> = { manquant: "Manquant", en_cours: "En cours", fait: "Fait" };

/**
 * Dossier client complet pour un contrôle ACPR : synthèse PDF (identité,
 * contrats, conformité, historique des statuts) + toutes les pièces du
 * coffre-fort, dans une archive ZIP. Les notes internes ne sont pas incluses.
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const [{ data: c }, { data: dossiers }, { data: conformite }, { data: docs }] = await Promise.all([
    supabaseAdmin.from("gpf_clients").select("*").eq("id", params.id).single(),
    supabaseAdmin.from("gpf_dossiers").select("*").eq("client_id", params.id).is("deleted_at", null),
    supabaseAdmin.from("gpf_compliance").select("*").eq("client_id", params.id),
    supabaseAdmin.from("gpf_documents").select("*").eq("client_id", params.id).is("deleted_at", null)
  ]);
  if (!c) return NextResponse.json({ ok: false, error: "introuvable" }, { status: 404 });
  const dossierIds = (dossiers ?? []).map((d) => d.id);
  const { data: historique } = dossierIds.length
    ? await supabaseAdmin.from("gpf_status_history").select("*").in("dossier_id", dossierIds).order("changed_at")
    : { data: [] };
  const produitDe = new Map((dossiers ?? []).map((d) => [d.id, GPF_PRODUIT_LABEL[d.produit as GpfProduit] ?? d.produit]));
  const conf = new Map((conformite ?? []).map((x) => [x.type, x]));

  const blocs: Bloc[] = [
    { t: "titre", texte: `Dossier client — ${c.prenom} ${String(c.nom).toUpperCase()}` },
    { t: "para", texte: `Extraction du ${new Date().toLocaleString("fr-FR")}.`, petit: true },
    { t: "sousTitre", texte: "Identité" },
    {
      t: "champs",
      lignes: [
        ["Nom", `${c.civilite ?? ""} ${c.prenom} ${String(c.nom).toUpperCase()}`.trim()],
        ["Adresse", [c.adresse, c.code_postal, c.ville].filter(Boolean).join(" ") || "—"],
        ["Téléphone / e-mail", [c.telephone, c.email].filter(Boolean).join(" · ") || "—"],
        ["Profession", c.profession ?? "—"],
        ["Contact créé le", date(c.created_at)]
      ]
    },
    { t: "sousTitre", texte: "Contrats et affaires" },
    ...((dossiers ?? []).length
      ? (dossiers ?? []).map(
          (d): Bloc => ({
            t: "champs",
            lignes: [
              [GPF_PRODUIT_LABEL[d.produit as GpfProduit] ?? d.produit, `${d.assureur_nom ?? "—"} · ${GPF_STATUT_LABEL[d.statut as GpfStatut] ?? d.statut}`],
              ["N° de contrat", d.reference_contrat ?? "—"],
              ["Signature / effet", `${date(d.date_signature)} / ${date(d.date_effet)}`]
            ]
          })
        )
      : [{ t: "para" as const, texte: "—" }]),
    { t: "sousTitre", texte: "Conformité" },
    {
      t: "champs",
      lignes: GPF_COMPLIANCE_ITEMS.map((i) => {
        const x = conf.get(i.type);
        return [i.label, x ? `${CONF_STATUT[x.statut] ?? x.statut}${x.date_signature ? ` · signé le ${date(x.date_signature)}` : ""}` : "Manquant"] as [string, string];
      })
    },
    { t: "sousTitre", texte: "Historique des étapes" },
    ...((historique ?? []).length
      ? [
          {
            t: "liste" as const,
            items: (historique ?? []).map(
              (h) => `${new Date(h.changed_at).toLocaleString("fr-FR")} — ${produitDe.get(h.dossier_id) ?? ""} : ${GPF_STATUT_LABEL[h.ancien_statut as GpfStatut] ?? h.ancien_statut ?? "création"} → ${GPF_STATUT_LABEL[h.nouveau_statut as GpfStatut] ?? h.nouveau_statut}`
            )
          }
        ]
      : [{ t: "para" as const, texte: "—" }]),
    { t: "sousTitre", texte: "Pièces jointes" },
    { t: "liste", items: (docs ?? []).map((d) => `${d.type} — ${d.nom_fichier ?? "sans fichier"} (reçu le ${date(d.date_reception ?? d.created_at)})`) }
  ];

  const fichiers: { nom: string; contenu: Buffer }[] = [{ nom: "00 - Synthèse du dossier.pdf", contenu: Buffer.from(await genererPdf("Dossier client", blocs)) }];
  for (const d of docs ?? []) {
    if (!d.storage_path) continue;
    const { data: blob } = await supabaseAdmin.storage.from(BUCKET).download(d.storage_path);
    if (blob) fichiers.push({ nom: `pieces/${d.nom_fichier ?? d.id}`, contenu: Buffer.from(await blob.arrayBuffer()) });
  }
  if ((docs ?? []).length) await supabaseAdmin.from("gpf_document_access").insert((docs ?? []).map((d) => ({ document_id: d.id, action: "export_acpr" })));

  const nom = `Dossier ${c.prenom} ${String(c.nom).toUpperCase()} - ${new Date().toISOString().slice(0, 10)}.zip`.replace(/[\\/:*?"<>|]/g, "");
  return new NextResponse(creerZip(fichiers), {
    headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nom)}` }
  });
}

import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export const BUCKET = "gpf-documents";

/** Range un PDF généré dans le coffre-fort du client (Storage + gpf_documents). */
export async function enregistrerPdf(clientId: string, dossierId: string | null, type: string, nomFichier: string, octets: Uint8Array) {
  const storagePath = `clients/${clientId}/${crypto.randomUUID()}.pdf`;
  const { error: up } = await supabaseAdmin.storage.from(BUCKET).upload(storagePath, Buffer.from(octets), { contentType: "application/pdf" });
  if (up) throw new Error(up.message);
  const { data, error } = await supabaseAdmin
    .from("gpf_documents")
    .insert({
      client_id: clientId,
      dossier_id: dossierId,
      type,
      recu: true,
      nom_fichier: nomFichier,
      storage_path: storagePath,
      taille_octets: octets.byteLength,
      date_reception: new Date().toISOString().slice(0, 10)
    })
    .select("*")
    .single();
  if (error) {
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    throw new Error(error.message);
  }
  return data as { id: string; nom_fichier: string; storage_path: string };
}

/** Nom de fichier lisible : « DER - Prénom NOM - 22-10-2026.pdf ». */
export const nomFichier = (libelle: string, c: { prenom: string; nom: string }) =>
  `${libelle} - ${c.prenom} ${c.nom.toUpperCase()} - ${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.pdf`.replace(/[\\/:*?"<>|]/g, "");

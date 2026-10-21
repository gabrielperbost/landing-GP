import { NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { buildEncryptedBackup } from "@/lib/gpf/backup";
import { cabinetEmail, sendGpfMail } from "@/lib/gpf/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Sauvegarde à la demande (bouton dans Paramètres) : même export chiffré que
// la sauvegarde hebdomadaire, envoyé à l'adresse du cabinet.
export async function POST() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const { file, counts, errors } = await buildEncryptedBackup();
    const date = new Date().toISOString().slice(0, 10);
    await sendGpfMail({
      to: cabinetEmail(),
      subject: `Sauvegarde GPF du ${date} (à la demande)`,
      text: `Sauvegarde chiffrée du CRM GPF, déclenchée depuis Paramètres.\n\n${Object.entries(counts)
        .map(([t, n]) => `- ${t} : ${n}`)
        .join("\n")}\n\nÀ ouvrir avec la clé de sauvegarde (gestionnaire de mots de passe).`,
      attachments: [{ filename: `gpf-sauvegarde-${date}.gpfbak`, content: file, contentType: "application/octet-stream" }]
    });
    return NextResponse.json({ ok: true, destinataire: cabinetEmail(), taille: file.length, counts, errors });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "erreur" }, { status: 500 });
  }
}

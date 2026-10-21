import { NextRequest, NextResponse } from "next/server";
import { buildEncryptedBackup } from "@/lib/gpf/backup";
import { cabinetEmail, sendGpfMail } from "@/lib/gpf/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization")?.replace("Bearer ", "") === secret;
}

// Sauvegarde hebdomadaire gratuite : export chiffré envoyé par e-mail au
// cabinet, donc conservé hors de Supabase. Appelée par Vercel Cron (vercel.json).
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { file, counts, errors } = await buildEncryptedBackup();
  const date = new Date().toISOString().slice(0, 10);
  const lignes = Object.entries(counts)
    .map(([t, n]) => `- ${t} : ${n} ligne(s)${errors[t] ? ` (erreur : ${errors[t]})` : ""}`)
    .join("\n");

  await sendGpfMail({
    to: cabinetEmail(),
    subject: `Sauvegarde GPF du ${date}`,
    text: `Bonjour,\n\nVoici la sauvegarde hebdomadaire chiffrée du CRM GPF.\n\n${lignes}\n\nConservez ce fichier. Il ne peut être ouvert qu'avec la clé de sauvegarde (rangée dans votre gestionnaire de mots de passe), avec le script scripts/gpf-decrypt-backup.mjs du projet.\n\nCe message est envoyé automatiquement chaque semaine.`,
    attachments: [{ filename: `gpf-sauvegarde-${date}.gpfbak`, content: file, contentType: "application/octet-stream" }]
  });

  return NextResponse.json({ ok: true, date, taille: file.length, counts, errors });
}

import "server-only";
import nodemailer from "nodemailer";

const env = (name: string) => {
  const v = process.env[name]?.trim();
  if (!v) return undefined;
  return (v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")) ? v.slice(1, -1).trim() || undefined : v;
};

/** Adresse du cabinet : destinataire par défaut des envois internes (sauvegardes, alertes). */
export const cabinetEmail = () => env("GP_FINANCES_EMAIL") ?? "contact@gp-finances.fr";

export type GpfMail = {
  to?: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
};

// Réutilise le SMTP déjà configuré pour le site (IONOS) : aucun service payant ajouté.
export async function sendGpfMail(mail: GpfMail) {
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  if (!host || !user || !pass) throw new Error("smtp_non_configure");
  const port = Number(env("SMTP_PORT") ?? "465") || 465;
  const transporter = nodemailer.createTransport({ host, port, secure: env("SMTP_SECURE") !== "false", auth: { user, pass } });
  await transporter.sendMail({
    from: env("FROM_EMAIL") ?? user,
    to: mail.to ?? cabinetEmail(),
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    attachments: mail.attachments
  });
}

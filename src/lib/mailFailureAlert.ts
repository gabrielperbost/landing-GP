import "server-only";

import nodemailer from "nodemailer";

const DEFAULT_MAIL_FAILURE_ALERT_TO = "contact@gp-finances.fr";

const normalizeEnv = (value: string | undefined): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const hasDoubleQuotes = trimmed.startsWith('"') && trimmed.endsWith('"');
  const hasSingleQuotes = trimmed.startsWith("'") && trimmed.endsWith("'");
  if (hasDoubleQuotes || hasSingleQuotes) {
    const unquoted = trimmed.slice(1, -1).trim();
    return unquoted || undefined;
  }

  return trimmed;
};

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const resolveAlertRecipients = () => {
  const configured = normalizeEnv(process.env.MAIL_FAILURE_ALERT_TO);
  const raw = configured || DEFAULT_MAIL_FAILURE_ALERT_TO;
  return raw
    .split(/[;,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const stringifyError = (error: unknown) => {
  if (!error) return "unknown_error";
  if (error instanceof Error) {
    return [error.name, error.message].filter(Boolean).join(": ");
  }
  return String(error);
};

const pickErrorMetadata = (error: unknown) => {
  if (!error || typeof error !== "object") return "";
  const candidate = error as {
    code?: unknown;
    responseCode?: unknown;
    response?: unknown;
    command?: unknown;
    rejected?: unknown;
    rejectedErrors?: unknown;
  };

  const lines = [
    candidate.code ? `code: ${String(candidate.code)}` : "",
    candidate.responseCode ? `response_code: ${String(candidate.responseCode)}` : "",
    candidate.command ? `command: ${String(candidate.command)}` : "",
    candidate.response ? `response: ${String(candidate.response)}` : "",
    Array.isArray(candidate.rejected) && candidate.rejected.length > 0
      ? `rejected: ${candidate.rejected.map((item) => String(item)).join(", ")}`
      : "",
    Array.isArray(candidate.rejectedErrors) && candidate.rejectedErrors.length > 0
      ? `rejected_errors: ${candidate.rejectedErrors.map((item) => String(item)).join(" | ")}`
      : ""
  ].filter(Boolean);

  return lines.join("\n");
};

export const getMailBounceAddress = () => normalizeEnv(process.env.SMTP_BOUNCE_ADDRESS) || "";

export const buildMailEnvelopeForRecipient = (recipient: string) => {
  const bounceAddress = getMailBounceAddress();
  if (!bounceAddress || !recipient?.trim()) return undefined;
  return {
    from: bounceAddress,
    to: [recipient.trim()]
  };
};

export const hasMailDeliveryRejection = (info: unknown) => {
  if (!info || typeof info !== "object") return false;
  const candidate = info as { rejected?: unknown; accepted?: unknown };
  const rejected = Array.isArray(candidate.rejected) ? candidate.rejected : [];
  const accepted = Array.isArray(candidate.accepted) ? candidate.accepted : [];
  return rejected.length > 0 || accepted.length === 0;
};

export const notifyMailFailureAlert = async ({
  context,
  recipient,
  subject,
  error
}: {
  context: string;
  recipient: string;
  subject: string;
  error?: unknown;
}) => {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const from = normalizeEnv(process.env.FROM_EMAIL);
  const recipients = resolveAlertRecipients();
  if (!host || !user || !pass || !from || recipients.length === 0) {
    console.error("mail-failure-alert-skipped", {
      context,
      recipient,
      reason: "smtp_config_missing_or_no_recipients"
    });
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parsePort(normalizeEnv(process.env.SMTP_PORT), 465),
    secure: normalizeEnv(process.env.SMTP_SECURE) !== "false",
    auth: { user, pass }
  });

  const errorSummary = stringifyError(error);
  const metadata = pickErrorMetadata(error);
  const timestamp = new Date().toISOString();

  try {
    await transporter.sendMail({
      from,
      to: recipients.join(", "),
      subject: `Alerte email GP Finances - echec d'envoi (${context})`,
      text: [
        "Un email transactionnel GP Finances n'a pas pu etre envoye.",
        "",
        `Contexte: ${context}`,
        `Destinataire vise: ${recipient || "-"}`,
        `Sujet vise: ${subject || "-"}`,
        `Horodatage: ${timestamp}`,
        "",
        `Erreur: ${errorSummary}`,
        metadata ? `\nDetails techniques:\n${metadata}` : ""
      ]
        .filter(Boolean)
        .join("\n")
    });
    return true;
  } catch (alertError) {
    console.error("mail-failure-alert-send-failed", {
      context,
      recipient,
      alertError
    });
    return false;
  }
};

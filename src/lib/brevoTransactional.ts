import { normalizeEnv } from "@/lib/monday";

const BREVO_TRANSACTIONAL_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

export type BrevoTransactionalConfig = {
  apiKey: string;
  senderEmail: string;
  senderName: string;
};

type SendBrevoTransactionalEmailPayload = {
  config: BrevoTransactionalConfig;
  to: {
    email: string;
    name?: string;
  };
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  unsubscribeUrl?: string;
  tags?: string[];
  attachment?: { url: string; name: string }[];
};

const parseFromEmail = (from: string) => {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim();
};

export const getBrevoTransactionalConfig = (): BrevoTransactionalConfig | null => {
  const apiKey = normalizeEnv(process.env.BREVO_API_KEY);
  const fallbackFrom = normalizeEnv(process.env.FROM_EMAIL) ?? "";
  const senderEmail = normalizeEnv(process.env.BREVO_SENDER_EMAIL) ?? parseFromEmail(fallbackFrom);
  const senderName = normalizeEnv(process.env.BREVO_SENDER_NAME) ?? "Gabriel PERBOST - GP Finances";

  if (!apiKey || !senderEmail) return null;
  return { apiKey, senderEmail, senderName };
};

export const sendBrevoTransactionalEmail = async ({
  config,
  to,
  subject,
  html,
  text,
  replyTo,
  unsubscribeUrl,
  tags = [],
  attachment
}: SendBrevoTransactionalEmailPayload) => {
  const headers =
    unsubscribeUrl
      ? {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
        }
      : undefined;

  const response = await fetch(BREVO_TRANSACTIONAL_EMAIL_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": config.apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: config.senderName,
        email: config.senderEmail
      },
      to: [
        {
          email: to.email,
          name: to.name || undefined
        }
      ],
      replyTo: replyTo ? { email: replyTo } : undefined,
      subject,
      htmlContent: html,
      textContent: text,
      tags,
      headers,
      attachment
    })
  });

  const responseBody = (await response.json().catch(() => ({}))) as {
    messageId?: string;
    code?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(`brevo_send_failed:${response.status}:${responseBody.message ?? responseBody.code ?? "unknown_error"}`);
  }

  return responseBody.messageId;
};

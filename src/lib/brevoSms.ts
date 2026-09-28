import "server-only";

/**
 * Envoi de SMS transactionnels via Brevo. Un SMS marketing/transactionnel en France
 * demande un nom d'expéditeur validé au préalable dans le compte Brevo (Paramètres >
 * Expéditeurs SMS) : sans validation, Brevo refuse l'envoi. Voir
 * docs/campaigns/webinaire-per-grand-public.md.
 */
const BREVO_SMS_URL = "https://api.brevo.com/v3/transactionalSMS/sms";

const normalizeEnv = (value: string | undefined): string | undefined => {
  const trimmed = (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
};

export type BrevoSmsConfig = { apiKey: string; sender: string };

export const getBrevoSmsConfig = (): BrevoSmsConfig | null => {
  const apiKey = normalizeEnv(process.env.BREVO_API_KEY);
  // Nom d'expéditeur SMS validé dans Brevo (11 caractères alphanumériques maximum).
  const sender = normalizeEnv(process.env.BREVO_SMS_SENDER) || "GPFinances";
  if (!apiKey) return null;
  return { apiKey, sender: sender.slice(0, 11) };
};

/** Met un numéro français au format international E.164 (+33...) attendu par Brevo. */
export const toE164FrenchPhone = (raw: string): string | null => {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return /^\+\d{8,15}$/.test(digits) ? digits : null;
  const national = digits.replace(/^0/, "");
  return /^[1-9]\d{8}$/.test(national) ? `+33${national}` : null;
};

export const sendBrevoSms = async ({
  config,
  phone,
  text,
  tag
}: {
  config: BrevoSmsConfig;
  phone: string;
  text: string;
  tag?: string;
}) => {
  const recipient = toE164FrenchPhone(phone);
  if (!recipient) throw new Error("INVALID_PHONE");
  const response = await fetch(BREVO_SMS_URL, {
    method: "POST",
    headers: { accept: "application/json", "api-key": config.apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      sender: config.sender,
      recipient,
      content: text.slice(0, 459), // ~3 SMS concaténés au maximum
      type: "transactional",
      tag
    })
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`BREVO_SMS_HTTP_${response.status}: ${body.slice(0, 300)}`);
  }
  return response.json();
};

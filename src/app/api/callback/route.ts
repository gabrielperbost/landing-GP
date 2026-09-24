import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { appendLeadLog, type LeadLogStatus } from "@/lib/leadsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ValidLead = {
  name: string;
  phone: string;
  email: string;
  source?: string;
};

type LeadSourcePayload = {
  form?: string;
  path?: string;
  objective?: string;
  lead_magnet?: unknown;
  [key: string]: unknown;
};

type LeadContext = {
  sourcePayload?: LeadSourcePayload;
  isPerLead: boolean;
  wantsLeadMagnet: boolean;
  objective?: string;
  leadMagnetUrl?: string;
};

const MANDATORY_LEAD_ALERT_EMAIL = "gabriel.perbost@gp-finances.fr";

type ValidationError = {
  success: false;
  error: {
    flatten: () => {
      fieldErrors: Record<string, string[]>;
    };
  };
};

type ValidationSuccess = {
  success: true;
  data: ValidLead;
};

type ValidationResult = ValidationError | ValidationSuccess;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizePhone = (phone: unknown) => String(phone ?? "").replace(/[^\d+]/g, "").trim();

const escapeHtml = (str: unknown) =>
  String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const invalidResult = (field: string, message: string): ValidationError => ({
  success: false,
  error: {
    flatten: () => ({
      fieldErrors: {
        [field]: [message]
      }
    })
  }
});

const validateLead = (body: unknown): ValidationResult => {
  if (!body || typeof body !== "object") {
    return invalidResult("body", "Payload invalide");
  }

  const data = body as Record<string, unknown>;
  const phone = normalizePhone(data.phone);
  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const source = typeof data.source === "string" ? data.source : undefined;

  if (phone.length < 8) {
    return invalidResult("phone", "Téléphone invalide");
  }

  if (name.length > 0 && name.length < 2) {
    return invalidResult("name", "Nom invalide");
  }

  if (email.length > 0 && !emailPattern.test(email)) {
    return invalidResult("email", "Email invalide");
  }

  return {
    success: true,
    data: {
      name: name || "Client",
      phone,
      email,
      source
    }
  };
};

type BrandEmailShellParams = {
  title: string;
  subtitle: string;
  contentHtml: string;
};

const brandEmailShell = ({ title, subtitle, contentHtml }: BrandEmailShellParams) => `
  <div style="background:#f5f8ff;padding:26px 14px;">
    <div style="max-width:680px;margin:0 auto;">
      <div style="background:linear-gradient(180deg,#eef4ff 0%, #f5f8ff 100%);border-radius:18px;padding:14px;">
        <div style="background:#ffffff;border:1px solid #e7eefb;border-radius:16px;overflow:hidden;">
          <div style="padding:18px 18px 14px 18px;border-bottom:1px solid #edf2ff;">
            <div style="font-family:Arial,sans-serif;color:#0b1220;font-weight:800;font-size:16px;">
              GP Finances
            </div>
            <div style="font-family:Arial,sans-serif;color:#4b5563;font-size:13px;margin-top:4px;">
              Courtier indépendant • Assurance emprunteur • Loi Lemoine
            </div>
          </div>

          <div style="padding:18px;">
            <div style="font-family:Arial,sans-serif;font-size:18px;font-weight:900;color:#0b1220;margin:0 0 6px;">
              ${title}
            </div>
            <div style="font-family:Arial,sans-serif;font-size:14px;color:#334155;line-height:1.5;margin:0 0 14px;">
              ${subtitle}
            </div>

            ${contentHtml}

            <div style="margin-top:18px;display:flex;gap:8px;flex-wrap:wrap;">
              <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;background:#eef2ff;border:1px solid #dbeafe;color:#1A3C5C;padding:8px 10px;border-radius:999px;">
                Sans engagement
              </span>
              <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;background:#eef2ff;border:1px solid #dbeafe;color:#1A3C5C;padding:8px 10px;border-radius:999px;">
                Données sécurisées
              </span>
              <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;background:#eef2ff;border:1px solid #dbeafe;color:#1A3C5C;padding:8px 10px;border-radius:999px;">
                Réponse &lt; 24h
              </span>
            </div>

            <div style="margin-top:16px;border-top:1px solid #edf2ff;padding-top:14px;">
              <div style="font-family:Arial,sans-serif;color:#64748b;font-size:12px;line-height:1.45;">
                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
              </div>
            </div>
          </div>
        </div>

        <div style="font-family:Arial,sans-serif;color:#94a3b8;font-size:11px;text-align:center;margin-top:10px;">
          © GP Finances - Email automatique
        </div>
      </div>
    </div>
  </div>`;

const buildClientEmailHtml = ({ name }: { name: string }) => {
  const fullName = name.trim() || "Bonjour";
  const content = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.6;">
      <p style="margin:0 0 10px;">Bonjour ${escapeHtml(fullName)},</p>

      <p style="margin:0 0 12px;">
        Nous avons bien reçu votre demande <b>"Être rappelé"</b>.
        Je vous contacte <b>très rapidement</b> pour vérifier si vous pouvez réduire le coût de votre assurance emprunteur
        <b>sans changer de banque</b> (Loi Lemoine).
      </p>

      <div style="background:#f1f6ff;border:1px solid #dbeafe;border-radius:14px;padding:14px;margin:12px 0;">
        <div style="font-weight:900;color:#1A3C5C;margin-bottom:6px;">Pour accélérer l'étude (recommandé)</div>
        <div style="color:#0f172a;">
          Vous pouvez répondre à cet email avec en pièces jointes :
          <ul style="margin:10px 0 0 18px;padding:0;">
            <li><b>Votre assurance emprunteur</b> (contrat / attestation)</li>
            <li><b>L'offre de prêt</b></li>
            <li><b>Le tableau d’amortissement</b></li>
          </ul>
          <div style="margin-top:10px;color:#334155;">
            Grâce à ces documents, je pourrais vous donner une réponse claire sur l'économie que vous allez réaliser.
          </div>
        </div>
      </div>

      <div style="background:#0b1220;border-radius:14px;padding:12px 14px;color:#ffffff;">
        <div style="font-weight:900;margin-bottom:4px;">Ce que vous gagnez</div>
        <div style="opacity:0.92;">
          • Une analyse personnalisée<br/>
          • Un plan simple : quoi faire, quand, et avec quelles garanties<br/>
          • Si ce n'est pas intéressant : je vous le dis tout de suite
        </div>
      </div>

      <p style="margin:14px 0 0;color:#0f172a;">
        Bien à vous,<br/>
        <b>Gabriel Perbost</b><br/>
        <span style="color:#64748b;">GP Finances - Courtier indépendant</span>
      </p>
    </div>
  `;

  return brandEmailShell({
    title: "Nous avons bien reçu votre demande, je vous rappelle au plus vite",
    subtitle: "Vous pouvez envoyer vos documents dès maintenant pour gagner du temps. (Répondez à cet email)",
    contentHtml: content
  });
};

const buildPerClientEmailHtml = ({
  name,
  wantsLeadMagnet,
  leadMagnetUrl
}: {
  name: string;
  wantsLeadMagnet: boolean;
  leadMagnetUrl?: string;
}) => {
  const fullName = name.trim() || "Bonjour";

  const leadMagnetBlock =
    wantsLeadMagnet && leadMagnetUrl
      ? `
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:14px;margin:12px 0;">
          <div style="font-weight:900;color:#9a3412;margin-bottom:6px;">Votre guide offert est prêt</div>
          <div style="color:#0f172a;">
            Voici votre lien de téléchargement :
            <br/>
            <a href="${escapeHtml(leadMagnetUrl)}" style="display:inline-block;margin-top:8px;color:#1A3C5C;font-weight:700;">
              Télécharger le guide « 7 erreurs PER à éviter »
            </a>
          </div>
        </div>
      `
      : "";

  const content = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.6;">
      <p style="margin:0 0 10px;">Bonjour ${escapeHtml(fullName)},</p>

      <p style="margin:0 0 12px;">
        Votre demande d’informations PER a bien été prise en compte.
        Je vous rappelle rapidement pour vérifier si cette stratégie est adaptée à votre situation fiscale et à vos objectifs retraite.
      </p>

      ${leadMagnetBlock}

      <div style="background:#0b1220;border-radius:14px;padding:12px 14px;color:#ffffff;">
        <div style="font-weight:900;margin-bottom:4px;">Ce que vous obtenez pendant l'appel</div>
        <div style="opacity:0.92;">
          • Une réponse claire sur la pertinence du PER dans votre cas<br/>
          • Un avis sur les points de vigilance (frais, horizon, fiscalité)<br/>
          • Aucune obligation de souscription
        </div>
      </div>

      <p style="margin:14px 0 0;color:#0f172a;">
        Bien à vous,<br/>
        <b>Gabriel Perbost</b><br/>
        <span style="color:#64748b;">GP Finances - Gérant du cabinet</span>
      </p>
    </div>
  `;

  return brandEmailShell({
    title: "Votre demande d’informations PER a bien été prise en compte",
    subtitle: "Merci. Nous revenons vers vous rapidement pour un échange personnalisé.",
    contentHtml: content
  });
};

const buildInternalEmailHtml = ({
  name,
  phone,
  email,
  source,
  context
}: {
  name: string;
  phone: string;
  email: string;
  source?: string;
  context?: LeadContext;
}) => {
  const perContextHtml = context?.isPerLead
    ? `
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;">
        <div><b>Contexte :</b> Lead PER</div>
        <div><b>Objectif :</b> ${escapeHtml(context.objective || "Non renseigné")}</div>
        <div><b>Guide demandé :</b> ${context.wantsLeadMagnet ? "Oui" : "Non"}</div>
      </div>
    `
    : "";

  const content = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.6;">
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:12px 14px;margin-bottom:12px;">
        <div style="font-weight:900;color:#9a3412;">Nouveau lead - Demande "Être rappelé"</div>
        <div style="color:#7c2d12;margin-top:4px;">Action : rappeler + demander documents (assurance / offre de prêt / TA)</div>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px 14px;">
        <div><b>Nom :</b> ${escapeHtml(name)}</div>
        <div><b>Téléphone :</b> ${escapeHtml(phone)}</div>
        <div><b>Email :</b> ${escapeHtml(email || "Non renseigné")}</div>
        <div><b>Source :</b> ${escapeHtml(source || "site")}</div>
        ${perContextHtml}
      </div>
    </div>
  `;

  return brandEmailShell({
    title: "Lead à rappeler",
    subtitle: "Une personne vient de demander à être rappelée depuis le site.",
    contentHtml: content
  });
};

const isTruthy = (value: string | undefined) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

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

const parseSourcePayload = (source: string | undefined): LeadSourcePayload | undefined => {
  if (!source) return undefined;
  try {
    const parsed = JSON.parse(source);
    if (!parsed || typeof parsed !== "object") return undefined;
    return parsed as LeadSourcePayload;
  } catch {
    return undefined;
  }
};

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

const resolveSiteBaseUrl = (req: Request): string => {
  const configured =
    normalizeEnv(process.env.PUBLIC_SITE_URL) ||
    normalizeEnv(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeEnv(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return configured.replace(/\/+$/, "");

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host");
  if (!host) return "https://gp-finances.fr";

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const proto = forwardedProto || (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
};

const resolveLeadContext = (req: Request, lead: ValidLead): LeadContext => {
  const sourcePayload = parseSourcePayload(lead.source);
  const formName = typeof sourcePayload?.form === "string" ? sourcePayload.form : "";
  const isPerLead = formName.startsWith("per_");
  const wantsLeadMagnet = isPerLead && normalizeBoolean(sourcePayload?.lead_magnet);
  const objective = typeof sourcePayload?.objective === "string" ? sourcePayload.objective : undefined;
  const leadMagnetUrl =
    normalizeEnv(process.env.PER_LEAD_MAGNET_URL) ||
    `${resolveSiteBaseUrl(req)}/lead-magnets/per/guide-per-7-erreurs.pdf`;

  return {
    sourcePayload,
    isPerLead,
    wantsLeadMagnet,
    objective,
    leadMagnetUrl
  };
};

const resolveInternalRecipients = (internalTo: string): string => {
  const recipients = new Set(
    internalTo
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
  recipients.add(MANDATORY_LEAD_ALERT_EMAIL);
  return Array.from(recipients).join(", ");
};

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const resolveSecure = (secure: string | undefined, port: number): boolean => {
  if (!secure) return port === 465;
  return isTruthy(secure);
};

const isMockMode = () => {
  if (!isTruthy(process.env.SMTP_MOCK)) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return isTruthy(process.env.ALLOW_SMTP_MOCK_IN_PROD);
};

const mockSuccess = (reason: string, lead: ValidLead) => {
  console.warn("callback-email-mock", {
    reason,
    lead
  });
  return NextResponse.json({ ok: true, mocked: true, reason });
};

const normalizeErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;
  return "unknown_error";
};

const persistLead = async (lead: ValidLead, status: LeadLogStatus, detail: string) => {
  try {
    await appendLeadLog({
      submittedAt: new Date().toISOString(),
      fullName: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source || "site",
      status,
      detail
    });
  } catch (error) {
    console.error("lead-log-failed", error);
  }
};

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/callback",
    method: "POST",
    note: "Utilisez une requête POST JSON pour soumettre un lead."
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = validateLead(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Champs invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const lead = parsed.data;
    const leadContext = resolveLeadContext(req, lead);

    const host = normalizeEnv(process.env.SMTP_HOST);
    const user = normalizeEnv(process.env.SMTP_USER);
    const pass = normalizeEnv(process.env.SMTP_PASS);
    const from = normalizeEnv(process.env.FROM_EMAIL);
    const internalTo = normalizeEnv(process.env.INTERNAL_LEADS_EMAIL);

    if (!host || !user || !pass || !from || !internalTo) {
      if (isMockMode()) {
        await persistLead(lead, "mocked", "smtp_config_missing");
        return mockSuccess("smtp_config_missing", lead);
      }
      await persistLead(lead, "error", "smtp_config_missing");
      return NextResponse.json({ ok: false, error: "Configuration SMTP incomplete" }, { status: 500 });
    }

    const port = parsePort(normalizeEnv(process.env.SMTP_PORT), 465);
    const secure = resolveSecure(normalizeEnv(process.env.SMTP_SECURE), port);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
    const internalRecipients = resolveInternalRecipients(internalTo);

    try {
      await transporter.sendMail({
        from,
        to: internalRecipients,
        subject: leadContext.isPerLead
          ? `Lead PER à rappeler - ${lead.name} (${lead.phone})`
          : `À rappeler - ${lead.name} (${lead.phone})`,
        html: buildInternalEmailHtml({ ...lead, context: leadContext })
      });

      let detail = "smtp_sent";
      if (lead.email) {
        try {
          await transporter.sendMail({
            from,
            to: lead.email,
            subject: leadContext.isPerLead
              ? "Votre demande d’informations PER a bien été prise en compte"
              : "Demande bien reçue, je vous rappelle au plus vite",
            html: leadContext.isPerLead
              ? buildPerClientEmailHtml({
                  name: lead.name,
                  wantsLeadMagnet: leadContext.wantsLeadMagnet,
                  leadMagnetUrl: leadContext.wantsLeadMagnet ? leadContext.leadMagnetUrl : undefined
                })
              : buildClientEmailHtml({ name: lead.name })
          });
        } catch (clientMailError) {
          const clientError = normalizeErrorMessage(clientMailError);
          detail = `smtp_sent_internal_only:${clientError}`;
          console.error("callback-client-email-failed", clientError);
        }
      }
      await persistLead(lead, "sent", detail);

      if (detail !== "smtp_sent") {
        return NextResponse.json({
          ok: true,
          warning: "Le lead est reçu, mais l'email de confirmation client a échoué."
        });
      }
    } catch (mailError) {
      if (isMockMode()) {
        await persistLead(lead, "mocked", "smtp_send_failed");
        return mockSuccess("smtp_send_failed", lead);
      }
      await persistLead(lead, "error", normalizeErrorMessage(mailError));
      throw mailError;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("api-callback-error", err);
    return NextResponse.json({ ok: false, error: "Une erreur est survenue. Réessayez." }, { status: 500 });
  }
}

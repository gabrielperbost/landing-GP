import { supabaseAdmin } from "@/lib/supabase";
import { normalizeEnv } from "@/lib/monday";
import crypto from "node:crypto";

type CreateOrReuseSessionParams = {
  mondayItemId: string;
  clientName: string;
  clientEmail: string;
  bank?: string;
  requestUrl?: string;
  accessPath?: string;
};

export const PER_SESSION_BANK_MARKER = "__per_dossier__";

export const isPerSessionBank = (bank: string | null | undefined) => bank === PER_SESSION_BANK_MARKER;

const generateToken = (length = 32) => {
  const bytes = crypto.randomBytes(Math.ceil((length * 3) / 4));
  return bytes.toString("base64url").slice(0, length);
};

const resolveTokenTtlDays = () => {
  const raw = Number(process.env.DEPOT_TOKEN_TTL_DAYS ?? "30");
  if (!Number.isFinite(raw) || raw <= 0) return 30;
  return Math.min(raw, 90);
};

const resolveBaseUrl = (requestUrl?: string) => {
  const envBaseUrl = normalizeEnv(process.env.NEXT_PUBLIC_BASE_URL);
  if (envBaseUrl) return envBaseUrl.replace(/\/+$/, "");
  if (requestUrl) {
    const origin = new URL(requestUrl).origin;
    return origin.replace(/\/+$/, "");
  }
  return "https://gp-finances.fr";
};

export const buildClientAccessLink = ({
  token,
  requestUrl,
  email,
  accessPath = "/depot"
}: {
  token: string;
  requestUrl?: string;
  email?: string;
  accessPath?: string;
}) => {
  const baseUrl = resolveBaseUrl(requestUrl);
  const params = new URLSearchParams({ token });
  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) {
    params.set("email", normalizedEmail);
  }
  const normalizedPath = accessPath.startsWith("/") ? accessPath : `/${accessPath}`;
  return `${baseUrl}${normalizedPath}?${params.toString()}`;
};

export const createOrReuseDepotSession = async ({
  mondayItemId,
  clientName,
  clientEmail,
  bank,
  requestUrl,
  accessPath
}: CreateOrReuseSessionParams) => {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + resolveTokenTtlDays());

  const { data: existingRows } = await supabaseAdmin
    .from("sessions")
    .select("id, token, token_expires_at, created_at")
    .eq("monday_item_id", mondayItemId)
    .order("created_at", { ascending: false })
    .limit(1);

  const existing = existingRows?.[0];

  let token: string;
  let sessionId: string;
  let tokenExpiresAt: string;

  if (existing && new Date(existing.token_expires_at) > now) {
    token = existing.token;
    sessionId = existing.id;
    tokenExpiresAt = existing.token_expires_at;

    await supabaseAdmin
      .from("sessions")
      .update({
        client_name: clientName,
        client_email: clientEmail,
        bank: bank || null
      })
      .eq("id", existing.id);
  } else if (existing) {
    token = generateToken(32);
    tokenExpiresAt = expiresAt.toISOString();
    sessionId = existing.id;

    const { error: updateError } = await supabaseAdmin
      .from("sessions")
      .update({
        token,
        token_expires_at: tokenExpiresAt,
        client_name: clientName,
        client_email: clientEmail,
        bank: bank || null
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error("session_rotation_failed");
    }
  } else {
    token = generateToken(32);
    tokenExpiresAt = expiresAt.toISOString();

    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .insert({
        token,
        monday_item_id: mondayItemId,
        client_name: clientName,
        client_email: clientEmail,
        bank: bank || null,
        status: "pending",
        token_expires_at: tokenExpiresAt
      })
      .select("id")
      .single();

    if (error || !session) {
      throw new Error("session_creation_failed");
    }
    sessionId = session.id;
  }

  const link = buildClientAccessLink({
    token,
    requestUrl,
    email: clientEmail,
    accessPath
  });

  return {
    sessionId,
    token,
    link,
    expiresAt: tokenExpiresAt
  };
};

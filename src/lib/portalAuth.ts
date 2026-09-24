import "server-only";

import crypto from "node:crypto";
import { createClient, type User } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const PORTAL_SESSION_COOKIE_NAME = "gpf_portal_session";
export const PORTAL_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 45;

export type PortalCookieSession = {
  token: string;
  email: string;
  iat: number;
  exp: number;
};

export type SessionsRow = {
  id: string;
  token: string;
  monday_item_id: string | null;
  client_name: string | null;
  client_email: string | null;
  bank: string | null;
  status: string | null;
  offre_url?: string | null;
  tableau_url?: string | null;
  token_expires_at: string;
  created_at?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
const isLegacyTokenInputAllowed =
  String(process.env.ALLOW_LEGACY_PORTAL_TOKEN_INPUT ?? "")
    .trim()
    .toLowerCase() === "true";

type TokenSource = "cookie" | "legacy" | "none";

const toBase64Url = (value: string) => Buffer.from(value, "utf8").toString("base64url");

const fromBase64Url = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const getCookieSecret = () => {
  const explicit = process.env.PORTAL_AUTH_COOKIE_SECRET?.trim();
  if (explicit && explicit.length >= 32) return explicit;

  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (fallback && fallback.length >= 32) return fallback;

  return "";
};

const signPayload = (payload: string) => {
  const secret = getCookieSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
};

const safeCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const parseCookieParts = (value: string) => {
  const [payloadPart, signaturePart] = value.split(".");
  if (!payloadPart || !signaturePart) return null;
  return { payloadPart, signaturePart };
};

const getRateLimitStore = () => {
  const g = globalThis as typeof globalThis & {
    __gpfPortalRateLimitStore?: Map<string, RateLimitEntry>;
  };
  if (!g.__gpfPortalRateLimitStore) {
    g.__gpfPortalRateLimitStore = new Map<string, RateLimitEntry>();
  }
  return g.__gpfPortalRateLimitStore;
};

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

const normalizeHost = (value: string | null | undefined) => {
  if (!value) return "";
  return value.trim().toLowerCase();
};

const withSamePort = (host: string, nextHostname: string) => {
  const split = host.split(":");
  if (split.length > 1) {
    const port = split.slice(1).join(":");
    return `${nextHostname}:${port}`;
  }
  return nextHostname;
};

const hostVariants = (host: string) => {
  const normalized = normalizeHost(host);
  if (!normalized) return [];

  const variants = new Set<string>([normalized]);

  if (normalized.startsWith("www.")) {
    variants.add(normalized.slice(4));
  } else if (!normalized.startsWith("localhost") && !normalized.startsWith("127.0.0.1") && !normalized.startsWith("[::1]")) {
    variants.add(`www.${normalized}`);
  }

  if (normalized.startsWith("localhost")) {
    variants.add(withSamePort(normalized, "127.0.0.1"));
  }
  if (normalized.startsWith("127.0.0.1")) {
    variants.add(withSamePort(normalized, "localhost"));
  }
  if (normalized.startsWith("[::1]")) {
    variants.add(withSamePort(normalized, "localhost"));
    variants.add(withSamePort(normalized, "127.0.0.1"));
  }

  return Array.from(variants);
};

const hostFromUrl = (value: string | null | undefined) => {
  if (!value) return "";
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return "";
  }
};

export const resolvePortalTokenFromRequest = ({
  req,
  legacyToken
}: {
  req: NextRequest;
  legacyToken?: string;
}): { token: string; email: string; source: TokenSource } => {
  const cookieSession = getPortalSessionFromRequest(req);
  if (cookieSession?.token) {
    return {
      token: cookieSession.token,
      email: cookieSession.email,
      source: "cookie"
    };
  }

  const fallbackToken = String(legacyToken ?? "").trim();
  if (isLegacyTokenInputAllowed && fallbackToken) {
    return {
      token: fallbackToken,
      email: "",
      source: "legacy"
    };
  }

  return {
    token: "",
    email: "",
    source: "none"
  };
};

export const isTrustedPortalOrigin = (req: NextRequest) => {
  const originHeader = req.headers.get("origin")?.trim();
  if (!originHeader) return true;

  let originHost = "";
  try {
    originHost = new URL(originHeader).host.toLowerCase();
  } catch {
    return false;
  }

  const requestHost = normalizeHost(req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  const baseHost = hostFromUrl(process.env.NEXT_PUBLIC_BASE_URL);
  const productionHost = normalizeHost(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL);

  const allowedHosts = new Set(
    [requestHost, baseHost, productionHost]
      .filter(Boolean)
      .flatMap((host) => hostVariants(host))
  );
  return allowedHosts.has(originHost);
};

export const isSessionOwnedByEmail = ({
  sessionEmail,
  expectedEmail
}: {
  sessionEmail: string | null | undefined;
  expectedEmail: string | null | undefined;
}) => {
  const normalizedSessionEmail = normalizeEmail(String(sessionEmail ?? ""));
  const normalizedExpectedEmail = normalizeEmail(String(expectedEmail ?? ""));
  if (!normalizedExpectedEmail) return true;
  if (!isValidEmail(normalizedSessionEmail) || !isValidEmail(normalizedExpectedEmail)) return false;
  return normalizedSessionEmail === normalizedExpectedEmail;
};

export const isStrongPortalPassword = (value: string) => {
  const password = value.trim();
  if (password.length < 8) return false;
  if (!/[a-z]/i.test(password)) return false;
  if (!/\d/.test(password)) return false;
  return true;
};

export const createPortalSessionCookieValue = ({
  token,
  email,
  maxAgeSeconds = PORTAL_SESSION_MAX_AGE_SECONDS
}: {
  token: string;
  email: string;
  maxAgeSeconds?: number;
}) => {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new Error("invalid_portal_cookie_email");
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: PortalCookieSession = {
    token,
    email: normalizedEmail,
    iat: nowSeconds,
    exp: nowSeconds + maxAgeSeconds
  };
  const payloadPart = toBase64Url(JSON.stringify(payload));
  const signaturePart = signPayload(payloadPart);
  if (!signaturePart) {
    throw new Error("portal_cookie_secret_missing");
  }
  return `${payloadPart}.${signaturePart}`;
};

export const parsePortalSessionCookie = (value: string | undefined | null): PortalCookieSession | null => {
  if (!value) return null;
  const parts = parseCookieParts(value);
  if (!parts) return null;

  const expectedSignature = signPayload(parts.payloadPart);
  if (!expectedSignature) return null;
  if (!safeCompare(expectedSignature, parts.signaturePart)) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(parts.payloadPart)) as Partial<PortalCookieSession>;
    const token = String(parsed.token ?? "").trim();
    const email = normalizeEmail(String(parsed.email ?? ""));
    const iat = Number(parsed.iat ?? 0);
    const exp = Number(parsed.exp ?? 0);

    if (!token || !isValidEmail(email) || !Number.isFinite(iat) || !Number.isFinite(exp)) {
      return null;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (exp <= nowSeconds) return null;

    return { token, email, iat, exp };
  } catch {
    return null;
  }
};

export const setPortalSessionCookie = ({
  response,
  token,
  email,
  maxAgeSeconds = PORTAL_SESSION_MAX_AGE_SECONDS
}: {
  response: NextResponse;
  token: string;
  email: string;
  maxAgeSeconds?: number;
}) => {
  const cookieValue = createPortalSessionCookieValue({ token, email, maxAgeSeconds });
  response.cookies.set({
    name: PORTAL_SESSION_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds
  });
};

export const clearPortalSessionCookie = (response: NextResponse) => {
  response.cookies.set({
    name: PORTAL_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
};

export const getPortalSessionFromRequest = (req: Pick<NextRequest, "cookies">): PortalCookieSession | null => {
  const value = req.cookies.get(PORTAL_SESSION_COOKIE_NAME)?.value;
  return parsePortalSessionCookie(value);
};

export const getPortalSessionFromCookieStore = (
  cookieStore: { get(name: string): { value: string } | undefined } | null
): PortalCookieSession | null => {
  if (!cookieStore) return null;
  const value = cookieStore.get(PORTAL_SESSION_COOKIE_NAME)?.value;
  return parsePortalSessionCookie(value);
};

export const checkPortalRateLimit = ({
  scope,
  key,
  maxAttempts,
  windowMs
}: {
  scope: string;
  key: string;
  maxAttempts: number;
  windowMs: number;
}): RateLimitResult => {
  const now = Date.now();
  const store = getRateLimitStore();
  const compositeKey = `${scope}:${key}`;

  for (const [entryKey, entryValue] of store.entries()) {
    if (entryValue.resetAt <= now) {
      store.delete(entryKey);
    }
  }

  const current = store.get(compositeKey);
  if (!current || current.resetAt <= now) {
    store.set(compositeKey, {
      count: 1,
      resetAt: now + windowMs
    });
    return {
      allowed: true,
      remaining: Math.max(maxAttempts - 1, 0),
      retryAfterSeconds: Math.ceil(windowMs / 1000)
    };
  }

  if (current.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1)
    };
  }

  current.count += 1;
  store.set(compositeKey, current);
  return {
    allowed: true,
    remaining: Math.max(maxAttempts - current.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1)
  };
};

const getSupabaseAuthClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("supabase_auth_env_missing");
  }
  return createClient(url, anon, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

const findPortalAuthUserByEmail = async (email: string): Promise<User | null> => {
  const normalizedEmail = normalizeEmail(email);
  let page = 1;
  const perPage = 200;

  while (page <= 25) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`auth_list_users_failed:${error.message}`);
    }

    const users = data.users ?? [];
    const found = users.find((user) => normalizeEmail(user.email ?? "") === normalizedEmail);
    if (found) return found;

    if (users.length < perPage) return null;
    page += 1;
  }

  return null;
};

export const getPortalAuthStateByEmail = async (email: string): Promise<{ exists: boolean; passwordSet: boolean }> => {
  const user = await findPortalAuthUserByEmail(email);
  if (!user) {
    return { exists: false, passwordSet: false };
  }

  const passwordSet = Boolean((user.user_metadata ?? {}).portal_password_set);
  return { exists: true, passwordSet };
};

const generateTemporaryPassword = () => `${crypto.randomBytes(16).toString("base64url")}Aa1!`;

export const ensurePortalAuthUser = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new Error("invalid_email");
  }

  const existing = await findPortalAuthUserByEmail(normalizedEmail);
  if (existing) return existing;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password: generateTemporaryPassword(),
    email_confirm: true,
    user_metadata: {
      portal_client: true,
      portal_password_set: false
    }
  });

  if (!error && data.user) {
    return data.user;
  }

  const message = String(error?.message ?? "").toLowerCase();
  if (message.includes("already") || message.includes("registered") || message.includes("exists") || message.includes("duplicate")) {
    const found = await findPortalAuthUserByEmail(normalizedEmail);
    if (found) return found;
  }

  throw new Error(`auth_create_user_failed:${error?.message ?? "unknown"}`);
};

export const updatePortalAuthPassword = async ({ email, password }: { email: string; password: string }) => {
  const user = await ensurePortalAuthUser(email);

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(user.user_metadata ?? {}),
      portal_client: true,
      portal_password_set: true
    }
  });

  if (error) {
    throw new Error(`auth_update_password_failed:${error.message}`);
  }
};

export const verifyPortalAuthCredentials = async ({ email, password }: { email: string; password: string }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) return false;

  const client = getSupabaseAuthClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: normalizedEmail,
    password
  });

  if (error || !data.user) {
    return false;
  }

  await client.auth.signOut();
  return true;
};

export const getClientIp = (req: NextRequest) => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return req.headers.get("x-real-ip")?.trim() ?? "unknown";
};

export const getSessionByToken = async (token: string) => {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("id, token, monday_item_id, client_name, client_email, bank, status, offre_url, tableau_url, token_expires_at, created_at")
    .eq("token", token)
    .single<SessionsRow>();

  if (error || !data) return null;
  return data;
};

export const getLatestSessionByEmail = async (email: string) => {
  if (!isSupabaseConfigured) return null;

  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("id, token, monday_item_id, client_name, client_email, bank, status, offre_url, tableau_url, token_expires_at, created_at")
    .eq("client_email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SessionsRow>();

  if (error || !data) return null;
  return data;
};

export const extendSessionTokenExpiryById = async (sessionId: string, years = 10) => {
  if (!sessionId) return null;
  const next = new Date();
  next.setFullYear(next.getFullYear() + years);
  const expiresAt = next.toISOString();
  await supabaseAdmin.from("sessions").update({ token_expires_at: expiresAt }).eq("id", sessionId);
  return expiresAt;
};

export const isSessionExpired = (session: Pick<SessionsRow, "token_expires_at">) => new Date(session.token_expires_at) < new Date();

export const isSessionStatusFirstLogin = (status: string | null | undefined) => {
  const normalized = String(status ?? "").trim().toLowerCase();
  return !normalized || normalized === "pending";
};

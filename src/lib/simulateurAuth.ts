import "server-only";

import crypto from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const SIMULATEUR_SESSION_COOKIE_NAME = "gpf_simulateur_session";
export const SIMULATEUR_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

type SimulateurSessionPayload = {
  scope: "gp_simulator_internal";
  iat: number;
  exp: number;
};

type CookieStoreLike = {
  get(name: string): { value: string } | undefined;
};

const toBase64Url = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const fromBase64Url = (value: string) => Buffer.from(value, "base64url").toString("utf8");

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

const getSimulateurPassword = () => process.env.SIMULATEUR_GP_PASSWORD?.trim() ?? "";

const getCookieSecret = () => {
  const explicit = process.env.SIMULATEUR_GP_COOKIE_SECRET?.trim();
  if (explicit && explicit.length >= 16) return explicit;

  const fallback = getSimulateurPassword();
  if (fallback.length >= 8) return fallback;

  return "";
};

const signPayload = (payloadPart: string) => {
  const secret = getCookieSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(payloadPart).digest("base64url");
};

export const isSimulateurPasswordConfigured = () => getSimulateurPassword().length >= 8;

export const isSimulateurPasswordValid = (candidate: string) => {
  const expected = getSimulateurPassword();
  if (!expected) return false;
  return safeCompare(candidate.trim(), expected);
};

export const createSimulateurSessionCookieValue = (maxAgeSeconds = SIMULATEUR_SESSION_MAX_AGE_SECONDS) => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: SimulateurSessionPayload = {
    scope: "gp_simulator_internal",
    iat: nowSeconds,
    exp: nowSeconds + maxAgeSeconds
  };

  const payloadPart = toBase64Url(JSON.stringify(payload));
  const signaturePart = signPayload(payloadPart);
  if (!signaturePart) {
    throw new Error("simulateur_cookie_secret_missing");
  }

  return `${payloadPart}.${signaturePart}`;
};

export const parseSimulateurSessionCookie = (value: string | undefined | null): SimulateurSessionPayload | null => {
  if (!value) return null;

  const parts = parseCookieParts(value);
  if (!parts) return null;

  const expectedSignature = signPayload(parts.payloadPart);
  if (!expectedSignature || !safeCompare(expectedSignature, parts.signaturePart)) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(parts.payloadPart)) as Partial<SimulateurSessionPayload>;
    const scope = String(parsed.scope ?? "");
    const iat = Number(parsed.iat ?? 0);
    const exp = Number(parsed.exp ?? 0);

    if (scope !== "gp_simulator_internal") return null;
    if (!Number.isFinite(iat) || !Number.isFinite(exp)) return null;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (exp <= nowSeconds) return null;

    return {
      scope: "gp_simulator_internal",
      iat,
      exp
    };
  } catch {
    return null;
  }
};

export const setSimulateurSessionCookie = ({
  response,
  maxAgeSeconds = SIMULATEUR_SESSION_MAX_AGE_SECONDS
}: {
  response: NextResponse;
  maxAgeSeconds?: number;
}) => {
  response.cookies.set({
    name: SIMULATEUR_SESSION_COOKIE_NAME,
    value: createSimulateurSessionCookieValue(maxAgeSeconds),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds
  });
};

export const clearSimulateurSessionCookie = (response: NextResponse) => {
  response.cookies.set({
    name: SIMULATEUR_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
};

export const isSimulateurAuthorizedFromRequest = (req: Pick<NextRequest, "cookies">) => {
  const value = req.cookies.get(SIMULATEUR_SESSION_COOKIE_NAME)?.value;
  return Boolean(parseSimulateurSessionCookie(value));
};

export const isSimulateurAuthorizedFromCookieStore = (cookieStore: CookieStoreLike | null) => {
  if (!cookieStore) return false;
  const value = cookieStore.get(SIMULATEUR_SESSION_COOKIE_NAME)?.value;
  return Boolean(parseSimulateurSessionCookie(value));
};

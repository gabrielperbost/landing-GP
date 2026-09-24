import "server-only";

import crypto from "crypto";
import { normalizeEnv } from "@/lib/monday";

const getSecret = () =>
  normalizeEnv(process.env.WEBINAR_AVOCATS_UNSUBSCRIBE_SECRET) ??
  normalizeEnv(process.env.WEBHOOK_SECRET) ??
  normalizeEnv(process.env.MONDAY_INCOMING_WEBHOOK_SECRET) ??
  "";

export const normalizeWebinarEmail = (email: string) => email.trim().toLowerCase();

export const createWebinarUnsubscribeToken = (email: string) => {
  const secret = getSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(normalizeWebinarEmail(email)).digest("hex");
};

export const createWebinarTrackingToken = (email: string) => {
  const secret = getSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(`tracking:${normalizeWebinarEmail(email)}`).digest("hex");
};

export const verifyWebinarUnsubscribeToken = ({ email, token }: { email: string; token: string }) => {
  const expected = createWebinarUnsubscribeToken(email);
  if (!expected || !token) return false;
  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);
  if (expectedBuffer.length !== tokenBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, tokenBuffer);
};

export const verifyWebinarTrackingToken = ({ email, token }: { email: string; token: string }) => {
  const expected = createWebinarTrackingToken(email);
  if (!expected || !token) return false;
  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);
  if (expectedBuffer.length !== tokenBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, tokenBuffer);
};

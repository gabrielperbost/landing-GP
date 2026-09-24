import { NextRequest, NextResponse } from "next/server";
import { recordPerLeadPhoneReceived, verifyPerPhoneCallbackToken } from "@/lib/tallyPerCampaign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const normalizePhone = (value: unknown) => String(value ?? "").replace(/[^\d+]/g, "").trim();
const isValidItemId = (value: string) => /^\d+$/.test(value);
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const readBody = async (request: NextRequest) => {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, unknown>;
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
};

export async function POST(request: NextRequest) {
  try {
    const body = await readBody(request);
    const itemId = String(body.item ?? body.itemId ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const token = String(body.token ?? "").trim();
    const phone = normalizePhone(body.phone);

    if (!isValidItemId(itemId)) {
      return NextResponse.json({ ok: false, error: "Lien invalide." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Email invalide." }, { status: 400 });
    }
    if (phone.replace(/\D/g, "").length < 9) {
      return NextResponse.json({ ok: false, error: "Téléphone invalide." }, { status: 400 });
    }
    if (!verifyPerPhoneCallbackToken({ itemId, email, token })) {
      return NextResponse.json({ ok: false, error: "Lien expiré ou invalide." }, { status: 403 });
    }

    const result = await recordPerLeadPhoneReceived({ itemId, email, phone });
    return NextResponse.json({ ok: true, itemId: result.itemId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const status = message === "invalid_phone" ? 400 : message.includes("not_found") || message.includes("mismatch") ? 404 : 500;
    return NextResponse.json({ ok: false, error: "Impossible d'enregistrer le téléphone." }, { status });
  }
}

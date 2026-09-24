import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getBankLabel } from "@/lib/depot";
import { normalizeEnv } from "@/lib/monday";
import { isSessionOwnedByEmail, isTrustedPortalOrigin, resolvePortalTokenFromRequest } from "@/lib/portalAuth";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DecisionPayload = {
  token?: string;
  decision?: "accepted" | "question" | string;
  note?: string;
};

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const extendTokenExpiryByYears = (years = 10) => {
  const next = new Date();
  next.setFullYear(next.getFullYear() + years);
  return next.toISOString();
};

const sendInternalDecisionEmail = async ({
  decision,
  note,
  clientName,
  clientEmail,
  bank,
  mondayItemId,
  sessionStatus,
  offreDone,
  tableauDone
}: {
  decision: "accepted" | "question";
  note: string;
  clientName: string;
  clientEmail: string;
  bank: string;
  mondayItemId: string;
  sessionStatus: string;
  offreDone: boolean;
  tableauDone: boolean;
}) => {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  const from = normalizeEnv(process.env.FROM_EMAIL);
  const to =
    normalizeEnv(process.env.INTERNAL_LEADS_EMAIL) ??
    normalizeEnv(process.env.GP_FINANCES_EMAIL) ??
    from;
  if (!host || !user || !pass || !from || !to) return false;

  const transporter = nodemailer.createTransport({
    host,
    port: parsePort(normalizeEnv(process.env.SMTP_PORT), 465),
    secure: normalizeEnv(process.env.SMTP_SECURE) !== "false",
    auth: { user, pass }
  });

  const decisionLabel = decision === "accepted" ? "Proposition acceptée" : "Question client";
  const decisionColor = decision === "accepted" ? "#047857" : "#1d4ed8";

  await transporter.sendMail({
    from,
    to,
    subject: `[Portail client] ${decisionLabel} - ${clientName || clientEmail || "Client"}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.55;">
        <h2 style="margin:0 0 12px;color:${decisionColor};">${decisionLabel}</h2>
        <p style="margin:0 0 8px;"><strong>Client:</strong> ${clientName || "Non renseigné"}</p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${clientEmail || "Non renseigné"}</p>
        <p style="margin:0 0 8px;"><strong>Banque:</strong> ${bank || "Non renseignée"}</p>
        <p style="margin:0 0 8px;"><strong>Monday item ID:</strong> ${mondayItemId || "Non renseigné"}</p>
        <p style="margin:0 0 8px;"><strong>Statut session:</strong> ${sessionStatus || "pending"}</p>
        <p style="margin:0 0 8px;"><strong>Offre de prêt déposée:</strong> ${offreDone ? "Oui" : "Non"}</p>
        <p style="margin:0 0 8px;"><strong>Tableau d'amortissement déposé:</strong> ${tableauDone ? "Oui" : "Non"}</p>
        <p style="margin:0 0 8px;"><strong>Date:</strong> ${new Date().toLocaleString("fr-FR")}</p>
        ${
          note
            ? `<div style="margin-top:12px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:8px;padding:12px;">
                 <p style="margin:0 0 6px;font-weight:700;">Note du client</p>
                 <p style="margin:0;white-space:pre-wrap;">${note.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</p>
               </div>`
            : ""
        }
      </div>
    `
  });

  return true;
};

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
    }
    if (!isTrustedPortalOrigin(req)) {
      return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
    }

    const body = (await req.json()) as DecisionPayload;
    const tokenFromBody = String(body.token ?? "").trim();
    const tokenAuth = resolvePortalTokenFromRequest({ req, legacyToken: tokenFromBody });
    const token = tokenAuth.token;
    const decision = String(body.decision ?? "").trim().toLowerCase();
    const note = String(body.note ?? "").trim();

    if (!token) {
      return NextResponse.json({ error: "Session non authentifiée" }, { status: 401 });
    }
    if (decision !== "accepted" && decision !== "question") {
      return NextResponse.json({ error: "Décision invalide" }, { status: 400 });
    }
    if (decision === "question" && note.length < 3) {
      return NextResponse.json({ error: "Ajoutez votre question avant de valider." }, { status: 400 });
    }

    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .select("id, client_name, client_email, bank, monday_item_id, status, offre_url, tableau_url")
      .eq("token", token)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }
    if (!isSessionOwnedByEmail({ sessionEmail: session.client_email, expectedEmail: tokenAuth.email })) {
      return NextResponse.json({ error: "Session non autorisée" }, { status: 403 });
    }

    const nextStatus =
      decision === "accepted" && String(session.status ?? "").trim().toLowerCase() !== "transferred"
        ? "proposal_accepted"
        : session.status ?? "pending";

    await supabaseAdmin
      .from("sessions")
      .update({ token_expires_at: extendTokenExpiryByYears(10), status: nextStatus })
      .eq("id", session.id);

    const notified = await sendInternalDecisionEmail({
      decision,
      note,
      clientName: session.client_name ?? "",
      clientEmail: session.client_email ?? "",
      bank: getBankLabel(session.bank ?? ""),
      mondayItemId: session.monday_item_id ?? "",
      sessionStatus: session.status ?? "",
      offreDone: Boolean(session.offre_url),
      tableauDone: Boolean(session.tableau_url)
    });

    return NextResponse.json({ ok: true, notified, status: nextStatus });
  } catch (error) {
    console.error("session-decision-route-failed", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

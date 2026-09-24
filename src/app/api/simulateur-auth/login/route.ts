import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  isSimulateurPasswordConfigured,
  isSimulateurPasswordValid,
  setSimulateurSessionCookie
} from "@/lib/simulateurAuth";

type LoginBody = {
  password?: string;
};

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!isSimulateurPasswordConfigured()) {
      return NextResponse.json({ error: "password_not_configured" }, { status: 503 });
    }

    const body = (await request.json()) as LoginBody;
    const password = String(body.password ?? "");

    if (!isSimulateurPasswordValid(password)) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    setSimulateurSessionCookie({ response });
    return response;
  } catch (error) {
    console.error("simulateur-login-failed", error);
    return NextResponse.json({ error: "login_failed" }, { status: 500 });
  }
}

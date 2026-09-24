import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error:
        "Point d'accès obsolète. Utilisez /api/portal-auth/login (email + mot de passe) pour récupérer une session sécurisée."
    },
    { status: 410 }
  );
}

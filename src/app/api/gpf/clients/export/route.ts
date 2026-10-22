import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { filtersFromParams, queryContacts } from "@/lib/gpf/contactsQuery";
import { GPF_PRODUIT_LABEL, type GpfProduit } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const frDate = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString("fr-FR") : "");

// Export CSV (séparateur « ; », lisible directement dans Excel) des contacts
// correspondant aux filtres de la liste.
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { rows } = await queryContacts(filtersFromParams(request.nextUrl.searchParams));
  const header = ["Prénom", "Nom", "E-mail", "Téléphone", "Type", "Statut", "Provenance", "Produits", "Ville", "Dernier contact", "Prochaine action", "Créé le"];
  const lines = rows.map((c) =>
    [
      c.prenom,
      c.nom,
      c.email,
      c.telephone,
      c.type_contact ?? "particulier",
      c.est_client ? "Client" : "Lead",
      c.provenance,
      c.produits.map((p) => GPF_PRODUIT_LABEL[p as GpfProduit] ?? p).join(", "),
      c.ville,
      frDate(c.dernier_contact_at),
      [c.prochaine_action, frDate(c.prochaine_action_date)].filter(Boolean).join(" — "),
      frDate(c.created_at)
    ]
      .map(cell)
      .join(";")
  );
  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-gp-finances-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

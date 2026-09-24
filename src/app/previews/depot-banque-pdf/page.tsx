"use client";

import { useMemo, useState } from "react";
import { BANK_TUTORIALS } from "@/lib/depot";
import { PdfPreviewCard } from "@/components/depot/PdfPreviewCard";

export default function DepotBanquePdfPreviewPage() {
  const [bank, setBank] = useState("cic");
  const tutorial = useMemo(() => BANK_TUTORIALS.find((item) => item.code === bank), [bank]);
  const examplePdfs = tutorial?.examplePdfs ?? [];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1000px 420px at 15% -10%, rgba(29, 78, 216, 0.14), transparent), radial-gradient(900px 420px at 90% -20%, rgba(15, 23, 42, 0.12), transparent), #eef3fb",
        fontFamily: "var(--font-manrope), system-ui, sans-serif",
        color: "#101828",
        padding: "26px 18px 50px"
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <section style={{ background: "#fff", border: "1px solid #d9e2f2", borderRadius: 20, padding: 24, marginBottom: 16 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, lineHeight: 1.2 }}>Preview dépôt bancaire - exemples PDF</h1>
          <p style={{ margin: 0, color: "#4b5565" }}>
            Cette page est un aperçu avant production du comportement demandé sur l&apos;espace client.
          </p>
        </section>

        <section style={{ background: "#fff", border: "1px solid #d9e2f2", borderRadius: 20, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Sélectionnez votre banque</h2>
            <span
              style={{
                borderRadius: 999,
                border: "1px solid #dce8ff",
                background: "#eef5ff",
                color: "#28426e",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 8px"
              }}
            >
              Mode preview
            </span>
          </div>

          <select
            value={bank}
            onChange={(event) => setBank(event.target.value)}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: "1px solid #cfd8ea",
              padding: "0 14px",
              fontSize: 14,
              background: "#fff"
            }}
          >
            {BANK_TUTORIALS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>

          {tutorial ? (
            <div style={{ marginTop: 12, border: "1px solid #dce8ff", borderRadius: 12, background: "#f7faff", padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#28426e", marginBottom: 4 }}>Chemin rapide dans votre banque</div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{tutorial.primaryPath}</div>
            </div>
          ) : null}

          {examplePdfs.length > 0 ? (
            <div style={{ marginTop: 12, border: "1px solid #c6dcff", borderRadius: 12, background: "#eef5ff", padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e3a8a", marginBottom: 4 }}>Exemples de documents à envoyer</div>
              <div style={{ fontSize: 13, color: "#334155", marginBottom: 10 }}>
                Ces aperçus montrent le format attendu pour l&apos;offre de prêt et le tableau d&apos;amortissement.
              </div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
                {examplePdfs.map((pdf) => (
                  <PdfPreviewCard
                    key={pdf.url}
                    label={pdf.label}
                    url={pdf.url}
                    previewUrl={pdf.previewUrl}
                    height={280}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 12, border: "1px dashed #cfd8ea", borderRadius: 12, background: "#fbfcff", padding: 12, color: "#5b6577", fontSize: 13 }}>
              Aucun exemple PDF configuré pour cette banque.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

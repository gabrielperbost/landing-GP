"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type PdfPreviewCardProps = {
  label: string;
  url: string;
  previewUrl?: string;
  height?: number;
};

export function PdfPreviewCard({ label, url, previewUrl, height = 250 }: PdfPreviewCardProps) {
  const [loading, setLoading] = useState(Boolean(previewUrl));
  const [error, setError] = useState(!previewUrl);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);

  useEffect(() => {
    if (!viewerOpen) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewerOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [viewerOpen]);

  return (
    <>
      <article style={{ borderRadius: 12, border: "1px solid #cfdcf2", background: "#fff", padding: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>{label}</div>
        <div
          style={{
            position: "relative",
            borderRadius: 10,
            border: "1px solid #deebff",
            overflow: "hidden",
            height,
            background: "#f8fafc"
          }}
        >
          {error ? (
            <div style={{ display: "grid", placeItems: "center", height: "100%", padding: 12, textAlign: "center", color: "#475569", fontSize: 12 }}>
              Aperçu indisponible sur ce navigateur.
              <br />
              Ouvrez le PDF via le lien ci-dessous.
            </div>
          ) : (
            <Image
              src={previewUrl ?? ""}
              alt={label}
              fill
              unoptimized
              sizes="(max-width: 900px) 100vw, 420px"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              style={{ objectFit: "contain", background: "#f8fafc" }}
            />
          )}
          {loading ? (
            <div style={{ position: "absolute", inset: 0, background: "rgba(248, 250, 252, 0.9)", display: "grid", placeItems: "center", fontSize: 12, color: "#475569" }}>
              Chargement de l&apos;aperçu...
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              setViewerLoading(true);
              setViewerOpen(true);
            }}
            style={{
              borderRadius: 10,
              border: "1px solid #bfd2f6",
              background: "#eef5ff",
              color: "#1d4ed8",
              fontSize: 12,
              fontWeight: 700,
              padding: "7px 11px",
              cursor: "pointer"
            }}
          >
            Agrandir et défiler
          </button>
        </div>
      </article>

      {viewerOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={() => setViewerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            background: "rgba(15, 23, 42, 0.6)",
            display: "grid",
            placeItems: "center",
            padding: 18
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(1100px, 100%)",
              height: "min(88vh, 920px)",
              borderRadius: 14,
              background: "#fff",
              border: "1px solid #d9e2f2",
              display: "grid",
              gridTemplateRows: "auto 1fr"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>{label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", textDecoration: "none" }}
                >
                  Ouvrir dans un nouvel onglet
                </a>
                <button
                  type="button"
                  onClick={() => setViewerOpen(false)}
                  style={{
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#334155",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "6px 10px",
                    cursor: "pointer"
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>

            <div style={{ position: "relative", minHeight: 0 }}>
              <iframe
                src={`${url}#view=FitH`}
                title={label}
                onLoad={() => setViewerLoading(false)}
                style={{ width: "100%", height: "100%", border: 0, background: "#f8fafc" }}
              />
              {viewerLoading ? (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(248, 250, 252, 0.85)", color: "#334155", fontSize: 12 }}>
                  Chargement du document...
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

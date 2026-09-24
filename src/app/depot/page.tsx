"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BANK_TUTORIALS, resolveBankCode } from "@/lib/depot";
import { PdfPreviewCard } from "@/components/depot/PdfPreviewCard";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

type RequiredDocType = "offre" | "tableau";
type UploadDocType = RequiredDocType | "autre";

const DOCS: Array<{ key: UploadDocType; label: string; required: boolean }> = [
  { key: "offre", label: "Offre de prêt", required: true },
  { key: "tableau", label: "Tableau d'amortissement", required: true },
  { key: "autre", label: "Autre document", required: false }
];

type UploadStatus = Record<RequiredDocType, boolean>;
type UploadingStatus = Record<UploadDocType, boolean>;
type UploadCountByType = Record<UploadDocType, number>;
type UploadedNames = Record<RequiredDocType, string>;
type UploadedDoc = { name: string; url?: string };
type UploadedDocsByType = Record<UploadDocType, UploadedDoc[]>;

const EMPTY_STATUS: UploadStatus = { offre: false, tableau: false };
const EMPTY_UPLOADING: UploadingStatus = { offre: false, tableau: false, autre: false };
const EMPTY_UPLOAD_COUNTS: UploadCountByType = { offre: 0, tableau: 0, autre: 0 };
const EMPTY_FILE_NAMES: UploadedNames = { offre: "", tableau: "" };
const EMPTY_UPLOADED_DOCS: UploadedDocsByType = { offre: [], tableau: [], autre: [] };

type Toast = {
  msg: string;
  err: boolean;
};

type SessionResponse = {
  already_done?: boolean;
  error?: string;
  client_name?: string;
  bank?: string;
  offre_done?: boolean;
  tableau_done?: boolean;
  offre_documents?: Array<{ name?: string; url?: string }>;
  tableau_documents?: Array<{ name?: string; url?: string }>;
  autre_documents?: Array<{ name?: string; url?: string }>;
};
type UploadResponse = {
  success?: boolean;
  error?: string;
  url?: string;
  auto_transfer_attempted?: boolean;
  auto_transfer_success?: boolean;
  auto_transfer_transferred_at?: string | null;
  auto_transfer_error?: string | null;
  uploaded_count_by_type?: {
    offre?: number;
    tableau?: number;
    autre?: number;
  };
};

const formatDate = (isoDate?: string) => {
  if (!isoDate) return new Date().toLocaleDateString("fr-FR");
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return new Date().toLocaleDateString("fr-FR");
  return parsed.toLocaleDateString("fr-FR");
};

const WEBSITE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://gp-finances.fr").replace(/\/+$/, "");

export default function DepotPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#5b6577" }}>
          Chargement...
        </div>
      }
    >
      <DepotContent />
    </Suspense>
  );
}

function DepotContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [clientName, setClientName] = useState("");
  const [bank, setBank] = useState("");
  const [uploaded, setUploaded] = useState<UploadStatus>(EMPTY_STATUS);
  const [uploading, setUploading] = useState<UploadingStatus>(EMPTY_UPLOADING);
  const [uploadedCounts, setUploadedCounts] = useState<UploadCountByType>(EMPTY_UPLOAD_COUNTS);
  const [fileNames, setFileNames] = useState<UploadedNames>(EMPTY_FILE_NAMES);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocsByType>(EMPTY_UPLOADED_DOCS);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transferRef, setTransferRef] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  const tutorial = useMemo(() => BANK_TUTORIALS.find((item) => item.code === bank), [bank]);
  const tutorialExamplePdfs = tutorial?.examplePdfs ?? [];
  const requiredReady = uploaded.offre && uploaded.tableau;
  const isTransferred = alreadyDone || success;
  const docsByType = useMemo(
    () =>
      DOCS.map((doc) => ({
        ...doc,
        documents: uploadedDocs[doc.key] ?? []
      })),
    [uploadedDocs]
  );
  const hasUploadedDocuments = docsByType.some((item) => item.documents.length > 0);
  const canTransfer = requiredReady && !sending && !isTransferred;

  useEffect(() => {
    let active = true;
    if (!token) {
      setError("Lien invalide.");
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    const run = async () => {
      try {
        const res = await fetch(`/api/session?token=${encodeURIComponent(token)}`, {
          signal: controller.signal,
          cache: "no-store"
        });
        const data = (await res.json()) as SessionResponse;
        if (!active) return;

        if (data.error) {
          setError(data.error);
          return;
        }

        const toUploadedDocs = (documents: Array<{ name?: string; url?: string }> = []): UploadedDoc[] =>
          documents.map((doc) => ({
            name: String(doc.name ?? "document"),
            url: String(doc.url ?? "")
          }));

        setAlreadyDone(Boolean(data.already_done));
        setClientName(data.client_name ?? "");
        setBank(resolveBankCode(data.bank ?? ""));
        const offreDocuments = toUploadedDocs(data.offre_documents ?? []);
        const tableauDocuments = toUploadedDocs(data.tableau_documents ?? []);
        const autreDocuments = toUploadedDocs(data.autre_documents ?? []);
        setUploaded({
          offre: offreDocuments.length > 0 || Boolean(data.offre_done),
          tableau: tableauDocuments.length > 0 || Boolean(data.tableau_done)
        });
        setUploadedCounts({
          offre: Math.max(offreDocuments.length, data.offre_done ? 1 : 0),
          tableau: Math.max(tableauDocuments.length, data.tableau_done ? 1 : 0),
          autre: autreDocuments.length
        });
        setFileNames({
          offre: String(offreDocuments[0]?.name ?? ""),
          tableau: String(tableauDocuments[0]?.name ?? "")
        });
        setUploadedDocs({
          offre: offreDocuments,
          tableau: tableauDocuments,
          autre: autreDocuments
        });
      } catch (err) {
        if (!active) return;
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("Le chargement est trop long. Réessayez dans quelques instants.");
          return;
        }
        setError("Erreur de chargement.");
      } finally {
        window.clearTimeout(timeoutId);
        if (active) setLoading(false);
      }
    };

    void run();

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [token]);

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3500);
  };

  const uploadOneFile = async (doc: UploadDocType, file: File) => {
    if (!token) return;
    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      showToast("Format invalide. Utilisez PDF, JPG ou PNG.", true);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast("Fichier trop volumineux (max 10 Mo).", true);
      return;
    }

    setUploading((prev) => ({ ...prev, [doc]: true }));

    const formData = new FormData();
    formData.append("token", token);
    formData.append("doc_type", doc);
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as UploadResponse;
      if (!data.success) {
        showToast(data.error ?? "Échec du dépôt.", true);
        return;
      }

      setUploadedDocs((prev) => ({
        ...prev,
        [doc]: [{ name: file.name, url: data.url }, ...prev[doc]]
      }));

      if (doc !== "autre") {
        setUploaded((prev) => ({ ...prev, [doc]: true }));
        setFileNames((prev) => ({ ...prev, [doc]: file.name }));
      }
      const nextCountValue = Number(data.uploaded_count_by_type?.[doc]);
      setUploadedCounts((prev) => ({
        ...prev,
        [doc]: Number.isFinite(nextCountValue) ? Math.max(0, Math.trunc(nextCountValue)) : prev[doc] + 1
      }));

      if (data.auto_transfer_success) {
        setTransferDate(formatDate(data.auto_transfer_transferred_at ?? undefined));
        setTransferRef(Math.random().toString(36).slice(2, 7).toUpperCase());
        setSuccess(true);
        return;
      }

      if (data.auto_transfer_attempted && !data.auto_transfer_success) {
        showToast("Documents déposés. Finalisez avec \"Envoyer mes documents\".", true);
        return;
      }

      showToast("Document déposé avec succès.");
    } catch {
      showToast("Erreur réseau pendant le dépôt.", true);
    } finally {
      setUploading((prev) => ({ ...prev, [doc]: false }));
    }
  };

  const uploadManyFiles = async (doc: UploadDocType, files: File[]) => {
    if (files.length === 0) return;
    for (const file of files) {
      // Keep sequential uploads to avoid racing status updates for the same case.
      // eslint-disable-next-line no-await-in-loop
      await uploadOneFile(doc, file);
    }
  };

  const transfer = async () => {
    if (!token) return;
    if (!requiredReady) {
      showToast("Offre de prêt et tableau d'amortissement requis.", true);
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, bank })
      });
      const data = (await res.json()) as { success?: boolean; error?: string; transferred_at?: string };
      if (!data.success) {
        showToast(data.error ?? "Échec de l'envoi.", true);
        return;
      }

      setTransferDate(formatDate(data.transferred_at));
      setTransferRef(Math.random().toString(36).slice(2, 7).toUpperCase());
      setSuccess(true);
    } catch {
      showToast("Erreur réseau pendant l'envoi.", true);
    } finally {
      setSending(false);
    }
  };

  const frameStyle = {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 500px at 10% -10%, rgba(26, 86, 219, 0.16), transparent), radial-gradient(1000px 500px at 90% -20%, rgba(15, 23, 42, 0.14), transparent), #eef3fb",
    color: "#101828",
    fontFamily: "var(--font-manrope), system-ui, sans-serif"
  } as const;

  if (loading) {
    return (
      <div style={{ ...frameStyle, display: "grid", placeItems: "center" }}>
        <p style={{ color: "#556176" }}>Chargement de votre espace de dépôt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...frameStyle, display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #ffc3c3", borderRadius: 20, padding: "42px 30px", maxWidth: 540, textAlign: "center" }}>
          <div style={{ fontSize: 46, marginBottom: 14 }}>🔒</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 26 }}>Lien invalide</h2>
          <p style={{ margin: 0, color: "#4b5565" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={frameStyle}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, borderBottom: "1px solid #d9e2f2", backdropFilter: "blur(8px)", background: "rgba(255,255,255,0.88)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontWeight: 800
              }}
            >
              GP
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>GP Finances</div>
              <div style={{ fontSize: 12, color: "#5b6577" }}>Dépôt sécurisé • Assurance emprunteur</div>
            </div>
          </div>
          <div style={{ fontSize: 12, border: "1px solid #c5d6f5", background: "#eef5ff", color: "#32528d", borderRadius: 999, padding: "6px 12px" }}>
            Espace dépôt
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px 70px" }}>
        <section style={{ background: "#fff", border: "1px solid #d9e2f2", borderRadius: 20, padding: 28, marginBottom: 16 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 30, lineHeight: 1.2 }}>
            Bonjour <span style={{ color: "#1d4ed8" }}>{clientName || "client"}</span>, déposez vos documents
          </h1>
          <p style={{ margin: 0, color: "#4b5565" }}>
            Merci de transmettre uniquement les 2 documents demandés : <strong>offre de prêt</strong> et{" "}
            <strong>tableau d&apos;amortissement</strong>.
          </p>
        </section>

        {isTransferred ? (
          <section style={{ background: "#fff", border: "1px solid #9ce6c1", borderRadius: 20, padding: "22px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: 22 }}>✅ Documents déjà transmis</h2>
                <p style={{ margin: 0, color: "#4b5565", fontSize: 14 }}>
                  Votre dossier est bien reçu. Vous pouvez consulter vos documents ci-dessous et en ajouter d&apos;autres si nécessaire.
                </p>
                {success && transferDate ? (
                  <p style={{ margin: "8px 0 0", color: "#1d4ed8", fontSize: 13 }}>
                    Transmis le {transferDate}
                    {transferRef ? ` • Réf. GP-${transferRef}` : ""}
                  </p>
                ) : null}
              </div>
              <a
                href={WEBSITE_URL}
                style={{
                  display: "inline-block",
                  borderRadius: 12,
                  padding: "11px 16px",
                  textDecoration: "none",
                  fontWeight: 700,
                  color: "#1d4ed8",
                  background: "#eef5ff",
                  border: "1px solid #c5d6f5"
                }}
              >
                Retourner sur le site GP Finances
              </a>
            </div>
          </section>
        ) : null}

        <section style={{ background: "#fff", border: "1px solid #d9e2f2", borderRadius: 20, padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 19 }}>1. Sélectionnez votre banque</h2>
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
              Aide documents
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
            <option value="">Choisir ma banque</option>
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

          {tutorialExamplePdfs.length > 0 ? (
            <div style={{ marginTop: 12, border: "1px solid #c6dcff", borderRadius: 12, background: "#eef5ff", padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e3a8a", marginBottom: 4 }}>Exemples de documents à envoyer</div>
              <div style={{ fontSize: 13, color: "#334155", marginBottom: 10 }}>
                Ces aperçus vous montrent le format attendu pour l&apos;offre de prêt et le tableau d&apos;amortissement.
              </div>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
                {tutorialExamplePdfs.map((pdf) => (
                  <PdfPreviewCard
                    key={pdf.url}
                    label={pdf.label}
                    url={pdf.url}
                    previewUrl={pdf.previewUrl}
                    height={250}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section style={{ background: "#fff", border: "1px solid #d9e2f2", borderRadius: 20, padding: 24, marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 19 }}>2. Déposez les fichiers</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {DOCS.map((doc) => {
              const done = doc.required ? uploaded[doc.key as RequiredDocType] : uploadedCounts.autre > 0;
              const uploadingNow = uploading[doc.key];
              const fileName = doc.required ? fileNames[doc.key as RequiredDocType] : "";

              return (
                <label
                  key={doc.key}
                  style={{
                    position: "relative",
                    display: "block",
                    borderRadius: 14,
                    padding: "14px 16px",
                    background: done ? "#f0fff5" : "#fbfcff",
                    border: `1.5px ${done ? "solid #9ce6c1" : "dashed #cfd8ea"}`,
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      if (files.length > 0) {
                        void uploadManyFiles(doc.key, files);
                      }
                      event.currentTarget.value = "";
                    }}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, pointerEvents: "none" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, flexWrap: "wrap" }}>
                        <span>{doc.label}</span>
                        <span
                          style={{
                            borderRadius: 999,
                            fontSize: 10,
                            padding: "3px 8px",
                            background: doc.required ? "#fff3d6" : "#eaf2ff",
                            color: doc.required ? "#8b5a00" : "#2e5fa8"
                          }}
                        >
                          {doc.required ? "Obligatoire" : "Optionnel"}
                        </span>
                        {done ? (
                          <span
                            style={{
                              borderRadius: 999,
                              fontSize: 10,
                              padding: "3px 8px",
                              background: "#dcfce7",
                              color: "#166534",
                              border: "1px solid #86efac"
                            }}
                          >
                            Document reçu
                          </span>
                        ) : null}
                      </div>
                      {doc.key === "tableau" ? (
                        <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.35, color: "#64748b", maxWidth: 640 }}>
                          En cas de financement avec plusieurs prêts pour un même bien immobilier, veuillez déposer
                          l&apos;intégralité des tableaux d&apos;amortissement (un par prêt), afin de permettre une analyse
                          complète de votre dossier.
                        </div>
                      ) : null}
                      <div style={{ marginTop: 4, fontSize: 12, color: done ? "#277f4f" : "#5b6577" }}>
                        {uploadingNow
                          ? "Dépôt en cours..."
                          : doc.required
                            ? done
                              ? uploadedCounts[doc.key as RequiredDocType] > 1
                                ? `${uploadedCounts[doc.key as RequiredDocType]} fichiers déposés`
                                : fileName || "Document déposé"
                              : "Cliquez pour ajouter un fichier"
                            : uploadedCounts.autre > 0
                              ? `${uploadedCounts.autre} document(s) ajouté(s)`
                              : "Ajoutez un document que vous jugez utile"}
                      </div>
                    </div>
                    <span style={{ fontSize: 22 }}>{uploadingNow ? "⏳" : done ? "✅" : "📄"}</span>
                  </div>
                </label>
              );
            })}
          </div>

          {hasUploadedDocuments ? (
            <div style={{ marginTop: 12, border: "1px solid #dce8ff", borderRadius: 12, background: "#f7faff", padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#28426e", marginBottom: 8 }}>Documents déjà transmis</div>
              <div style={{ display: "grid", gap: 10 }}>
                {docsByType
                  .filter((entry) => entry.documents.length > 0)
                  .map((entry) => (
                    <div key={entry.key} style={{ border: "1px solid #deebff", borderRadius: 10, background: "#fff", padding: "8px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, color: "#1f2937", fontSize: 13 }}>{entry.label}</span>
                        <span
                          style={{
                            borderRadius: 999,
                            fontSize: 10,
                            padding: "2px 7px",
                            background: "#dcfce7",
                            color: "#166534",
                            border: "1px solid #86efac"
                          }}
                        >
                          Document reçu
                        </span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, color: "#334155", fontSize: 13, lineHeight: 1.5 }}>
                        {entry.documents.map((doc, index) => (
                          <li key={`${entry.key}-${doc.name}-${index}`} style={{ marginBottom: 4 }}>
                            {doc.url ? (
                              <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", textDecoration: "none" }}>
                                {doc.name}
                              </a>
                            ) : (
                              doc.name
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
              <p style={{ margin: "10px 0 0", color: "#56657d", fontSize: 12 }}>
                Vous pouvez cliquer sur une case ci-dessus pour ajouter des documents complémentaires.
              </p>
            </div>
          ) : null}
        </section>

        <section style={{ background: "#fff", border: "1px solid #d9e2f2", borderRadius: 20, padding: 24 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 19 }}>{isTransferred ? "3. Envoi finalisé" : "3. Finaliser l'envoi"}</h2>
          <p style={{ margin: "0 0 14px", color: "#4b5565", fontSize: 14 }}>
            {isTransferred
              ? "Votre dossier est déjà transmis. Vous pouvez continuer à ajouter des documents si nous vous le demandons."
              : "L'envoi sera activé dès que les 2 documents obligatoires seront déposés."}
          </p>
          <button
            type="button"
            onClick={() => void transfer()}
            disabled={!canTransfer}
            style={{
              width: "100%",
              height: 50,
              borderRadius: 12,
              border: "none",
              fontWeight: 700,
              fontSize: 15,
              cursor: canTransfer ? "pointer" : "not-allowed",
              background: canTransfer ? "linear-gradient(135deg, #1d4ed8, #0f172a)" : "#d7deea",
              color: canTransfer ? "#fff" : "#657186"
            }}
          >
            {sending ? "Envoi en cours..." : isTransferred ? "Dossier déjà transmis" : "Envoyer mes documents"}
          </button>
          <p style={{ margin: "10px 0 0", color: "#6d7788", fontSize: 12 }}>Formats acceptés: PDF, JPG, PNG • Taille max: 10 Mo par fichier.</p>
        </section>
      </main>

      {toast ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 22,
            transform: "translateX(-50%)",
            background: toast.err ? "#ffe8e8" : "#e8fff1",
            color: toast.err ? "#8b1c1c" : "#1f6f43",
            border: `1px solid ${toast.err ? "#f6bcbc" : "#a9e2be"}`,
            borderRadius: 12,
            padding: "10px 16px",
            fontSize: 13,
            zIndex: 50
          }}
        >
          {toast.msg}
        </div>
      ) : null}
    </div>
  );
}

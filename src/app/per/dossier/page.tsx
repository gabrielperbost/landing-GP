"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const WEBSITE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://gp-finances.fr").replace(/\/+$/, "");
const COMPANY_BROCHURE_URL = "/plaquettes/plaquette-gp-finances.pdf";

const PER_TESTIMONIALS = [
  {
    title: "Dorothée - 17 000 € économisés sur 3 ans",
    subtitle: "Avis client",
    src: "/videos/PER/temoignage-1-dorothee.mp4",
    poster: "/videos/posters/per-temoignage-1.png"
  },
  {
    title: "Anaëlle - 8 000 € économisés sur 1 an",
    subtitle: "Avis client",
    src: "/videos/PER/temoignage-2-anaelle.mp4",
    poster: "/videos/posters/per-temoignage-2.png"
  },
  {
    title: "Frédéric - 4 000 € économisés sur 1 an",
    subtitle: "Avis client",
    src: "/videos/temoignage-3-frederic.mp4",
    poster: "/videos/posters/per-temoignage-3.png"
  }
];

type RequiredDocType = "avis_imposition";
type UploadDocType = RequiredDocType | "autre";

type PerProfile = {
  situationProfessionnelle: string;
  revenuNetImposable: string;
  impotPaye: string;
  trancheMarginaleImposition: string;
  objectifPrincipal: string;
  versementEnvisage: string;
  commentaireInterne: string;
};

type UploadedDoc = { name: string; url?: string };
type UploadedDocsByType = Record<UploadDocType, UploadedDoc[]>;
type UploadStatus = Record<RequiredDocType, boolean>;
type UploadingStatus = Record<UploadDocType, boolean>;
type UploadCountByType = Record<UploadDocType, number>;
type UploadedNames = Record<RequiredDocType, string>;
type Toast = { msg: string; err: boolean };

type SessionResponse = {
  already_done?: boolean;
  error?: string;
  client_name?: string;
  client_email?: string;
  avis_imposition_done?: boolean;
  avis_imposition_documents?: Array<{ name?: string; url?: string }>;
  autre_documents?: Array<{ name?: string; url?: string }>;
};

type UploadResponse = {
  success?: boolean;
  error?: string;
  url?: string;
  uploaded_count_by_type?: {
    avis_imposition?: number;
    autre?: number;
  };
};

const DOCS: Array<{ key: UploadDocType; label: string; required: boolean; helper: string }> = [
  {
    key: "avis_imposition",
    label: "Avis d'imposition",
    required: true,
    helper: "Avis d'imposition de cette année sur les revenus de l'année dernière."
  },
  {
    key: "autre",
    label: "Autre document",
    required: false,
    helper: "Ajoutez un document complémentaire si nous vous l'avons demandé."
  }
];

const EMPTY_STATUS: UploadStatus = { avis_imposition: false };
const EMPTY_UPLOADING: UploadingStatus = { avis_imposition: false, autre: false };
const EMPTY_UPLOAD_COUNTS: UploadCountByType = { avis_imposition: 0, autre: 0 };
const EMPTY_FILE_NAMES: UploadedNames = { avis_imposition: "" };
const EMPTY_UPLOADED_DOCS: UploadedDocsByType = { avis_imposition: [], autre: [] };
const EMPTY_PROFILE: PerProfile = {
  situationProfessionnelle: "",
  revenuNetImposable: "",
  impotPaye: "",
  trancheMarginaleImposition: "",
  objectifPrincipal: "",
  versementEnvisage: "",
  commentaireInterne: ""
};

const formatDate = (isoDate?: string) => {
  if (!isoDate) return new Date().toLocaleDateString("fr-FR");
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return new Date().toLocaleDateString("fr-FR");
  return parsed.toLocaleDateString("fr-FR");
};

export default function PerDossierPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#5b6577" }}>
          Chargement...
        </div>
      }
    >
      <PerDossierContent />
    </Suspense>
  );
}

function PerDossierContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const isDemo = searchParams.get("demo") === "1";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [uploaded, setUploaded] = useState<UploadStatus>(EMPTY_STATUS);
  const [uploading, setUploading] = useState<UploadingStatus>(EMPTY_UPLOADING);
  const [uploadedCounts, setUploadedCounts] = useState<UploadCountByType>(EMPTY_UPLOAD_COUNTS);
  const [fileNames, setFileNames] = useState<UploadedNames>(EMPTY_FILE_NAMES);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocsByType>(EMPTY_UPLOADED_DOCS);
  const [profile] = useState<PerProfile>(EMPTY_PROFILE);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transferDate, setTransferDate] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  const requiredReady = uploaded.avis_imposition;
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
    if (isDemo) {
      setAlreadyDone(false);
      setClientName("Client démo");
      setClientEmail("client.demo@gp-finances.fr");
      setUploaded({ avis_imposition: false });
      setUploadedCounts(EMPTY_UPLOAD_COUNTS);
      setFileNames(EMPTY_FILE_NAMES);
      setUploadedDocs(EMPTY_UPLOADED_DOCS);
      setLoading(false);
      return () => {
        active = false;
      };
    }

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
        const res = await fetch(`/api/per/session?token=${encodeURIComponent(token)}`, {
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

        const avisDocuments = toUploadedDocs(data.avis_imposition_documents ?? []);
        const autreDocuments = toUploadedDocs(data.autre_documents ?? []);
        setAlreadyDone(Boolean(data.already_done));
        setClientName(data.client_name ?? "");
        setClientEmail(data.client_email ?? "");
        setUploaded({ avis_imposition: avisDocuments.length > 0 || Boolean(data.avis_imposition_done) });
        setUploadedCounts({
          avis_imposition: Math.max(avisDocuments.length, data.avis_imposition_done ? 1 : 0),
          autre: autreDocuments.length
        });
        setFileNames({ avis_imposition: String(avisDocuments[0]?.name ?? "") });
        setUploadedDocs({ avis_imposition: avisDocuments, autre: autreDocuments });
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
  }, [token, isDemo]);

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3500);
  };

  const uploadOneFile = async (doc: UploadDocType, file: File) => {
    if (!token && !isDemo) return;
    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      showToast("Format invalide. Utilisez PDF, JPG ou PNG.", true);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast("Fichier trop volumineux (max 10 Mo).", true);
      return;
    }

    setUploading((prev) => ({ ...prev, [doc]: true }));

    if (isDemo) {
      window.setTimeout(() => {
        const fileUrl = URL.createObjectURL(file);
        setUploadedDocs((prev) => ({
          ...prev,
          [doc]: [{ name: file.name, url: fileUrl }, ...prev[doc]]
        }));
        if (doc === "avis_imposition") {
          setUploaded({ avis_imposition: true });
          setFileNames({ avis_imposition: file.name });
        }
        setUploadedCounts((prev) => ({ ...prev, [doc]: prev[doc] + 1 }));
        setUploading((prev) => ({ ...prev, [doc]: false }));
        showToast("Document ajouté en mode démo.");
      }, 450);
      return;
    }

    const sessionToken = token ?? "";
    const formData = new FormData();
    formData.append("token", sessionToken);
    formData.append("doc_type", doc);
    formData.append("file", file);

    try {
      const res = await fetch("/api/per/upload", { method: "POST", body: formData });
      const data = (await res.json()) as UploadResponse;
      if (!data.success) {
        showToast(data.error ?? "Échec du dépôt.", true);
        return;
      }

      setUploadedDocs((prev) => ({
        ...prev,
        [doc]: [{ name: file.name, url: data.url }, ...prev[doc]]
      }));

      if (doc === "avis_imposition") {
        setUploaded({ avis_imposition: true });
        setFileNames({ avis_imposition: file.name });
      }

      const nextCountValue = Number(data.uploaded_count_by_type?.[doc]);
      setUploadedCounts((prev) => ({
        ...prev,
        [doc]: Number.isFinite(nextCountValue) ? Math.max(0, Math.trunc(nextCountValue)) : prev[doc] + 1
      }));
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
    if (!token && !isDemo) return;
    if (!requiredReady) {
      showToast("Avis d'imposition obligatoire.", true);
      return;
    }

    setSending(true);
    if (isDemo) {
      window.setTimeout(() => {
        setTransferDate(formatDate(new Date().toISOString()));
        setTransferRef("DEMO");
        setSuccess(true);
        setSending(false);
      }, 500);
      return;
    }

    try {
      const sessionToken = token ?? "";
      const res = await fetch("/api/per/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: sessionToken, per_profile: profile })
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
      "radial-gradient(1200px 500px at 10% -10%, rgba(26, 60, 92, 0.18), transparent), radial-gradient(900px 460px at 90% -20%, rgba(200, 168, 107, 0.18), transparent), #eef3fb",
    color: "#101828",
    fontFamily: "var(--font-manrope), system-ui, sans-serif"
  } as const;

  if (loading) {
    return (
      <div style={{ ...frameStyle, display: "grid", placeItems: "center" }}>
        <p style={{ color: "#556176" }}>Chargement de votre espace PER...</p>
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
                background: "linear-gradient(135deg, #1A3C5C, #C8A86B)",
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
              <div style={{ fontSize: 12, color: "#5b6577" }}>Dépôt sécurisé • Plan Épargne Retraite</div>
            </div>
          </div>
          <div style={{ fontSize: 12, border: "1px solid #d9c99f", background: "#fff8e8", color: "#6b5520", borderRadius: 999, padding: "6px 12px" }}>
            Espace PER
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px 70px" }}>
        <section style={{ background: "#fff", border: "1px solid #d9e2f2", borderRadius: 20, padding: 28, marginBottom: 16 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 30, lineHeight: 1.2 }}>
            Bonjour <span style={{ color: "#1A3C5C" }}>{clientName || "client"}</span>, déposez vos documents
          </h1>
          <p style={{ margin: 0, color: "#4b5565" }}>
            Merci de transmettre votre <strong>avis d&apos;imposition de cette année sur les revenus de l&apos;année dernière</strong>.
          </p>
          {clientEmail ? <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 13 }}>Email dossier : {clientEmail}</p> : null}
        </section>

        {isTransferred ? (
          <section style={{ background: "#fff", border: "1px solid #9ce6c1", borderRadius: 20, padding: "22px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: 22 }}>✅ Dossier PER transmis</h2>
                <p style={{ margin: 0, color: "#4b5565", fontSize: 14 }}>
                  Votre dossier est bien reçu. Vous pouvez consulter vos documents ci-dessous et en ajouter d&apos;autres si nécessaire.
                </p>
                {success && transferDate ? (
                  <p style={{ margin: "8px 0 0", color: "#1A3C5C", fontSize: 13 }}>
                    Transmis le {transferDate}
                    {transferRef ? ` • Réf. PER-${transferRef}` : ""}
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
                  color: "#1A3C5C",
                  background: "#f7f4eb",
                  border: "1px solid #d9c99f"
                }}
              >
                Retourner sur le site GP Finances
              </a>
            </div>
          </section>
        ) : null}

        <section style={{ background: "#fff", border: "1px solid #d9e2f2", borderRadius: 20, padding: 24, marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 19 }}>1. Déposez les fichiers</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {DOCS.map((doc) => {
              const done = doc.required ? uploaded.avis_imposition : uploadedCounts.autre > 0;
              const uploadingNow = uploading[doc.key];
              const fileName = doc.required ? fileNames.avis_imposition : "";

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
                      <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.35, color: "#64748b", maxWidth: 640 }}>
                        {doc.helper}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12, color: done ? "#277f4f" : "#5b6577" }}>
                        {uploadingNow
                          ? "Dépôt en cours..."
                          : doc.required
                            ? done
                              ? uploadedCounts.avis_imposition > 1
                                ? `${uploadedCounts.avis_imposition} fichiers déposés`
                                : fileName || "Document déposé"
                              : "Cliquez pour ajouter un fichier"
                            : uploadedCounts.autre > 0
                              ? `${uploadedCounts.autre} document(s) ajouté(s)`
                              : "Ajoutez un document complémentaire"}
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
                              <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: "#1A3C5C", textDecoration: "none" }}>
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
            </div>
          ) : null}
        </section>

        <section style={{ background: "#fff", border: "1px solid #d9e2f2", borderRadius: 20, padding: 24 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 19 }}>{isTransferred ? "2. Envoi finalisé" : "2. Finaliser l'envoi"}</h2>
          <p style={{ margin: "0 0 14px", color: "#4b5565", fontSize: 14 }}>
            {isTransferred
              ? "Votre dossier PER est déjà transmis. Vous pouvez continuer à ajouter des documents si nous vous le demandons."
              : "L'envoi sera activé dès que l'avis d'imposition obligatoire sera déposé."}
          </p>
          <button
            type="button"
            disabled={!canTransfer}
            onClick={() => void transfer()}
            style={{
              width: "100%",
              height: 52,
              border: 0,
              borderRadius: 14,
              background: canTransfer ? "linear-gradient(135deg, #1A3C5C, #C8A86B)" : "#cbd5e1",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15,
              cursor: canTransfer ? "pointer" : "not-allowed"
            }}
          >
            {sending ? "Envoi en cours..." : isTransferred ? "Dossier transmis" : "Envoyer mon dossier PER"}
          </button>
        </section>

        <section style={{ background: "#fff", border: "1px solid #d9e2f2", borderRadius: 20, padding: 24, marginTop: 16, marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 19 }}>Qui sommes-nous ?</h2>
          <p style={{ margin: "0 0 14px", color: "#4b5565", fontSize: 14 }}>
            Retrouvez la présentation du cabinet, mon rôle, notre méthode d&apos;accompagnement et ce que nous faisons pour vos dossiers.
          </p>
          <a
            href={COMPANY_BROCHURE_URL}
            download
            style={{
              display: "inline-flex",
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              padding: "12px 16px",
              background: "linear-gradient(135deg, #1A3C5C, #C8A86B)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              textDecoration: "none"
            }}
          >
            Télécharger la plaquette GP Finances
          </a>
        </section>

        <section style={{ background: "#fff", border: "1px solid #d9e2f2", borderRadius: 20, padding: 24, marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 19 }}>Avis clients PER</h2>
          <p style={{ margin: "0 0 14px", color: "#4b5565", fontSize: 14 }}>
            Quelques retours clients pour découvrir l&apos;accompagnement GP Finances autour du Plan Épargne Retraite.
          </p>
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
            {PER_TESTIMONIALS.map((video) => (
              <article
                key={video.src}
                style={{
                  overflow: "hidden",
                  border: "1px solid #d9e2f2",
                  borderRadius: 16,
                  background: "#f8fbff"
                }}
              >
                <video
                  src={video.src}
                  poster={video.poster}
                  controls
                  preload="metadata"
                  playsInline
                  style={{ display: "block", width: "100%", aspectRatio: "9 / 16", objectFit: "cover", background: "#0f172a" }}
                />
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1A3C5C" }}>{video.title}</div>
                  <div style={{ marginTop: 2, fontSize: 12, color: "#64748b" }}>{video.subtitle}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {toast ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 22,
            transform: "translateX(-50%)",
            zIndex: 50,
            borderRadius: 999,
            padding: "11px 16px",
            color: toast.err ? "#991b1b" : "#166534",
            background: toast.err ? "#fee2e2" : "#dcfce7",
            border: `1px solid ${toast.err ? "#fecaca" : "#86efac"}`,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 16px 30px rgba(15,23,42,.12)"
          }}
        >
          {toast.msg}
        </div>
      ) : null}
    </div>
  );
}

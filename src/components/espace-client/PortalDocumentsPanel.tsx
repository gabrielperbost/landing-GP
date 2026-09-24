"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SimulationAndInsurerDocs } from "@/components/espace-client/SimulationAndInsurerDocs";
import { isLikelySimulationUrl } from "@/lib/simulationUrl";
import { StatusPill } from "@/components/espace-client/ui";
import type { Tone } from "@/components/espace-client/ui";

type MyDoc = {
  name: string;
  status: string;
  tone: Tone;
  documentUrl?: string;
};

type InsurerDoc = {
  name: string;
  status: string;
  tone: Tone;
};

type PortalDocumentsPanelProps = {
  initialMyDocs: MyDoc[];
  insurerDocs: InsurerDoc[];
  initialSimulationUrl?: string;
  initialSimulationName?: string;
  initialProposalAccepted?: boolean;
};

type SessionApiResponse = {
  already_done?: boolean;
  status?: string;
  offre_done?: boolean;
  tableau_done?: boolean;
  offre_url?: string;
  tableau_url?: string;
  offre_documents?: Array<{ name?: string; url?: string }>;
  tableau_documents?: Array<{ name?: string; url?: string }>;
  autre_documents?: Array<{ name?: string; url?: string }>;
  simulation_url?: string;
  simulation_name?: string;
};

type UploadDocType = "offre" | "tableau" | "autre";

type UploadToast = {
  message: string;
  tone: "success" | "warning";
};
type UploadApiResponse = {
  success?: boolean;
  error?: string;
  url?: string;
  auto_transfer_attempted?: boolean;
  auto_transfer_success?: boolean;
  uploaded_count_by_type?: {
    offre?: number;
    tableau?: number;
    autre?: number;
  };
};

const STAGE_ORDER: Record<string, number> = {
  empty: 0,
  first_login: 1,
  password_set: 2,
  in_progress: 3,
  simulation_available: 4,
  proposal_accepted: 5,
  complete: 6
};

const ACCEPTED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const DOC_NAME_BY_TYPE: Record<Exclude<UploadDocType, "autre">, string> = {
  offre: "Offre de prêt",
  tableau: "Tableau d'amortissement"
};

const getUploadTypeFromDocName = (docName: string): Exclude<UploadDocType, "autre"> | null => {
  if (docName === DOC_NAME_BY_TYPE.offre) return "offre";
  if (docName === DOC_NAME_BY_TYPE.tableau) return "tableau";
  return null;
};

const toUploadedDoc = (name: string, done: boolean, url: string, count = 0): MyDoc => ({
  name,
  status: done ? (count > 1 ? `Déposé (${count})` : "Déposé") : "À déposer",
  tone: done ? "success" : "warning",
  documentUrl: done && url ? url : undefined
});

export function PortalDocumentsPanel({
  initialMyDocs,
  insurerDocs,
  initialSimulationUrl,
  initialSimulationName,
  initialProposalAccepted = false
}: PortalDocumentsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [myDocs, setMyDocs] = useState<MyDoc[]>(initialMyDocs);
  const [uploading, setUploading] = useState<Record<UploadDocType, boolean>>({
    offre: false,
    tableau: false,
    autre: false
  });
  const [optionalDocs, setOptionalDocs] = useState<Array<{ name: string; url?: string }>>([]);
  const [docCounts, setDocCounts] = useState<Record<UploadDocType, number>>({
    offre: 0,
    tableau: 0,
    autre: 0
  });
  const [toast, setToast] = useState<UploadToast | null>(null);
  const [simulationUrl, setSimulationUrl] = useState(initialSimulationUrl ?? "");
  const [simulationName, setSimulationName] = useState(initialSimulationName ?? "");
  const [proposalAccepted, setProposalAccepted] = useState(initialProposalAccepted);
  const [sessionSnapshot, setSessionSnapshot] = useState<SessionApiResponse | null>(null);

  const offreInputRef = useRef<HTMLInputElement | null>(null);
  const tableauInputRef = useRef<HTMLInputElement | null>(null);
  const autreInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string, tone: "success" | "warning") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    setProposalAccepted(initialProposalAccepted);
  }, [initialProposalAccepted]);

  const refreshFromSession = useCallback(async () => {
    try {
      const response = await fetch("/api/session", { cache: "no-store", credentials: "include" });
      if (!response.ok) return;

      const payload = (await response.json()) as SessionApiResponse;
      const offreDocuments = payload.offre_documents ?? [];
      const tableauDocuments = payload.tableau_documents ?? [];
      const autreDocuments = payload.autre_documents ?? [];
      const offreCount = Math.max(offreDocuments.length, payload.offre_done ? 1 : 0);
      const tableauCount = Math.max(tableauDocuments.length, payload.tableau_done ? 1 : 0);
      setSessionSnapshot(payload);
      setDocCounts({
        offre: offreCount,
        tableau: tableauCount,
        autre: autreDocuments.length
      });
      setMyDocs((previous) =>
        previous.map((doc) => {
          if (doc.name === DOC_NAME_BY_TYPE.offre) {
            return toUploadedDoc(doc.name, offreCount > 0, payload.offre_url ?? "", offreCount);
          }
          if (doc.name === DOC_NAME_BY_TYPE.tableau) {
            return toUploadedDoc(doc.name, tableauCount > 0, payload.tableau_url ?? "", tableauCount);
          }
          return doc;
        })
      );
      setOptionalDocs(
        autreDocuments.map((doc) => ({
          name: String(doc.name ?? "document"),
          url: String(doc.url ?? "")
        }))
      );

      if (typeof payload.simulation_url === "string") {
        setSimulationUrl(payload.simulation_url.trim());
      }
      if (typeof payload.simulation_name === "string") {
        setSimulationName(payload.simulation_name.trim());
      }
      const status = String(payload.status ?? "").trim().toLowerCase();
      setProposalAccepted(status === "proposal_accepted" || status === "transferred");
    } catch {
      // Keep previous values on network errors.
    }
  }, []);

  useEffect(() => {
    void refreshFromSession();

    const intervalId = window.setInterval(() => {
      void refreshFromSession();
    }, 9000);

    return () => window.clearInterval(intervalId);
  }, [refreshFromSession]);

  useEffect(() => {
    if (!sessionSnapshot) return;
    if (searchParams.get("firstLogin") === "1") return;

    const sessionStatus = String(sessionSnapshot.status ?? "").trim().toLowerCase();
    const hasDocs = Boolean(sessionSnapshot.offre_done && sessionSnapshot.tableau_done);
    const hasSimulation = isLikelySimulationUrl(sessionSnapshot.simulation_url?.trim() ?? "");
    const expectedStage =
      sessionStatus === "transferred"
        ? "complete"
        : sessionStatus === "proposal_accepted"
          ? "proposal_accepted"
          : hasDocs
            ? hasSimulation
              ? "simulation_available"
              : "in_progress"
            : "password_set";
    const currentStage = searchParams.get("stage")?.trim() ?? "";
    const currentRank = STAGE_ORDER[currentStage] ?? -1;
    const expectedRank = STAGE_ORDER[expectedStage] ?? -1;
    const resolvedStage = currentRank > expectedRank ? currentStage : expectedStage;

    if (currentStage === resolvedStage) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("token");
    params.delete("firstLogin");
    params.set("stage", resolvedStage);
    router.replace(`/espace-client/portail?${params.toString()}`, { scroll: false });
  }, [router, searchParams, sessionSnapshot]);

  const uploadDocument = async (docType: UploadDocType, file: File) => {
    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      showToast("Format invalide. Utilisez PDF, JPG ou PNG.", "warning");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast("Fichier trop volumineux (max 10 Mo).", "warning");
      return;
    }

    setUploading((previous) => ({ ...previous, [docType]: true }));

    const formData = new FormData();
    formData.append("doc_type", docType);
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData
      });
      const payload = (await response.json()) as UploadApiResponse;

      if (!payload.success) {
        showToast(payload.error ?? "Échec du téléversement.", "warning");
        return;
      }

      const nextCountRaw = Number(payload.uploaded_count_by_type?.[docType]);
      const resolvedCount = Number.isFinite(nextCountRaw)
        ? Math.max(0, Math.trunc(nextCountRaw))
        : docCounts[docType] + 1;
      setDocCounts((previous) => ({
        ...previous,
        [docType]: resolvedCount
      }));

      if (docType === "autre") {
        setOptionalDocs((previous) => [{ name: file.name, url: payload.url }, ...previous]);
      } else {
        const targetName = DOC_NAME_BY_TYPE[docType];
        setMyDocs((previous) =>
          previous.map((doc) =>
            doc.name === targetName
              ? toUploadedDoc(doc.name, true, payload.url || doc.documentUrl || "", resolvedCount)
              : doc
          )
        );
      }

      await refreshFromSession();

      if (payload.auto_transfer_attempted && !payload.auto_transfer_success) {
        showToast("Documents déposés, mais la transmission finale a échoué. Réessayez le dépôt.", "warning");
        return;
      }

      showToast("Document téléversé avec succès.", "success");
    } catch {
      showToast("Erreur réseau pendant le téléversement.", "warning");
    } finally {
      setUploading((previous) => ({ ...previous, [docType]: false }));
    }
  };

  const uploadDocuments = async (docType: UploadDocType, files: File[]) => {
    if (files.length === 0) return;
    for (const file of files) {
      // Keep sequential uploads to avoid racing updates on the same document type.
      // eslint-disable-next-line no-await-in-loop
      await uploadDocument(docType, file);
    }
  };

  const clientDocsDeposited = useMemo(
    () => myDocs.every((doc) => doc.status.startsWith("Déposé")),
    [myDocs]
  );

  const pickButtonLabel = (status: string) => (status.startsWith("Déposé") ? "Remplacer" : "Télécharger");

  return (
    <>
      <p className="mt-3 text-sm text-slate-600 sm:text-base" style={{ lineHeight: 1.65 }}>
        Téléversez vos documents depuis le bouton Télécharger. Vous pouvez aussi ajouter un document facultatif.
      </p>

      <input
        ref={offreInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) void uploadDocuments("offre", files);
          event.currentTarget.value = "";
        }}
      />
      <input
        ref={tableauInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) void uploadDocuments("tableau", files);
          event.currentTarget.value = "";
        }}
      />
      <input
        ref={autreInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) void uploadDocuments("autre", files);
          event.currentTarget.value = "";
        }}
      />

      <ul className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
        {myDocs.map((doc) => {
          const uploadType = getUploadTypeFromDocName(doc.name);
          const isUploading = uploadType ? uploading[uploadType] : false;

          return (
            <li
              key={doc.name}
              className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-base text-slate-700 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-[24px] sm:px-5 sm:py-4"
            >
              <span className="inline-flex items-center gap-2.5 break-words text-sm font-semibold text-slate-700 sm:text-base" style={{ lineHeight: 1.35 }}>
                <span aria-hidden="true">📄</span>
                {doc.name}
              </span>
              <span className="inline-flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-2.5">
                {doc.documentUrl ? (
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 sm:h-10 sm:px-4 sm:text-sm"
                  >
                    Ouvrir
                  </a>
                ) : null}

                <button
                  type="button"
                  disabled={!uploadType || isUploading}
                  onClick={() => {
                    if (uploadType === "offre") offreInputRef.current?.click();
                    if (uploadType === "tableau") tableauInputRef.current?.click();
                  }}
                  className="inline-flex h-9 items-center rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-4 sm:text-sm"
                >
                  {isUploading ? "Téléversement..." : `⬇ ${pickButtonLabel(doc.status)}`}
                </button>

                <StatusPill tone={doc.tone}>{doc.status}</StatusPill>
              </span>
            </li>
          );
        })}

        <li
          className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-base text-slate-700 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-[24px] sm:px-5 sm:py-4"
        >
          <span className="inline-flex items-center gap-2.5 break-words text-sm font-semibold text-slate-700 sm:text-base" style={{ lineHeight: 1.35 }}>
            <span aria-hidden="true">📄</span>
            Autre document
          </span>
          <span className="inline-flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-2.5">
            <button
              type="button"
              disabled={uploading.autre}
              onClick={() => autreInputRef.current?.click()}
              className="inline-flex h-9 items-center rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-4 sm:text-sm"
            >
              {uploading.autre ? "Téléversement..." : "⬇ Télécharger"}
            </button>
            <StatusPill tone="neutral">{docCounts.autre > 0 ? `Optionnel (${docCounts.autre})` : "Optionnel"}</StatusPill>
          </span>
        </li>
      </ul>

      {optionalDocs.length ? (
        <div className="mt-6 rounded-[20px] border border-slate-200 bg-slate-50 p-4 sm:rounded-[24px] sm:p-6">
          <p className="text-sm font-semibold text-slate-700">Documents facultatifs ajoutés</p>
          <ul className="mt-3 space-y-2">
            {optionalDocs.map((doc) => (
              <li key={`${doc.name}-${doc.url ?? ""}`} className="flex flex-col gap-1 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                <span>{doc.name}</span>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">
                    Ouvrir
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {toast ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2 text-sm ${
            toast.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {toast.message}
        </p>
      ) : null}

      <SimulationAndInsurerDocs
        initialSimulationUrl={simulationUrl}
        initialSimulationName={simulationName}
        insurerDocs={insurerDocs}
        clientDocsDeposited={clientDocsDeposited}
        initialProposalAccepted={proposalAccepted}
      />
    </>
  );
}

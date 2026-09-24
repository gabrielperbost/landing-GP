"use client";

import { useEffect, useState } from "react";
import { SimulationPanel } from "@/components/espace-client/SimulationPanel";
import { StatusPill } from "@/components/espace-client/ui";
import type { Tone } from "@/components/espace-client/ui";

type InsurerDoc = {
  name: string;
  status: string;
  tone: Tone;
};

type SimulationAndInsurerDocsProps = {
  initialSimulationUrl?: string;
  initialSimulationName?: string;
  insurerDocs: InsurerDoc[];
  clientDocsDeposited: boolean;
  initialProposalAccepted?: boolean;
};

export function SimulationAndInsurerDocs({
  initialSimulationUrl,
  initialSimulationName,
  insurerDocs,
  clientDocsDeposited,
  initialProposalAccepted = false
}: SimulationAndInsurerDocsProps) {
  const [proposalAccepted, setProposalAccepted] = useState(initialProposalAccepted);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setProposalAccepted(initialProposalAccepted);
  }, [initialProposalAccepted]);

  const handleToggleDocuments = () => {
    if (!clientDocsDeposited || !proposalAccepted) return;
    setIsOpen((prev) => !prev);
  };

  const canRevealInsurerDocs = clientDocsDeposited && proposalAccepted;

  return (
    <div className="mt-8 w-full space-y-7 sm:mt-11 sm:space-y-9">
      <SimulationPanel
        initialSimulationUrl={initialSimulationUrl}
        initialSimulationName={initialSimulationName}
        onAccepted={() => {
          setProposalAccepted(true);
          setIsOpen(true);
        }}
      />

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.3)] sm:rounded-[32px] sm:p-7">
        <button
          type="button"
          onClick={handleToggleDocuments}
          className={`flex w-full items-center justify-between text-left ${
            canRevealInsurerDocs ? "cursor-pointer" : "cursor-not-allowed opacity-80"
          }`}
          aria-expanded={isOpen}
        >
          <span className="text-base font-semibold text-slate-900">Document de l&apos;assureur</span>
          <span className="text-xl text-slate-500">{isOpen ? "▾" : "▸"}</span>
        </button>

        {!canRevealInsurerDocs ? (
          <p className="mt-3 text-sm text-slate-600">
            Les documents assureur seront disponibles après l&apos;acceptation de la proposition d&apos;assurance.
          </p>
        ) : null}

        {canRevealInsurerDocs && isOpen ? (
          <ul className="mt-4 space-y-2.5">
            {insurerDocs.map((doc) => (
              <li
                key={doc.name}
                className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{doc.name}</span>
                <StatusPill tone={doc.tone}>{doc.status}</StatusPill>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

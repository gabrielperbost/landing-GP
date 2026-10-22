"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/gpf/PageHeader";
import { MonJour } from "@/components/gpf/commercial/MonJour";
import { Kanban } from "@/components/gpf/commercial/Kanban";
import { ListeAffaires } from "@/components/gpf/commercial/ListeAffaires";
import { Analyse } from "@/components/gpf/commercial/Analyse";

const VUES = [
  ["jour", "Mon jour"],
  ["pipeline", "Pipeline"],
  ["liste", "Liste"],
  ["analyse", "Analyse"]
] as const;
type Vue = (typeof VUES)[number][0];

export default function CommercialPage() {
  const [vue, setVue] = useState<Vue>("jour");

  // Vue mémorisée pour ce navigateur (confort, pas une donnée).
  useEffect(() => {
    try {
      const v = localStorage.getItem("gpf-commercial-vue") as Vue | null;
      if (v && VUES.some(([k]) => k === v)) setVue(v);
    } catch {
      // stockage indisponible : on reste sur « Mon jour »
    }
  }, []);
  const choisir = (v: Vue) => {
    setVue(v);
    try {
      localStorage.setItem("gpf-commercial-vue", v);
    } catch {
      // stockage indisponible
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader titre="Commercial" sousTitre="Vos affaires en cours, de l'arrivée du lead à la signature." />
      <div className="flex gap-1 border-b border-[var(--gpf-border)]">
        {VUES.map(([k, l]) => (
          <button
            key={k}
            onClick={() => choisir(k)}
            className={`px-3 py-2 text-sm -mb-px border-b-2 ${vue === k ? "border-[#CDAA5A] text-[var(--gpf-ink)] font-semibold" : "border-transparent text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {vue === "jour" ? <MonJour /> : null}
      {vue === "pipeline" ? <Kanban /> : null}
      {vue === "liste" ? <ListeAffaires /> : null}
      {vue === "analyse" ? <Analyse /> : null}
    </div>
  );
}

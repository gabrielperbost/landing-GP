"use client";
import { useEffect, useState } from "react";
import { GPF_PRODUIT_LABEL, type GpfProduit } from "@/lib/gpf/types";

type DeletedClient = { id: string; prenom: string; nom: string; joursRestants: number };
type DeletedDossier = { id: string; produit: GpfProduit; client: { prenom: string; nom: string } | null; joursRestants: number };
type DeletedDocument = {
  id: string;
  nom_fichier: string | null;
  type: string;
  dossierProduit: GpfProduit | null;
  client: { prenom: string; nom: string } | null;
  joursRestants: number;
};

export default function GpfCorbeillePage() {
  const [clients, setClients] = useState<DeletedClient[]>([]);
  const [dossiers, setDossiers] = useState<DeletedDossier[]>([]);
  const [documents, setDocuments] = useState<DeletedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/gpf/corbeille");
    const data = await res.json();
    if (data.ok) {
      setClients(data.clients);
      setDossiers(data.dossiers);
      setDocuments(data.documents);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const restore = async (kind: "clients" | "dossiers" | "documents", id: string) => {
    await fetch(`/api/gpf/${kind}/${id}/restore`, { method: "POST" });
    load();
  };

  if (loading) return <p className="text-sm text-[#64717d]">Chargement...</p>;

  const empty = clients.length === 0 && dossiers.length === 0 && documents.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-[#071C2C]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
          Corbeille
        </h1>
        <p className="text-sm text-[#64717d] mt-1">Les éléments supprimés restent ici 30 jours avant suppression définitive.</p>
      </div>

      {empty ? <p className="text-sm text-[#9aa3ab]">La corbeille est vide.</p> : null}

      {clients.length > 0 ? (
        <Section title="Clients">
          {clients.map((c) => (
            <Row key={c.id} label={`${c.prenom} ${c.nom}`} joursRestants={c.joursRestants} onRestore={() => restore("clients", c.id)} />
          ))}
        </Section>
      ) : null}

      {dossiers.length > 0 ? (
        <Section title="Dossiers">
          {dossiers.map((d) => (
            <Row
              key={d.id}
              label={`${GPF_PRODUIT_LABEL[d.produit]} — ${d.client ? `${d.client.prenom} ${d.client.nom}` : "client inconnu"}`}
              joursRestants={d.joursRestants}
              onRestore={() => restore("dossiers", d.id)}
            />
          ))}
        </Section>
      ) : null}

      {documents.length > 0 ? (
        <Section title="Documents">
          {documents.map((doc) => (
            <Row
              key={doc.id}
              label={`${doc.type} — ${doc.nom_fichier ?? "fichier"}${doc.client ? ` (${doc.client.prenom} ${doc.client.nom})` : ""}`}
              joursRestants={doc.joursRestants}
              onRestore={() => restore("documents", doc.id)}
            />
          ))}
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e2e5e9] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e2e5e9]">
        <h2 className="text-sm font-semibold text-[#071C2C]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Row({ label, joursRestants, onRestore }: { label: string; joursRestants: number; onRestore: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#f1f2f4] last:border-0">
      <div>
        <div className="text-sm text-[#071C2C]">{label}</div>
        <div className="text-xs text-[#9aa3ab] mt-0.5">
          {joursRestants > 0 ? `${joursRestants} jour${joursRestants > 1 ? "s" : ""} avant suppression définitive` : "Purge imminente"}
        </div>
      </div>
      <button onClick={onRestore} className="rounded-full bg-[#2f9e6e] text-white text-xs font-semibold px-3 py-1.5 shrink-0">
        Restaurer
      </button>
    </div>
  );
}

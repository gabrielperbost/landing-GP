"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Donnees = {
  client: { prenom: string; nom: string; email: string | null };
  contrats: { id: string; produit: string; compagnie: string | null; reference: string | null; date_effet: string | null; prime_mensuelle: number | null; prime_annuelle: number | null; resilie: boolean }[];
  enCours: { id: string; produit: string; etape: string }[];
  documents: { id: string; type: string; nom: string | null; date: string; aSigner: boolean; deposeParVous: boolean }[];
  demandes: { id: string; libelle: string; statut: "demandee" | "recue"; created_at: string; recue_at: string | null }[];
};

const eur = (v: number | null) => (v == null ? null : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v));
const date = (v: string | null) => (v ? new Date(v.length === 10 ? `${v}T00:00:00` : v).toLocaleDateString("fr-FR") : "—");
const ERREURS: Record<string, string> = { format: "Formats acceptés : PDF, JPG, PNG, HEIC.", taille: "Fichier trop lourd (10 Mo maximum).", trop_de_depots: "Trop de dépôts, réessayez plus tard." };

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-[#071C2C]/10 overflow-hidden">
      <h2 className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#071C2C]/60 border-b border-[#071C2C]/5">{titre}</h2>
      {children}
    </section>
  );
}

export default function PortailTableauPage() {
  const router = useRouter();
  const [d, setD] = useState<Donnees | null>(null);
  const [depot, setDepot] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cible = useRef<string | null>(null);

  const charger = async () => {
    const r = await fetch("/api/portail/moi").catch(() => null);
    if (r?.status === 401) return router.replace("/mon-espace");
    const j = await r?.json().catch(() => null);
    if (j?.ok) setD(j);
  };
  useEffect(() => {
    charger();
  }, []);

  const telecharger = async (id: string) => {
    const r = await fetch(`/api/portail/documents/${id}`).then((x) => x.json()).catch(() => null);
    if (r?.ok) window.location.href = r.url;
  };
  const choisir = (demandeId: string | null) => {
    cible.current = demandeId;
    if (fileRef.current) {
      fileRef.current.value = "";
      fileRef.current.click();
    }
  };
  const envoyer = async (file: File) => {
    setDepot(cible.current ?? "libre");
    setMessage(null);
    const fd = new FormData();
    fd.append("file", file);
    if (cible.current) fd.append("demande_id", cible.current);
    const r = await fetch("/api/portail/depot", { method: "POST", body: fd }).catch(() => null);
    const j = await r?.json().catch(() => null);
    setDepot(null);
    setMessage(j?.ok ? "Merci, votre document a bien été transmis à votre conseiller." : ERREURS[j?.error] ?? "L'envoi n'a pas abouti. Réessayez.");
    charger();
  };
  const deconnexion = async () => {
    await fetch("/api/portail/deconnexion", { method: "POST" });
    router.replace("/mon-espace");
  };

  if (!d) return <p className="text-sm text-[#071C2C]/60">Chargement de votre espace…</p>;
  const aFournir = d.demandes.filter((x) => x.statut === "demandee");
  const aSigner = d.documents.filter((x) => x.aSigner);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: "var(--font-portail-serif)" }}>
            Bonjour {d.client.prenom}
          </h1>
          <p className="text-sm text-[#071C2C]/60 mt-1">Votre espace personnel GP Finances.</p>
        </div>
        <button onClick={deconnexion} className="text-xs text-[#071C2C]/60 hover:text-[#071C2C] mt-2">
          Se déconnecter
        </button>
      </div>

      {message ? <p className="text-sm rounded-lg bg-[#CDAA5A]/15 px-4 py-3">{message}</p> : null}

      {aFournir.length || aSigner.length ? (
        <Section titre="À faire">
          {aFournir.map((x) => (
            <div key={x.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#071C2C]/5 last:border-0">
              <span className="w-2 h-2 rounded-full bg-[#c98a1f]" />
              <span className="flex-1 text-sm">{x.libelle}</span>
              <button onClick={() => choisir(x.id)} disabled={depot !== null} className="rounded-full bg-[#CDAA5A] text-[#071C2C] text-xs font-semibold px-4 py-2 disabled:opacity-50">
                {depot === x.id ? "Envoi…" : "Déposer"}
              </button>
            </div>
          ))}
          {aSigner.map((x) => (
            <div key={x.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#071C2C]/5 last:border-0">
              <span className="w-2 h-2 rounded-full bg-[#579bfc]" />
              <span className="flex-1 text-sm">
                {x.type} à signer
                <span className="block text-[11px] text-[#071C2C]/50">Téléchargez-le, signez-le, puis renvoyez-le avec « Envoyer un document ».</span>
              </span>
              <button onClick={() => telecharger(x.id)} className="rounded-full border border-[#071C2C]/20 text-xs px-4 py-2">
                Télécharger
              </button>
            </div>
          ))}
        </Section>
      ) : null}

      <Section titre="Mes contrats">
        {d.contrats.length === 0 ? (
          <p className="px-5 py-4 text-sm text-[#071C2C]/60">Aucun contrat pour le moment.</p>
        ) : (
          d.contrats.map((c) => (
            <div key={c.id} className={`px-5 py-3 border-b border-[#071C2C]/5 last:border-0 ${c.resilie ? "opacity-50" : ""}`}>
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="font-medium">{c.produit}</p>
                <p className="text-sm">{c.prime_mensuelle != null ? `${eur(c.prime_mensuelle)} / mois` : c.prime_annuelle != null ? `${eur(c.prime_annuelle)} / an` : ""}</p>
              </div>
              <p className="text-xs text-[#071C2C]/60 mt-0.5">
                {[c.compagnie, c.reference ? `n° ${c.reference}` : null, c.date_effet ? `depuis le ${date(c.date_effet)}` : null, c.resilie ? "résilié" : null].filter(Boolean).join(" · ")}
              </p>
            </div>
          ))
        )}
      </Section>

      {d.enCours.length ? (
        <Section titre="Mes demandes en cours">
          {d.enCours.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#071C2C]/5 last:border-0">
              <span className="text-sm font-medium">{x.produit}</span>
              <span className="text-xs rounded-full bg-[#071C2C]/5 px-3 py-1">{x.etape}</span>
            </div>
          ))}
        </Section>
      ) : null}

      <Section titre="Mes documents">
        {d.documents.length === 0 ? (
          <p className="px-5 py-4 text-sm text-[#071C2C]/60">Aucun document partagé pour le moment.</p>
        ) : (
          d.documents.map((x) => (
            <button key={x.id} onClick={() => telecharger(x.id)} className="w-full text-left flex items-center gap-3 px-5 py-3 border-b border-[#071C2C]/5 last:border-0 hover:bg-[#F7F6F2]">
              <span className="flex-1 min-w-0">
                <span className="block text-sm truncate">{x.type}</span>
                <span className="block text-[11px] text-[#071C2C]/50 truncate">
                  {x.nom} · {date(x.date)}
                  {x.deposeParVous ? " · envoyé par vous" : ""}
                </span>
              </span>
              <span className="text-xs text-[#071C2C]/60">Télécharger</span>
            </button>
          ))
        )}
        <div className="px-5 py-3 border-t border-[#071C2C]/5">
          <button onClick={() => choisir(null)} disabled={depot !== null} className="rounded-full border border-[#071C2C]/20 text-xs px-4 py-2 disabled:opacity-50">
            {depot === "libre" ? "Envoi…" : "Envoyer un document"}
          </button>
          <p className="text-[11px] text-[#071C2C]/50 mt-2">Ne transmettez jamais de questionnaire de santé ici : il se remplit directement auprès de l&apos;assureur.</p>
        </div>
      </Section>

      <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => e.target.files?.[0] && envoyer(e.target.files[0])} />
    </div>
  );
}

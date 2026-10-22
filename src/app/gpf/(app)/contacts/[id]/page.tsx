"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GPF_PRODUIT_LABEL,
  GPF_PRODUITS,
  GPF_SCORE_COLOR,
  GPF_SCORE_LABEL,
  GPF_STATUTS_SIGNES,
  GPF_TYPE_CONTACT_LABEL,
  compteDansRevenus,
  formatNom,
  type GpfClient,
  type GpfScore
} from "@/lib/gpf/types";
import { primeAnnuelle } from "@/lib/gpf/contrats";
import { SkeletonPage } from "@/components/gpf/Skeleton";
import { useGpfShell, usePageTitle } from "@/components/gpf/GpfShell";
import { Accueil, ListeDossiers } from "@/components/gpf/fiche/Accueil";
import { AppelDialog, NoteForm, RdvForm, TacheForm } from "@/components/gpf/fiche/Actions";
import { DossierModal } from "@/components/gpf/fiche/DossierModal";
import { Budget, Coordonnees, Fiscalite, Projet } from "@/components/gpf/fiche/Formulaires";
import { Conformite, Documents, Historique } from "@/components/gpf/fiche/Suivi";
import { EspaceClient } from "@/components/gpf/fiche/EspaceClient";
import { age, api, BoutonOr, euro, frDate, Panneau, type FicheData } from "@/components/gpf/fiche/shared";

const ONGLETS: [string, string][] = [
  ["accueil", "Accueil"],
  ["contrats", "Contrats"],
  ["affaires", "Affaires"],
  ["coordonnees", "Coordonnées"],
  ["budget", "Budget"],
  ["fiscalite", "Fiscalité"],
  ["conformite", "Conformité"],
  ["projet", "Projet"],
  ["documents", "Documents"],
  ["historique", "Historique"]
];

type Dialogue = "appel" | "note" | "tache" | "rdv" | "affaire" | null;

export default function FicheContactPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <FicheContact id={params.id} />
    </Suspense>
  );
}

function FicheContact({ id }: { id: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const shell = useGpfShell();
  const [data, setData] = useState<FicheData | null>(null);
  const [introuvable, setIntrouvable] = useState(false);
  const [onglet, setOnglet] = useState(search.get("onglet") ?? "accueil");
  const [dossierOuvert, setDossierOuvert] = useState<string | null>(search.get("dossier"));
  const [dialogue, setDialogue] = useState<Dialogue>(search.get("note") ? "note" : search.get("tache") ? "tache" : null);
  const [version, setVersion] = useState(0);

  const load = useCallback(async () => {
    const [fiche, notes, taches, rdv, conformite, documents] = await Promise.all([
      api(`/api/gpf/clients/${id}`, "GET"),
      api(`/api/gpf/clients/${id}/notes`, "GET"),
      api(`/api/gpf/taches?client_id=${id}`, "GET"),
      api(`/api/gpf/rdv?client_id=${id}`, "GET"),
      api(`/api/gpf/clients/${id}/conformite`, "GET"),
      api(`/api/gpf/clients/${id}/documents`, "GET")
    ]);
    if (!fiche.ok) {
      setIntrouvable(true);
      return;
    }
    setData({
      client: fiche.data.client,
      dossiers: fiche.data.dossiers,
      notes: notes.ok ? notes.data.notes : [],
      taches: taches.ok ? taches.data.taches : [],
      rdv: rdv.ok ? rdv.data.rdv : [],
      conformite: conformite.ok ? conformite.data.items : [],
      documents: documents.ok ? documents.data.documents : []
    });
    setVersion((v) => v + 1);
  }, [id]);

  useEffect(() => {
    load();
    // L'assistant signale une modification validée : on recharge la fiche.
    window.addEventListener("gpf:fiche-modifiee", load);
    return () => window.removeEventListener("gpf:fiche-modifiee", load);
  }, [load]);

  const client = data?.client ?? null;
  usePageTitle(client ? formatNom(client) : null);

  const resume = useMemo(() => {
    if (!data) return null;
    const dossiers = data.dossiers;
    const contrats = dossiers.filter((d) => d.contrat_statut || GPF_STATUTS_SIGNES.has(d.statut));
    const primeTotale = contrats.filter(compteDansRevenus).reduce((s, d) => s + (primeAnnuelle(d) ?? 0), 0);
    const estClient = contrats.some((d) => d.contrat_statut !== "resilie");
    const ci = data.conformite.find((c) => c.type === "piece_identite");
    const lcb = data.conformite.find((c) => c.type === "lcb_ft");
    const today = new Date().toISOString().slice(0, 10);
    const kycOk = ci?.statut === "fait" && (!ci.date_expiration || ci.date_expiration >= today) && lcb?.statut === "fait";
    return { contrats, affaires: dossiers.filter((d) => !d.contrat_statut && !GPF_STATUTS_SIGNES.has(d.statut)), primeTotale, estClient, kycOk };
  }, [data]);

  const changerOnglet = (o: string) => {
    setOnglet(o);
    router.replace(`/gpf/contacts/${id}${o === "accueil" ? "" : `?onglet=${o}`}`, { scroll: false });
  };

  const supprimer = async () => {
    if (!client || !confirm(`Déplacer ${formatNom(client)} vers la corbeille ? Restaurable pendant 30 jours.`)) return;
    const r = await api(`/api/gpf/clients/${id}`, "DELETE");
    if (!r.ok) {
      alert(r.data?.error === "dossiers_actifs" ? "Impossible : ce contact a encore des dossiers actifs." : "Échec de la suppression.");
      return;
    }
    router.replace("/gpf/contacts");
  };

  if (introuvable) {
    return (
      <div className="text-sm text-[var(--gpf-muted)]">
        Contact introuvable (peut-être déplacé dans la corbeille).{" "}
        <Link href="/gpf/contacts" className="underline">
          Retour aux contacts
        </Link>
      </div>
    );
  }
  if (!data || !client || !resume) return <SkeletonPage />;

  const a = age(client);
  const score = client.score as GpfScore | null | undefined;
  const dossierModal = data.dossiers.find((d) => d.id === dossierOuvert) ?? null;
  const entreprise = client.type_contact === "entreprise";
  const bouton = "rounded-full border border-[var(--gpf-border)] bg-[var(--gpf-surface)] text-[var(--gpf-ink)] text-xs font-medium px-3 py-1.5 hover:bg-[var(--gpf-surface-alt)]";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl text-[var(--gpf-ink)]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
              {client.civilite ? `${client.civilite} ` : ""}
              {formatNom(client)}
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white rounded-full px-2 py-0.5" style={{ background: resume.estClient ? "#2f9e6e" : "#c98a1f" }}>
              {resume.estClient ? "Client" : "Lead"}
            </span>
            {score ? (
              <span className="text-[10px] rounded-full px-2 py-0.5 border" style={{ color: GPF_SCORE_COLOR[score], borderColor: GPF_SCORE_COLOR[score] }}>
                {GPF_SCORE_LABEL[score]}
              </span>
            ) : null}
            <span
              className="text-[10px] font-semibold rounded-full px-2 py-0.5 border"
              style={{ color: resume.kycOk ? "#2f9e6e" : "#b3463f", borderColor: resume.kycOk ? "#2f9e6e" : "#b3463f" }}
              title={resume.kycOk ? "Pièce d'identité valide et LCB-FT faits" : "Pièce d'identité ou LCB-FT manquant"}
            >
              {entreprise ? "KYB" : "KYC"} {resume.kycOk ? "complet" : "incomplet"}
            </span>
            {client.nrp_count ? <span className="text-[10px] rounded-full px-2 py-0.5 bg-[var(--gpf-danger-tint)] text-[#b3463f]">NRP ×{client.nrp_count}</span> : null}
          </div>
          <p className="text-sm text-[var(--gpf-muted)] mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {client.email ? (
              <a href={`mailto:${client.email}`} className="hover:underline">
                {client.email}
              </a>
            ) : null}
            {client.telephone ? (
              <a href={`tel:${client.telephone.replace(/\s/g, "")}`} className="hover:underline">
                {client.telephone}
              </a>
            ) : null}
            {client.date_naissance || a ? (
              <span>
                {client.date_naissance ? frDate(client.date_naissance) : `né(e) en ${client.annee_naissance}`}
                {a != null ? ` · ${a} ans` : ""}
              </span>
            ) : null}
            <span>{GPF_TYPE_CONTACT_LABEL[client.type_contact ?? "particulier"]}</span>
            {client.provenance ? <span>Provenance : {client.provenance}</span> : null}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-[var(--gpf-subtle)]">Prime annualisée totale</div>
          <div className="text-2xl font-semibold tabular-nums text-[var(--gpf-ink)]">{euro(resume.primeTotale) ?? "—"}</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setDialogue("appel")} className={bouton}>
          Appeler
        </button>
        {client.email ? (
          <a href={`mailto:${client.email}`} className={bouton}>
            E-mail
          </a>
        ) : null}
        <button onClick={() => setDialogue("note")} className={bouton}>
          Note
        </button>
        <button onClick={() => setDialogue("tache")} className={bouton}>
          Tâche
        </button>
        <button onClick={() => setDialogue("rdv")} className={bouton}>
          RDV
        </button>
        <button onClick={() => shell?.openAssistant()} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-3 py-1.5">
          Demander à l&apos;assistant
        </button>
        <button onClick={supprimer} className="ml-auto text-xs text-[#b3463f] px-2" title="Déplacer vers la corbeille">
          Supprimer
        </button>
      </div>

      <div className="flex gap-1 border-b border-[var(--gpf-border)] overflow-x-auto">
        {ONGLETS.map(([k, l]) => {
          const n = k === "contrats" ? resume.contrats.length : k === "affaires" ? resume.affaires.length : null;
          return (
            <button
              key={k}
              onClick={() => changerOnglet(k)}
              className={`px-3 py-2 text-sm -mb-px border-b-2 whitespace-nowrap ${
                onglet === k ? "border-[#CDAA5A] text-[var(--gpf-ink)] font-semibold" : "border-transparent text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]"
              }`}
            >
              {l}
              {n != null ? ` (${n})` : ""}
            </button>
          );
        })}
      </div>

      {onglet === "accueil" ? (
        <Accueil
          data={data}
          onOpenDossier={setDossierOuvert}
          onNote={() => setDialogue("note")}
          onTache={() => setDialogue("tache")}
          onRdv={() => setDialogue("rdv")}
          onChanged={load}
          onTab={changerOnglet}
        />
      ) : null}
      {onglet === "contrats" ? <ListeDossiers titre="Contrats" dossiers={resume.contrats} onOpen={setDossierOuvert} /> : null}
      {onglet === "affaires" ? (
        <ListeDossiers
          titre="Affaires en cours et perdues"
          dossiers={resume.affaires}
          onOpen={setDossierOuvert}
          action={
            <button onClick={() => setDialogue("affaire")} className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]">
              + Nouvelle affaire
            </button>
          }
        />
      ) : null}
      {onglet === "coordonnees" ? <Coordonnees key={version} client={client} onSaved={load} /> : null}
      {onglet === "budget" ? <Budget key={version} client={client} onSaved={load} /> : null}
      {onglet === "fiscalite" ? <Fiscalite key={version} client={client} onSaved={load} /> : null}
      {onglet === "conformite" ? <Conformite key={version} clientId={id} items={data.conformite} onChanged={load} /> : null}
      {onglet === "projet" ? <Projet key={version} dossiers={data.dossiers} onSaved={load} /> : null}
      {onglet === "documents" ? (
        <div className="flex flex-col gap-4">
          <Documents clientId={id} documents={data.documents} dossiers={data.dossiers} onChanged={load} />
          <EspaceClient clientId={id} />
        </div>
      ) : null}
      {onglet === "historique" ? <Historique clientId={id} version={version} /> : null}

      {dossierModal ? <DossierModal dossier={dossierModal} onClose={() => setDossierOuvert(null)} onChanged={load} /> : null}
      {dialogue === "appel" ? <AppelDialog client={client} dossiers={data.dossiers} onClose={() => setDialogue(null)} onDone={load} /> : null}
      {dialogue === "note" ? <NoteForm clientId={id} onClose={() => setDialogue(null)} onDone={load} /> : null}
      {dialogue === "tache" ? <TacheForm clientId={id} onClose={() => setDialogue(null)} onDone={load} /> : null}
      {dialogue === "rdv" ? <RdvForm clientId={id} nom={formatNom(client)} onClose={() => setDialogue(null)} onDone={load} /> : null}
      {dialogue === "affaire" ? <NouvelleAffaire client={client} onClose={() => setDialogue(null)} onDone={load} /> : null}
    </div>
  );
}

function NouvelleAffaire({ client, onClose, onDone }: { client: GpfClient; onClose: () => void; onDone: () => void }) {
  const [produit, setProduit] = useState<string>(GPF_PRODUITS[0]);
  const [source, setSource] = useState(client.provenance ?? "");
  const [saving, setSaving] = useState(false);
  return (
    <Panneau titre="Nouvelle affaire" onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          const r = await api(`/api/gpf/clients/${client.id}/dossiers`, "POST", { produit, source: source || undefined });
          setSaving(false);
          if (r.ok) {
            onDone();
            onClose();
          }
        }}
      >
        <label className="text-xs text-[var(--gpf-muted)] flex flex-col gap-1">
          Produit
          <select value={produit} onChange={(e) => setProduit(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
            {GPF_PRODUITS.map((p) => (
              <option key={p} value={p}>
                {GPF_PRODUIT_LABEL[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--gpf-muted)] flex flex-col gap-1">
          Source
          <input value={source} onChange={(e) => setSource(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
        </label>
        <BoutonOr type="submit" disabled={saving}>
          {saving ? "…" : "Créer l'affaire"}
        </BoutonOr>
      </form>
    </Panneau>
  );
}

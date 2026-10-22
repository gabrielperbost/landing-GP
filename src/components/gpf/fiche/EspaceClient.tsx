"use client";
import { useEffect, useState } from "react";
import { api, Bloc, frDate, frDateHeure, Vide } from "./shared";

type Etat = {
  disponible: boolean;
  email: string | null;
  derniereConnexion: string | null;
  dernierLien: string | null;
  demandes: { id: string; libelle: string; statut: "demandee" | "recue"; created_at: string; recue_at: string | null }[];
  documents: { id: string; type: string; nom_fichier: string | null; visible_client: boolean; depose_par_client: boolean; created_at: string }[];
};

const SUGGESTIONS = ["Pièce d'identité", "Justificatif de domicile", "RIB", "Offre de prêt", "Tableau d'amortissement", "Bulletin de salaire", "Avis d'imposition", "DER signé", "Lettre de mission signée"];

/**
 * Espace client du contact : envoi du lien magique, pièces demandées (le client
 * les dépose depuis son espace), documents partagés. Le client ne voit jamais
 * les notes ni les commissions.
 */
export function EspaceClient({ clientId }: { clientId: string }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [libelle, setLibelle] = useState("");
  const [occupe, setOccupe] = useState(false);

  const charger = () => api(`/api/gpf/clients/${clientId}/portail`, "GET").then((r) => setEtat(r.ok ? r.data : { disponible: false } as Etat));
  useEffect(() => {
    charger();
  }, [clientId]);

  if (!etat) return null;
  if (!etat.disponible)
    return (
      <Bloc titre="Espace client">
        <Vide>Disponible après l&apos;application des mises à jour de la base (Paramètres → Base de données).</Vide>
      </Bloc>
    );

  const envoyerLien = async () => {
    if (!etat.email) return alert("Ajoutez d'abord l'e-mail du client dans Coordonnées.");
    if (!confirm(`Envoyer un lien d'accès à l'espace client à ${etat.email} ?`)) return;
    setOccupe(true);
    const r = await api(`/api/gpf/clients/${clientId}/portail`, "POST", { action: "lien" });
    setOccupe(false);
    alert(r.ok ? `Lien envoyé à ${etat.email} (valable 7 jours).` : "Envoi impossible.");
    charger();
  };
  const demander = async (l: string) => {
    if (!l.trim()) return;
    const r = await api(`/api/gpf/clients/${clientId}/portail`, "POST", { action: "demander", libelle: l });
    if (!r.ok) return alert(r.data?.error === "sante_interdit" ? "Aucune pièce médicale ne transite par le CRM : le questionnaire de santé se remplit chez l'assureur." : "Demande impossible.");
    setLibelle("");
    charger();
  };
  const annuler = async (id: string) => {
    await api(`/api/gpf/clients/${clientId}/portail`, "POST", { action: "annuler_demande", id });
    charger();
  };
  const partager = async (documentId: string, visible: boolean) => {
    await api(`/api/gpf/clients/${clientId}/portail`, "POST", { action: "partager", document_id: documentId, visible });
    charger();
  };

  return (
    <Bloc
      titre="Espace client"
      action={
        <button onClick={envoyerLien} disabled={occupe} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-[11px] font-semibold px-3 py-1 disabled:opacity-40">
          Envoyer le lien d&apos;accès
        </button>
      }
    >
      <p className="px-4 pt-3 text-xs text-[var(--gpf-muted)]">
        {etat.derniereConnexion ? `Dernière connexion du client : ${frDateHeure(etat.derniereConnexion)}.` : "Le client ne s'est pas encore connecté."}
        {etat.dernierLien ? ` Dernier lien envoyé le ${frDate(etat.dernierLien)}.` : ""}
      </p>

      <div className="px-4 py-3 border-b border-[var(--gpf-border-soft)]">
        <p className="text-[11px] uppercase tracking-wider text-[var(--gpf-muted)] mb-2">Pièces demandées au client</p>
        {etat.demandes.length === 0 ? <p className="text-xs text-[var(--gpf-subtle)]">Aucune demande en cours.</p> : null}
        {etat.demandes.map((d) => (
          <div key={d.id} className="flex items-center gap-2 py-1 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: d.statut === "recue" ? "#2f9e6e" : "#c98a1f" }} />
            <span className="flex-1 text-[var(--gpf-ink)]">{d.libelle}</span>
            <span className="text-[11px] text-[var(--gpf-subtle)]">{d.statut === "recue" ? `reçue le ${frDate(d.recue_at)}` : `demandée le ${frDate(d.created_at)}`}</span>
            {d.statut === "demandee" ? (
              <button onClick={() => annuler(d.id)} className="text-[11px] text-[var(--gpf-subtle)] hover:text-[#b3463f]">
                Retirer
              </button>
            ) : null}
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <input list="gpf-pieces" value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Pièce à demander…" className="rounded-lg border px-3 py-1.5 text-sm flex-1" />
          <datalist id="gpf-pieces">
            {SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button onClick={() => demander(libelle)} disabled={!libelle.trim()} className="rounded-full border border-[var(--gpf-border)] text-xs px-3 text-[var(--gpf-ink)] disabled:opacity-40">
            Demander
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-[var(--gpf-muted)] mb-2">Documents visibles par le client</p>
        {etat.documents.length === 0 ? <p className="text-xs text-[var(--gpf-subtle)]">Aucun document.</p> : null}
        {etat.documents.map((d) => (
          <label key={d.id} className="flex items-center gap-2 py-1 text-sm">
            <input type="checkbox" checked={d.visible_client || d.depose_par_client} disabled={d.depose_par_client} onChange={(e) => partager(d.id, e.target.checked)} />
            <span className="flex-1 text-[var(--gpf-ink)] truncate">
              {d.type} <span className="text-[11px] text-[var(--gpf-subtle)]">· {d.nom_fichier}</span>
            </span>
            {d.depose_par_client ? <span className="text-[11px] text-[var(--gpf-subtle)]">déposé par le client</span> : null}
          </label>
        ))}
        <p className="text-[11px] text-[var(--gpf-subtle)] mt-2">Les documents à signer générés dans Conformité apparaissent automatiquement. Notes et commissions ne sont jamais visibles.</p>
      </div>
    </Bloc>
  );
}

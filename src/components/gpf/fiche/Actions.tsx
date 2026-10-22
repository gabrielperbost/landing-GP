"use client";
import { useState } from "react";
import {
  GPF_CALL_RESULTAT_LABEL,
  GPF_NOTE_CATEGORIE_LABEL,
  GPF_PRODUIT_LABEL,
  GPF_STATUTS_CLOS,
  GPF_TASK_CATEGORIE_LABEL,
  type GpfCallResultat,
  type GpfClient,
  type GpfDossier
} from "@/lib/gpf/types";
import { api, BoutonOr, Field, frDateHeure, inputCls, Panneau } from "./shared";

const demain9h = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toLocalInput(d);
};
export const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** « Appel effectué » : résultat, compteur NRP, relance automatique, proposition de passer en Perdu. */
export function AppelDialog({ client, dossiers, onClose, onDone }: { client: GpfClient; dossiers: GpfDossier[]; onClose: () => void; onDone: () => void }) {
  const [resultat, setResultat] = useState<GpfCallResultat | null>(null);
  const [rappel, setRappel] = useState(demain9h());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [retour, setRetour] = useState<{ nrpCount: number; relance: string | null; proposerPerdu: boolean } | null>(null);
  const affairesOuvertes = dossiers.filter((d) => !d.contrat_statut && !GPF_STATUTS_CLOS.has(d.statut));

  const enregistrer = async () => {
    if (!resultat) return;
    setSaving(true);
    const r = await api(`/api/gpf/clients/${client.id}/appels`, "POST", {
      resultat,
      note,
      rappel_at: resultat === "rappeler" ? new Date(rappel).toISOString() : undefined,
      dossier_id: affairesOuvertes[0]?.id
    });
    setSaving(false);
    if (r.ok) {
      setRetour(r.data);
      onDone();
    }
  };

  const passerPerdu = async (id: string) => {
    await api(`/api/gpf/dossiers/${id}`, "PATCH", { statut: "refuse", motif_refus: "Injoignable" });
    onDone();
    onClose();
  };

  return (
    <Panneau titre={`Appel — ${client.prenom} ${client.nom.toUpperCase()}`} onClose={onClose}>
      {client.telephone ? (
        <a href={`tel:${client.telephone.replace(/\s/g, "")}`} className="block text-center rounded-lg border border-[var(--gpf-border)] py-2.5 mb-4 text-[var(--gpf-ink)] font-medium">
          Appeler le {client.telephone}
        </a>
      ) : (
        <p className="text-sm text-[var(--gpf-subtle)] mb-4">Aucun numéro de téléphone sur la fiche.</p>
      )}

      {retour ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[var(--gpf-ink)]">
            Appel enregistré.
            {retour.relance ? ` Relance programmée le ${frDateHeure(retour.relance)}.` : ""}
            {retour.nrpCount > 0 ? ` Tentatives sans réponse : ${retour.nrpCount}.` : ""}
          </p>
          {retour.proposerPerdu && affairesOuvertes.length ? (
            <div className="rounded-lg p-3 bg-[var(--gpf-danger-tint)]">
              <p className="text-sm text-[var(--gpf-ink)] mb-2">4 appels sans réponse. Passer l&apos;affaire en Perdu (motif « Injoignable ») ?</p>
              {affairesOuvertes.map((d) => (
                <button key={d.id} onClick={() => passerPerdu(d.id)} className="block text-xs rounded-full bg-[#b3463f] text-white px-3 py-1.5 mb-1">
                  Passer « {GPF_PRODUIT_LABEL[d.produit]} » en Perdu
                </button>
              ))}
            </div>
          ) : null}
          <BoutonOr onClick={onClose}>Fermer</BoutonOr>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-[var(--gpf-muted)]">Résultat de l&apos;appel</div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(GPF_CALL_RESULTAT_LABEL) as GpfCallResultat[]).map((r) => (
              <button
                key={r}
                onClick={() => setResultat(r)}
                className={`rounded-lg border px-3 py-2.5 text-sm ${resultat === r ? "border-[#CDAA5A] bg-[var(--gpf-warning-tint)] text-[var(--gpf-ink)] font-semibold" : "border-[var(--gpf-border)] text-[var(--gpf-ink)]"}`}
              >
                {GPF_CALL_RESULTAT_LABEL[r]}
              </button>
            ))}
          </div>
          {resultat === "rappeler" ? (
            <Field label="Rappeler le">
              <input type="datetime-local" value={rappel} onChange={(e) => setRappel(e.target.value)} className={inputCls} />
            </Field>
          ) : null}
          <Field label="Note (facultatif)">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={inputCls} />
          </Field>
          <p className="text-[11px] text-[var(--gpf-subtle)]">
            Sans réponse : relance automatique à J+1, puis J+3, puis J+7. Dès que le contact répond, la séquence s&apos;arrête.
          </p>
          <BoutonOr onClick={enregistrer} disabled={!resultat || saving}>
            {saving ? "…" : "Enregistrer l'appel"}
          </BoutonOr>
        </div>
      )}
    </Panneau>
  );
}

export function NoteForm({ clientId, onClose, onDone }: { clientId: string; onClose: () => void; onDone: () => void }) {
  const [categorie, setCategorie] = useState("suivi");
  const [contenu, setContenu] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Panneau titre="Nouvelle note" onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          const r = await api(`/api/gpf/clients/${clientId}/notes`, "POST", { categorie, contenu });
          setSaving(false);
          if (r.ok) {
            onDone();
            onClose();
          }
        }}
      >
        <Field label="Catégorie">
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className={inputCls}>
            {Object.entries(GPF_NOTE_CATEGORIE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Note">
          <textarea required value={contenu} onChange={(e) => setContenu(e.target.value)} rows={6} className={inputCls} autoFocus />
        </Field>
        <p className="text-[11px] text-[var(--gpf-subtle)]">Ne saisissez aucune donnée médicale.</p>
        <BoutonOr type="submit" disabled={saving || !contenu.trim()}>
          {saving ? "…" : "Enregistrer la note"}
        </BoutonOr>
      </form>
    </Panneau>
  );
}

export function TacheForm({ clientId, dossierId, onClose, onDone }: { clientId?: string | null; dossierId?: string | null; onClose: () => void; onDone: () => void }) {
  const [titre, setTitre] = useState("");
  const [categorie, setCategorie] = useState("appel");
  const [echeance, setEcheance] = useState(demain9h());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Panneau titre="Nouvelle tâche" onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          const r = await api("/api/gpf/taches", "POST", {
            client_id: clientId ?? null,
            dossier_id: dossierId ?? null,
            titre,
            categorie,
            echeance: echeance ? new Date(echeance).toISOString() : null,
            notes
          });
          setSaving(false);
          if (r.ok) {
            onDone();
            onClose();
          }
        }}
      >
        <Field label="Tâche">
          <input required value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. envoyer le devis April" className={inputCls} autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Catégorie">
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className={inputCls}>
              {Object.entries(GPF_TASK_CATEGORIE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Échéance">
            <input type="datetime-local" value={echeance} onChange={(e) => setEcheance(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} />
        </Field>
        <BoutonOr type="submit" disabled={saving || !titre.trim()}>
          {saving ? "…" : "Créer la tâche"}
        </BoutonOr>
      </form>
    </Panneau>
  );
}

export function RdvForm({ clientId, nom, onClose, onDone }: { clientId?: string | null; nom?: string; onClose: () => void; onDone: () => void }) {
  const [titre, setTitre] = useState(nom ? `Rendez-vous avec ${nom}` : "");
  const [debut, setDebut] = useState(demain9h());
  const [duree, setDuree] = useState("30");
  const [statut, setStatut] = useState("a_venir");
  const [lieu, setLieu] = useState("");
  const [visio, setVisio] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Panneau titre="Planifier un rendez-vous" onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          const r = await api("/api/gpf/rdv", "POST", {
            client_id: clientId ?? null,
            titre,
            debut: new Date(debut).toISOString(),
            duree_min: Number(duree),
            statut,
            lieu: lieu || null,
            lien_visio: visio || null
          });
          setSaving(false);
          if (r.ok) {
            onDone();
            onClose();
          }
        }}
      >
        <Field label="Objet">
          <input required value={titre} onChange={(e) => setTitre(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Date et heure">
            <input type="datetime-local" value={debut} onChange={(e) => setDebut(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Durée">
            <select value={duree} onChange={(e) => setDuree(e.target.value)} className={inputCls}>
              {["15", "30", "45", "60", "90"].map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Statut">
          <select value={statut} onChange={(e) => setStatut(e.target.value)} className={inputCls}>
            <option value="a_venir">À venir</option>
            <option value="provisoire">Provisoire</option>
          </select>
        </Field>
        <Field label="Lieu">
          <input value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Cabinet, téléphone…" className={inputCls} />
        </Field>
        <Field label="Lien visio">
          <input value={visio} onChange={(e) => setVisio(e.target.value)} placeholder="https://zoom.us/…" className={inputCls} />
        </Field>
        <BoutonOr type="submit" disabled={saving || !titre.trim()}>
          {saving ? "…" : "Planifier"}
        </BoutonOr>
      </form>
    </Panneau>
  );
}

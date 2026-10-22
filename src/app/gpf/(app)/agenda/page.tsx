"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GPF_RDV_STATUT_LABEL, formatNom, type GpfAppointment, type GpfRdvStatut } from "@/lib/gpf/types";
import { PageHeader } from "@/components/gpf/PageHeader";
import { ContactPicker } from "@/components/gpf/ContactPicker";
import { api, BoutonOr, Field, frDateHeure, inputCls, Panneau } from "@/components/gpf/fiche/shared";
import { toLocalInput } from "@/components/gpf/fiche/Actions";

const COULEUR: Record<GpfRdvStatut, string> = { a_venir: "#CDAA5A", provisoire: "#9aa3ab", passe: "#2f9e6e", annule: "#b3463f" };
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const debutSemaine = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
const memeJour = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const heure = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function AgendaPage() {
  const [vue, setVue] = useState<"semaine" | "mois">("semaine");
  const [ref, setRef] = useState(new Date());
  const [rdv, setRdv] = useState<GpfAppointment[]>([]);
  const [indispo, setIndispo] = useState(false);
  const [nouveau, setNouveau] = useState<Date | null>(null);
  const [ouvert, setOuvert] = useState<GpfAppointment | null>(null);

  const { debut, fin, jours } = useMemo(() => {
    if (vue === "semaine") {
      const d = debutSemaine(ref);
      const f = new Date(d);
      f.setDate(f.getDate() + 7);
      return { debut: d, fin: f, jours: Array.from({ length: 7 }, (_, i) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)) };
    }
    const premier = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const d = debutSemaine(premier);
    const f = new Date(d);
    f.setDate(f.getDate() + 42);
    return { debut: d, fin: f, jours: Array.from({ length: 42 }, (_, i) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)) };
  }, [vue, ref]);

  const load = async () => {
    const r = await api(`/api/gpf/rdv?du=${debut.toISOString()}&au=${fin.toISOString()}`, "GET");
    setRdv(r.ok ? r.data.rdv : []);
    setIndispo(!r.ok);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debut.getTime(), fin.getTime()]);

  const decaler = (sens: number) => {
    const x = new Date(ref);
    if (vue === "semaine") x.setDate(x.getDate() + 7 * sens);
    else x.setMonth(x.getMonth() + sens);
    setRef(x);
  };
  const titre =
    vue === "semaine"
      ? `Semaine du ${debut.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
      : ref.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const aujourdhui = new Date();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader titre="Agenda" actions={<BoutonOr onClick={() => setNouveau(new Date())}>Nouveau rendez-vous</BoutonOr>} />
      {indispo ? (
        <div className="text-sm rounded-lg px-4 py-2.5 bg-[var(--gpf-warning-tint)] text-[var(--gpf-ink)]">L&apos;agenda sera disponible dès que la mise à jour de la base sera appliquée (Paramètres).</div>
      ) : null}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => decaler(-1)} className="rounded-lg border border-[var(--gpf-border)] w-8 h-8 text-[var(--gpf-ink)]" aria-label="Période précédente">
          ‹
        </button>
        <button onClick={() => setRef(new Date())} className="rounded-lg border border-[var(--gpf-border)] px-3 h-8 text-xs text-[var(--gpf-ink)]">
          Aujourd&apos;hui
        </button>
        <button onClick={() => decaler(1)} className="rounded-lg border border-[var(--gpf-border)] w-8 h-8 text-[var(--gpf-ink)]" aria-label="Période suivante">
          ›
        </button>
        <span className="text-sm font-medium text-[var(--gpf-ink)] capitalize ml-2">{titre}</span>
        <div className="ml-auto flex gap-1">
          {(["semaine", "mois"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVue(v)}
              className={`rounded-full px-3 py-1 text-xs border capitalize ${vue === v ? "bg-[#CDAA5A] text-[#071c2c] border-transparent" : "text-[var(--gpf-muted)] border-[var(--gpf-border)] bg-[var(--gpf-surface)]"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid grid-cols-7 gap-px bg-[var(--gpf-border)] border border-[var(--gpf-border)] rounded-xl overflow-hidden`}>
        {JOURS.map((j) => (
          <div key={j} className="bg-[var(--gpf-surface-alt)] text-[11px] uppercase tracking-wide text-[var(--gpf-subtle)] text-center py-1.5">
            {j}
          </div>
        ))}
        {jours.map((jour) => {
          const duJour = rdv.filter((r) => memeJour(new Date(r.debut), jour));
          const horsMois = vue === "mois" && jour.getMonth() !== ref.getMonth();
          return (
            <div
              key={jour.toISOString()}
              onDoubleClick={() => {
                const d = new Date(jour);
                d.setHours(9, 0, 0, 0);
                setNouveau(d);
              }}
              className={`bg-[var(--gpf-surface)] p-1.5 ${vue === "semaine" ? "min-h-[320px]" : "min-h-[96px]"} ${horsMois ? "opacity-40" : ""}`}
            >
              <div className={`text-xs mb-1 ${memeJour(jour, aujourdhui) ? "font-bold text-[#CDAA5A]" : "text-[var(--gpf-muted)]"}`}>{jour.getDate()}</div>
              <div className="flex flex-col gap-1">
                {duJour.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setOuvert(r)}
                    className="text-left rounded px-1.5 py-1 text-[11px] leading-tight bg-[var(--gpf-surface-alt)] border-l-2 hover:bg-[var(--gpf-fill)]"
                    style={{ borderLeftColor: COULEUR[r.statut] }}
                  >
                    <span className="font-semibold text-[var(--gpf-ink)]">{heure(r.debut)}</span>{" "}
                    <span className={`text-[var(--gpf-ink)] ${r.statut === "annule" ? "line-through" : ""}`}>{r.client ? formatNom(r.client) : r.titre}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-[var(--gpf-subtle)]">Double-cliquez sur un jour pour y planifier un rendez-vous. La synchronisation Calendly / Google Agenda arrive au lot 9.</p>

      {nouveau ? <NouveauRdv date={nouveau} onClose={() => setNouveau(null)} onDone={load} /> : null}
      {ouvert ? <RdvDetail rdv={ouvert} onClose={() => setOuvert(null)} onDone={load} /> : null}
    </div>
  );
}

function NouveauRdv({ date, onClose, onDone }: { date: Date; onClose: () => void; onDone: () => void }) {
  const [contact, setContact] = useState<{ id: string; label: string } | null>(null);
  const [titre, setTitre] = useState("Rendez-vous");
  const [debut, setDebut] = useState(toLocalInput(date));
  const [duree, setDuree] = useState("30");
  const [statut, setStatut] = useState("a_venir");
  const [visio, setVisio] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <Panneau titre="Nouveau rendez-vous" onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          const r = await api("/api/gpf/rdv", "POST", {
            client_id: contact?.id ?? null,
            titre: contact && titre === "Rendez-vous" ? `Rendez-vous avec ${contact.label}` : titre,
            debut: new Date(debut).toISOString(),
            duree_min: Number(duree),
            statut,
            lien_visio: visio || null
          });
          setSaving(false);
          if (r.ok) {
            onDone();
            onClose();
          }
        }}
      >
        <Field label="Contact">
          <ContactPicker value={contact} onChange={setContact} />
        </Field>
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
        <Field label="Lien visio">
          <input value={visio} onChange={(e) => setVisio(e.target.value)} className={inputCls} />
        </Field>
        <BoutonOr type="submit" disabled={saving}>
          {saving ? "…" : "Planifier"}
        </BoutonOr>
      </form>
    </Panneau>
  );
}

function RdvDetail({ rdv, onClose, onDone }: { rdv: GpfAppointment; onClose: () => void; onDone: () => void }) {
  const changer = async (statut: string) => {
    await api(`/api/gpf/rdv/${rdv.id}`, "PATCH", { statut });
    onDone();
    onClose();
  };
  const supprimer = async () => {
    if (!confirm("Supprimer ce rendez-vous ?")) return;
    await api(`/api/gpf/rdv/${rdv.id}`, "DELETE");
    onDone();
    onClose();
  };
  return (
    <Panneau titre={rdv.titre} onClose={onClose}>
      <div className="flex flex-col gap-3 text-sm">
        <div className="text-[var(--gpf-ink)]">
          {frDateHeure(rdv.debut)} · {rdv.duree_min} min
        </div>
        {rdv.client ? (
          <Link href={`/gpf/contacts/${rdv.client.id}`} className="underline text-[var(--gpf-ink)]">
            {formatNom(rdv.client)}
          </Link>
        ) : null}
        {rdv.lien_visio ? (
          <a href={rdv.lien_visio} target="_blank" rel="noopener noreferrer" className="underline text-[var(--gpf-ink)]">
            Rejoindre la visio
          </a>
        ) : null}
        {rdv.lieu ? <div className="text-[var(--gpf-muted)]">{rdv.lieu}</div> : null}
        <div className="text-xs text-[var(--gpf-muted)]">
          Statut : {GPF_RDV_STATUT_LABEL[rdv.statut]} · Source : {rdv.source}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(GPF_RDV_STATUT_LABEL) as GpfRdvStatut[])
            .filter((s) => s !== rdv.statut)
            .map((s) => (
              <button key={s} onClick={() => changer(s)} className="rounded-full border border-[var(--gpf-border)] px-3 py-1 text-xs text-[var(--gpf-ink)]">
                Marquer {GPF_RDV_STATUT_LABEL[s].toLowerCase()}
              </button>
            ))}
        </div>
        <button onClick={supprimer} className="text-xs text-[#b3463f] text-left">
          Supprimer le rendez-vous
        </button>
      </div>
    </Panneau>
  );
}

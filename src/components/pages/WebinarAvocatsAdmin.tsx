"use client";

import { FormEvent, useEffect, useState } from "react";

type Participant = {
  email: string;
  prenom?: string | null;
  nom?: string | null;
  barreau?: string | null;
  cabinet?: string | null;
  telephone?: string | null;
  status?: string | null;
  consent_at?: string | null;
  created_at?: string | null;
};

type ParticipantsResponse = {
  success?: boolean;
  error?: string;
  counts?: {
    registered: number;
    unsubscribed: number;
  };
  tracking?: {
    counts?: Record<
      string,
      {
        total: number;
        unique: number;
      }
    >;
    events?: Array<{
      event_at: string;
      event: "questionnaire" | "plaquette" | "site";
      email: string;
      prenom?: string;
      nom?: string;
      target_url?: string;
      source?: string;
    }>;
  };
  participants?: Participant[];
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
};

export function WebinarAvocatsAdmin() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<ParticipantsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadParticipants = async (adminToken: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/webinar-avocats/participants?token=${encodeURIComponent(adminToken)}`, {
        cache: "no-store"
      });
      const payload = (await response.json()) as ParticipantsResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Impossible de charger les participants.");
      }

      setData(payload);
    } catch (loadError) {
      setData(null);
      setError(loadError instanceof Error ? loadError.message : "Erreur inconnue.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token") ?? "";
    if (!tokenFromUrl) return;
    setToken(tokenFromUrl);
    void loadParticipants(tokenFromUrl);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadParticipants(token);
  };

  return (
    <main className="min-h-screen bg-[#eef3fb] px-4 py-10">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#1A3C5C]">Webinaire PER avocats</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">Participants inscrits</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Cette page affiche les inscriptions enregistrées dans Supabase pour le webinaire du 17 septembre 2026.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Token admin"
              className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 outline-none ring-blue-100 focus:ring-4"
            />
            <button
              type="submit"
              disabled={isLoading || !token}
              className="min-h-12 rounded-xl px-5 text-sm font-extrabold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#1A3C5C", color: "#ffffff", border: "1px solid #143047" }}
            >
              {isLoading ? "Chargement..." : "Voir les inscrits"}
            </button>
          </form>

          {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </div>

        {data?.counts ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Inscrits</p>
              <p className="mt-2 text-4xl font-black text-[#1A3C5C]">{data.counts.registered}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Désinscrits</p>
              <p className="mt-2 text-4xl font-black text-slate-950">{data.counts.unsubscribed}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Dernière mise à jour</p>
              <p className="mt-3 text-sm font-bold text-slate-950">{formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        ) : null}

        {data?.tracking?.counts ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["questionnaire", "Accès questionnaire"],
              ["plaquette", "Plaquette téléchargée"],
              ["site", "Notre site"]
            ].map(([event, label]) => {
              const stats = data.tracking?.counts?.[event] ?? { total: 0, unique: 0 };
              return (
                <div key={event} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-2 text-4xl font-black text-[#1A3C5C]">{stats.unique}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{stats.total} clic(s) total</p>
                </div>
              );
            })}
          </div>
        ) : null}

        {data?.tracking?.events?.length ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-black text-slate-950">Suivi des clics</h2>
              <p className="mt-1 text-sm text-slate-500">
                Questionnaire, téléchargement de plaquette et clic vers le site, avec l’email identifié quand le lien vient de la campagne.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.tracking.events
                    .slice()
                    .sort((left, right) => new Date(right.event_at).getTime() - new Date(left.event_at).getTime())
                    .map((event, index) => (
                      <tr key={`${event.email}-${event.event}-${event.event_at}-${index}`} className="text-slate-700">
                        <td className="px-4 py-3">{formatDate(event.event_at)}</td>
                        <td className="px-4 py-3 font-bold text-slate-950">
                          {event.event === "questionnaire"
                            ? "Questionnaire"
                            : event.event === "plaquette"
                              ? "Plaquette"
                              : "Notre site"}
                        </td>
                        <td className="px-4 py-3">{[event.prenom, event.nom].filter(Boolean).join(" ") || "—"}</td>
                        <td className="px-4 py-3">
                          <a className="font-semibold text-[#1A3C5C] underline" href={`mailto:${event.email}`}>
                            {event.email}
                          </a>
                        </td>
                        <td className="px-4 py-3">{event.source || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {data?.participants ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Inscription</th>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Barreau</th>
                    <th className="px-4 py-3">Cabinet</th>
                    <th className="px-4 py-3">Téléphone</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.participants.map((participant) => (
                    <tr key={participant.email} className="text-slate-700">
                      <td className="px-4 py-3">{formatDate(participant.created_at)}</td>
                      <td className="px-4 py-3 font-bold text-slate-950">
                        {[participant.prenom, participant.nom].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <a className="font-semibold text-[#1A3C5C] underline" href={`mailto:${participant.email}`}>
                          {participant.email}
                        </a>
                      </td>
                      <td className="px-4 py-3">{participant.barreau || "—"}</td>
                      <td className="px-4 py-3">{participant.cabinet || "—"}</td>
                      <td className="px-4 py-3">{participant.telephone || "—"}</td>
                      <td className="px-4 py-3">{participant.status || "registered"}</td>
                    </tr>
                  ))}
                  {!data.participants.length ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        Aucun inscrit pour le moment.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

const KPI_ROWS = [
  {
    kpi: "Visites landing",
    definition: "Nombre d'entrees sur la landing (home + pages villes)",
    source: "gp_lp_visit"
  },
  {
    kpi: "Temps >= 60 secondes",
    definition: "Prospects restes au moins 60s sur la page",
    source: "gp_lp_time_mark (seconds=60)"
  },
  {
    kpi: "Scroll 75%",
    definition: "Prospects qui ont atteint 75% de la page",
    source: "gp_lp_scroll (depth_pct=75)"
  },
  {
    kpi: "Section estimation vue",
    definition: "Prospects ayant atteint la zone formulaire",
    source: "gp_lp_section (section_id=estimation)"
  },
  {
    kpi: "Video start",
    definition: "Nombre de lectures video lancees",
    source: "gp_video_start"
  },
  {
    kpi: "Video completion",
    definition: "Nombre de videos vues jusqu'a la fin",
    source: "gp_video_complete"
  },
  {
    kpi: "Clic Appel",
    definition: "Clics sur les CTA telephone",
    source: "gp_cta_click"
  },
  {
    kpi: "Clic RDV",
    definition: "Clics vers Calendly",
    source: "gp_rdv_click"
  },
  {
    kpi: "Leads soumis",
    definition: "Formulaires envoyes avec succes",
    source: "gp_lead_submit (status=submitted)"
  }
];

export default function TrackingKpisPreviewPage() {
  return (
    <main className="container py-10 sm:py-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Pilotage marketing</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">Support KPI tracking landing</h1>
        <p className="mt-3 text-sm text-muted sm:text-base">
          Ce tableau resume les KPI a suivre pour comprendre le comportement des prospects et optimiser la conversion.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-3 shadow-soft sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-primary">KPI</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-primary">Definition</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-primary">Event source</th>
              </tr>
            </thead>
            <tbody>
              {KPI_ROWS.map((row) => (
                <tr key={row.kpi} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-3 text-sm font-semibold text-ink">{row.kpi}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{row.definition}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

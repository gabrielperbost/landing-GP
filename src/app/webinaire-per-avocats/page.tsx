import type { Metadata } from "next";
import { WebinarAvocatsSignupForm } from "@/components/pages/WebinarAvocatsSignupForm";
import { WEBINAR_AVOCATS } from "@/lib/webinarAvocatsCampaign";

export const metadata: Metadata = {
  title: "Webinaire PER pour avocats | GP Finances",
  description: "Inscription au webinaire GP Finances dédié au PER pour les avocats.",
  robots: {
    index: false,
    follow: false
  }
};

export default function WebinarPerAvocatsPage() {
  return (
    <main className="min-h-screen bg-[#eef3fb]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,168,107,.35),transparent_34%),radial-gradient(circle_at_top_right,rgba(26,60,92,.18),transparent_30%)]" />
        <div className="container relative grid gap-4 py-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="mb-4 inline-flex w-fit rounded-full border border-[#C8A86B]/40 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-[#1A3C5C]">
              GP Finances · Webinaire avocats
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#102033] sm:text-5xl">
              Avocats : comment réduire votre impôt 2026 tout en préparant votre retraite ?
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Un webinaire réservé aux avocats inscrits à un barreau français pour comprendre les principaux leviers
              d’optimisation fiscale, avec un focus concret sur le Plan Épargne Retraite.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Date", WEBINAR_AVOCATS.dateLabel],
                ["Horaire", WEBINAR_AVOCATS.timeLabel],
                ["Format", WEBINAR_AVOCATS.durationLabel]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-extrabold text-[#1A3C5C]">{value}</p>
                </div>
              ))}
            </div>

          </div>

          <aside className="lg:pl-4">
            <div className="sticky top-6">
              <div
                className="mb-3 rounded-3xl p-4 shadow-xl shadow-blue-950/20"
                style={{
                  backgroundColor: "#1A3C5C",
                  border: "1px solid #143047",
                  color: "#ffffff"
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "#EAD7A0" }}>
                  Bulletin d’inscription
                </p>
                <p className="mt-1 text-2xl font-black" style={{ color: "#ffffff" }}>
                  Webinaire gratuit
                </p>
                <p className="mt-1 text-sm leading-6" style={{ color: "#EAF2FF" }}>
                  Participation gratuite. Replay envoyé aux inscrits après le webinaire.
                </p>
              </div>
              <WebinarAvocatsSignupForm />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

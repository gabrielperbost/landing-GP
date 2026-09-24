import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Désinscription | Webinaire PER avocats",
  robots: {
    index: false,
    follow: false
  }
};

export default function WebinarPerAvocatsDesinscriptionPage() {
  return (
    <main className="min-h-screen bg-[#eef3fb] px-4 py-16">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#1A3C5C]">GP Finances</p>
        <h1 className="mt-3 text-3xl font-black text-[#102033]">Désinscription</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Les emails de campagne contiennent un lien personnel permettant de confirmer automatiquement la désinscription.
          Si vous souhaitez être retiré manuellement de la campagne webinaire PER pour avocats, répondez simplement à l’email
          reçu avec la mention “désinscription”.
        </p>
      </section>
    </main>
  );
}

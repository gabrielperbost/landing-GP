import type { Metadata } from "next";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Plan Epargne Retraite - Reduisez vos impots des cette annee | GP Finances",
  description:
    "Grace au PER, certains de nos clients economisent jusqu'a 9 000EUR d'impots par an. Simulation gratuite et personnalisee par Gabriel Perbost, courtier independant.",
  alternates: {
    canonical: "/per"
  },
  openGraph: {
    title: "Plan Epargne Retraite - Reduisez vos impots des cette annee | GP Finances",
    description:
      "Grace au PER, certains de nos clients economisent jusqu'a 9 000EUR d'impots par an. Simulation gratuite et personnalisee par Gabriel Perbost, courtier independant.",
    url: "https://gp-finances.fr/per",
    siteName: "GP Finances",
    locale: "fr_FR",
    type: "website"
  }
};

function toSearchString(searchParams: SearchParams | undefined): string {
  if (!searchParams) return "";

  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      params.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    }
  });

  return params.toString();
}

export default function PerPage({ searchParams }: { searchParams?: SearchParams }) {
  const query = toSearchString(searchParams);
  const iframeSrc = query ? `/landing-per-gp-finances.html?${query}` : "/landing-per-gp-finances.html";

  return (
    <main style={{ height: "100dvh", width: "100%", overflow: "hidden" }}>
      <iframe
        src={iframeSrc}
        title="Landing PER GP Finances"
        style={{ border: 0, width: "100%", height: "100%" }}
      />
    </main>
  );
}

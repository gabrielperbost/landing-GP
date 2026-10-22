/** Regroupe les provenances saisies librement (Monday, Tally…) en sources homogènes. */
export function normSource(s: string | null | undefined): string {
  const v = (s ?? "").toLowerCase();
  if (!v.trim()) return "Non renseignée";
  if (v.includes("meta") || v.includes("facebook") || v.includes("instagram")) return "Meta Ads";
  if (v.includes("tally")) return "Tally";
  if (v.includes("masterlead")) return "Masterleads";
  if (v.includes("century")) return "Century 21";
  if (v.includes("recommand") || v.includes("connaissance") || v.includes("parrain")) return "Recommandation";
  if (v.includes("site") || v.includes("web")) return "Site";
  if (v.includes("apporteur") || v.includes("partenaire")) return "Apporteur";
  if (v.includes("webinaire")) return "Webinaire";
  if (v.includes("physique")) return "Physique";
  return s!.trim().slice(0, 40);
}

/** Sources payantes pour lesquelles un coût mensuel peut être saisi. */
export const SOURCES_PAYANTES = ["Meta Ads", "Masterleads", "Tally"];

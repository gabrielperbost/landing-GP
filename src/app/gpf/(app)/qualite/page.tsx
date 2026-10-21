import Link from "next/link";
import { PageHeader } from "@/components/gpf/PageHeader";

const OUTILS = [
  { href: "/gpf/donnees-incompletes", titre: "Données incomplètes", texte: "Contrats sans compagnie, prime, date d'effet ou commission, à compléter directement dans le tableau." },
  { href: "/gpf/doublons", titre: "Doublons possibles", texte: "Fiches et dossiers en double, à fusionner après vérification. Chaque fusion peut être annulée." },
  { href: "/gpf/noms-a-corriger", titre: "Noms à corriger", texte: "Noms mal importés (« ? », prénom et nom inversés…) avec une correction proposée à valider." }
];

export default function QualitePage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Qualité des données" sousTitre="Des données justes pour des chiffres justes : rien n'est corrigé sans votre validation." />
      <div className="grid md:grid-cols-3 gap-3">
        {OUTILS.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] border-t-2 rounded-xl p-5 hover:bg-[var(--gpf-surface-alt)]"
            style={{ borderTopColor: "#CDAA5A" }}
          >
            <div className="text-sm font-semibold text-[var(--gpf-ink)]">{o.titre}</div>
            <p className="text-xs text-[var(--gpf-muted)] mt-1.5">{o.texte}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Modèle de données pour les landing pages locales « assurance emprunteur »
 * (36 communes du 92 + 20 arrondissements de Paris). Une ville = un fichier
 * dans ce dossier, pour faciliter la relecture et la vérification des faits.
 *
 * Règle stricte : aucun champ chiffré ne doit être inventé. Si une donnée ne
 * peut pas être vérifiée avec une source fiable (DVF/data.gouv.fr, Notaires
 * du Grand Paris, INSEE), la valeur est `null` et le champ est listé dans le
 * rapport de génération sous TODO_VERIFIER.
 */

export type ChiffreVerifie = {
  valeur: number;
  source: string;
  date: string; // date de récupération de la donnée, pas la date de la transaction
};

export type VilleData = {
  slug: string;
  nom: string;
  type: "commune" | "arrondissement";
  codesPostaux: string[];
  departement: "92" | "75";

  /** Slugs (pas les noms) des villes/arrondissements voisins, pour le maillage interne. */
  villesVoisines: string[];

  /** Vrais quartiers de la ville, pas des zones inventées. */
  quartiers: string[];

  /** 2-3 phrases spécifiques : type de biens, profil dominant (primo-accédants, familles, investisseurs…). */
  profilImmobilier: string;

  /** Prix au m², par type de bien. `null` si non vérifié → TODO_VERIFIER. */
  prixM2: {
    appartements: ChiffreVerifie | null;
    maisons: ChiffreVerifie | null;
  };

  population: ChiffreVerifie | null;

  /** Qui emprunte ici, en une ou deux phrases ancrées dans la réalité du marché local. */
  profilEmprunteurs: string;

  /** Temps/moyen de transport réel jusqu'au bureau d'Issy-les-Moulineaux ou à Paris 6e. */
  accesBureau: string;

  /** L'angle unique de la page (voir brief : grands capitaux, primo-accédants, cadres de la Défense…). */
  angleEditorial: string;

  /** 3 questions propres à la ville. Des questions générales tournantes s'y ajoutent automatiquement. */
  faqLocales: { q: string; r: string }[];

  /**
   * Sources des faits qualitatifs cités dans la page (quartiers, lignes de transport, lieux,
   * caractérisations du marché) — tout ce qui n'est pas déjà un ChiffreVerifie (prix, population).
   * `source` doit pointer vers quelque chose de vérifiable (ligne RATP/SNCF officielle, site de la
   * mairie, API Géo, Wikipédia pour un nom de quartier d'usage courant…). Si un fait n'a pas pu
   * être vérifié rigoureusement, mettre `"TODO_VERIFIER"` comme source plutôt que d'inventer une
   * référence : scripts/check-landings.ts les liste pour relecture.
   */
  faitsSources: { fait: string; source: string }[];

  /**
   * Ordre des blocs dans la section locale, pour éviter un gabarit identique
   * d'une ville à l'autre (voir brief). Si omis, l'ordre par défaut
   * [profil, stats, financing, faq, neighbors] est utilisé.
   */
  sectionOrder?: Array<"profil" | "stats" | "financing" | "faq" | "neighbors">;

  meta: {
    title: string;
    description: string;
  };
};

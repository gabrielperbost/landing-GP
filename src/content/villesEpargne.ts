/**
 * Pages locales « courtier en PER » et « courtier en assurance-vie » (toutes les villes : 10 pilotes ici, les autres dans villesEpargneLot*.ts).
 * Une ville = un bloc PER et un bloc assurance-vie, rédigés séparément pour que les deux pages
 * d'une même ville ne se ressemblent pas, ni entre elles, ni avec la page assurance de prêt.
 *
 * Angle « métier » : les internautes cherchent un courtier, un cabinet ou un conseiller près de
 * chez eux, pas seulement le produit. GP Finances est courtier en assurance (ORIAS 23003789) :
 * jamais « conseiller en gestion de patrimoine » ni « CIF », titres réservés.
 *
 * Règles : aucun chiffre dans ces textes (les chiffres viennent de localDataEpargne.json, INSEE,
 * et sont affichés à part avec leur source) ; faits locaux repris des fiches déjà vérifiées de
 * src/content/villes/{slug}.ts (quartiers, transports, quartiers d'affaires).
 */

export type BlocEpargne = {
  /** Angle de la page, une phrase. */
  angle: string;
  /** 2 paragraphes propres à la ville et au produit. */
  texte: [string, string];
  /** 3 questions propres à la ville. Des questions générales tournantes s'y ajoutent. */
  faq: { q: string; r: string }[];
  meta: { title: string; description: string };
};

export type VilleEpargne = { slug: string; per: BlocEpargne; av: BlocEpargne };

import { LOT1 } from "./villesEpargneLot1.ts";
import { LOT2 } from "./villesEpargneLot2.ts";
import { LOT3 } from "./villesEpargneLot3.ts";
import { LOT4 } from "./villesEpargneLot4.ts";
import { LOT5 } from "./villesEpargneLot5.ts";
import { LOT6 } from "./villesEpargneLot6.ts";
const LOTS: VilleEpargne[] = [...LOT1, ...LOT2, ...LOT3, ...LOT4, ...LOT5, ...LOT6];

/** Les 10 villes pilotes (octobre 2026). Les autres villes sont dans les fichiers villesEpargneLot*.ts. */
const PILOTES: VilleEpargne[] = [
  {
    slug: "boulogne-billancourt",
    per: {
      angle: "Des revenus élevés, une tranche d’imposition souvent haute : le PER prend tout son sens.",
      texte: [
        "À Boulogne-Billancourt, beaucoup d’actifs travaillent dans les sièges d’entreprises de la ville, à Issy-les-Moulineaux ou à Paris. Avec des revenus confortables, la tranche marginale d’imposition grimpe vite, et c’est précisément là que chaque euro versé sur un Plan d’Épargne Retraite réduit le plus votre impôt.",
        "Mon rôle de courtier est de vérifier, avant tout versement, que le PER est le bon outil pour vous : votre tranche aujourd’hui, celle attendue à la retraite, le plafond de déduction encore disponible sur votre avis d’imposition, et le contrat dont les frais et la gestion vous conviennent. Je compare plusieurs assureurs, pas seulement le contrat d’une banque."
      ],
      faq: [
        {
          q: "J’ai déjà un PER d’entreprise chez mon employeur à Boulogne : faut-il en ouvrir un autre ?",
          r: "Pas forcément. Le PER d’entreprise reçoit l’épargne salariale et l’abondement ; un PER individuel accueille vos versements volontaires, déductibles de votre revenu imposable. Les deux se complètent. Je regarde ce que vous avez déjà avant de proposer quoi que ce soit."
        },
        {
          q: "Je viens d’acheter à Boulogne-Billancourt : le PER bloque-t-il mon épargne ?",
          r: "L’épargne est en principe disponible à la retraite, mais l’achat de la résidence principale fait partie des cas de sortie anticipée. Pour une épargne de précaution, mieux vaut garder une poche disponible à côté : c’est l’équilibre que je vous aide à trouver."
        },
        {
          q: "Peut-on se voir près de Marcel Sembat ou des Princes plutôt qu’en visio ?",
          r: "Le cabinet est à Issy-les-Moulineaux, à quelques minutes de Boulogne-Billancourt. La plupart des rendez-vous se font en visio, mais un échange en personne est possible sur demande."
        }
      ],
      meta: {
        title: "Courtier PER à Boulogne-Billancourt : épargne retraite et impôts",
        description: "Courtier en Plan d’Épargne Retraite à Boulogne-Billancourt : économie d’impôt selon votre tranche, comparaison des assureurs, transfert d’un ancien PER. Étude sans engagement."
      }
    },
    av: {
      angle: "Faire travailler une épargne déjà constituée, sans la laisser dormir sur un livret.",
      texte: [
        "À Boulogne-Billancourt, l’assurance-vie sert souvent à placer une épargne qui s’accumule : après une prime, la vente d’un premier appartement ou simplement des années d’économies. Laisser cet argent sur un compte courant ou un livret plafonné, c’est perdre en rendement année après année.",
        "En tant que courtier en assurance-vie, je compare les contrats de plusieurs assureurs : frais sur versement, frais de gestion, qualité du fonds en euros et choix d’unités de compte. Vous savez exactement ce que vous payez, et vous gardez la main sur votre argent : un contrat d’assurance-vie reste disponible à tout moment."
      ],
      faq: [
        {
          q: "J’ai une assurance-vie ouverte à ma banque il y a longtemps : vaut-il mieux la garder ?",
          r: "Un contrat ancien garde son antériorité fiscale, c’est un vrai atout après 8 ans. Souvent, la bonne solution est de le conserver et d’ouvrir un second contrat aux frais plus bas pour les nouveaux versements. Je compare les deux avant de vous conseiller."
        },
        {
          q: "Je vends mon appartement près de Billancourt : où placer le produit de la vente en attendant ?",
          r: "Si le projet suivant est proche, la priorité est la sécurité et la disponibilité, par exemple sur un fonds en euros. Si l’argent n’a pas d’usage prévu avant plusieurs années, une part d’unités de compte peut se justifier. Tout dépend de l’horizon, c’est la première question que je vous pose."
        },
        {
          q: "Un courtier coûte-t-il plus cher que ma banque ?",
          r: "Non. Ma rémunération est versée par l’assureur et incluse dans les frais du contrat, comme pour un contrat bancaire. La différence, c’est que je compare plusieurs assureurs au lieu d’un seul."
        }
      ],
      meta: {
        title: "Courtier en assurance-vie à Boulogne-Billancourt | GP Finances",
        description: "Courtier en assurance-vie à Boulogne-Billancourt : comparaison des contrats, frais, fonds en euros et unités de compte. Un interlocuteur à deux pas, à Issy-les-Moulineaux."
      }
    }
  },
  {
    slug: "neuilly-sur-seine",
    per: {
      angle: "Hauts revenus, impôt élevé : le PER comme levier fiscal, à manier avec méthode.",
      texte: [
        "Neuilly-sur-Seine affiche l’un des niveaux de vie les plus élevés d’Île-de-France. Pour les foyers dans les tranches d’imposition les plus hautes, un versement sur un Plan d’Épargne Retraite peut faire baisser l’impôt de façon nette, à condition de respecter le plafond de déduction et de penser dès maintenant à la fiscalité de la sortie.",
        "Je ne vends pas le PER comme une solution universelle. Mon travail de courtier est de calculer ce que vous gagnez vraiment : l’économie d’impôt aujourd’hui, la fiscalité à la retraite, l’intérêt d’utiliser les plafonds non consommés les années passées, et les plafonds propres aux dirigeants et professions libérales, nombreux à Neuilly."
      ],
      faq: [
        {
          q: "Je suis dirigeant de société à Neuilly : le PER est-il plus intéressant que d’autres solutions ?",
          r: "Il peut l’être, mais il se compare. Selon votre mode de rémunération, votre statut et votre tranche, d’autres enveloppes peuvent jouer. Je fais le point sur votre situation avant de recommander un PER individuel."
        },
        {
          q: "Je n’ai pas utilisé mon plafond de déduction ces dernières années : est-il perdu ?",
          r: "Non. Les plafonds non utilisés des années précédentes se reportent pendant plusieurs années : le montant encore disponible figure sur votre avis d’imposition. Un versement plus important une année peut donc rester entièrement déductible."
        },
        {
          q: "Le cabinet peut-il intervenir sur l’Île de la Jatte ou vers Bagatelle ?",
          r: "Oui. Le cabinet est à Issy-les-Moulineaux ; les échanges se font surtout en visio ou par téléphone, et un rendez-vous en personne reste possible à Neuilly sur demande."
        }
      ],
      meta: {
        title: "Courtier en PER à Neuilly-sur-Seine : réduire son impôt",
        description: "Plan d’Épargne Retraite à Neuilly-sur-Seine : économie d’impôt selon votre tranche, report des plafonds non utilisés, cas des dirigeants. Courtier indépendant, étude sans engagement."
      }
    },
    av: {
      angle: "Organiser la transmission de son patrimoine, bien avant qu’il ne soit trop tard.",
      texte: [
        "À Neuilly-sur-Seine, la part des habitants de 65 ans et plus est plus forte que la moyenne du département, et la question de la transmission arrive tôt dans la discussion. L’assurance-vie reste l’outil le plus souple pour transmettre un capital à ses proches dans un cadre fiscal avantageux, en dehors de la succession.",
        "Tout se joue sur deux points que je vérifie avec vous : l’âge auquel les versements sont faits, avant ou après 70 ans, qui change la fiscalité ; et la rédaction de la clause bénéficiaire, trop souvent laissée à la formule par défaut. Comme courtier, je compare aussi les contrats haut de gamme des assureurs, frais compris."
      ],
      faq: [
        {
          q: "J’ai plus de 70 ans : l’assurance-vie a-t-elle encore un intérêt pour transmettre ?",
          r: "Oui, avec des règles différentes. Après 70 ans, l’abattement porte sur les versements et non sur les gains : les intérêts produits ensuite sont transmis sans droits. Selon votre situation, un nouveau contrat peut rester utile."
        },
        {
          q: "Ma clause bénéficiaire dit « mon conjoint, à défaut mes enfants » : est-ce suffisant ?",
          r: "C’est la formule standard, et elle ne convient pas à toutes les familles : familles recomposées, enfant à protéger, démembrement de la clause. Je vous aide à la relire et à l’adapter à votre situation."
        },
        {
          q: "Peut-on se rencontrer à Neuilly-sur-Seine ?",
          r: "Le cabinet est à Issy-les-Moulineaux. La plupart des échanges se font en visio ; un rendez-vous en personne à Neuilly reste possible."
        }
      ],
      meta: {
        title: "Courtier assurance-vie à Neuilly-sur-Seine : transmettre son patrimoine",
        description: "Assurance-vie à Neuilly-sur-Seine : transmission, clause bénéficiaire, versements avant ou après 70 ans, comparaison des contrats et des frais. Courtier indépendant, sans engagement."
      }
    }
  },
  {
    slug: "issy-les-moulineaux",
    per: {
      angle: "Votre courtier en épargne retraite est à Issy : un rendez-vous au cabinet, sans détour.",
      texte: [
        "Le cabinet GP Finances est installé à Issy-les-Moulineaux. Pour les salariés des sièges d’entreprises de Val de Seine comme pour les habitants du Fort d’Issy ou de Corentin Celton, faire le point sur un Plan d’Épargne Retraite peut se faire en personne, en bas de chez vous.",
        "Beaucoup de salariés d’Issy cumulent plusieurs dispositifs : PER d’entreprise, ancien contrat Madelin ou PERP, épargne salariale. Avant d’ouvrir un nouveau contrat, je fais l’inventaire de ce que vous avez déjà, je regarde ce qui mérite d’être regroupé ou transféré, puis je compare les PER individuels de plusieurs assureurs."
      ],
      faq: [
        {
          q: "Je travaille à Val de Seine et j’ai un PER collectif : puis-je le transférer ?",
          r: "Les sommes d’un PER collectif peuvent être transférées vers un PER individuel, sous conditions, et librement une fois que vous avez quitté l’entreprise. Tant que vous y êtes salarié, il est souvent plus intéressant de le garder pour profiter de l’abondement."
        },
        {
          q: "J’ai un vieux PERP ou un contrat Madelin : que faire ?",
          r: "Ces anciens contrats peuvent être transférés vers un PER, qui offre notamment la sortie en capital à la retraite. Le transfert n’est pas toujours avantageux, certains anciens contrats ayant des garanties intéressantes : je les étudie avant de conseiller quoi que ce soit."
        },
        {
          q: "Où se trouve le cabinet à Issy-les-Moulineaux ?",
          r: "Rue du Gouverneur Général Éboué, à quelques minutes de la ligne 12 (Mairie d’Issy, Corentin Celton) et de la gare RER C. Les rendez-vous se font au cabinet, en visio ou par téléphone, comme vous préférez."
        }
      ],
      meta: {
        title: "Courtier PER à Issy-les-Moulineaux : cabinet sur place",
        description: "Plan d’Épargne Retraite à Issy-les-Moulineaux : bilan de vos contrats (PER d’entreprise, Madelin, PERP), transfert et économie d’impôt. Cabinet de courtage sur place, rendez-vous possible."
      }
    },
    av: {
      angle: "Un contrat d’assurance-vie choisi sur pièces, avec un cabinet de courtage à Issy.",
      texte: [
        "À Issy-les-Moulineaux, beaucoup de jeunes actifs et de familles se constituent une épargne pour un projet : apport pour un achat plus grand, études des enfants, réserve de sécurité. L’assurance-vie est l’enveloppe la plus adaptée pour une épargne de moyen et long terme qui reste disponible.",
        "Le cabinet étant à Issy, nous pouvons regarder ensemble, au bureau ou en visio, les contrats que je sélectionne chez plusieurs assureurs : frais sur versement, frais de gestion annuels, fonds en euros et supports disponibles. Je vous explique chaque ligne, sans jargon, pour que vous choisissiez en connaissance de cause."
      ],
      faq: [
        {
          q: "Je prépare l’apport d’un futur achat : l’assurance-vie est-elle adaptée ?",
          r: "Oui si l’achat est à quelques années : l’argent reste disponible à tout moment, et vous pouvez sécuriser la part nécessaire à l’apport sur un fonds en euros. Pour un achat très proche, un livret peut suffire ; je vous le dis franchement."
        },
        {
          q: "Peut-on ouvrir une assurance-vie pour un enfant ?",
          r: "Oui, un mineur peut être titulaire d’un contrat, géré par ses parents jusqu’à sa majorité. C’est aussi une façon de faire courir tôt le délai de 8 ans, qui conditionne la fiscalité la plus favorable."
        },
        {
          q: "Peut-on se voir au cabinet ?",
          r: "Oui, le cabinet est à Issy-les-Moulineaux, rue du Gouverneur Général Éboué. Vous pouvez aussi choisir la visio ou le téléphone."
        }
      ],
      meta: {
        title: "Courtier en assurance-vie à Issy-les-Moulineaux | Cabinet GP Finances",
        description: "Assurance-vie à Issy-les-Moulineaux : comparaison des contrats et des frais, épargne de projet, contrat pour un enfant. Cabinet de courtage à Issy, au bureau ou en visio."
      }
    }
  },
  {
    slug: "levallois-perret",
    per: {
      angle: "Actifs à hauts revenus, souvent en couple : optimiser le PER à l’échelle du foyer.",
      texte: [
        "Levallois-Perret compte beaucoup de couples actifs aux revenus élevés. Pour un foyer imposé en commun, la question n’est pas seulement « faut-il un PER ? », mais « qui verse, et combien ? » : chaque membre du couple dispose de son propre plafond de déduction, et les plafonds peuvent être mutualisés.",
        "En tant que courtier, je regarde votre avis d’imposition, vos plafonds respectifs et votre tranche marginale pour répartir les versements au mieux. Puis je compare les contrats de plusieurs assureurs, en privilégiant des frais lisibles et une gestion adaptée au temps qui vous sépare de la retraite."
      ],
      faq: [
        {
          q: "Avec mon conjoint, peut-on utiliser nos deux plafonds de déduction sur un seul PER ?",
          r: "Les couples mariés ou pacsés peuvent mutualiser leurs plafonds : celui de l’un peut servir à déduire les versements faits par l’autre. Il faut le demander sur la déclaration de revenus ; je vous montre où."
        },
        {
          q: "Nous sommes locataires à Levallois et voulons acheter : faut-il attendre avant d’ouvrir un PER ?",
          r: "Pas nécessairement, puisque l’achat de la résidence principale permet de débloquer l’épargne du PER. Mais si l’achat est proche, mieux vaut garder votre apport sur une épargne disponible. On arbitre ensemble selon votre calendrier."
        },
        {
          q: "Peut-on se rencontrer à Levallois ou près du Front de Seine ?",
          r: "Le cabinet est à Issy-les-Moulineaux. La plupart des échanges se font en visio ; un rendez-vous en personne est possible sur demande."
        }
      ],
      meta: {
        title: "PER à Levallois-Perret : courtier en épargne retraite",
        description: "Courtier PER à Levallois-Perret : versements à l’échelle du couple, mutualisation des plafonds, économie d’impôt et comparaison des assureurs. Étude personnalisée, sans engagement."
      }
    },
    av: {
      angle: "Une épargne qui grandit avec le foyer : diversifier sans se disperser.",
      texte: [
        "À Levallois-Perret, l’épargne de beaucoup de foyers est éclatée : un livret par-ci, un compte-titres par-là, une vieille assurance-vie bancaire. Regrouper l’épargne de long terme dans un ou deux contrats bien choisis permet d’y voir clair et de mieux répartir entre sécurité et performance.",
        "Mon métier de courtier est de comparer les contrats d’assurance-vie du marché pour vous en proposer un qui correspond à votre profil : part de fonds en euros, unités de compte, gestion libre ou pilotée, et surtout des frais que vous comprenez. Un contrat mal choisi coûte cher sur vingt ans ; un bon contrat se garde toute une vie."
      ],
      faq: [
        {
          q: "Gestion libre ou gestion pilotée : que choisir ?",
          r: "En gestion libre, vous choisissez vous-même les supports. En gestion pilotée, un gérant le fait selon le profil de risque choisi. Si vous n’avez ni le temps ni l’envie de suivre les marchés, la gestion pilotée est souvent plus confortable. Je vous explique les deux, frais compris."
        },
        {
          q: "Faut-il ouvrir un contrat chacun ou un contrat commun en couple ?",
          r: "Le plus souvent, un contrat par personne, chacun désignant l’autre comme bénéficiaire : c’est plus simple pour la transmission. Le bon choix dépend de votre régime matrimonial, que je regarde avec vous."
        },
        {
          q: "Le cabinet intervient-il à Levallois-Perret ?",
          r: "Oui, le cabinet est à Issy-les-Moulineaux et accompagne des épargnants de tout l’ouest parisien, en visio, par téléphone ou en rendez-vous."
        }
      ],
      meta: {
        title: "Assurance-vie à Levallois-Perret : comparer avec un courtier",
        description: "Courtier en assurance-vie à Levallois-Perret : regrouper son épargne, gestion libre ou pilotée, contrats de couple, frais lisibles. Étude personnalisée, sans engagement."
      }
    }
  },
  {
    slug: "courbevoie",
    per: {
      angle: "Salariés de La Défense : faire le tri entre PER d’entreprise, épargne salariale et PER individuel.",
      texte: [
        "Courbevoie accueille une partie du quartier d’affaires de La Défense. Beaucoup d’habitants y sont salariés de grands groupes et disposent déjà d’un PER collectif, d’un plan d’épargne entreprise et parfois d’un régime de retraite supplémentaire. Ajouter un PER individuel peut être utile, mais pas toujours.",
        "Avant tout, je fais le point sur ce que vous détenez déjà dans votre entreprise et sur votre plafond de déduction restant, qui tient compte des cotisations versées par votre employeur. Ensuite seulement, je compare les PER individuels de plusieurs assureurs pour vos versements volontaires."
      ],
      faq: [
        {
          q: "Mon employeur à La Défense cotise déjà pour ma retraite : mon plafond PER est-il réduit ?",
          r: "Il peut l’être : certaines cotisations versées par l’employeur viennent en déduction de votre plafond. Le montant disponible figure sur votre avis d’imposition ; je le vérifie avec vous avant tout versement."
        },
        {
          q: "Je change d’entreprise : que devient mon PER collectif ?",
          r: "Vous le conservez, et vous pouvez le transférer vers un PER individuel ou vers le PER de votre nouvel employeur. Le transfert permet de regrouper votre épargne retraite au même endroit."
        },
        {
          q: "Peut-on se voir près du Faubourg de l’Arche ou de Bécon ?",
          r: "Le cabinet est à Issy-les-Moulineaux. Les échanges se font surtout en visio, pratique entre deux réunions ; un rendez-vous en personne reste possible."
        }
      ],
      meta: {
        title: "Courtier PER à Courbevoie : salariés de La Défense",
        description: "Plan d’Épargne Retraite à Courbevoie : PER collectif, épargne salariale, plafond de déduction et transfert lors d’un changement d’employeur. Courtier indépendant, étude sans engagement."
      }
    },
    av: {
      angle: "Primes, intéressement, épargne salariale : donner un cap à l’argent qui arrive par à-coups.",
      texte: [
        "Pour les salariés des entreprises de La Défense qui habitent Courbevoie, l’épargne arrive souvent par à-coups : prime annuelle, intéressement, déblocage d’un plan d’épargne entreprise. Sans cap, ces sommes finissent sur un compte courant. L’assurance-vie permet de les placer à moyen et long terme tout en les gardant disponibles.",
        "Comme courtier, je compare les contrats de plusieurs assureurs et vous aide à définir une répartition cohérente avec vos projets : une part sécurisée sur un fonds en euros, une part plus dynamique en unités de compte si votre horizon le permet. Des versements libres, au rythme de vos primes."
      ],
      faq: [
        {
          q: "Je débloque mon plan d’épargne entreprise : où placer cet argent ?",
          r: "Tout dépend de son usage. Pour un projet proche, la sécurité prime ; pour une épargne de long terme, une assurance-vie bien choisie est souvent l’enveloppe la plus souple. On en parle avant que l’argent n’arrive sur votre compte."
        },
        {
          q: "Puis-je faire des versements irréguliers sur une assurance-vie ?",
          r: "Oui. Vous versez quand vous le souhaitez, par exemple à chaque prime, sans obligation de régularité. Certains contrats ont un versement minimum, que je regarde dans la comparaison."
        },
        {
          q: "Le cabinet est-il loin de Courbevoie ?",
          r: "Le cabinet est à Issy-les-Moulineaux. Les rendez-vous se font en visio, par téléphone ou en personne, selon ce qui vous arrange."
        }
      ],
      meta: {
        title: "Courtier en assurance-vie à Courbevoie | GP Finances",
        description: "Assurance-vie à Courbevoie : placer primes et épargne salariale, versements libres, fonds en euros et unités de compte, comparaison des contrats. Courtier indépendant."
      }
    }
  },
  {
    slug: "rueil-malmaison",
    per: {
      angle: "À dix ou quinze ans de la retraite : le moment où le PER rapporte le plus.",
      texte: [
        "Rueil-Malmaison compte une population familiale et beaucoup d’actifs dans la seconde moitié de leur carrière. C’est souvent entre 45 et 60 ans que le Plan d’Épargne Retraite est le plus intéressant : les revenus sont au plus haut, l’impôt aussi, et l’horizon de placement reste suffisant.",
        "Mon rôle de courtier est de mettre des chiffres sur votre situation : économie d’impôt selon votre tranche, capital estimé à la retraite, choix entre sortie en capital ou en rente. Je compare ensuite les PER de plusieurs assureurs, en privilégiant une gestion qui se sécurise automatiquement à l’approche de la retraite."
      ],
      faq: [
        {
          q: "J’ai 55 ans à Rueil-Malmaison : est-il trop tard pour ouvrir un PER ?",
          r: "Non, c’est même souvent le bon moment si votre tranche d’imposition est élevée. La durée de placement est plus courte, ce qui oriente vers une gestion plus prudente ; je regarde avec vous si l’économie d’impôt justifie le blocage jusqu’à la retraite."
        },
        {
          q: "À la retraite, faut-il sortir en capital ou en rente ?",
          r: "Le PER permet les deux, ou un mélange. Le capital offre de la liberté, la rente un revenu garanti à vie. La fiscalité diffère selon le choix ; on en parle bien avant la date de départ."
        },
        {
          q: "Le cabinet se déplace-t-il à Rueil-Malmaison ?",
          r: "Le cabinet est à Issy-les-Moulineaux. La plupart des échanges se font en visio ou par téléphone ; un rendez-vous en personne reste possible."
        }
      ],
      meta: {
        title: "PER à Rueil-Malmaison : courtier retraite et fiscalité",
        description: "Courtier en Plan d’Épargne Retraite à Rueil-Malmaison : quand ouvrir un PER, économie d’impôt, sortie en capital ou en rente. Étude chiffrée, sans engagement."
      }
    },
    av: {
      angle: "Préparer l’avenir des enfants et sécuriser l’épargne de la famille.",
      texte: [
        "À Rueil-Malmaison, beaucoup de familles se posent les mêmes questions : comment financer les études des enfants, les aider à acheter leur premier logement, et protéger le conjoint en cas de coup dur. L’assurance-vie répond à ces trois besoins à la fois, grâce à sa souplesse et à la clause bénéficiaire.",
        "Je compare les contrats de plusieurs assureurs pour vous proposer celui qui colle à vos objectifs : versements programmés chaque mois, poche sécurisée pour les projets proches, poche plus dynamique pour le long terme. Je vous aide aussi à rédiger une clause bénéficiaire qui protège vraiment votre famille."
      ],
      faq: [
        {
          q: "Comment épargner pour les études de mes enfants ?",
          r: "Des versements programmés sur une assurance-vie, avec une gestion qui se sécurise à l’approche de la date des études, sont une solution simple. Le contrat peut être au nom d’un parent ou de l’enfant lui-même."
        },
        {
          q: "Puis-je aider mes enfants à acheter leur logement grâce à mon assurance-vie ?",
          r: "Oui, en faisant un retrait partiel, possible à tout moment, puis un don. Après 8 ans de contrat, la fiscalité du retrait est allégée. Je vous explique les étapes avant de décider."
        },
        {
          q: "Le cabinet accompagne-t-il les familles de Rueil-Malmaison ?",
          r: "Oui, depuis Issy-les-Moulineaux, en visio, par téléphone ou en rendez-vous en personne."
        }
      ],
      meta: {
        title: "Courtier en assurance-vie à Rueil-Malmaison : épargne familiale",
        description: "Assurance-vie à Rueil-Malmaison : épargne pour les enfants, aide à l’achat d’un logement, clause bénéficiaire, comparaison des contrats. Courtier indépendant, sans engagement."
      }
    }
  },
  {
    slug: "saint-cloud",
    per: {
      angle: "Professions libérales et indépendants : des plafonds de déduction plus larges à exploiter.",
      texte: [
        "Saint-Cloud compte de nombreux foyers aisés, parmi lesquels des professions libérales, des indépendants et des dirigeants. Pour les travailleurs non salariés, le Plan d’Épargne Retraite offre un plafond de déduction spécifique, souvent bien plus élevé que celui d’un salarié, déductible du bénéfice professionnel.",
        "Je vérifie d’abord quel plafond s’applique à votre statut, puis je compare les PER de plusieurs assureurs. Pour un indépendant, la souplesse des versements compte beaucoup : verser davantage les bonnes années, moins les autres, sans pénalité. C’est un critère que je regarde systématiquement."
      ],
      faq: [
        {
          q: "Je suis profession libérale à Saint-Cloud : quel est mon plafond de déduction ?",
          r: "Les indépendants bénéficient d’un plafond propre, calculé sur le bénéfice imposable et plus élevé que celui des salariés. Je le calcule avec vous à partir de votre dernier bénéfice."
        },
        {
          q: "Mes revenus varient d’une année à l’autre : le PER est-il adapté ?",
          r: "Oui, à condition de choisir un contrat sans versements obligatoires. Vous versez plus les bonnes années, quand l’économie d’impôt est la plus forte, et vous pouvez ne rien verser une année difficile."
        },
        {
          q: "Peut-on se rencontrer vers Montretout ou le centre de Saint-Cloud ?",
          r: "Le cabinet est à Issy-les-Moulineaux, à quelques kilomètres. Les échanges se font surtout en visio ; un rendez-vous en personne reste possible."
        }
      ],
      meta: {
        title: "Courtier PER à Saint-Cloud : indépendants et libéraux",
        description: "Plan d’Épargne Retraite à Saint-Cloud : plafond de déduction des indépendants et professions libérales, versements souples, comparaison des assureurs. Courtier indépendant."
      }
    },
    av: {
      angle: "Un patrimoine à faire fructifier et à transmettre, avec un contrat à sa mesure.",
      texte: [
        "À Saint-Cloud, où le niveau de vie est parmi les plus élevés de l’ouest parisien, l’assurance-vie sert souvent deux objectifs en même temps : faire fructifier une épargne importante et préparer sa transmission. Ces deux objectifs demandent un contrat offrant un large choix de supports et des frais maîtrisés sur de gros montants.",
        "Comme courtier, j’ai accès aux contrats de plusieurs assureurs, y compris des contrats haut de gamme rarement proposés en agence bancaire. Je compare les frais, qui pèsent lourd sur un capital élevé, la qualité du fonds en euros et les options de gestion, puis je vous aide à organiser la clause bénéficiaire."
      ],
      faq: [
        {
          q: "Sur un capital important, les frais de gestion font-ils vraiment une différence ?",
          r: "Oui, et plus le capital est élevé, plus l’écart se voit. Quelques dixièmes de point de frais en moins chaque année représentent une somme significative sur vingt ans. C’est l’un des premiers critères de ma comparaison."
        },
        {
          q: "Faut-il répartir son épargne sur plusieurs contrats ?",
          r: "C’est souvent judicieux : plusieurs contrats chez des assureurs différents diversifient le risque et permettent des clauses bénéficiaires distinctes. Je vous propose une organisation adaptée à votre patrimoine."
        },
        {
          q: "Le cabinet intervient-il à Saint-Cloud ?",
          r: "Oui, le cabinet est à Issy-les-Moulineaux ; les rendez-vous se font en visio, par téléphone ou en personne."
        }
      ],
      meta: {
        title: "Assurance-vie à Saint-Cloud : courtier pour patrimoine et transmission",
        description: "Courtier en assurance-vie à Saint-Cloud : contrats haut de gamme, frais sur gros capitaux, plusieurs contrats, clause bénéficiaire. Étude personnalisée, sans engagement."
      }
    }
  },
  {
    slug: "paris-15e",
    per: {
      angle: "Familles et doubles actifs du 15e : épargner pour la retraite sans sacrifier les projets.",
      texte: [
        "Le 15e est le plus peuplé des arrondissements parisiens, avec beaucoup de familles et de couples où les deux travaillent. Entre le logement, les enfants et les projets, l’épargne retraite passe souvent au second plan. Pourtant, quelques versements bien placés sur un Plan d’Épargne Retraite réduisent l’impôt dès cette année.",
        "Mon approche de courtier est pragmatique : on part de votre budget réel, on fixe un effort d’épargne supportable, et on vérifie que l’économie d’impôt justifie le blocage des sommes jusqu’à la retraite. Je compare ensuite les contrats de plusieurs assureurs pour choisir un PER aux frais raisonnables."
      ],
      faq: [
        {
          q: "Avec un budget serré, vaut-il mieux un PER ou une assurance-vie ?",
          r: "Si votre tranche d’imposition est faible, l’assurance-vie, disponible à tout moment, est souvent plus adaptée. Le PER devient intéressant quand l’économie d’impôt est significative. Je fais le calcul avec vous plutôt que de trancher par principe."
        },
        {
          q: "Peut-on faire de petits versements mensuels sur un PER ?",
          r: "Oui, beaucoup de contrats acceptent des versements programmés modestes, que vous pouvez suspendre ou modifier. C’est souvent la façon la plus simple d’épargner sans y penser."
        },
        {
          q: "Peut-on se voir dans le 15e, vers Convention ou Beaugrenelle ?",
          r: "Le cabinet est à Issy-les-Moulineaux, juste de l’autre côté de la Porte de Versailles. La plupart des échanges se font en visio ; un rendez-vous au cabinet est rapide depuis le 15e."
        }
      ],
      meta: {
        title: "Courtier PER Paris 15e : épargne retraite des familles",
        description: "Plan d’Épargne Retraite dans le 15e arrondissement : PER ou assurance-vie, versements mensuels, économie d’impôt. Courtier indépendant à deux pas, à Issy-les-Moulineaux."
      }
    },
    av: {
      angle: "Une épargne disponible pour les projets de la famille, sans renoncer au rendement.",
      texte: [
        "Dans le 15e, beaucoup de familles cherchent à passer d’un appartement à un logement plus grand, ou à préparer les études des enfants. L’assurance-vie convient bien à ces projets à quelques années : l’argent reste disponible, et une partie peut être placée plus dynamiquement selon l’horizon.",
        "Le cabinet est à Issy-les-Moulineaux, à la sortie de la Porte de Versailles. Je compare pour vous les contrats d’assurance-vie de plusieurs assureurs et vous explique clairement les frais, le fonds en euros et les unités de compte, pour que chaque euro épargné travaille au service de vos projets."
      ],
      faq: [
        {
          q: "Nous voulons acheter plus grand dans quelques années : où épargner l’apport ?",
          r: "Une assurance-vie avec une part sécurisée sur fonds en euros est adaptée à un horizon de quelques années, avec des retraits possibles à tout moment. Plus l’échéance approche, plus on sécurise."
        },
        {
          q: "Les unités de compte sont-elles risquées ?",
          r: "Oui, leur valeur peut baisser, il n’y a pas de garantie en capital. C’est pourquoi leur part dépend de votre horizon et de votre tolérance au risque. Je vous propose une répartition que vous comprenez et acceptez."
        },
        {
          q: "Le cabinet est-il facile d’accès depuis le 15e ?",
          r: "Oui, il est à Issy-les-Moulineaux, juste après la Porte de Versailles. Visio et téléphone sont aussi possibles."
        }
      ],
      meta: {
        title: "Assurance-vie Paris 15e : courtier pour vos projets",
        description: "Courtier en assurance-vie dans le 15e arrondissement : épargne pour un achat ou les études, fonds en euros et unités de compte, frais expliqués. Cabinet à Issy, à deux pas."
      }
    }
  },
  {
    slug: "paris-16e",
    per: {
      angle: "Hauts revenus et fin de carrière : un PER pensé jusqu’à la sortie.",
      texte: [
        "Dans le 16e, le niveau de vie médian est parmi les plus élevés de Paris, et la part des habitants proches de la retraite ou déjà retraités est importante. Pour les actifs fortement imposés, le Plan d’Épargne Retraite permet une économie d’impôt immédiate ; reste à bien préparer la sortie, imposée à son tour.",
        "Mon travail de courtier est de raisonner sur toute la durée : l’économie aujourd’hui, la fiscalité au moment de la sortie, le choix entre capital et rente, et la transmission du PER en cas de décès. Je compare les PER de plusieurs assureurs, y compris des contrats aux options de gestion étendues."
      ],
      faq: [
        {
          q: "Que devient mon PER si je décède avant la retraite ?",
          r: "L’épargne est transmise aux bénéficiaires que vous avez désignés. Selon votre âge au décès, la fiscalité se rapproche de celle de l’assurance-vie. Le choix du contrat et de la clause compte, je les vérifie avec vous."
        },
        {
          q: "Ma tranche d’imposition baissera à la retraite : le PER reste-t-il intéressant ?",
          r: "C’est même le cas le plus favorable : vous déduisez vos versements à une tranche élevée et vous êtes imposé à la sortie à une tranche plus basse. Je chiffre l’écart pour vous."
        },
        {
          q: "Peut-on se voir vers Auteuil ou la Muette ?",
          r: "Le cabinet est à Issy-les-Moulineaux, à proximité du 16e. Les échanges se font surtout en visio ou par téléphone ; un rendez-vous en personne reste possible."
        }
      ],
      meta: {
        title: "PER Paris 16e : courtier en épargne retraite",
        description: "Courtier en Plan d’Épargne Retraite dans le 16e arrondissement : économie d’impôt, fiscalité de la sortie, capital ou rente, transmission. Étude chiffrée, sans engagement."
      }
    },
    av: {
      angle: "Transmettre hors succession, en optimisant chaque bénéficiaire.",
      texte: [
        "Le 16e compte une proportion élevée d’habitants de 65 ans et plus. Pour beaucoup, l’assurance-vie est avant tout un outil de transmission : chaque bénéficiaire profite d’un abattement propre sur les sommes reçues, en dehors de la succession, ce qui permet de transmettre davantage à ses enfants et petits-enfants.",
        "En tant que courtier, je vous aide à bâtir une stratégie de transmission : nombre de bénéficiaires, répartition, versements avant ou après 70 ans, et rédaction précise de la clause. Je compare aussi les contrats de plusieurs assureurs pour réduire les frais, qui comptent sur des capitaux importants."
      ],
      faq: [
        {
          q: "Puis-je désigner mes petits-enfants comme bénéficiaires ?",
          r: "Oui, vous désignez librement les bénéficiaires, y compris des petits-enfants ou des personnes hors de la famille. Chacun profite de son propre abattement, d’où l’intérêt de bien répartir."
        },
        {
          q: "Mon contrat a été ouvert il y a très longtemps : faut-il le modifier ?",
          r: "Il faut surtout le relire. Les contrats anciens ont souvent une clause bénéficiaire qui ne correspond plus à la famille d’aujourd’hui, et certains ont une fiscalité particulièrement favorable qu’il ne faut pas perdre. Je l’examine avant toute décision."
        },
        {
          q: "Le cabinet intervient-il dans le 16e ?",
          r: "Oui, le cabinet est à Issy-les-Moulineaux, tout proche ; les rendez-vous se font en personne, en visio ou par téléphone."
        }
      ],
      meta: {
        title: "Courtier assurance-vie Paris 16e : transmission et clause bénéficiaire",
        description: "Assurance-vie dans le 16e arrondissement : transmission hors succession, choix des bénéficiaires, contrats anciens, frais sur gros capitaux. Courtier indépendant, sans engagement."
      }
    }
  },
  {
    slug: "paris-17e",
    per: {
      angle: "Cadres, entrepreneurs et jeunes actifs : un PER adapté à chaque étape de carrière.",
      texte: [
        "Le 17e mêle des profils très différents : cadres du secteur Ternes-Monceau, jeunes actifs installés dans l’écoquartier Clichy-Batignolles, entrepreneurs et indépendants. Pour chacun, le Plan d’Épargne Retraite ne joue pas le même rôle : levier fiscal immédiat pour les uns, épargne de long terme pour les autres.",
        "Comme courtier, j’adapte le conseil à votre étape de carrière. Pour un jeune actif, un PER n’est pas toujours prioritaire ; pour un cadre bien imposé ou un indépendant, il peut l’être. Je compare ensuite les contrats de plusieurs assureurs, en tenant compte des frais et de la gestion proposée."
      ],
      faq: [
        {
          q: "J’ai 30 ans et j’habite les Batignolles : un PER est-il utile à mon âge ?",
          r: "Ça dépend de votre impôt et de vos projets. Si vous comptez acheter bientôt, garder une épargne disponible est souvent prioritaire. Si votre tranche est déjà élevée, commencer tôt un PER avec de petits versements peut se justifier."
        },
        {
          q: "Je crée mon entreprise : puis-je ouvrir un PER en tant qu’indépendant ?",
          r: "Oui, et vous bénéficiez d’un plafond de déduction propre aux travailleurs non salariés. La souplesse des versements est importante quand les revenus démarrent ; je compare les contrats sur ce point."
        },
        {
          q: "Peut-on se voir dans le 17e ?",
          r: "Le cabinet est à Issy-les-Moulineaux. La plupart des échanges se font en visio ou par téléphone ; un rendez-vous en personne est possible sur demande."
        }
      ],
      meta: {
        title: "Courtier en PER Paris 17e : cadres, indépendants, jeunes actifs",
        description: "Plan d’Épargne Retraite dans le 17e arrondissement : PER selon votre étape de carrière, plafond des indépendants, versements souples. Courtier indépendant, étude sans engagement."
      }
    },
    av: {
      angle: "Construire son épargne dès les premières années, puis la faire évoluer.",
      texte: [
        "Dans le 17e, de nombreux jeunes actifs et jeunes couples se constituent une première épargne, notamment autour des Batignolles. Ouvrir tôt une assurance-vie, même avec de petits montants, fait courir le délai de 8 ans qui conditionne la fiscalité la plus avantageuse : un atout pour plus tard.",
        "Je compare les contrats de plusieurs assureurs pour vous proposer un contrat sans frais d’entrée excessifs, avec des versements programmés à partir de montants modestes et un choix de supports qui pourra évoluer avec vous. L’idée : un contrat que vous garderez longtemps, pas un placement à refaire dans cinq ans."
      ],
      faq: [
        {
          q: "Avec quel montant peut-on ouvrir une assurance-vie ?",
          r: "Certains contrats s’ouvrent avec quelques centaines d’euros, puis acceptent des versements mensuels modestes. Le minimum varie selon l’assureur ; c’est un critère de ma comparaison."
        },
        {
          q: "Pourquoi ouvrir une assurance-vie tôt si je n’ai pas beaucoup à placer ?",
          r: "Parce que l’avantage fiscal des retraits dépend de l’ancienneté du contrat, pas du montant. Un contrat ouvert aujourd’hui avec peu d’argent aura 8 ans quand vous en aurez peut-être besoin."
        },
        {
          q: "Le cabinet accompagne-t-il les habitants du 17e ?",
          r: "Oui, depuis Issy-les-Moulineaux, en visio, par téléphone ou en rendez-vous en personne."
        }
      ],
      meta: {
        title: "Assurance-vie Paris 17e : courtier pour bien démarrer son épargne",
        description: "Courtier en assurance-vie dans le 17e arrondissement : ouvrir un contrat tôt, petits versements, frais d’entrée, choix des supports. Étude personnalisée, sans engagement."
      }
    }
  }
];

export const VILLES_EPARGNE: VilleEpargne[] = [...PILOTES, ...LOTS];

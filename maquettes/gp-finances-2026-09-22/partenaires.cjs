'use strict';
/* Page « Partenaires » (/partenaires) et lien dans le bas de toutes les pages.
   Tant que la liste est vide, ni la page ni le lien ne sont publiés.
   Un partenaire :
   {
     nom: 'Agence Exemple',                  // nom affiché
     type: 'Agence immobilière',             // Agence immobilière, Notaire, Expert-comptable, Courtier en crédit, Assureur…
     ville: 'Issy-les-Moulineaux',           // facultatif, utile pour le référencement local
     texte: 'Deux lignes : ce que fait le partenaire et ce que nous faisons ensemble.',
     site: 'https://www.exemple.fr',         // lien vers son site
     logo: 'partenaires/agence-exemple.png', // fichier déposé dans assets/partenaires/ (PNG, JPG, SVG ou WebP)
     fondLogo: 'sombre'                      // facultatif : pour un logo blanc, affiché sur fond bleu nuit
   }
   Ajouter uniquement des partenaires qui ont donné leur accord pour apparaître (nom et logo). */
// Accords confirmés par Gabriel le 30 octobre 2026 (nom, logo et lien).
module.exports = [
  { nom: 'Pères et Fils Immobilier', type: 'Agence immobilière', ville: 'Boulogne-Billancourt et Paris', texte: 'Agence familiale : vente, location, gestion locative et conseil en investissement immobilier, avec un interlocuteur unique du premier rendez-vous à la signature.', site: 'https://www.peresetfilsimmobilier.fr', logo: 'partenaires/peres-et-fils.png' },
  { nom: 'SARANGE', type: 'Fenêtres et menuiseries', ville: 'Seine-et-Marne', texte: 'Fabricant et installateur de fenêtres, portes et volets sur mesure, certifié RGE, dans toute l’Île-de-France. Pour vos travaux de rénovation, en lien avec leur financement.', site: 'https://www.sarange.fr', logo: 'partenaires/sarange.png' },
  { nom: 'Mansion Aquitaine', type: 'Agence immobilière', ville: 'Gironde', texte: 'Agence immobilière à Saint-André-de-Cubzac et Langon, spécialiste de la division foncière et des biens de caractère, de Bordeaux au Sud Gironde.', site: 'https://mansion-aquitaine.fr', logo: 'partenaires/mansion-aquitaine.svg', fondLogo: 'sombre' }
];

/* Section « Pour célébrer vos projets », en bas de la page, séparée des professionnels.
   Mention factuelle (loi Évin) : ni photo de bouteille, ni prix, avec l'avertissement sanitaire. Accord du Détendeur obtenu le 30 octobre 2026. */
module.exports.celebrer = {
  nom: 'Le Détendeur',
  apresAu: 'Détendeur', // « nous faisons confiance au Détendeur » (et non « au Le Détendeur »)
  site: 'https://ledetendeur.fr',
  description: 'restaurant et caviste à Boulogne-Billancourt'
};

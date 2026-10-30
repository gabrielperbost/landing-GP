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
module.exports = [];

/* Section « Pour célébrer vos projets », en bas de la page, séparée des professionnels.
   Mention factuelle (loi Évin) : ni photo de bouteille, ni prix, avec l'avertissement sanitaire. Accord du Détendeur obtenu le 30 octobre 2026. */
module.exports.celebrer = {
  nom: 'Le Détendeur',
  apresAu: 'Détendeur', // « nous faisons confiance au Détendeur » (et non « au Le Détendeur »)
  site: 'https://ledetendeur.fr',
  description: 'restaurant et caviste à Boulogne-Billancourt'
};

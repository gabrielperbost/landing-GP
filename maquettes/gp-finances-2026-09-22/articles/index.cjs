'use strict';
/* Rubrique « Conseils » : 12 articles (2 par type). `published:false` = brouillon, visible seulement dans l'aperçu de la maquette. */
const list = [...require('./pret.cjs'), ...require('./epargne.cjs'), ...require('./protection.cjs')];
const slugs = new Set(list.map(a => a.slug));
for (const a of list) {
  for (const r of a.related || []) if (!slugs.has(r)) throw new Error(`Article « ${a.slug} » : article lié inconnu « ${r} »`);
  for (const k of ['slug', 'service', 'title', 'seoTitle', 'description', 'intro', 'sections', 'faq', 'cta', 'sources']) if (!a[k]) throw new Error(`Article « ${a.slug} » : champ « ${k} » manquant`);
}
// Test uniquement (jamais en production réelle) : GP_PUBLISH_ALL=1 publie tous les brouillons pour vérifier la construction.
if (globalThis.process.env.GP_PUBLISH_ALL === '1') for (const a of list) a.published = true;
module.exports = list;

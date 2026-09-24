const fs = require('node:fs');
const path = require('node:path');

const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function googleUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && /^(www\.)?(google\.(com|fr)|maps\.google\.(com|fr)|maps\.app\.goo\.gl|g\.page)$/.test(url.hostname) ? escape(url.href) : '';
  } catch { return ''; }
}
const dateLabel = value => new Date(value.slice(0,7) + '-01T12:00:00Z').toLocaleDateString('fr-FR', {month:'long',year:'numeric',timeZone:'UTC'});
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}(?:-\d{2})?$/.test(value) && !Number.isNaN(Date.parse(value));
const arrow = '<span aria-hidden="true">↗</span>';
const play = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7V5Z" fill="currentColor"/></svg>';

// Existing client videos. Google ratings are never inferred from these testimonials.
const stories = [
  {name:'Un client témoigne',subject:'Assurance emprunteur',result:'21 200 € économisés',image:'temoignage-assurance.png',video:'Tem1.mp4'},
  {name:'Johanna',subject:'Assurance emprunteur',result:'14 100 € économisés',image:'temoignage-djian.png',video:'Tem4.mp4'},
  {name:'John',subject:'Assurance emprunteur',result:'9 000 € économisés',image:'temoignage-9000.png',video:'Tem5.mp4'},
  {name:'Anaëlle',subject:'Plan Épargne Retraite',result:'Son expérience en vidéo',image:'temoignage-anaelle.png',video:'PER/temoignage-2-anaelle.mp4'},
  {name:'Dorothée',subject:'Plan Épargne Retraite',result:'Son expérience en vidéo',image:'temoignage-dorothee.png',video:'PER/temoignage-1-dorothee.mp4'}
];

module.exports = function createSocialProof(root, figures) {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'avis-google.json'), 'utf8'));
  const profileUrl = googleUrl(config.profileUrl);
  const verified = Boolean(profileUrl && validDate(config.verifiedAt));
  const reviews = verified && Array.isArray(config.reviews) ? config.reviews.filter(review =>
    typeof review.author === 'string' && review.author.trim() && typeof review.text === 'string' && review.text.trim() &&
    Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5 && validDate(review.publishedAt) && googleUrl(review.url)
  ) : [];
  const hasRating = verified && Number.isFinite(config.rating) && config.rating >= 1 && config.rating <= 5 && Number.isInteger(config.reviewCount) && config.reviewCount > 0;
  const ratingText = hasRating ? `${Number(config.rating).toLocaleString('fr-FR')} / 5 · ${config.reviewCount.toLocaleString('fr-FR')} avis Google` : '';
  const ratingBadge = hasRating ? `<a class="google-rating" href="${profileUrl}" target="_blank" rel="noopener"><span class="proof-star" aria-hidden="true">★</span><strong>${ratingText}</strong>${arrow}</a>` : '';
  const localPhoto = value => typeof value === 'string' && /^assets\/google-reviews\/[a-z0-9-]+\.(?:jpg|png|webp)$/.test(value) && fs.existsSync(path.join(root, value)) ? escape(value) : '';

  function heroProof(kind = '') {
    const insurance = kind === 'assurance-emprunteur';
    const selected = verified && Array.isArray(config.featuredReviewers) ? config.featuredReviewers.filter(person => typeof person.name === 'string' && localPhoto(person.photo) && googleUrl(person.profileUrl)) : [];
    const target = kind === '' ? '#avis-clients' : (insurance || kind === 'per' ? '#temoignages' : 'index.html#avis-clients');
    if (hasRating) {
      const score = Number(config.rating).toLocaleString('fr-FR');
      const count = config.reviewCount.toLocaleString('fr-FR');
      return `<div class="hero-social-proof"><a class="client-proof-link rated-card" href="${profileUrl}" target="_blank" rel="noopener" aria-label="${score} sur 5, ${count} avis clients Google. Consulter les avis sur Google"><span class="rated-score" aria-hidden="true">${score}<small>/5</small></span><span class="rated-body"><span class="rated-stars" aria-hidden="true">★★★★★</span><strong>${count} avis clients sur Google</strong><span class="client-proof-caption">Consulter leurs avis ${arrow}</span></span></a></div>`;
    }
    return `<div class="hero-social-proof"><a class="client-proof-link" href="${hasRating ? profileUrl : target}" ${hasRating ? 'target="_blank" rel="noopener"' : ''}>${selected.length?`<span class="client-avatars" aria-hidden="true">${selected.map(person=>`<img src="${localPhoto(person.photo)}" alt="" title="Photo de profil Google : ${escape(person.name)}" width="46" height="46">`).join('')}</span>`:''}<span><strong>${hasRating ? '<span class="proof-star" aria-hidden="true">★</span> '+ratingText : 'Ils nous ont fait confiance.'}</strong><span class="client-proof-caption">${hasRating ? 'Consulter leurs avis sur Google' : 'Découvrez leurs témoignages en vidéo'} ${arrow}</span></span></a></div>`;
  }

  function trustBar() {
    return `<section class="confidence-band" aria-label="GP Finances en quelques repères"><div class="container confidence-grid"><a href="assurance-emprunteur.html#cas-concret"><strong><span data-live-savings>${escape(figures.savings)}</span> €</strong><span>économisés en assurance emprunteur</span></a><a href="assurance-emprunteur.html#comprendre"><strong>${escape(figures.partners)} assureurs</strong><span>partenaires pour comparer les solutions</span></a><a href="https://www.cncef.org/annuaire/perbost-gabriel/" target="_blank" rel="noopener"><strong>Un courtier identifié ${arrow}</strong><span>ORIAS n° 23003789 · Vérifier le cabinet</span></a></div></section>`;
  }

  function reviewCard(review, index) {
    const initials = review.author.trim().split(/\s+/).slice(0,2).map(word=>Array.from(word)[0]).join('').toUpperCase();
    const long = review.text.length > 230;
    return `<li class="proof-card google-review"><div class="review-card-top"><span class="review-stars" role="img" aria-label="${review.rating} étoiles sur 5"><span aria-hidden="true">${'★'.repeat(review.rating)}<span class="empty-stars">${'★'.repeat(5-review.rating)}</span></span></span><span class="review-quote" aria-hidden="true">“</span></div><blockquote><p class="review-text${long?' is-collapsed':''}" id="review-text-${index}">${escape(review.text)}</p></blockquote>${long?`<button type="button" class="review-read-more" aria-expanded="false" aria-controls="review-text-${index}">Lire la suite</button>`:''}${review.excerpt?'<p class="review-excerpt">Extrait de l’avis</p>':''}<div class="review-author"><span class="review-initials" aria-hidden="true">${escape(initials)}</span><div><strong>${escape(review.author)}</strong><span>Avis Google · <time datetime="${escape(review.publishedAt)}">${dateLabel(review.publishedAt)}</time></span></div></div><a class="review-source" href="${googleUrl(review.url)}" target="_blank" rel="noopener" aria-label="Voir l’avis de ${escape(review.author)} sur Google">Lire sur Google ${arrow}</a></li>`;
  }

  function storyCard(story) {
    return `<li class="proof-card proof-story"><button type="button" data-video="https://gp-finances.fr/videos/${story.video}" data-video-title="Témoignage — ${escape(story.name)}" aria-label="Lire le témoignage : ${escape(story.name)}"><span class="proof-story-photo"><img src="assets/${story.image}" alt="" loading="lazy" width="320" height="210"><span class="proof-story-play">${play}<span>Voir son témoignage</span></span></span><span class="proof-story-copy"><span class="small-caps">${story.subject}</span><strong>${story.result}</strong><span>${story.name} ${arrow}</span></span></button></li>`;
  }

  function carousel(kind = '') {
    // Without verified Google content, display genuine video testimonials with their own labels.
    const useGoogle = reviews.length > 0;
    if (kind && !useGoogle) return '';
    const cards = useGoogle ? reviews.map(reviewCard) : stories.map(storyCard);
    return `<section class="section social-proof-section" id="avis-clients" aria-labelledby="reviews-heading" data-review-carousel><div class="container"><div class="proof-section-heading">${ratingBadge || '<p class="eyebrow"><span></span>Ils nous font confiance</p>'}<h2 id="reviews-heading">Leur expérience vaut <br><em>plus que nos promesses.</em></h2><p>${useGoogle?'Des avis publiés sur la fiche Google de GP Finances. <br>Des expériences à lire, et à vérifier par vous-même.':'Des clients qui prennent la parole. <br>Découvrez leur expérience avec GP Finances.'}</p></div><div class="review-toolbar" hidden><button type="button" class="review-auto" data-review-toggle aria-pressed="false">${play}<span>Mettre en pause</span></button><div class="review-navigation"><span class="review-position" aria-live="off"></span><button type="button" class="review-arrow" data-review-prev aria-label="Témoignage précédent">←</button><button type="button" class="review-arrow" data-review-next aria-label="Témoignage suivant">→</button></div></div><div class="review-viewport" tabindex="0" role="region" aria-label="${useGoogle?'Avis Google':'Témoignages vidéo'} — faire défiler"><ul class="review-track">${cards.join('')}</ul></div><div class="reviews-footer">${useGoogle?`<a class="text-link" href="${profileUrl}" target="_blank" rel="noopener">Voir tous les avis sur Google ${arrow}</a><p>Une sélection d’avis et d’extraits. Note et nombre d’avis relevés en ${dateLabel(config.verifiedAt)}.</p>`:'<a class="text-link" href="assurance-emprunteur.html#temoignages">Découvrir les témoignages en assurance emprunteur '+arrow+'</a><p>Économies issues de dossiers clients, sur la durée de leur prêt. Chaque situation est différente.</p>'}</div></div></section>`;
  }
  // Thin scrolling strip ("station board"): verified Google reviews only, looping right to left.
  // Full text when short, otherwise cut at a word boundary with an ellipsis; each item links to Google.
  function ticker() {
    if (!reviews.length || !hasRating) return '';
    const cut = text => {
      const clean = text.replace(/\s+/g, ' ').trim();
      if (clean.length <= 96) return clean;
      const head = clean.slice(0, 96);
      return head.slice(0, head.lastIndexOf(' ') > 40 ? head.lastIndexOf(' ') : 96).replace(/[\s,;:.!?…-]+$/, '') + '…';
    };
    const item = review => `<li><a href="${googleUrl(review.url) || profileUrl}" target="_blank" rel="noopener"><span class="tk-stars" aria-hidden="true">★★★★★</span><span class="tk-text">« ${escape(cut(review.text))} »</span><span class="tk-author">${escape(review.author)}</span><span class="tk-source">Avis Google</span></a></li>`;
    const list = reviews.map(item).join('');
    return `<section class="review-ticker" aria-label="Avis clients Google : ${escape(ratingText)}"><div class="tk-badge"><span class="tk-star" aria-hidden="true">★</span><strong>${escape(Number(config.rating).toLocaleString('fr-FR'))}/5</strong><span>${escape(config.reviewCount.toLocaleString('fr-FR'))} avis</span></div><div class="tk-window"><ul class="tk-track">${list}</ul><ul class="tk-track" aria-hidden="true">${list.replace(/<a /g, '<a tabindex="-1" ')}</ul></div></section>`;
  }
  return {heroProof, trustBar, carousel, ticker, hasGoogleReviews:reviews.length>0};
};

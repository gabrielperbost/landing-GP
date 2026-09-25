'use strict';
/* Articles « PER » et « Assurance-vie ». Règles décrites : état du droit connu au début de 2026, à faire valider avant publication (voir docs/blog-a-valider.md). */
module.exports = [
{
  slug: 'per-impots-combien-economiser',
  service: 'per',
  published: false,
  title: 'PER et impôts : combien pouvez-vous vraiment économiser ?',
  seoTitle: 'PER et impôts : combien pouvez-vous économiser ?',
  description: 'Le Plan Épargne Retraite permet de déduire vos versements de votre revenu imposable. Comment calculer l’économie d’impôt, le plafond et les limites.',
  readMinutes: 6,
  updated: '2026-09-25',
  intro: 'Le Plan Épargne Retraite (PER) est souvent présenté comme un moyen de payer moins d’impôt. C’est vrai, mais l’économie réelle dépend de votre situation. Voici comment la calculer, quel plafond respecter et pourquoi il s’agit d’un report d’impôt plutôt que d’une exonération.',
  sections: [
    { h2: 'Le principe : déduire vos versements de votre revenu imposable', html: `
<p>Les versements volontaires que vous faites sur un PER peuvent être <strong>déduits de votre revenu imposable</strong>, dans la limite d’un plafond. Vous ne payez donc pas d’impôt sur la part de revenu que vous placez sur le PER cette année-là.</p>
<p>L’économie d’impôt est simple à estimer : c’est <strong>le montant versé multiplié par votre tranche marginale d’imposition (TMI)</strong>, à condition que votre plafond de déduction soit suffisant.</p>
<table class="local-table local-table-small"><thead><tr><th>Versement</th><th>TMI</th><th>Économie d’impôt</th><th>Effort réel</th></tr></thead><tbody>
<tr><td>5 000 €</td><td>30 %</td><td>1 500 €</td><td>3 500 €</td></tr>
<tr><td>8 000 €</td><td>41 %</td><td>3 280 €</td><td>4 720 €</td></tr>
<tr><td>12 000 €</td><td>30 %</td><td>3 600 €</td><td>8 400 €</td></tr>
</tbody></table>
<p class="art-note">Exemples pédagogiques, sous réserve d’un plafond de déduction suffisant. L’économie réelle dépend de votre foyer fiscal.</p>` },
    { h2: 'Quelle est votre tranche marginale d’imposition ?', html: `
<p>Le barème de l’impôt sur le revenu est progressif : plus votre revenu imposable est élevé, plus la dernière part de revenu est taxée à un taux élevé (0 %, 11 %, 30 %, 41 % ou 45 % selon le barème en vigueur). Ce taux appliqué à la dernière tranche, c’est votre TMI.</p>
<p>Elle dépend de vos revenus, mais aussi de votre situation familiale (nombre de parts). Les tranches sont mises à jour chaque année : vérifiez celles qui s’appliquent à vous sur votre avis d’imposition ou sur le simulateur des impôts.</p>
<p>Plus votre TMI est élevée, plus l’avantage est important. À 0 % ou à 11 %, l’intérêt fiscal du PER est faible, voire nul.</p>` },
    { h2: 'Le plafond de déduction', html: `
<p>Vous ne pouvez pas tout déduire. Le plafond annuel correspond à <strong>10 % de vos revenus d’activité professionnelle de l’année précédente</strong>, ces revenus n’étant retenus que dans la limite de 8 fois le plafond annuel de la Sécurité sociale (PASS). Il ne peut pas être inférieur à <strong>10 % du PASS</strong>, même avec de faibles revenus.</p>
<ul>
<li>Le plafond que vous n’utilisez pas peut être <strong>reporté pendant 3 ans</strong>.</li>
<li>Dans un couple soumis à une imposition commune, les plafonds peuvent être <strong>mutualisés</strong> si vous le choisissez.</li>
<li>Votre plafond disponible est indiqué sur votre <strong>avis d’imposition</strong>.</li>
</ul>
<p>Les indépendants et les dirigeants ont des règles de calcul spécifiques, à vérifier au cas par cas.</p>` },
    { h2: 'Attention : c’est un report d’impôt, pas une exonération', html: `
<p>Ce que vous déduisez aujourd’hui sera imposé plus tard. À la sortie, les sommes issues de versements déduits sont soumises à l’impôt sur le revenu, et les gains à la fiscalité des revenus du capital. Le pari du PER est donc de <strong>déduire quand votre TMI est élevée</strong> et de récupérer l’épargne quand elle sera plus basse, généralement à la retraite.</p>
<p>Vous pouvez aussi choisir de <strong>ne pas déduire</strong> vos versements : dans ce cas, seuls les gains sont imposés à la sortie. Ce choix se fait à chaque versement.</p>` },
    { h2: 'Pour qui le PER est-il intéressant ?', html: `
<ul>
<li>Vous êtes <strong>fortement imposé</strong> (TMI de 30 % ou plus) et vous disposez d’un plafond de déduction élevé.</li>
<li>Vous <strong>préparez votre retraite</strong> et acceptez de bloquer cette épargne jusqu’au départ (avec des cas de déblocage anticipé).</li>
<li>Vous avez déjà une épargne de précaution : le PER n’est pas une épargne disponible.</li>
</ul>
<div class="art-callout"><strong>En pratique :</strong> avant de verser, faites le calcul avec votre situation réelle (revenus, foyer, plafond disponible). Le simulateur PER de GP Finances vous donne une estimation en trois étapes.</div>` }
  ],
  faq: [
    { q: 'Puis-je déduire tout ce que je verse sur mon PER ?', a: 'Non, seulement dans la limite de votre plafond de déduction, indiqué sur votre avis d’imposition. Le plafond non utilisé peut être reporté pendant 3 ans.' },
    { q: 'Le PER fait-il économiser 30 % de mon versement ?', a: 'Seulement si votre tranche marginale d’imposition est de 30 %. L’économie est égale au versement multiplié par votre TMI, dans la limite du plafond.' },
    { q: 'Mon argent est-il bloqué ?', a: 'Jusqu’à la retraite, en principe, sauf cas de déblocage anticipé prévus par la loi (achat de la résidence principale, accidents de la vie…).' },
    { q: 'Et si je ne suis pas imposable ?', a: 'L’avantage fiscal est nul. Le PER peut malgré tout servir à épargner pour la retraite, mais sans économie d’impôt immédiate.' }
  ],
  cta: { kind: 'simulator', href: '/per-retraite#simuler', label: 'Simuler mon économie d’impôt', text: 'Renseignez votre situation en trois étapes : vous obtenez une estimation de votre économie d’impôt et de l’effort réel d’épargne.' },
  sources: [
    { label: 'Ministère de l’Économie : fonctionnement du PER', url: 'https://www.economie.gouv.fr/particuliers/gerer-mon-argent/gerer-mon-budget-et-mon-epargne/comment-fonctionne-le-plan-depargne-retraite-individuel' },
    { label: 'impots.gouv.fr : épargne retraite', url: 'https://www.impots.gouv.fr/particulier/epargne-retraite' },
    { label: 'Bofip : limites de déduction des cotisations d’épargne retraite', url: 'https://bofip.impots.gouv.fr/bofip/1124-PGP.html/identifiant=BOI-IR-BASE-20-50-20-20260217' }
  ],
  related: ['per-sortie-capital-rente-deblocage', 'clause-beneficiaire-assurance-vie-transmission']
},
{
  slug: 'per-sortie-capital-rente-deblocage',
  service: 'per',
  published: false,
  title: 'PER : comment récupérer son épargne (capital, rente, déblocage anticipé)',
  seoTitle: 'PER : récupérer son épargne (capital, rente, déblocage)',
  description: 'À la retraite, en capital ou en rente ? Et avant, dans quels cas peut-on débloquer son PER ? Les règles, la fiscalité et les questions à se poser.',
  readMinutes: 6,
  updated: '2026-09-25',
  intro: 'On parle beaucoup de l’avantage fiscal du PER à l’entrée, beaucoup moins de la sortie. Pourtant, c’est elle qui détermine ce que vous gagnerez vraiment. Capital, rente, déblocage anticipé : voici les règles à connaître avant de verser.',
  sections: [
    { h2: 'À la retraite : trois façons de sortir', html: `
<ul>
<li><strong>En capital</strong>, en une fois ou de façon fractionnée. Cela vous donne de la souplesse pour un projet ou pour compléter vos revenus.</li>
<li><strong>En rente viagère</strong>, versée à vie. Vous sécurisez un revenu régulier, mais le capital n’est plus disponible.</li>
<li><strong>Un mélange des deux</strong> : une partie en capital et une partie en rente.</li>
</ul>
<p>Selon l’origine des sommes (versements volontaires, épargne salariale, cotisations obligatoires de l’employeur), les possibilités de sortie en capital ne sont pas les mêmes. Vérifiez la composition de votre PER.</p>` },
    { h2: 'La fiscalité à la sortie, en résumé', html: `
<p>Elle dépend de la façon dont vous avez versé :</p>
<ul>
<li>Si vous avez <strong>déduit</strong> vos versements à l’entrée, ils sont imposés à la sortie à l’impôt sur le revenu, et les gains sont soumis à la fiscalité des revenus du capital.</li>
<li>Si vous avez <strong>choisi de ne pas déduire</strong>, seuls les gains sont imposés à la sortie.</li>
<li>Une <strong>rente</strong> est imposée selon des règles proches de celles des pensions.</li>
</ul>
<p>L’équilibre à trouver : avoir déduit quand votre tranche d’imposition était élevée, pour être imposé quand elle sera plus basse. Une sortie fractionnée sur plusieurs années peut aider à limiter l’impôt.</p>` },
    { h2: 'Le déblocage anticipé : les cas prévus par la loi', html: `
<p>Avant la retraite, votre PER est en principe bloqué. La loi prévoit toutefois des cas de déblocage anticipé :</p>
<ul>
<li>l’<strong>achat de votre résidence principale</strong> (pour la part issue des versements volontaires et de l’épargne salariale) ;</li>
<li>le <strong>décès</strong> de votre conjoint ou de votre partenaire de PACS ;</li>
<li>l’<strong>invalidité</strong> de l’épargnant, de ses enfants, de son conjoint ou de son partenaire de PACS ;</li>
<li>l’<strong>expiration de vos droits au chômage</strong> ;</li>
<li>la <strong>cessation d’activité non salariée</strong> à la suite d’une liquidation judiciaire ;</li>
<li>une situation de <strong>surendettement</strong>.</li>
</ul>
<p>Dans ces situations, les conditions de fiscalité varient. Faites-vous conseiller avant de demander le déblocage.</p>` },
    { h2: 'Capital ou rente : comment choisir ?', html: `
<table class="local-table local-table-small"><thead><tr><th></th><th>Capital</th><th>Rente</th></tr></thead><tbody>
<tr><td>Souplesse</td><td>Élevée</td><td>Faible</td></tr>
<tr><td>Revenu garanti à vie</td><td>Non</td><td>Oui</td></tr>
<tr><td>Transmission</td><td>Possible</td><td>Limitée</td></tr>
<tr><td>Risque de tout dépenser</td><td>Oui</td><td>Non</td></tr>
</tbody></table>
<p>Le bon choix dépend de vos autres revenus de retraite, de votre situation familiale et de votre besoin de sécurité. Beaucoup de personnes retiennent une solution mixte.</p>` },
    { h2: 'Les bonnes questions avant de verser', html: `
<ul>
<li>Ai-je déjà une <strong>épargne de précaution</strong> ? Le PER n’est pas disponible.</li>
<li>Quel est mon <strong>horizon</strong> avant la retraite ?</li>
<li>Puis-je <strong>transférer</strong> mon PER plus tard ? Oui : les frais de transfert sont plafonnés à 1 % avant 5 ans de détention et nuls ensuite.</li>
<li>Comment mon PER est-il <strong>transmis</strong> en cas de décès ?</li>
</ul>` }
  ],
  faq: [
    { q: 'Puis-je récupérer mon PER avant la retraite ?', a: 'Uniquement dans les cas prévus par la loi : achat de la résidence principale, décès du conjoint, invalidité, fin des droits au chômage, liquidation judiciaire d’une activité non salariée, surendettement.' },
    { q: 'Vaut-il mieux prendre le capital ou la rente ?', a: 'Cela dépend de vos autres revenus et de votre besoin de sécurité. Le capital est plus souple, la rente assure un revenu à vie. Une solution mixte est fréquente.' },
    { q: 'Que devient mon PER en cas de décès ?', a: 'Les sommes sont transmises aux bénéficiaires désignés, avec une fiscalité propre au contrat et à l’âge du décès. Il faut vérifier la clause bénéficiaire.' },
    { q: 'Peut-on transférer son PER vers un autre contrat ?', a: 'Oui. Les frais de transfert sont plafonnés à 1 % avant 5 ans de détention et sont nuls au-delà.' }
  ],
  cta: { kind: 'call', project: 'PER', label: 'Faire le point sur mon PER', text: 'Un échange pour vérifier ce qui est possible dans votre cas, avant ou après un versement.' },
  sources: [
    { label: 'Ministère de l’Économie : fonctionnement du PER', url: 'https://www.economie.gouv.fr/particuliers/gerer-mon-argent/gerer-mon-budget-et-mon-epargne/comment-fonctionne-le-plan-depargne-retraite-individuel' },
    { label: 'Direction générale du Trésor : le PER, questions-réponses pour les épargnants', url: 'https://www.tresor.economie.gouv.fr/banque-assurance-finance/les-mesures-de-la-loi-pacte-pour-le-financement-de-l-economie/questions-reponses-le-nouveau-per-pour-les-epargnants' }
  ],
  related: ['per-impots-combien-economiser', 'assurance-vie-fonctionnement-fonds-euros-unites-de-compte']
},
{
  slug: 'assurance-vie-fonctionnement-fonds-euros-unites-de-compte',
  service: 'assurance-vie',
  published: false,
  title: 'Assurance-vie : comment ça marche ? Fonds euros, unités de compte et frais',
  seoTitle: 'Assurance-vie : fonds euros, unités de compte et frais',
  description: 'Fonds euros, unités de compte, frais : les bases de l’assurance-vie expliquées simplement, avec les points à comparer avant de choisir un contrat.',
  readMinutes: 7,
  updated: '2026-09-25',
  intro: 'L’assurance-vie est le placement préféré des Français, mais elle est souvent mal comprise. Ce n’est pas un placement en soi : c’est une enveloppe dans laquelle on met des supports très différents. Voici ce qu’il faut savoir pour bien choisir.',
  sections: [
    { h2: 'Une enveloppe, pas un placement', html: `
<p>Un contrat d’assurance-vie fonctionne comme un compartiment : vous y versez de l’argent, que vous répartissez entre un <strong>fonds en euros</strong> et des <strong>unités de compte</strong>. Votre rendement dépend de ce que vous y placez.</p>
<p>Ses principaux atouts : <strong>l’argent reste disponible</strong> (vous pouvez faire des retraits quand vous le souhaitez), une <strong>fiscalité qui devient plus douce avec le temps</strong> et de bons outils de <strong>transmission</strong> à vos proches.</p>` },
    { h2: 'Le fonds en euros : la sécurité', html: `
<p>Le capital investi est <strong>garanti par l’assureur</strong> (en général net des frais de gestion). Chaque année, l’assureur annonce un rendement, qui devient définitivement acquis : c’est l’« effet cliquet ».</p>
<p>Le rendement n’est pas garanti à l’avance, et il varie d’un contrat à l’autre. C’est le support le plus sûr, mais aussi le plus limité en potentiel de gain.</p>` },
    { h2: 'Les unités de compte : le potentiel, et le risque', html: `
<p>Les unités de compte sont des supports investis en actions, obligations, immobilier (SCPI, SCI), fonds diversifiés ou ETF. Leur valeur monte ou descend selon les marchés.</p>
<div class="art-callout"><strong>Important :</strong> sur les unités de compte, l’assureur ne garantit pas le capital. Il existe un <strong>risque de perte en capital</strong>. Elles se pensent sur le long terme.</div>` },
    { h2: 'Comment répartir entre les deux ?', html: `
<p>Il n’y a pas de répartition idéale : elle dépend de votre horizon, de votre besoin de disponibilité et de votre tolérance au risque. À titre d’illustration :</p>
<table class="local-table local-table-small"><thead><tr><th>Profil</th><th>Fonds euros</th><th>Unités de compte</th></tr></thead><tbody>
<tr><td>Prudent, horizon court</td><td>Majorité</td><td>Faible part</td></tr>
<tr><td>Équilibré, horizon moyen</td><td>Environ la moitié</td><td>Environ la moitié</td></tr>
<tr><td>Dynamique, horizon long</td><td>Minoritaire</td><td>Majorité</td></tr>
</tbody></table>
<p class="art-note">Illustration pédagogique, non un conseil personnalisé.</p>` },
    { h2: 'Les frais : ce qui fait la différence sur la durée', html: `
<p>Les frais se cumulent d’année en année. Comparez chaque ligne :</p>
<ul>
<li>les <strong>frais sur versement</strong> ;</li>
<li>les <strong>frais de gestion annuels</strong>, sur le fonds en euros et sur les unités de compte ;</li>
<li>les <strong>frais d’arbitrage</strong> (changer de support) ;</li>
<li>les <strong>frais propres aux supports</strong> (fonds, ETF, SCPI).</li>
</ul>
<p>Pour mesurer l’impact : 100 000 € placés pendant 20 ans qui progressent de 4 % par an net de frais deviennent environ 219 000 €, contre environ 181 000 € avec 1 point de frais en plus (3 % net). Soit <strong>près de 38 500 € de moins</strong>.</p>
<p class="art-note">Hypothèse de calcul, sans garantie de rendement.</p>` },
    { h2: 'Comment choisir un contrat', html: `
<ul>
<li>Comparez les <strong>frais</strong> sur tous les niveaux.</li>
<li>Regardez la <strong>qualité du fonds en euros</strong> sur plusieurs années, pas seulement l’année dernière.</li>
<li>Vérifiez la <strong>gamme de supports</strong> disponibles.</li>
<li>Contrôlez la <strong>solidité de l’assureur</strong> et la qualité du service.</li>
<li>Faites-vous accompagner par un <strong>courtier indépendant</strong> qui peut comparer plusieurs contrats.</li>
</ul>` }
  ],
  faq: [
    { q: 'Mon argent est-il bloqué en assurance-vie ?', a: 'Non. Vous pouvez faire des retraits (rachats) à tout moment, avec une fiscalité qui dépend de la durée du contrat.' },
    { q: 'Le fonds en euros est-il garanti à 100 % ?', a: 'Le capital est garanti par l’assureur, généralement net des frais de gestion. Le rendement, lui, n’est pas garanti à l’avance.' },
    { q: 'Puis-je perdre de l’argent en assurance-vie ?', a: 'Oui, sur les unités de compte, dont le capital n’est pas garanti. Sur le fonds en euros, le capital est garanti par l’assureur.' },
    { q: 'Assurance-vie ou PER ?', a: 'Ils n’ont pas le même objectif : l’assurance-vie reste disponible, le PER est bloqué jusqu’à la retraite mais offre un avantage fiscal à l’entrée. Ils peuvent se compléter.' }
  ],
  cta: { kind: 'simulator', href: '/assurance-vie#simuler-assurance-vie', label: 'Simuler mon épargne', text: 'Testez une projection de capital selon votre versement, votre durée et une hypothèse de rendement, sans engagement.' },
  sources: [
    { label: 'Service-public.fr : fonctionnement du contrat d’assurance-vie', url: 'https://www.service-public.fr/particuliers/vosdroits/F15274' },
    { label: 'AMF : investir en unités de compte', url: 'https://www.amf-france.org' }
  ],
  related: ['clause-beneficiaire-assurance-vie-transmission', 'per-sortie-capital-rente-deblocage']
},
{
  slug: 'clause-beneficiaire-assurance-vie-transmission',
  service: 'assurance-vie',
  published: false,
  title: 'Clause bénéficiaire de l’assurance-vie : bien la rédiger pour protéger vos proches',
  seoTitle: 'Clause bénéficiaire assurance-vie : bien la rédiger',
  description: 'La clause bénéficiaire décide qui reçoit votre capital. Clause standard ou personnalisée, fiscalité au décès, erreurs à éviter : le guide.',
  readMinutes: 6,
  updated: '2026-09-25',
  intro: 'C’est la partie la plus importante d’un contrat d’assurance-vie, et pourtant la plus négligée : la clause bénéficiaire. Elle décide de qui recevra votre capital. Une clause mal rédigée peut priver un proche, ou compliquer inutilement sa situation.',
  sections: [
    { h2: 'Pourquoi cette clause compte autant', html: `
<p>Le capital d’une assurance-vie est versé <strong>aux bénéficiaires que vous avez désignés</strong>, en dehors des règles habituelles de la succession. C’est ce qui en fait un outil de transmission très souple. Mais cela suppose que la clause soit claire, à jour et adaptée à votre famille.</p>` },
    { h2: 'La clause standard : simple, mais pas pour tout le monde', html: `
<p>La clause la plus courante est : « mon conjoint, à défaut mes enfants nés ou à naître, vivants ou représentés, à défaut mes héritiers ». Elle convient à beaucoup de situations classiques.</p>
<p>Elle est en revanche peu adaptée dans plusieurs cas :</p>
<ul>
<li><strong>famille recomposée</strong> ou enfants de plusieurs unions ;</li>
<li><strong>concubin</strong> ou partenaire, à protéger expressément ;</li>
<li>volonté de <strong>répartir différemment</strong> entre les bénéficiaires ;</li>
<li>volonté de protéger le conjoint tout en préservant les enfants (clause avec démembrement).</li>
</ul>` },
    { h2: 'La fiscalité au décès, en résumé', html: `
<p>Elle dépend de l’âge auquel les primes ont été versées :</p>
<ul>
<li><strong>Primes versées avant 70 ans</strong> : chaque bénéficiaire dispose d’un abattement de 152 500 € (tous contrats confondus), puis les sommes sont taxées à 20 % jusqu’à 700 000 € et à 31,25 % au-delà.</li>
<li><strong>Primes versées après 70 ans</strong> : un abattement global de 30 500 € s’applique sur les primes, les gains étant exonérés. Le reste entre dans les droits de succession.</li>
<li>Le <strong>conjoint ou partenaire de PACS</strong> est exonéré.</li>
</ul>
<p class="art-note">Montants et règles en vigueur à la date de rédaction, à faire vérifier avant toute décision.</p>` },
    { h2: 'Les bonnes pratiques', html: `
<ul>
<li><strong>Soyez précis</strong> : nom, prénom, date et lieu de naissance de chaque bénéficiaire.</li>
<li><strong>Prévoyez un second rang</strong> : que se passe-t-il si un bénéficiaire décède avant vous ?</li>
<li><strong>Attention à l’acceptation</strong> : quand un bénéficiaire accepte la clause, vous ne pouvez plus la modifier sans son accord.</li>
<li><strong>Revoyez-la</strong> après chaque événement de vie : mariage, naissance, décès, séparation.</li>
<li><strong>Vérifiez tous vos contrats</strong> : les abattements s’apprécient tous contrats confondus.</li>
</ul>
<div class="art-callout"><strong>Un réflexe simple :</strong> relisez votre clause une fois par an, et à chaque changement dans votre famille.</div>` }
  ],
  faq: [
    { q: 'Puis-je modifier la clause bénéficiaire ?', a: 'Oui, tant qu’aucun bénéficiaire ne l’a acceptée. Après acceptation, sa modification nécessite son accord.' },
    { q: 'Puis-je désigner une personne hors de ma famille ?', a: 'Oui, vous êtes libre de désigner la personne de votre choix, mais la fiscalité applicable au décès peut être moins favorable selon le lien avec le bénéficiaire.' },
    { q: 'L’assurance-vie échappe-t-elle à la succession ?', a: 'En principe, oui : le capital est versé aux bénéficiaires hors succession, sous réserve notamment de primes manifestement exagérées au regard de votre situation.' },
    { q: 'Que se passe-t-il sans clause valable ?', a: 'Le capital peut alors revenir à la succession, avec la fiscalité correspondante. D’où l’importance de la relire régulièrement.' }
  ],
  cta: { kind: 'call', project: 'Assurance-Vie', label: 'Faire relire ma clause', text: 'Un échange pour vérifier que votre clause correspond à votre situation et à vos souhaits.' },
  sources: [
    { label: 'impots.gouv.fr : bénéficiaire d’une assurance-vie, comment la déclarer ?', url: 'https://www.impots.gouv.fr/particulier/questions/je-suis-beneficiaire-dune-assurance-vie-comment-la-declarer' },
    { label: 'Ministère de l’Économie : pourquoi souscrire un contrat d’assurance-vie ?', url: 'https://www.economie.gouv.fr/particuliers/gerer-mon-argent/gerer-mon-budget-et-mon-epargne/pourquoi-souscrire-un-contrat-dassurance-vie' }
  ],
  related: ['assurance-vie-fonctionnement-fonds-euros-unites-de-compte', 'per-impots-combien-economiser']
}
];

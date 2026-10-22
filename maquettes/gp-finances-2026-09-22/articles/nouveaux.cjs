'use strict';
/* Nouveaux articles (octobre 2026), un par produit, sur des recherches que les articles déjà publiés ne traitent pas.
   Les articles existants ne sont pas modifiés : les nouveaux renvoient vers eux, jamais l’inverse.
   Publiés le 22 octobre 2026. */
module.exports = [
{
  slug: 'quotite-assurance-de-pret-couple',
  service: 'assurance-emprunteur',
  published: true,
  title: 'Quotité d’assurance de prêt : 50/50, 100/100 ou selon les revenus, que choisir en couple ?',
  seoTitle: 'Quotité d’assurance de prêt : comment la choisir ?',
  description: 'Quotité d’assurance de prêt en couple : 50/50, 100/100 ou selon les revenus ? Définition, exemples chiffrés, impact sur le coût et le questionnaire de santé.',
  readMinutes: 7,
  updated: '2026-10-22',
  intro: 'Quand on emprunte à deux, la banque demande de choisir la quotité d’assurance de prêt : la part du crédit que l’assurance couvre pour chaque emprunteur. 50/50, 100/100, 70/30 : ce choix décide de ce que devrait rembourser le survivant en cas de coup dur, et il pèse sur le prix de l’assurance. Voici comment le faire en connaissance de cause.',
  sections: [
    { h2: 'Qu’est-ce que la quotité d’assurance de prêt ?', html: `
<p>La quotité est le <strong>pourcentage du prêt couvert par l’assurance pour chaque emprunteur</strong>. Pour un emprunteur seul, elle est de 100 %. Pour un couple, la banque exige en général que le total des deux quotités atteigne <strong>au moins 100 %</strong>, et il peut aller jusqu’à 200 %.</p>
<ul>
<li><strong>50/50</strong> : chacun est assuré pour la moitié du prêt (total 100 %, le minimum).</li>
<li><strong>70/30</strong> ou <strong>60/40</strong> : la répartition suit souvent les revenus (total 100 %).</li>
<li><strong>100/100</strong> : chacun est assuré pour la totalité du prêt (total 200 %, la protection maximale).</li>
<li>Toutes les combinaisons intermédiaires sont possibles, par exemple <strong>100/50</strong>.</li>
</ul>` },
    { h2: 'Exemple : ce qui se passe en cas de décès', html: `
<p>Un couple emprunte 300 000 €. Quelques années plus tard, il reste 250 000 € à rembourser quand l’un des deux décède. <em>Exemple illustratif.</em></p>
<table class="local-table local-table-small"><thead><tr><th>Quotité de la personne décédée</th><th>Pris en charge par l’assureur</th><th>Reste à rembourser par le survivant</th></tr></thead><tbody>
<tr><td>50 %</td><td>125 000 €</td><td>125 000 €</td></tr>
<tr><td>70 %</td><td>175 000 €</td><td>75 000 €</td></tr>
<tr><td>100 %</td><td>250 000 €</td><td><strong>0 €</strong></td></tr>
</tbody></table>
<p>Le même raisonnement s’applique en cas d’invalidité ou d’arrêt de travail : avec une quotité de 50 %, l’assurance ne prend en charge que la moitié de la mensualité.</p>` },
    { h2: 'Combien coûte une quotité plus élevée ?', html: `
<p>Le coût de l’assurance est <strong>proportionnel à la quotité</strong> : assurer une personne à 100 % au lieu de 50 % double, à peu près, sa cotisation.</p>
<table class="local-table local-table-small"><thead><tr><th>Quotités</th><th>Cotisation annuelle</th><th>Coût sur 20 ans</th></tr></thead><tbody>
<tr><td>50/50</td><td>450 €</td><td>9 000 €</td></tr>
<tr><td>70/30</td><td>450 €</td><td>9 000 €</td></tr>
<tr><td>100/100</td><td>900 €</td><td>18 000 €</td></tr>
</tbody></table>
<p class="art-note">Exemple pédagogique : prêt de 300 000 € sur 20 ans, taux d’assurance de 0,15 % par an sur le capital initial pour chacun. Le tarif réel dépend de l’âge, de la santé et de la profession de chaque emprunteur.</p>
<p>Bonne nouvelle : en renégociant l’assurance de prêt auprès d’un assureur externe, une couverture à 100/100 coûte parfois <strong>le même prix, voire moins cher</strong>, que le 50/50 proposé par la banque. Vous doublez la protection de votre foyer sans payer plus. C’est l’un des premiers calculs que je fais pour un couple.</p>` },
    { h2: 'Comment répartir la quotité selon vos revenus', html: `
<p>La bonne question à se poser : <strong>si l’un de nous disparaît ou ne peut plus travailler, l’autre peut-il payer seul ce qui reste ?</strong></p>
<ul>
<li><strong>Revenus proches</strong> : le 50/50 peut suffire si chacun peut assumer la moitié de la mensualité, mais le survivant devra la payer jusqu’au bout.</li>
<li><strong>Revenus inégaux</strong> : une répartition qui suit les revenus (70/30 par exemple) protège mieux le conjoint qui gagne le moins.</li>
<li><strong>Enfants à charge ou un seul revenu</strong> : le 100/100, ou au minimum 100 % sur le revenu principal, évite de laisser une dette à la famille.</li>
</ul>
<div class="art-callout"><strong>Un repère simple :</strong> assurez chaque emprunteur au moins à hauteur de sa part dans les revenus du foyer, et visez 100 % sur chacun dès qu’il y a des enfants.</div>` },
    { h2: 'Quotité et questionnaire de santé : attention au seuil de 200 000 €', html: `
<p>Depuis la loi Lemoine, le questionnaire de santé n’est plus demandé lorsque la part assurée <strong>ne dépasse pas 200 000 € par personne</strong> et que le prêt se termine avant les 60 ans de l’emprunteur.</p>
<p>La part assurée, c’est le capital multiplié par la quotité. Pour un prêt de 400 000 € :</p>
<ul>
<li>en <strong>50/50</strong>, chacun est assuré pour 200 000 € : pas de questionnaire si le prêt se termine avant 60 ans ;</li>
<li>en <strong>100/100</strong>, chacun est assuré pour 400 000 € : le questionnaire de santé est demandé.</li>
</ul>
<p>Ce n’est pas une raison pour sous-assurer votre foyer, mais c’est un paramètre à connaître, notamment si l’un de vous a des antécédents de santé.</p>` },
    { h2: 'Peut-on changer de quotité en cours de prêt ?', html: `
<p>Oui, en changeant d’assurance. Depuis la <a href="conseil-changer-assurance-de-pret-loi-lemoine.html">loi Lemoine</a>, vous pouvez changer d’assurance de prêt à tout moment : c’est l’occasion de revoir la répartition, par exemple pour passer à 100/100 après une naissance, à condition de respecter les garanties exigées par la banque.</p>
<p>Pour comparer les offres, regardez aussi la façon dont la cotisation est calculée : <a href="conseil-capital-initial-ou-capital-restant-du.html">capital initial ou capital restant dû</a>. Le <a href="assurance-emprunteur.html#simuler-assurance">simulateur d’assurance de prêt</a> vous donne une estimation pour un ou deux emprunteurs.</p>
<p>Vous habitez Paris ou les Hauts-de-Seine ? Je reçois au cabinet d’Issy-les-Moulineaux ou en visio : voir <a href="/assurance-emprunteur/paris">l’assurance de prêt à Paris</a> et <a href="/assurance-emprunteur/hauts-de-seine">dans les Hauts-de-Seine</a>.</p>` }
  ],
  faq: [
    { q: 'Quelle quotité d’assurance de prêt choisir en couple ?', a: 'Au minimum, la banque exige un total de 100 % (par exemple 50/50). Pour protéger le survivant, la répartition peut suivre les revenus (70/30) ou aller jusqu’à 100/100, qui solde le prêt en cas de décès de l’un des deux.' },
    { q: 'La quotité 100/100 coûte-t-elle deux fois plus cher ?', a: 'À peu près, car la cotisation est proportionnelle à la quotité. Mais une assurance renégociée à 100/100 coûte parfois le même prix, voire moins cher, que le 50/50 du contrat de la banque.' },
    { q: 'Que se passe-t-il en cas de décès avec une quotité de 50 % ?', a: 'L’assureur rembourse la moitié du capital restant dû. Le co-emprunteur survivant doit continuer à rembourser l’autre moitié.' },
    { q: 'La quotité a-t-elle un effet sur le questionnaire de santé ?', a: 'Oui. Le questionnaire n’est pas demandé si la part assurée ne dépasse pas 200 000 € par personne et que le prêt se termine avant 60 ans. La part assurée est égale au capital multiplié par la quotité.' },
    { q: 'Peut-on modifier la quotité après la signature du prêt ?', a: 'Oui, en changeant d’assurance de prêt, ce qui est possible à tout moment depuis la loi Lemoine, à condition que le nouveau contrat respecte les garanties exigées par la banque.' }
  ],
  cta: { kind: 'simulator', href: '/assurance-emprunteur#simuler-assurance', label: 'Simuler notre assurance de prêt', text: 'Comparez plusieurs solutions pour un ou deux emprunteurs, avec le coût total selon la quotité choisie.' },
  sources: [
    { label: 'La finance pour tous : assurance emprunteur, les garanties décès, incapacité, invalidité', url: 'https://www.lafinancepourtous.com/pratique/assurance/assurance-emprunteur/les-garanties-deces-incapacite-invalidite/' },
    { label: 'Ministère de l’Économie : questionnaire de santé, quand est-il obligatoire ?', url: 'https://www.economie.gouv.fr/particuliers/gerer-mon-argent/emprunter-et-sassurer/assurance-emprunteur-questionnaire-de-sante-quand-est-ce-obligatoire' },
    { label: 'Service-public.fr : comment obtenir un contrat d’assurance emprunteur pour un crédit immobilier ?', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1671' }
  ],
  related: ['changer-assurance-de-pret-loi-lemoine', 'capital-initial-ou-capital-restant-du', 'prevoyance-protection-famille-capital-deces']
},
{
  slug: 'per-ou-assurance-vie-lequel-choisir',
  service: 'per',
  published: true,
  title: 'PER ou assurance-vie : lequel choisir pour préparer sa retraite ?',
  seoTitle: 'PER ou assurance-vie : lequel choisir ?',
  description: 'PER ou assurance-vie ? Fiscalité à l’entrée et à la sortie, disponibilité, transmission : le comparatif complet, avec un exemple, pour savoir lequel choisir.',
  readMinutes: 7,
  updated: '2026-10-22',
  intro: 'PER ou assurance-vie ? C’est l’une des questions que l’on me pose le plus souvent. Les deux permettent d’épargner sur le long terme, avec des supports proches, mais ils ne répondent pas au même besoin. Voici le comparatif, point par point, pour choisir selon votre situation, et souvent combiner les deux.',
  sections: [
    { h2: 'La réponse courte', html: `
<ul>
<li>Le <strong>PER</strong> est fait pour l’argent dont vous n’aurez pas besoin avant la retraite, surtout si votre <strong>tranche marginale d’imposition est de 30 % ou plus</strong> : vos versements réduisent votre impôt dès cette année.</li>
<li>L’<strong>assurance-vie</strong> est faite pour l’épargne qui doit rester <strong>disponible</strong> : projets, complément de revenus, transmission à vos proches.</li>
<li>Pour beaucoup de foyers, la bonne réponse est <strong>les deux</strong>, dans des proportions qui dépendent de vos impôts et de vos projets.</li>
</ul>` },
    { h2: 'PER et assurance-vie : le tableau comparatif', html: `
<table class="local-table local-table-small"><thead><tr><th></th><th>PER</th><th>Assurance-vie</th></tr></thead><tbody>
<tr><td>Objectif</td><td>Préparer la retraite</td><td>Épargner pour tout projet</td></tr>
<tr><td>Disponibilité</td><td>Bloqué jusqu’à la retraite, sauf cas de déblocage anticipé</td><td>Disponible à tout moment</td></tr>
<tr><td>À l’entrée</td><td>Versements déductibles du revenu imposable, dans un plafond</td><td>Pas d’avantage fiscal</td></tr>
<tr><td>À la sortie</td><td>Versements déduits imposés au barème, gains au prélèvement forfaitaire</td><td>Seuls les gains sont imposés, avec un abattement après 8 ans</td></tr>
<tr><td>Transmission</td><td>Possible, avec une clause bénéficiaire</td><td>Très avantageuse : 152 500 € par bénéficiaire pour les primes versées avant 70 ans</td></tr>
<tr><td>Supports</td><td>Fonds en euros, unités de compte, gestion pilotée</td><td>Fonds en euros, unités de compte, gestion pilotée</td></tr>
</tbody></table>
<p class="art-note">Règles en vigueur à la date de mise à jour. Les unités de compte présentent un risque de perte en capital.</p>` },
    { h2: 'Exemple : 5 000 € par an pendant 15 ans', html: `
<p>Prenons une personne de 45 ans, imposée à 30 %, qui peut mettre de côté 5 000 € par an. <em>Exemple illustratif.</em></p>
<ul>
<li><strong>Sur un PER</strong>, chaque versement lui fait économiser 1 500 € d’impôt, soit <strong>22 500 € sur 15 ans</strong>, si son plafond de déduction le permet. En contrepartie, l’argent est bloqué jusqu’à la retraite, et le capital issu des versements sera imposé à la sortie.</li>
<li><strong>Sur une assurance-vie</strong>, elle ne gagne rien sur ses impôts aujourd’hui, mais elle peut retirer son argent à tout moment, et seuls les gains seront imposés.</li>
</ul>
<p>Le PER est d’autant plus gagnant que sa tranche d’imposition à la retraite sera <strong>plus basse</strong> qu’aujourd’hui. Si elle reste identique, l’avantage vient surtout du placement de l’impôt économisé pendant 15 ans. Le détail du calcul est dans notre article <a href="conseil-per-impots-combien-economiser.html">PER et impôts : combien pouvez-vous économiser ?</a></p>` },
    { h2: 'Quand privilégier le PER ?', html: `
<ul>
<li>Votre tranche marginale d’imposition est de <strong>30 %, 41 % ou 45 %</strong>.</li>
<li>Vous avez déjà une <strong>épargne de précaution</strong> disponible.</li>
<li>Vos revenus vont probablement <strong>baisser à la retraite</strong>.</li>
<li>Vous voulez vous <strong>imposer une discipline</strong> : l’argent placé sur le PER ne sera pas dépensé avant l’heure.</li>
<li>Vous avez moins de 70 ans : depuis 2026, les versements faits après 70 ans ne sont plus déductibles (voir <a href="conseil-per-loi-de-finances-2026-changements.html">ce que la loi de finances 2026 a changé</a>).</li>
</ul>` },
    { h2: 'Quand privilégier l’assurance-vie ?', html: `
<ul>
<li>Vous êtes <strong>non imposable ou imposé à 11 %</strong> : l’avantage du PER est faible, voire nul.</li>
<li>Vous voulez garder votre argent <strong>disponible</strong> pour un projet : achat, études des enfants, travaux.</li>
<li>Vous pensez à la <strong>transmission</strong> : l’assurance-vie reste l’outil de référence, à condition de soigner la <a href="conseil-clause-beneficiaire-assurance-vie-transmission.html">clause bénéficiaire</a>.</li>
<li>Vous voulez profiter de la <strong>fiscalité après 8 ans</strong>, qui s’applique à chaque retrait.</li>
</ul>
<p>Pour les bases, voir <a href="conseil-assurance-vie-fonctionnement-fonds-euros-unites-de-compte.html">assurance-vie : comment ça marche ?</a></p>` },
    { h2: 'Et pourquoi pas les deux ?', html: `
<p>Une stratégie fréquente consiste à :</p>
<ol>
<li>garder une <strong>épargne de précaution</strong> sur des livrets ;</li>
<li>alimenter une <strong>assurance-vie</strong> pour les projets à moyen terme et la transmission ;</li>
<li>verser sur un <strong>PER</strong> la part réservée à la retraite, à hauteur de votre plafond de déduction ;</li>
<li>replacer l’<strong>économie d’impôt</strong> du PER sur l’assurance-vie, pour qu’elle travaille elle aussi.</li>
</ol>
<div class="art-callout"><strong>En pratique :</strong> le bon dosage dépend de votre tranche d’imposition, de votre plafond PER (indiqué sur votre avis d’imposition) et de vos projets. Le <a href="per.html#simuler">simulateur PER</a> estime votre économie d’impôt ; le <a href="assurance-vie.html#simuler-assurance-vie">simulateur d’assurance-vie</a> projette votre capital.</div>` }
  ],
  faq: [
    { q: 'Vaut-il mieux un PER ou une assurance-vie ?', a: 'Le PER est plus intéressant si vous êtes imposé à 30 % ou plus et que l’argent est destiné à la retraite. L’assurance-vie convient mieux à une épargne qui doit rester disponible ou être transmise. Les deux se complètent souvent.' },
    { q: 'Peut-on avoir un PER et une assurance-vie en même temps ?', a: 'Oui, sans aucune restriction. Beaucoup d’épargnants combinent les deux : le PER pour réduire l’impôt et préparer la retraite, l’assurance-vie pour les projets et la transmission.' },
    { q: 'Peut-on transférer une assurance-vie vers un PER ?', a: 'Pas directement : il faut faire un retrait sur l’assurance-vie, puis un versement sur le PER. Le retrait peut être imposé sur la part de gains, selon l’ancienneté du contrat.' },
    { q: 'Le PER est-il intéressant si je ne suis pas imposable ?', a: 'Peu : l’économie d’impôt à l’entrée est nulle, et l’argent est bloqué. Une assurance-vie est en général plus adaptée.' },
    { q: 'Que devient un PER au décès ?', a: 'Les sommes sont versées aux bénéficiaires désignés dans la clause, avec une fiscalité proche de celle de l’assurance-vie pour un PER assurantiel, qui dépend notamment de l’âge au décès.' }
  ],
  cta: { kind: 'simulator', href: '/per-retraite#simuler', label: 'Simuler mon économie d’impôt', text: 'Estimez en trois étapes ce qu’un versement sur un PER vous ferait économiser, puis comparons ensemble avec l’assurance-vie.' },
  sources: [
    { label: 'Ministère de l’Économie : fonctionnement du PER', url: 'https://www.economie.gouv.fr/particuliers/gerer-mon-argent/gerer-mon-budget-et-mon-epargne/comment-fonctionne-le-plan-depargne-retraite-individuel' },
    { label: 'Service-public.fr : fonctionnement du contrat d’assurance-vie', url: 'https://www.service-public.fr/particuliers/vosdroits/F15274' },
    { label: 'impots.gouv.fr : épargne retraite', url: 'https://www.impots.gouv.fr/particulier/epargne-retraite' }
  ],
  related: ['per-impots-combien-economiser', 'assurance-vie-fonctionnement-fonds-euros-unites-de-compte', 'per-sortie-capital-rente-deblocage']
},
{
  slug: 'assurance-vie-apres-70-ans',
  service: 'assurance-vie',
  published: true,
  title: 'Assurance-vie après 70 ans : est-ce encore intéressant ?',
  seoTitle: 'Assurance-vie après 70 ans : est-ce intéressant ?',
  description: 'Assurance-vie après 70 ans : abattement de 30 500 €, gains exonérés, comparaison avec la succession classique. Les règles et les stratégies à connaître.',
  readMinutes: 7,
  updated: '2026-10-22',
  intro: 'On entend souvent qu’il ne sert plus à rien de verser sur une assurance-vie après 70 ans. C’est faux. La fiscalité change à cet âge, mais l’assurance-vie garde des atouts réels, en particulier pour transmettre à des proches éloignés ou à des personnes hors de la famille. Voici les règles, un exemple chiffré et les bonnes pratiques.',
  sections: [
    { h2: 'Ce qui change à 70 ans', html: `
<p>Au décès, la fiscalité de l’assurance-vie dépend de l’<strong>âge auquel chaque versement a été fait</strong>, pas de l’âge d’ouverture du contrat :</p>
<ul>
<li><strong>Versements faits avant 70 ans</strong> : chaque bénéficiaire profite d’un abattement de 152 500 €, puis d’un prélèvement de 20 % jusqu’à 700 000 € et de 31,25 % au-delà.</li>
<li><strong>Versements faits après 70 ans</strong> : un abattement global de <strong>30 500 €</strong> s’applique sur les versements, et <strong>tous les gains sont exonérés</strong>. Le reste entre dans la succession.</li>
</ul>
<p>Le conjoint et le partenaire de PACS restent, eux, totalement exonérés dans tous les cas.</p>` },
    { h2: 'Les 30 500 € et les gains exonérés : un exemple', html: `
<p>Une personne verse 100 000 € sur une assurance-vie à 72 ans. À son décès, le contrat vaut 130 000 €. Elle a désigné sa fille comme bénéficiaire. <em>Exemple illustratif.</em></p>
<table class="local-table local-table-small"><thead><tr><th>Élément</th><th>Montant</th><th>Fiscalité</th></tr></thead><tbody>
<tr><td>Versements jusqu’à 30 500 €</td><td>30 500 €</td><td>Exonérés</td></tr>
<tr><td>Versements au-delà</td><td>69 500 €</td><td>Droits de succession, après les abattements habituels</td></tr>
<tr><td>Gains du contrat</td><td>30 000 €</td><td><strong>Exonérés</strong></td></tr>
</tbody></table>
<p>Les 69 500 € taxables s’ajoutent à la succession, mais ils profitent des abattements habituels : <strong>100 000 € par enfant</strong> s’ils n’ont pas été utilisés par ailleurs. Et plus le contrat dure, plus la part de gains exonérés est importante.</p>
<p class="art-note">L’abattement de 30 500 € est global : il s’applique une seule fois, tous contrats et tous bénéficiaires confondus.</p>` },
    { h2: 'Pour qui l’assurance-vie après 70 ans est-elle intéressante ?', html: `
<p>L’avantage est le plus fort lorsque le bénéficiaire serait <strong>lourdement taxé</strong> dans une succession classique :</p>
<ul>
<li>un <strong>neveu ou une nièce</strong>, taxé à 55 % au-delà d’un petit abattement ;</li>
<li>une <strong>personne sans lien de parenté</strong>, taxée à 60 % ;</li>
<li>un <strong>concubin</strong> non pacsé, considéré comme un tiers par l’administration fiscale.</li>
</ul>
<p>Pour ces bénéficiaires, les 30 500 € exonérés et l’exonération totale des gains font une vraie différence. Pour les enfants, l’intérêt existe aussi, surtout sur les gains accumulés avec le temps.</p>` },
    { h2: 'Les autres atouts après 70 ans', html: `
<ul>
<li>L’argent reste <strong>disponible</strong> : vous pouvez faire des retraits à tout moment.</li>
<li>La <strong>fiscalité des retraits</strong> ne change pas : après 8 ans de contrat, les gains bénéficient d’un abattement annuel de 4 600 € pour une personne seule, ou 9 200 € pour un couple.</li>
<li>Vous choisissez librement vos <strong>bénéficiaires</strong> et la répartition entre eux.</li>
<li>Le capital est versé <strong>rapidement</strong> aux bénéficiaires, en dehors du règlement de la succession.</li>
</ul>
<p>Pour revoir les bases, voir notre guide <a href="conseil-assurance-vie-fonctionnement-fonds-euros-unites-de-compte.html">assurance-vie : comment ça marche ?</a></p>` },
    { h2: 'Les bonnes pratiques', html: `
<ul>
<li><strong>Verser avant 70 ans quand c’est possible</strong> : ces versements gardent l’abattement de 152 500 € par bénéficiaire.</li>
<li><strong>Ne pas fermer un ancien contrat</strong> : il reste utile, même si vos nouveaux versements suivent la règle des plus de 70 ans.</li>
<li><strong>Séparer les contrats</strong> : un contrat pour les versements d’avant 70 ans, un autre pour ceux d’après, facilite le suivi.</li>
<li><strong>Soigner la <a href="conseil-clause-beneficiaire-assurance-vie-transmission.html">clause bénéficiaire</a></strong>, et la relire régulièrement.</li>
<li><strong>Rester mesuré</strong> : des versements disproportionnés par rapport à votre patrimoine peuvent être contestés par les héritiers (on parle de « primes manifestement exagérées »).</li>
</ul>
<div class="art-callout"><strong>À retenir :</strong> après 70 ans, l’assurance-vie n’est plus le « couteau suisse » fiscal d’avant, mais elle reste souvent plus avantageuse qu’une succession classique, surtout pour transmettre hors de la ligne directe.</div>` }
  ],
  faq: [
    { q: 'Peut-on encore ouvrir une assurance-vie après 70 ans ?', a: 'Oui, il n’y a pas de limite d’âge. Les versements faits après 70 ans suivent simplement une fiscalité différente au décès : abattement global de 30 500 € sur les versements et gains exonérés.' },
    { q: 'Les gains d’une assurance-vie après 70 ans sont-ils taxés ?', a: 'Au décès, non : tous les gains produits par les versements faits après 70 ans sont exonérés de droits de succession. Seuls les versements au-delà de 30 500 € sont taxés.' },
    { q: 'L’abattement de 30 500 € est-il par bénéficiaire ?', a: 'Non, il est global : il s’applique une seule fois, tous contrats confondus, et se partage entre les bénéficiaires.' },
    { q: 'Faut-il retirer son argent d’une assurance-vie à 70 ans ?', a: 'Non. Les sommes versées avant 70 ans conservent leur fiscalité avantageuse, quel que soit l’âge au décès. Fermer le contrat ferait perdre cet avantage.' },
    { q: 'L’assurance-vie après 70 ans est-elle intéressante pour un neveu ?', a: 'Oui, c’est même l’un des cas où elle est la plus utile : un neveu est taxé à 55 % dans une succession classique, alors que les gains du contrat et les premiers 30 500 € versés sont exonérés.' }
  ],
  cta: { kind: 'call', project: 'Assurance-Vie', label: 'Faire le point sur ma transmission', text: 'Un échange pour voir comment organiser vos contrats et vos versements selon vos bénéficiaires.' },
  sources: [
    { label: 'CNP Assurances : notice explicative de l’article 757 B du Code général des impôts (2026)', url: 'https://www.cnp.fr/le-groupe-cnp-assurances/newsroom/publications/2026/particuliers/faq/notice-explicative-article-757-b-du-code-general-des-impots' },
    { label: 'impots.gouv.fr : bénéficiaire d’une assurance-vie, comment la déclarer ?', url: 'https://www.impots.gouv.fr/particulier/questions/je-suis-beneficiaire-dune-assurance-vie-comment-la-declarer' },
    { label: 'Service-public.fr : fonctionnement du contrat d’assurance-vie', url: 'https://www.service-public.fr/particuliers/vosdroits/F15274' }
  ],
  related: ['clause-beneficiaire-assurance-vie-transmission', 'assurance-vie-fonctionnement-fonds-euros-unites-de-compte', 'assurance-vie-collecte-record-2026']
},
{
  slug: 'prevoyance-ou-mutuelle-difference',
  service: 'prevoyance',
  published: true,
  title: 'Prévoyance et mutuelle : quelle différence, et faut-il les deux ?',
  seoTitle: 'Prévoyance ou mutuelle : quelle différence ?',
  description: 'Mutuelle et prévoyance ne couvrent pas les mêmes risques : frais de santé d’un côté, perte de revenus, invalidité et décès de l’autre. Le comparatif clair.',
  readMinutes: 6,
  updated: '2026-10-22',
  intro: 'Beaucoup de personnes pensent être protégées parce qu’elles ont une mutuelle. Pourtant, la mutuelle ne verse rien si vous ne pouvez plus travailler pendant des mois. C’est le rôle de la prévoyance. Voici la différence entre les deux, en clair, et comment vérifier ce qui vous couvre vraiment.',
  sections: [
    { h2: 'La différence en une phrase', html: `
<p><strong>La mutuelle rembourse vos frais de santé ; la prévoyance protège vos revenus et votre famille.</strong></p>
<ul>
<li>La <strong>mutuelle</strong> (ou complémentaire santé) complète les remboursements de la Sécurité sociale : consultations, médicaments, hospitalisation, optique, dentaire.</li>
<li>La <strong>prévoyance</strong> verse de l’argent quand un accident de la vie vous empêche de travailler ou en cas de décès : indemnités pendant un arrêt, rente d’invalidité, capital décès.</li>
</ul>` },
    { h2: 'Mutuelle et prévoyance : le tableau comparatif', html: `
<table class="local-table local-table-small"><thead><tr><th></th><th>Mutuelle santé</th><th>Prévoyance</th></tr></thead><tbody>
<tr><td>Ce qui est couvert</td><td>Frais de santé</td><td>Perte de revenus, invalidité, décès</td></tr>
<tr><td>Ce qui est versé</td><td>Des remboursements de soins</td><td>Des indemnités, une rente ou un capital</td></tr>
<tr><td>Quand</td><td>À chaque dépense de santé</td><td>En cas d’arrêt de travail, d’invalidité ou de décès</td></tr>
<tr><td>Pour qui</td><td>Vous et vos ayants droit</td><td>Vous, votre conjoint, vos enfants</td></tr>
<tr><td>Salariés du privé</td><td>Contrat d’entreprise obligatoire</td><td>Souvent prévue par l’entreprise, obligatoire pour les cadres</td></tr>
<tr><td>Indépendants</td><td>Contrat individuel à souscrire</td><td>Contrat individuel à souscrire</td></tr>
</tbody></table>` },
    { h2: 'Un exemple : six mois d’arrêt de travail', html: `
<p>Une cadre qui gagne 5 000 € brut par mois se blesse et doit s’arrêter six mois. <em>Exemple illustratif.</em></p>
<ul>
<li>Sa <strong>mutuelle</strong> rembourse les consultations, les séances de kinésithérapie et l’hospitalisation.</li>
<li>Mais pour ses revenus, la Sécurité sociale lui verse au plus <strong>42,97 € brut par jour</strong> en 2026 (voir <a href="conseil-prevoyance-indemnites-journalieres-secu-plafond.html">notre article sur les indemnités journalières</a>). Le maintien de salaire par l’employeur ne dure qu’un temps.</li>
<li>C’est la <strong>prévoyance</strong> qui comble l’écart pour que ses revenus ne s’effondrent pas.</li>
</ul>
<p>Sans prévoyance, ses soins sont bien remboursés… mais son budget, lui, ne l’est pas.</p>` },
    { h2: 'Salarié, indépendant : qui a besoin de quoi ?', html: `
<p><strong>Salariés du privé.</strong> L’employeur doit proposer une mutuelle collective. La prévoyance d’entreprise est obligatoire pour les cadres et souvent prévue pour les autres salariés par la convention collective. Vérifiez les montants : ils sont parfois modestes, notamment en cas d’invalidité.</p>
<p><strong>Indépendants et dirigeants.</strong> Rien n’est prévu par défaut au-delà du régime obligatoire : il faut souscrire soi-même une mutuelle et une prévoyance. Les cotisations peuvent, sous conditions, être déduites du bénéfice imposable. Voir notre guide <a href="conseil-prevoyance-independants-arret-de-travail.html">prévoyance des indépendants</a>.</p>
<p><strong>Retraités.</strong> La mutuelle reste essentielle. La prévoyance se concentre alors sur le décès et, parfois, sur la dépendance.</p>` },
    { h2: 'Comment vérifier ce qui vous couvre vraiment', html: `
<ol>
<li><strong>Rassemblez vos notices</strong> : mutuelle, prévoyance d’entreprise, assurance de prêt.</li>
<li><strong>Pour la mutuelle</strong>, regardez le tableau de garanties poste par poste (voir <a href="conseil-mutuelle-comment-choisir-niveau-de-garanties.html">comment choisir son niveau de garanties</a>).</li>
<li><strong>Pour la prévoyance</strong>, notez trois chiffres : le revenu garanti pendant un arrêt, la rente en cas d’invalidité, le capital décès.</li>
<li><strong>Comparez avec vos besoins</strong> : charges du foyer, crédits, enfants à charge (voir <a href="conseil-prevoyance-protection-famille-capital-deces.html">de quelle protection votre famille a besoin</a>).</li>
</ol>
<div class="art-callout"><strong>Le bon réflexe :</strong> faites relire vos contrats avant d’en souscrire un nouveau. On découvre souvent des doublons d’un côté et des trous de l’autre. Je fais ce point lors d’une étude de <a href="prevoyance.html">prévoyance</a> ou de <a href="mutuelle.html">mutuelle</a>.</div>` }
  ],
  faq: [
    { q: 'Quelle est la différence entre une mutuelle et une prévoyance ?', a: 'La mutuelle rembourse les frais de santé, en complément de la Sécurité sociale. La prévoyance verse des indemnités, une rente ou un capital en cas d’arrêt de travail, d’invalidité ou de décès.' },
    { q: 'La mutuelle couvre-t-elle un arrêt de travail ?', a: 'Elle rembourse les soins liés à l’arrêt, mais elle ne compense pas la perte de revenus. C’est le rôle de la prévoyance.' },
    { q: 'La prévoyance est-elle obligatoire ?', a: 'Pour les salariés cadres du privé, l’employeur doit financer une prévoyance. Pour les autres salariés, elle dépend souvent de la convention collective. Pour les indépendants, elle est facultative mais fortement conseillée.' },
    { q: 'Faut-il une mutuelle et une prévoyance ?', a: 'Oui dans la plupart des cas : les deux contrats couvrent des risques différents et ne font pas doublon. La prévoyance devient indispensable dès qu’il y a des personnes à charge ou un crédit.' },
    { q: 'Un indépendant peut-il déduire sa mutuelle et sa prévoyance ?', a: 'Sous conditions, oui : les cotisations des contrats dits Madelin sont déductibles du bénéfice imposable, dans certaines limites. Les micro-entrepreneurs ne sont pas concernés.' }
  ],
  cta: { kind: 'call', project: 'Prévoyance', label: 'Faire le point sur mes contrats', text: 'Un échange pour vérifier ce que couvrent vraiment votre mutuelle et votre prévoyance, et combler ce qui manque.' },
  sources: [
    { label: 'Service-public.fr : complémentaire santé d’entreprise', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F20739' },
    { label: 'Service-public.fr : arrêt maladie, indemnités journalières versées au salarié', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F3053' },
    { label: 'Assurance maladie : montants maximum des indemnités journalières en 2026', url: 'https://www.ameli.fr/entreprise/vos-salaries/montants-reference/indemnites-journalieres-montants-maximum' }
  ],
  related: ['prevoyance-indemnites-journalieres-secu-plafond', 'mutuelle-comment-choisir-niveau-de-garanties', 'prevoyance-independants-arret-de-travail']
},
{
  slug: 'mutuelle-retraite-loi-evin',
  service: 'mutuelle',
  published: true,
  title: 'Mutuelle à la retraite : garder celle de l’entreprise (loi Évin) ou en changer ?',
  seoTitle: 'Mutuelle à la retraite : loi Évin ou nouveau contrat ?',
  description: 'À la retraite, la loi Évin permet de garder la mutuelle de votre entreprise, sans questionnaire de santé. Délais, tarifs, et quand vaut-il mieux en changer ?',
  readMinutes: 6,
  updated: '2026-10-22',
  intro: 'Le jour du départ à la retraite, la mutuelle d’entreprise s’arrête. Beaucoup de jeunes retraités découvrent alors qu’ils doivent choisir, souvent dans l’urgence, entre garder leur contrat collectif grâce à la loi Évin ou souscrire une nouvelle mutuelle. Voici comment ça marche, combien ça coûte et comment décider.',
  sections: [
    { h2: 'Ce qui se passe le jour de la retraite', html: `
<p>Pendant votre carrière, votre mutuelle d’entreprise était financée au moins pour moitié par votre employeur. À la retraite, ce contrat collectif prend fin. Deux possibilités s’offrent à vous :</p>
<ul>
<li><strong>garder les garanties de votre mutuelle d’entreprise</strong>, à titre individuel, grâce à la loi Évin ;</li>
<li><strong>souscrire une nouvelle mutuelle</strong>, choisie librement.</li>
</ul>
<p>Dans les deux cas, vous payez désormais seul la totalité de la cotisation.</p>` },
    { h2: 'La loi Évin : garder sa mutuelle d’entreprise', html: `
<p>L’article 4 de la loi Évin permet aux retraités de <strong>conserver les garanties santé</strong> du contrat collectif de leur ancienne entreprise :</p>
<ul>
<li><strong>sans questionnaire de santé</strong> ni délai de carence ;</li>
<li>avec les <strong>mêmes garanties de remboursement</strong> que les salariés en activité ;</li>
<li>à condition d’en faire la <strong>demande dans les 6 mois</strong> qui suivent la fin du contrat de travail.</li>
</ul>
<p>L’assureur doit vous adresser une proposition de maintien au plus tard 2 mois après la fin de votre contrat de travail. Seules les garanties de frais de santé sont concernées, pas la prévoyance.</p>` },
    { h2: 'Combien coûte une mutuelle loi Évin ?', html: `
<p>Le tarif est encadré, mais il augmente :</p>
<ul>
<li>vous payez désormais la <strong>part de l’employeur en plus de la vôtre</strong> ;</li>
<li>la cotisation peut être majorée par rapport au tarif des salariés en activité, dans la <strong>limite de 50 %</strong> pendant les trois premières années, avec une hausse progressive ;</li>
<li>à partir de la <strong>4e année</strong>, le tarif devient libre.</li>
</ul>
<p><em>Exemple illustratif :</em> une cotisation de 120 € par mois pour un salarié, dont 60 € payés par l’employeur, coûte au retraité au moins 120 € par mois, et jusqu’à 180 € avec la majoration maximale.</p>
<p class="art-note">Les paliers exacts dépendent de la date de votre contrat : vérifiez la proposition de l’assureur.</p>` },
    { h2: 'Loi Évin ou nouvelle mutuelle : comment choisir ?', html: `
<table class="local-table local-table-small"><thead><tr><th></th><th>Mutuelle loi Évin</th><th>Nouvelle mutuelle individuelle</th></tr></thead><tbody>
<tr><td>Questionnaire de santé</td><td>Aucun</td><td>Rarement demandé, selon les contrats</td></tr>
<tr><td>Garanties</td><td>Celles de l’entreprise, souvent élevées</td><td>Choisies selon vos besoins</td></tr>
<tr><td>Prix</td><td>Majoré, puis libre après 3 ans</td><td>Selon l’âge et le niveau choisi</td></tr>
<tr><td>Conjoint et enfants</td><td>Pas toujours inclus</td><td>À choisir</td></tr>
</tbody></table>
<ul>
<li>La <strong>loi Évin</strong> est souvent intéressante si vous avez des <strong>soins importants en cours</strong> ou si les garanties de votre entreprise sont très bonnes.</li>
<li>Une <strong>nouvelle mutuelle</strong> est souvent moins chère à garanties adaptées, surtout si le contrat d’entreprise comporte des garanties dont vous n’aurez plus besoin (maternité, orthodontie des enfants…).</li>
</ul>
<p>Pour comparer, partez de vos dépenses réelles de santé : la méthode est détaillée dans <a href="conseil-mutuelle-comment-choisir-niveau-de-garanties.html">comment choisir son niveau de garanties</a>.</p>` },
    { h2: 'Les erreurs à éviter', html: `
<ul>
<li><strong>Laisser passer le délai de 6 mois</strong> : au-delà, le droit au maintien loi Évin est perdu.</li>
<li><strong>Garder le contrat par défaut</strong> sans comparer : après la 3e année, le tarif devient libre.</li>
<li><strong>Oublier le conjoint</strong> : il n’est pas toujours couvert par le maintien loi Évin.</li>
<li><strong>Rester sans couverture</strong> entre deux contrats : choisissez la nouvelle mutuelle avant la fin de l’ancienne.</li>
</ul>
<p>Une fois en contrat individuel, vous pourrez aussi en changer plus tard : voir <a href="conseil-mutuelle-changer-resiliation-infra-annuelle.html">changer de mutuelle à tout moment</a>. Et avec la <a href="conseil-mutuelle-hausse-2027-comment-ne-pas-la-subir.html">hausse attendue des mutuelles en 2027</a>, comparer devient d’autant plus utile.</p>
<div class="art-callout"><strong>Le bon moment :</strong> commencez à comparer trois mois avant votre départ à la retraite. Je compare pour vous la proposition loi Évin et les offres de <a href="mutuelle.html">mutuelle santé</a> du marché.</div>` }
  ],
  faq: [
    { q: 'Peut-on garder sa mutuelle d’entreprise à la retraite ?', a: 'Oui, grâce à l’article 4 de la loi Évin, sans questionnaire de santé, à condition d’en faire la demande dans les 6 mois qui suivent la fin du contrat de travail.' },
    { q: 'Combien coûte une mutuelle loi Évin ?', a: 'Vous payez la totalité de la cotisation, part de l’employeur comprise. Elle peut être majorée jusqu’à 50 % par rapport au tarif des salariés pendant les trois premières années, puis devient libre à partir de la 4e année.' },
    { q: 'Quel est le délai pour demander le maintien loi Évin ?', a: '6 mois après la fin du contrat de travail. L’assureur doit vous envoyer sa proposition au plus tard 2 mois après cette date.' },
    { q: 'La mutuelle loi Évin couvre-t-elle mon conjoint ?', a: 'Pas toujours : le maintien porte sur vos garanties, et l’assureur peut ne pas l’étendre à votre conjoint ou à vos enfants. Vérifiez la proposition.' },
    { q: 'Vaut-il mieux garder la mutuelle d’entreprise ou en prendre une nouvelle ?', a: 'Cela dépend de vos soins et du prix. La loi Évin est utile en cas de soins importants ou de très bonnes garanties ; une nouvelle mutuelle est souvent moins chère à garanties adaptées à la retraite.' }
  ],
  cta: { kind: 'call', project: 'Mutuelle', label: 'Comparer avant ma retraite', text: 'Envoyez-moi la proposition loi Évin de votre assureur : je la compare avec les offres du marché, à garanties adaptées à vos besoins.' },
  sources: [
    { label: 'Service-public.fr : peut-on garder la mutuelle de son employeur à la fin du contrat de travail ?', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F20744' },
    { label: 'Service-public.fr : complémentaire santé d’entreprise', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F20739' }
  ],
  related: ['mutuelle-comment-choisir-niveau-de-garanties', 'mutuelle-changer-resiliation-infra-annuelle', 'mutuelle-hausse-2027-comment-ne-pas-la-subir']
},
{
  slug: 'taux-endettement-calcul-regle-35',
  service: 'regroupement-credits',
  published: true,
  title: 'Taux d’endettement : comment le calculer et que faire au-delà de 35 % ?',
  seoTitle: 'Taux d’endettement : calcul et règle des 35 %',
  description: 'Comment calculer votre taux d’endettement, ce que dit la règle des 35 % du HCSF, et les solutions s’il est trop élevé : regroupement, assurance, durée.',
  readMinutes: 6,
  updated: '2026-10-22',
  intro: 'Le taux d’endettement est le premier chiffre que regarde une banque avant d’accorder un crédit. Au-delà de 35 %, la plupart des dossiers sont refusés. Voici comment le calculer vous-même, ce que dit exactement la règle, et les leviers pour le faire baisser.',
  sections: [
    { h2: 'Comment calculer son taux d’endettement ?', html: `
<p>La formule est simple :</p>
<div class="art-callout"><strong>Taux d’endettement = charges de crédit mensuelles ÷ revenus nets mensuels × 100</strong></div>
<p><strong>Les charges</strong> comprennent toutes vos mensualités de crédit (immobilier, auto, consommation, renouvelable), <strong>assurance emprunteur comprise</strong>, ainsi que certaines charges fixes comme une pension alimentaire versée.</p>
<p><strong>Les revenus</strong> sont vos revenus nets avant impôt : salaires, revenus d’indépendant, pensions. Les revenus locatifs sont souvent retenus en partie seulement, par prudence.</p>` },
    { h2: 'Un exemple chiffré', html: `
<p>Un couple gagne 5 200 € net par mois. <em>Exemple illustratif.</em></p>
<table class="local-table local-table-small"><thead><tr><th>Crédit</th><th>Mensualité, assurance comprise</th></tr></thead><tbody>
<tr><td>Crédit immobilier</td><td>1 450 €</td></tr>
<tr><td>Prêt auto</td><td>320 €</td></tr>
<tr><td>Crédit renouvelable</td><td>150 €</td></tr>
<tr><td><strong>Total</strong></td><td><strong>1 920 €</strong></td></tr>
</tbody></table>
<p>Taux d’endettement : 1 920 ÷ 5 200 × 100 = <strong>36,9 %</strong>. Au-dessus de 35 %, un nouveau crédit sera très difficile à obtenir en l’état.</p>` },
    { h2: 'La règle des 35 % : ce que dit le HCSF', html: `
<p>Depuis le 1er janvier 2022, une décision du Haut Conseil de stabilité financière (HCSF) s’impose aux banques pour les crédits immobiliers :</p>
<ul>
<li>le taux d’effort ne doit pas dépasser <strong>35 % des revenus nets</strong>, <strong>assurance emprunteur comprise</strong> ;</li>
<li>la durée du prêt ne doit pas dépasser <strong>25 ans</strong>, ou 27 ans avec un différé lorsque l’entrée dans le logement est décalée (achat dans le neuf, travaux) ;</li>
<li>les banques peuvent déroger à ces règles pour <strong>20 % de leurs nouveaux crédits</strong> chaque trimestre, en priorité pour l’achat d’une résidence principale.</li>
</ul>
<p>La banque reste libre de refuser un prêt même sous 35 % : elle regarde aussi votre <strong>reste à vivre</strong>, c’est-à-dire ce qu’il vous reste chaque mois une fois les crédits payés, la stabilité de vos revenus et votre épargne.</p>` },
    { h2: 'Que faire si votre taux d’endettement est trop élevé ?', html: `
<ol>
<li><strong>Solder les petits crédits</strong> : rembourser un crédit renouvelable ou un prêt auto presque terminé avec votre épargne fait baisser le taux immédiatement.</li>
<li><strong>Réduire le coût de l’assurance de prêt</strong> : l’assurance compte dans les 35 %. Une assurance moins chère baisse la mensualité totale, sans toucher au taux du crédit. Voir <a href="conseil-changer-assurance-de-pret-loi-lemoine.html">changer d’assurance de prêt avec la loi Lemoine</a>.</li>
<li><strong>Regrouper ses crédits</strong> : une seule mensualité, plus faible, sur une durée plus longue. Attention au coût total, détaillé dans <a href="conseil-regroupement-de-credits-quand-est-ce-interessant.html">regroupement de crédits : quand est-ce vraiment intéressant ?</a></li>
<li><strong>Augmenter l’apport ou ajuster le projet</strong> : un montant emprunté plus faible fait baisser la future mensualité.</li>
</ol>
<p>Dans l’exemple ci-dessus, passer d’une assurance de banque à une assurance individuelle moins chère et solder le crédit renouvelable peut suffire à repasser sous les 35 %. Le chiffrage d’un regroupement est détaillé dans <a href="conseil-regroupement-de-credits-calcul-avant-de-signer.html">notre exemple chiffré</a>.</p>` },
    { h2: 'Taux d’endettement : ce qu’il faut retenir', html: `
<ul>
<li>Le calcul : mensualités de crédit, assurance comprise, divisées par les revenus nets.</li>
<li>La limite de 35 % s’applique aux crédits immobiliers, avec une marge de dérogation pour les banques.</li>
<li>Assurance de prêt, petits crédits et regroupement sont les trois leviers les plus efficaces pour le faire baisser.</li>
</ul>
<div class="art-callout"><strong>Besoin d’y voir clair ?</strong> J’étudie vos crédits en cours et je vous dis franchement quel levier est le plus utile dans votre cas : voir notre page <a href="regroupement-credits.html">regroupement de crédits</a> ou estimez votre économie avec le <a href="assurance-emprunteur.html#simuler-assurance">simulateur d’assurance de prêt</a>.</div>` }
  ],
  faq: [
    { q: 'Comment calculer son taux d’endettement ?', a: 'Divisez le total de vos mensualités de crédit, assurance comprise, par vos revenus nets mensuels avant impôt, puis multipliez par 100.' },
    { q: 'Le taux d’endettement maximum est-il toujours de 35 % ?', a: 'Pour un crédit immobilier, oui : c’est la règle fixée par le HCSF, assurance emprunteur comprise. Les banques peuvent toutefois y déroger pour 20 % de leurs nouveaux crédits chaque trimestre.' },
    { q: 'L’assurance de prêt compte-t-elle dans le taux d’endettement ?', a: 'Oui. C’est pourquoi une assurance de prêt moins chère peut aider à repasser sous les 35 %.' },
    { q: 'Le loyer compte-t-il dans le taux d’endettement ?', a: 'Pas dans le calcul HCSF, qui porte sur les charges de crédit. En revanche, la banque tient compte du loyer dans votre reste à vivre si vous restez locataire.' },
    { q: 'Un regroupement de crédits fait-il baisser le taux d’endettement ?', a: 'Oui, en général : la mensualité unique est plus faible que la somme des anciennes. En contrepartie, la durée s’allonge et le coût total peut augmenter.' }
  ],
  cta: { kind: 'call', project: 'Regroupement de crédits', label: 'Faire étudier mon endettement', text: 'J’analyse vos crédits en cours et je chiffre les leviers pour alléger vos mensualités : assurance, regroupement ou remboursement ciblé.' },
  sources: [
    { label: 'HCSF : foire aux questions sur les conditions d’octroi des crédits immobiliers', url: 'https://www.economie.gouv.fr/files/files/directions_services/hcsf/HCSF_FAQ_decisions_octroi_credits_immobiliers.pdf' },
    { label: 'Ministère de l’Économie : crédit immobilier, comment ça marche ?', url: 'https://www.economie.gouv.fr/particuliers/gerer-mon-argent/emprunter-et-sassurer/credit-immobilier-comment-ca-marche' }
  ],
  related: ['regroupement-de-credits-quand-est-ce-interessant', 'changer-assurance-de-pret-loi-lemoine', 'regroupement-de-credits-calcul-avant-de-signer']
}
];

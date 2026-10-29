'use strict';
/* Articles fiscalité (29 octobre 2026) : sujets que les articles déjà publiés ne traitent pas.
   PER : la déclaration des versements et le calendrier de l'économie d'impôt (le calcul et le plafond sont dans per-impots-combien-economiser).
   Assurance-vie : la taxation au décès, avant et après 70 ans, comparée et chiffrée cas par cas (après 70 ans seul : assurance-vie-apres-70-ans).
   Les articles existants ne sont pas modifiés : les nouveaux renvoient vers eux. */
module.exports = [
{
  slug: 'per-declarer-versements-impots-case-6ns',
  service: 'per',
  published: true,
  title: 'Déclarer son PER aux impôts : cases 6NS, 6NT, 6NU et calendrier de l’économie d’impôt',
  seoTitle: 'Déclarer son PER aux impôts : case 6NS et calendrier',
  description: 'Verser sur un PER avant le 31 décembre, le déclarer en case 6NS, 6NT ou 6NU, vérifier son plafond et savoir quand l’économie d’impôt arrive : le mode d’emploi.',
  readMinutes: 7,
  updated: '2026-10-29',
  intro: 'Verser sur un PER ne suffit pas à payer moins d’impôt : encore faut-il que le versement soit fait à temps, qu’il soit déclaré dans la bonne case et que votre plafond le permette. Une case oubliée, et la déduction est perdue. Voici le mode d’emploi complet, du versement de fin d’année jusqu’au remboursement par les impôts.',
  sections: [
    { h2: 'Le calendrier : du versement au remboursement', html: `
<p>Pour un versement fait en 2026, l’économie d’impôt arrive en 2027. Le parcours est toujours le même :</p>
<table class="local-table local-table-small"><thead><tr><th>Quand</th><th>Ce qui se passe</th></tr></thead><tbody>
<tr><td>Avant le 31 décembre 2026</td><td>Vous versez sur votre PER. C’est la date d’encaissement par l’assureur qui compte, pas celle de votre virement.</td></tr>
<tr><td>Printemps 2027</td><td>Vous déclarez le montant versé dans votre déclaration de revenus 2026, en case 6NS, 6NT ou 6NU.</td></tr>
<tr><td>Été 2027</td><td>L’avis d’imposition tient compte de la déduction. L’impôt trop prélevé à la source vous est remboursé, en général à partir de fin juillet.</td></tr>
</tbody></table>
<p>Le PER ne fait pas partie de l’avance de janvier versée par les impôts : cette avance concerne les réductions et crédits d’impôt (emploi à domicile, garde d’enfant, dons…). Le PER, lui, est une <strong>déduction du revenu imposable</strong> : son effet n’apparaît qu’au moment du calcul de l’impôt, l’été suivant.</p>
<div class="art-callout"><strong>Attention au 31 décembre :</strong> les assureurs demandent souvent que les versements arrivent quelques jours avant la fin de l’année pour être comptés sur 2026. Visez la mi-décembre au plus tard, et plus tôt si vous ouvrez un nouveau contrat.</div>` },
    { h2: 'Dans quelle case déclarer vos versements ?', html: `
<p>Les versements volontaires sur un PER individuel se déclarent dans la rubrique « Épargne retraite » de la déclaration de revenus (formulaire 2042) :</p>
<table class="local-table local-table-small"><thead><tr><th>Case</th><th>Pour qui</th></tr></thead><tbody>
<tr><td><strong>6NS</strong></td><td>Déclarant 1</td></tr>
<tr><td><strong>6NT</strong></td><td>Déclarant 2 (conjoint marié ou pacsé)</td></tr>
<tr><td><strong>6NU</strong></td><td>Personnes à charge (total de leurs versements)</td></tr>
</tbody></table>
<ul>
<li>Ces cases <strong>ne sont pas préremplies</strong>. Si vous ne les remplissez pas, vous ne bénéficiez d’aucune déduction, même si votre assureur vous a envoyé une attestation.</li>
<li>Indiquez le montant figurant sur l’<strong>attestation fiscale</strong> que votre assureur vous envoie en début d’année.</li>
<li>Si vous avez choisi de <strong>ne pas déduire</strong> un versement, ne le déclarez pas : il sera alors traité différemment à la sortie, où seuls les gains seront imposés.</li>
<li>Les versements de l’<strong>employeur</strong> (abondement, cotisations obligatoires) ne se déclarent pas dans ces cases : ils figurent déjà sur votre fiche de paie et réduisent votre plafond.</li>
</ul>
<p class="art-note">Les indépendants qui déduisent leurs versements de leur résultat professionnel suivent une autre règle : ils ne les déclarent pas en 6NS. Vérifiez chaque année la notice de la déclaration, les numéros de cases pouvant évoluer.</p>` },
    { h2: 'Votre plafond : où le trouver et comment le lire', html: `
<p>Votre avis d’imposition reçu l’été comporte un cadre intitulé « Plafond épargne retraite ». Il indique, pour chaque membre du foyer, le montant que vous pouvez déduire pour les versements de l’année suivante.</p>
<ul>
<li>Ce plafond additionne celui de l’année et les <strong>plafonds non utilisés</strong> des années précédentes. Depuis la loi de finances 2026, les plafonds générés à partir de 2026 sont reportables pendant 5 ans ; ceux de 2024 et 2025 restent reportables 3 ans.</li>
<li>Les plafonds les plus anciens sont utilisés en premier : c’est ce qui permet d’en perdre le moins possible.</li>
<li>Pour les versements faits en 2026, le plafond de l’année est de 10 % des revenus professionnels de 2025, avec un minimum de 4 710 € et un maximum de 37 680 €.</li>
</ul>
<p>Le détail du calcul du plafond et de l’économie selon votre tranche d’imposition est dans notre article <a href="conseil-per-impots-combien-economiser.html">PER et impôts : combien pouvez-vous économiser ?</a></p>` },
    { h2: 'En couple : mutualiser les plafonds', html: `
<p>Les couples mariés ou pacsés, imposés ensemble, peuvent <strong>additionner leurs plafonds</strong>. C’est utile quand l’un des deux verse beaucoup sur son PER et que l’autre n’utilise pas son plafond.</p>
<p><em>Exemple illustratif :</em> Paul a un plafond de 6 000 € et verse 10 000 € sur son PER. Sa conjointe, Léa, a un plafond de 5 000 € et ne verse rien. Sans mutualisation, Paul ne déduit que 6 000 €. En cochant la case de mutualisation (case 6QR), il peut déduire les 10 000 €, en utilisant 4 000 € du plafond de Léa.</p>
<p>Ce choix se fait chaque année, au moment de la déclaration.</p>` },
    { h2: 'Combien cela rapporte, et quand vous le voyez', html: `
<p>Prenons un couple imposé dans la tranche à 30 %, qui verse 6 000 € sur un PER en décembre 2026, dans la limite de son plafond. <em>Exemple illustratif.</em></p>
<ul>
<li>Versement : <strong>6 000 €</strong> en décembre 2026.</li>
<li>Déclaration au printemps 2027 : 6 000 € en case 6NS.</li>
<li>Économie d’impôt : <strong>6 000 € × 30 % = 1 800 €</strong>, remboursés à partir de l’été 2027 si l’impôt a déjà été prélevé à la source.</li>
<li>Effort réel d’épargne : <strong>4 200 €</strong>.</li>
</ul>
<p>Si votre versement fait passer une partie de vos revenus dans une tranche plus basse, l’économie est un peu plus faible sur la partie concernée. C’est pourquoi il est utile de calculer le montant optimal avant de verser.</p>` },
    { h2: 'Oubli ou erreur : comment rattraper', html: `
<ul>
<li><strong>Vous avez oublié la case 6NS</strong> : vous pouvez corriger votre déclaration en ligne sur impots.gouv.fr, généralement de début août à mi-décembre de l’année de la déclaration. Au-delà, une réclamation reste possible.</li>
<li><strong>Vous avez déclaré un montant faux</strong> : même démarche, avec l’attestation de votre assureur à l’appui.</li>
<li><strong>Vous avez dépassé votre plafond</strong> : seule la partie dans le plafond est déduite, l’excédent n’ouvre pas droit à déduction. Il sera traité comme un versement non déduit à la sortie.</li>
</ul>
<div class="art-callout"><strong>En pratique :</strong> avant votre versement de fin d’année, notez votre plafond disponible sur votre dernier avis d’imposition et gardez l’attestation de l’assureur avec vos papiers fiscaux. Au printemps, la déclaration prend deux minutes.</div>` }
  ],
  faq: [
    { q: 'Dans quelle case déclarer mes versements sur un PER ?', a: 'En case 6NS pour le déclarant 1, 6NT pour le déclarant 2 et 6NU pour les personnes à charge, dans la rubrique « Épargne retraite » de la déclaration de revenus. Ces cases ne sont pas préremplies.' },
    { q: 'Jusqu’à quand verser sur un PER pour réduire l’impôt de cette année ?', a: 'Jusqu’au 31 décembre, mais c’est la date d’encaissement par l’assureur qui compte. Mieux vaut verser au plus tard à la mi-décembre.' },
    { q: 'Quand vais-je recevoir l’économie d’impôt de mon PER ?', a: 'L’année suivant le versement : vous le déclarez au printemps, et l’impôt trop prélevé à la source est remboursé à partir de l’été. Le PER n’entre pas dans l’avance de janvier.' },
    { q: 'J’ai oublié de déclarer mon versement PER, que faire ?', a: 'Corrigez votre déclaration en ligne sur impots.gouv.fr, en général entre début août et mi-décembre. Passé ce délai, une réclamation reste possible.' },
    { q: 'Mon conjoint peut-il me donner son plafond PER ?', a: 'Oui, si vous êtes mariés ou pacsés et imposés ensemble : en cochant la case de mutualisation, vous additionnez vos plafonds pour l’année.' }
  ],
  cta: { kind: 'simulator', href: '/per-retraite#simuler', label: 'Calculer mon versement avant le 31 décembre', text: 'Estimez en trois étapes le montant à verser et l’économie d’impôt correspondante, avant la fin de l’année.' },
  sources: [
    { label: 'impots.gouv.fr : épargne retraite', url: 'https://www.impots.gouv.fr/particulier/epargne-retraite' },
    { label: 'Ministère de l’Économie : fonctionnement du PER', url: 'https://www.economie.gouv.fr/particuliers/gerer-mon-argent/gerer-mon-budget-et-mon-epargne/comment-fonctionne-le-plan-depargne-retraite-individuel' },
    { label: 'Bofip : limites de déduction des cotisations d’épargne retraite', url: 'https://bofip.impots.gouv.fr/bofip/1124-PGP.html/identifiant=BOI-IR-BASE-20-50-20-20260217' }
  ],
  related: ['per-impots-combien-economiser', 'per-loi-de-finances-2026-changements', 'per-ou-assurance-vie-lequel-choisir']
},
{
  slug: 'assurance-vie-succession-fiscalite-avant-apres-70-ans',
  service: 'assurance-vie',
  published: true,
  title: 'Assurance-vie et succession : comment le capital est taxé au décès, avant et après 70 ans',
  seoTitle: 'Assurance-vie et succession : avant ou après 70 ans',
  description: 'Assurance-vie au décès : 152 500 € par bénéficiaire avant 70 ans, 30 500 € et gains exonérés après. Les deux régimes détaillés, avec 4 exemples chiffrés.',
  readMinutes: 9,
  updated: '2026-10-29',
  intro: 'Au décès, une assurance-vie ne suit pas les règles habituelles de la succession. Mais sa fiscalité dépend d’un détail que beaucoup ignorent : l’âge auquel chaque somme a été versée. Avant 70 ans ou après 70 ans, ce ne sont pas les mêmes abattements, pas les mêmes taux, pas la même assiette. Voici les deux régimes expliqués en détail, puis quatre exemples chiffrés pour voir ce que reçoivent réellement vos proches.',
  sections: [
    { h2: 'La règle de base : c’est l’âge du versement qui compte', html: `
<p>Ce n’est ni l’âge d’ouverture du contrat, ni l’âge au décès qui détermine la fiscalité, mais <strong>l’âge que vous aviez au moment de chaque versement</strong>. Un même contrat peut donc contenir deux parts, taxées différemment :</p>
<ul>
<li>la part issue des <strong>versements faits avant vos 70 ans</strong> ;</li>
<li>la part issue des <strong>versements faits après vos 70 ans</strong>.</li>
</ul>
<p>Dans les deux cas, votre <strong>conjoint marié ou partenaire de PACS est totalement exonéré</strong>. Un frère ou une sœur peut l’être aussi, sous trois conditions : être célibataire, veuf, divorcé ou séparé ; avoir plus de 50 ans ou être invalide ; avoir vécu avec vous pendant les cinq ans précédant le décès.</p>` },
    { h2: 'Versements avant 70 ans : 152 500 € par bénéficiaire', html: `
<p>Pour les sommes issues des versements faits avant 70 ans, on regarde <strong>tout ce que reçoit le bénéficiaire</strong> : les versements et les gains qu’ils ont produits.</p>
<ol>
<li>Chaque bénéficiaire profite d’un <strong>abattement de 152 500 €</strong>, valable pour l’ensemble des contrats du défunt.</li>
<li>Au-delà, il paie un <strong>prélèvement de 20 %</strong> sur sa part taxable jusqu’à 700 000 €, c’est-à-dire sur ce qu’il reçoit entre 152 500 € et 852 500 €.</li>
<li>Au-delà, le taux passe à <strong>31,25 %</strong>.</li>
</ol>
<table class="local-table local-table-small"><thead><tr><th>Capital reçu par un bénéficiaire</th><th>Prélèvement</th><th>Net reçu</th></tr></thead><tbody>
<tr><td>150 000 €</td><td>0 €</td><td>150 000 €</td></tr>
<tr><td>250 000 €</td><td>19 500 €</td><td>230 500 €</td></tr>
<tr><td>500 000 €</td><td>69 500 €</td><td>430 500 €</td></tr>
<tr><td>1 000 000 €</td><td>186 094 €</td><td>813 906 €</td></tr>
</tbody></table>
<p>Point essentiel : cet abattement est <strong>par bénéficiaire</strong>. Avec trois enfants désignés, ce sont 457 500 € qui peuvent être transmis sans aucun prélèvement. Et il s’ajoute à l’abattement de la succession classique (100 000 € par enfant), qui reste entier pour le reste du patrimoine.</p>
<p class="art-note">Pour les contrats ouverts avant le 20 novembre 1991, les versements faits avant le 13 octobre 1998 bénéficient d’une exonération totale.</p>` },
    { h2: 'Versements après 70 ans : 30 500 € et des gains exonérés', html: `
<p>Pour les versements faits après 70 ans, la logique est différente :</p>
<ol>
<li>Seuls les <strong>versements</strong> sont pris en compte. <strong>Tous les gains</strong> qu’ils ont produits sont exonérés, quel que soit leur montant.</li>
<li>Un <strong>abattement de 30 500 €</strong> s’applique sur ces versements. Il est <strong>global</strong> : un seul abattement pour tous les contrats et tous les bénéficiaires, partagé entre eux au prorata de ce qu’ils reçoivent.</li>
<li>Le reste est soumis aux <strong>droits de succession classiques</strong>, selon le lien de parenté, après les abattements habituels de la succession s’ils n’ont pas été utilisés par ailleurs.</li>
</ol>
<table class="local-table local-table-small"><thead><tr><th>Bénéficiaire</th><th>Abattement de succession</th><th>Taux appliqué au-delà</th></tr></thead><tbody>
<tr><td>Enfant</td><td>100 000 €</td><td>De 5 % à 45 %, 20 % pour la plupart des cas</td></tr>
<tr><td>Frère ou sœur</td><td>15 932 €</td><td>35 % puis 45 % au-delà de 24 430 €</td></tr>
<tr><td>Neveu ou nièce</td><td>7 967 €</td><td>55 %</td></tr>
<tr><td>Personne sans lien de parenté (dont concubin)</td><td>1 594 €</td><td>60 %</td></tr>
</tbody></table>
<p>Ce régime est donc moins généreux sur le montant exonéré, mais il devient très intéressant quand le contrat a longtemps fructifié, puisque les gains échappent à toute taxation. Notre article <a href="conseil-assurance-vie-apres-70-ans.html">assurance-vie après 70 ans : est-ce encore intéressant ?</a> détaille les stratégies propres à cet âge.</p>` },
    { h2: 'Les deux régimes côte à côte', html: `
<table class="local-table local-table-small"><thead><tr><th></th><th>Versements avant 70 ans</th><th>Versements après 70 ans</th></tr></thead><tbody>
<tr><td>Ce qui est taxé</td><td>Versements et gains</td><td>Versements seulement</td></tr>
<tr><td>Abattement</td><td>152 500 € par bénéficiaire</td><td>30 500 € pour tous les bénéficiaires</td></tr>
<tr><td>Au-delà</td><td>20 %, puis 31,25 %</td><td>Droits de succession selon le lien de parenté</td></tr>
<tr><td>Abattement de la succession classique</td><td>Reste entier</td><td>Peut être consommé</td></tr>
<tr><td>Conjoint, partenaire de PACS</td><td>Exonéré</td><td>Exonéré</td></tr>
</tbody></table>
<p>Un même bénéficiaire peut <strong>cumuler les deux</strong> : l’abattement de 152 500 € sur la part d’avant 70 ans et sa quote-part des 30 500 € sur la part d’après 70 ans.</p>` },
    { h2: 'Exemple 1 : deux enfants, versements avant 70 ans', html: `
<p>Une mère a versé 300 000 € avant ses 70 ans. À son décès, le contrat vaut 500 000 €. Ses deux enfants sont bénéficiaires à parts égales. <em>Exemple illustratif.</em></p>
<ul>
<li>Chaque enfant reçoit 250 000 €.</li>
<li>Après l’abattement de 152 500 €, il reste 97 500 € taxés à 20 %, soit <strong>19 500 € chacun</strong>.</li>
<li>Chacun reçoit donc <strong>230 500 € net</strong>.</li>
</ul>
<p>Si ces 250 000 € avaient été transmis par la succession classique, chaque enfant aurait payé environ <strong>28 200 €</strong> de droits, après son abattement de 100 000 €. Avec l’assurance-vie, il paie 8 700 € de moins, et son abattement de 100 000 € reste disponible pour la maison ou les autres biens.</p>` },
    { h2: 'Exemple 2 : deux enfants, versements après 70 ans', html: `
<p>Un père verse 120 000 € à 73 ans. À son décès, le contrat vaut 160 000 €. Ses deux enfants sont bénéficiaires à parts égales. <em>Exemple illustratif.</em></p>
<ul>
<li>Les 40 000 € de gains sont <strong>exonérés</strong>.</li>
<li>Sur les 120 000 € versés, on retire l’abattement de 30 500 €. Il reste 89 500 €, soit <strong>44 750 € par enfant</strong>, à ajouter à la succession.</li>
<li>Si la succession ne contient pas d’autres biens importants, ces 44 750 € sont couverts par l’abattement de 100 000 € de chaque enfant : <strong>aucun droit à payer</strong>.</li>
<li>Si l’abattement est déjà utilisé par d’autres biens, ces 44 750 € sont taxés, le plus souvent à 20 %, soit environ 8 950 € par enfant.</li>
</ul>
<p>Pour des enfants, l’assurance-vie après 70 ans reste donc utile, surtout grâce à l’exonération des gains, mais l’avantage est bien plus fort avec les versements d’avant 70 ans.</p>` },
    { h2: 'Exemple 3 : un neveu, la différence la plus spectaculaire', html: `
<p>Une personne sans enfant souhaite transmettre à son neveu. Elle place 100 000 €, qui valent 120 000 € à son décès. <em>Exemple illustratif.</em></p>
<table class="local-table local-table-small"><thead><tr><th>Situation</th><th>Taxation</th><th>Le neveu reçoit</th></tr></thead><tbody>
<tr><td>Sans assurance-vie (succession)</td><td>(120 000 − 7 967) × 55 % ≈ 61 600 €</td><td>≈ 58 400 €</td></tr>
<tr><td>Assurance-vie, versement après 70 ans</td><td>(100 000 − 30 500 − 7 967) × 55 % ≈ 33 800 €</td><td>≈ 86 200 €</td></tr>
<tr><td>Assurance-vie, versement avant 70 ans</td><td>120 000 € &lt; 152 500 € : rien</td><td><strong>120 000 €</strong></td></tr>
</tbody></table>
<p>Pour un neveu, une nièce, un concubin ou un ami, l’assurance-vie peut doubler ce qui est réellement transmis. C’est là que le choix du moment du versement pèse le plus.</p>` },
    { h2: 'Exemple 4 : un contrat qui mélange les deux', html: `
<p>Une personne a versé 80 000 € avant 70 ans, devenus 110 000 €, puis 50 000 € après 70 ans, devenus 60 000 €. Sa fille est l’unique bénéficiaire. <em>Exemple illustratif.</em></p>
<ul>
<li><strong>Part d’avant 70 ans</strong> : 110 000 €, sous l’abattement de 152 500 €. Aucun prélèvement.</li>
<li><strong>Part d’après 70 ans</strong> : les 10 000 € de gains sont exonérés. Sur les 50 000 € versés, après l’abattement de 30 500 €, 19 500 € entrent dans la succession, couverts par l’abattement de 100 000 € si la succession est modeste.</li>
<li>Résultat : <strong>170 000 € transmis sans impôt</strong> dans la plupart des cas.</li>
</ul>
<p>L’assureur fait lui-même la répartition entre les deux parts. Garder une trace de vos versements et de leur date reste utile, en particulier si vous avez plusieurs contrats.</p>` },
    { h2: 'Ce qu’il faut faire selon votre âge', html: `
<ul>
<li><strong>Avant 70 ans</strong> : c’est la période la plus favorable. Si vous envisagez de transmettre, alimenter vos contrats avant cet âge permet d’utiliser l’abattement de 152 500 € pour chaque bénéficiaire.</li>
<li><strong>Après 70 ans</strong> : ne fermez pas vos anciens contrats, leurs versements gardent leur fiscalité d’avant 70 ans. Pour les nouveaux versements, un contrat séparé facilite le suivi.</li>
<li><strong>À tout âge</strong> : multipliez les bénéficiaires si cela correspond à vos souhaits, chacun ayant son propre abattement pour la part d’avant 70 ans.</li>
<li><strong>Soignez la <a href="conseil-clause-beneficiaire-assurance-vie-transmission.html">clause bénéficiaire</a></strong> : sans clause valable, le capital revient à la succession et perd ces avantages.</li>
<li><strong>Restez mesuré</strong> : des versements disproportionnés par rapport à votre patrimoine peuvent être contestés par les héritiers (« primes manifestement exagérées »).</li>
</ul>
<div class="art-callout"><strong>À retenir :</strong> avant 70 ans, 152 500 € par bénéficiaire, gains compris. Après 70 ans, 30 500 € pour tous, mais des gains totalement exonérés. Le conjoint ne paie jamais rien.</div>
<p class="art-note">Les prélèvements sociaux restent dus au décès sur les gains qui n’y ont pas encore été soumis (en général ceux des unités de compte). Montants et règles en vigueur à la date de mise à jour.</p>` }
  ],
  faq: [
    { q: 'Quel est l’abattement de l’assurance-vie au décès ?', a: '152 500 € par bénéficiaire pour les sommes issues des versements faits avant 70 ans, gains compris. Pour les versements faits après 70 ans, un abattement global de 30 500 € s’applique, et les gains sont exonérés.' },
    { q: 'L’assurance-vie entre-t-elle dans la succession ?', a: 'Non pour les versements faits avant 70 ans, qui suivent leur propre fiscalité. Pour les versements faits après 70 ans, la part qui dépasse 30 500 € est soumise aux droits de succession, mais les gains restent exonérés.' },
    { q: 'L’abattement de 152 500 € s’ajoute-t-il aux 100 000 € de la succession ?', a: 'Oui. Un enfant peut recevoir 152 500 € d’une assurance-vie alimentée avant 70 ans sans prélèvement, et profiter en plus de son abattement de 100 000 € sur le reste de la succession.' },
    { q: 'Qu’est-ce qui compte : l’âge à l’ouverture du contrat ou l’âge du versement ?', a: 'L’âge au moment de chaque versement. Un contrat ouvert à 60 ans peut contenir des versements faits après 70 ans, qui suivront alors la fiscalité d’après 70 ans.' },
    { q: 'Le conjoint paie-t-il des impôts sur l’assurance-vie ?', a: 'Non, le conjoint marié et le partenaire de PACS sont totalement exonérés, quel que soit le montant et l’âge des versements.' },
    { q: 'Combien paie un neveu sur une assurance-vie ?', a: 'Rien jusqu’à 152 500 € pour les versements faits avant 70 ans. Pour les versements faits après 70 ans, les gains sont exonérés et les versements au-delà de 30 500 € sont taxés à 55 % après un abattement de 7 967 €.' }
  ],
  cta: { kind: 'call', project: 'Assurance-Vie', label: 'Organiser ma transmission', text: 'Un échange pour regarder vos contrats, l’âge de vos versements et vos bénéficiaires, et voir ce qu’ils recevraient réellement.' },
  sources: [
    { label: 'impots.gouv.fr : bénéficiaire d’une assurance-vie, comment la déclarer ?', url: 'https://www.impots.gouv.fr/particulier/questions/je-suis-beneficiaire-dune-assurance-vie-comment-la-declarer' },
    { label: 'Service-public.fr : droits de succession, barèmes et abattements', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F14198' },
    { label: 'Service-public.fr : fonctionnement du contrat d’assurance-vie', url: 'https://www.service-public.fr/particuliers/vosdroits/F15274' }
  ],
  related: ['assurance-vie-apres-70-ans', 'clause-beneficiaire-assurance-vie-transmission', 'per-ou-assurance-vie-lequel-choisir']
}
];

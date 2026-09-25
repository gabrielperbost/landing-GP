'use strict';
/* Articles « Prévoyance », « Mutuelle » et « Regroupement de crédits ». Règles décrites : état du droit connu au début de 2026, à faire valider avant publication (voir docs/blog-a-valider.md). */
module.exports = [
{
  slug: 'prevoyance-independants-arret-de-travail',
  service: 'prevoyance',
  published: true,
  title: 'Prévoyance des indépendants : que se passe-t-il en cas d’arrêt de travail ?',
  seoTitle: 'Prévoyance des indépendants : arrêt de travail et invalidité',
  description: 'Indépendant, dirigeant, profession libérale : que se passe-t-il si vous ne pouvez plus travailler ? Ce que couvre une prévoyance et comment la choisir.',
  readMinutes: 6,
  updated: '2026-09-25',
  intro: 'Quand on travaille à son compte, un arrêt de travail ne met pas seulement le revenu en danger : les charges, elles, continuent. La protection de base des indépendants est en général moins généreuse que celle d’un salarié. Voici ce qu’il faut vérifier, et ce qu’une prévoyance peut apporter.',
  sections: [
    { h2: 'Un régime de base qui indemnise moins qu’on ne le croit', html: `
<p>Selon votre statut (artisan, commerçant, profession libérale, dirigeant), le régime obligatoire prévoit des indemnités journalières en cas d’arrêt maladie, souvent <strong>plus limitées et versées après un délai</strong> que pour un salarié. Les règles varient selon votre régime et votre caisse.</p>
<p>Le point de départ, c’est donc de <strong>vérifier ce que votre régime vous verserait réellement</strong>, dans quel délai et pendant combien de temps, puis de mesurer l’écart avec vos charges.</p>` },
    { h2: 'Ce que couvre une prévoyance', html: `
<ul>
<li><strong>L’arrêt de travail (incapacité)</strong> : des indemnités journalières qui complètent celles du régime obligatoire, après une franchise.</li>
<li><strong>L’invalidité</strong> : une rente ou un capital si vous ne pouvez plus exercer, totalement ou partiellement.</li>
<li><strong>Le décès</strong> : un capital ou une rente pour votre conjoint et vos enfants.</li>
<li><strong>Les frais généraux professionnels</strong> : une prise en charge de charges fixes (loyer du local, prêt professionnel) pendant que vous ne travaillez pas.</li>
</ul>` },
    { h2: 'Comment dimensionner sa protection', html: `
<p>Trois questions pour commencer :</p>
<ol>
<li><strong>De quel revenu mensuel ai-je besoin ?</strong> Charges personnelles, crédits, famille.</li>
<li><strong>Quelles charges professionnelles continuent</strong> même si je ne travaille pas ?</li>
<li><strong>Combien de temps puis-je tenir sans revenu</strong> ? Cela détermine la franchise (le délai avant que la prévoyance commence à payer).</li>
</ol>
<p>À titre d’illustration : pour maintenir 3 000 € par mois, il faut comparer ce montant à ce que votre régime verserait. Si celui-ci ne couvre qu’une partie, la prévoyance vient compléter l’écart.</p>
<p class="art-note">Exemple pédagogique : les montants réels dépendent de votre régime, de vos revenus déclarés et du contrat.</p>` },
    { h2: 'Les points à lire de près dans un contrat', html: `
<ul>
<li><strong>La franchise</strong> : 3, 15, 30, 90 jours… plus elle est courte, plus la cotisation est élevée.</li>
<li><strong>La définition de l’invalidité</strong> : elle peut se juger par rapport à votre métier ou à toute activité. La différence est majeure.</li>
<li><strong>La base d’indemnisation</strong> : sur quels revenus l’indemnité est-elle calculée ?</li>
<li><strong>La durée maximale</strong> de versement et les <strong>exclusions</strong> (dos, psychisme, sports…).</li>
<li>Le caractère <strong>indemnitaire</strong> (vous êtes indemnisé de la perte réelle) ou <strong>forfaitaire</strong> (un montant fixé au contrat).</li>
</ul>
<div class="art-callout"><strong>À vérifier :</strong> pour les indépendants, les cotisations de prévoyance sont souvent déductibles du bénéfice imposable, dans certaines limites. Demandez-le lors de l’étude.</div>` }
  ],
  faq: [
    { q: 'Une prévoyance est-elle obligatoire pour un indépendant ?', a: 'Pas en général. Le régime de base est obligatoire, mais la prévoyance complémentaire est un choix. Certaines professions ont toutefois des régimes spécifiques.' },
    { q: 'Que veut dire « franchise » ?', a: 'C’est le nombre de jours d’arrêt de travail avant que le contrat ne commence à verser des indemnités. Une franchise longue réduit la cotisation.' },
    { q: 'Peut-on souscrire avec un problème de santé ?', a: 'C’est souvent possible, mais avec un questionnaire de santé qui peut entraîner des exclusions ou une surprime. Mieux vaut le faire avant un problème.' },
    { q: 'La prévoyance couvre-t-elle aussi mon prêt professionnel ?', a: 'Elle peut prendre en charge des frais généraux ou compléter votre revenu. L’assurance de prêt reste le contrat qui rembourse le crédit en cas de décès ou d’invalidité.' }
  ],
  cta: { kind: 'call', project: 'Prévoyance', label: 'Faire étudier ma prévoyance', text: 'Une étude personnalisée de votre situation : régime obligatoire, besoin réel, franchise adaptée.' },
  sources: [
    { label: 'Service-public.fr : protection sociale des indépendants', url: 'https://www.service-public.fr' },
    { label: 'Sécurité sociale des indépendants', url: 'https://www.secu-independants.fr' }
  ],
  related: ['prevoyance-protection-famille-capital-deces', 'changer-assurance-de-pret-loi-lemoine']
},
{
  slug: 'prevoyance-protection-famille-capital-deces',
  service: 'prevoyance',
  published: true,
  title: 'Prévoyance : de quelle protection votre famille a-t-elle vraiment besoin ?',
  seoTitle: 'Prévoyance : quelle protection pour votre famille ?',
  description: 'Capital décès, rente éducation, invalidité : comment évaluer la protection dont votre famille a besoin, avec une méthode simple et un exemple chiffré.',
  readMinutes: 6,
  updated: '2026-09-25',
  intro: 'On assure sa voiture et son logement sans se poser de question, mais on réfléchit rarement à ce qui se passerait pour ses proches en cas de décès ou d’invalidité. La bonne question n’est pas « quel contrat ? » mais « de quel montant ma famille aurait-elle besoin ? ».',
  sections: [
    { h2: 'Une méthode en quatre étapes', html: `
<ol>
<li><strong>Listez les dépenses du foyer</strong> : logement, alimentation, scolarité, loisirs, crédits.</li>
<li><strong>Identifiez ce qui est déjà couvert</strong> : assurance de prêt (qui rembourse le crédit), garanties de l’employeur, régimes obligatoires.</li>
<li><strong>Définissez la durée du besoin</strong> : jusqu’à l’autonomie des enfants, jusqu’à la retraite du conjoint…</li>
<li><strong>Calculez l’écart</strong> entre les revenus qui resteraient et les dépenses à couvrir.</li>
</ol>` },
    { h2: 'Un exemple chiffré', html: `
<table class="local-table local-table-small"><thead><tr><th>Élément</th><th>Montant</th></tr></thead><tbody>
<tr><td>Dépenses mensuelles du foyer</td><td>3 500 €</td></tr>
<tr><td>Revenus qui resteraient (conjoint)</td><td>2 000 €</td></tr>
<tr><td>Écart mensuel à couvrir</td><td><strong>1 500 €</strong></td></tr>
<tr><td>Durée du besoin</td><td>10 ans</td></tr>
<tr><td>Capital ou équivalent à prévoir</td><td><strong>180 000 €</strong></td></tr>
</tbody></table>
<p class="art-note">Exemple pédagogique : 1 500 € × 12 mois × 10 ans. Le besoin réel dépend de chaque foyer.</p>
<p>À cela s’ajoutent, selon les cas, les frais d’obsèques et des frais ponctuels.</p>` },
    { h2: 'Les formes de protection', html: `
<ul>
<li><strong>Le capital décès</strong> : une somme versée en une fois aux bénéficiaires.</li>
<li><strong>La rente conjoint</strong> : un revenu régulier pour le conjoint survivant.</li>
<li><strong>La rente éducation</strong> : un revenu versé pour les enfants jusqu’à un âge défini.</li>
<li><strong>Les garanties en cas d’invalidité ou d’arrêt long</strong> : souvent oubliées, elles peuvent peser aussi lourd sur le budget qu’un décès.</li>
</ul>` },
    { h2: 'Les erreurs fréquentes', html: `
<ul>
<li>Croire que l’<strong>assurance de prêt</strong> suffit : elle rembourse le crédit, pas les dépenses courantes de la famille.</li>
<li>Ne pas vérifier la <strong>prévoyance de l’employeur</strong> (souvent présente pour les salariés) et ses montants.</li>
<li>Oublier de <strong>mettre à jour</strong> les bénéficiaires et les montants après une naissance, un achat immobilier, une séparation.</li>
</ul>
<div class="art-callout"><strong>Le bon réflexe :</strong> faire le calcul avant de comparer les prix. Un contrat pas cher qui couvre mal ne protège personne.</div>` }
  ],
  faq: [
    { q: 'L’assurance de prêt suffit-elle à protéger ma famille ?', a: 'Non. Elle rembourse tout ou partie du crédit en cas de décès ou d’invalidité, mais ne finance pas les dépenses courantes du foyer.' },
    { q: 'Mon employeur me couvre-t-il ?', a: 'Souvent, pour un salarié, un contrat collectif prévoit des garanties décès et invalidité. Vérifiez la notice pour connaître les montants exacts.' },
    { q: 'À quel âge faut-il y penser ?', a: 'Dès qu’il y a des personnes à charge ou un crédit : achat immobilier, naissance, création d’activité. Plus on s’y prend tôt, plus le contrat est simple à obtenir.' }
  ],
  cta: { kind: 'call', project: 'Prévoyance', label: 'Calculer mon besoin', text: 'Un échange pour chiffrer la protection dont votre famille a réellement besoin.' },
  sources: [
    { label: 'Service-public.fr : décès, capital décès et protection des proches', url: 'https://www.service-public.fr' },
    { label: 'France Assureurs', url: 'https://www.franceassureurs.fr' }
  ],
  related: ['prevoyance-independants-arret-de-travail', 'clause-beneficiaire-assurance-vie-transmission']
},
{
  slug: 'mutuelle-comment-choisir-niveau-de-garanties',
  service: 'mutuelle',
  published: true,
  title: 'Mutuelle santé : comment choisir son niveau de garanties',
  seoTitle: 'Mutuelle santé : choisir son niveau de garanties',
  description: 'Taux de remboursement, 100 % Santé, contrat responsable : comprendre les garanties d’une mutuelle et choisir le niveau adapté à vos besoins.',
  readMinutes: 6,
  updated: '2026-09-25',
  intro: 'Comparer des mutuelles uniquement sur le prix est le meilleur moyen de se tromper. Un contrat très bon marché peut rembourser trop peu quand vous en avez besoin ; un contrat très complet peut vous faire payer des garanties inutiles. Voici comment choisir le bon niveau.',
  sections: [
    { h2: 'La mutuelle complète la Sécurité sociale', html: `
<p>L’Assurance maladie rembourse une partie de vos dépenses de santé, calculée sur une <strong>base de remboursement</strong> fixée par la Sécurité sociale. La mutuelle prend en charge tout ou partie de ce qui reste : le ticket modérateur, le forfait hospitalier, et surtout les dépassements d’honoraires, l’optique, le dentaire ou les aides auditives.</p>` },
    { h2: 'Bien lire les taux de remboursement', html: `
<p>Les garanties sont souvent exprimées en pourcentage de la base de remboursement (BR). Un remboursement à « 200 % BR » ne signifie pas qu’on vous rembourse le double de vos frais : cela veut dire deux fois le tarif de référence de la Sécurité sociale, y compris sa part.</p>
<p>Certaines garanties sont en euros (forfaits annuels), notamment en optique, en dentaire ou pour les médecines douces. Regardez les <strong>plafonds annuels</strong>.</p>` },
    { h2: 'Le 100 % Santé', html: `
<p>Le dispositif « 100 % Santé » permet d’obtenir certains équipements en <strong>optique, dentaire et audiologie sans reste à charge</strong>, à condition de choisir les produits d’un panier défini. Les contrats dits « responsables » doivent prendre en charge ce panier.</p>
<p>Le 100 % Santé ne couvre pas tout : vous pouvez préférer des équipements hors panier, et c’est là que le niveau de garantie de votre mutuelle compte.</p>` },
    { h2: 'Adapter le niveau à votre profil', html: `
<table class="local-table local-table-small"><thead><tr><th>Profil</th><th>Postes à surveiller</th></tr></thead><tbody>
<tr><td>Jeune, en bonne santé</td><td>Hospitalisation, soins courants ; niveau de base souvent suffisant</td></tr>
<tr><td>Famille avec enfants</td><td>Dentaire, orthodontie, optique, consultations</td></tr>
<tr><td>Porteur de lunettes ou de prothèses</td><td>Optique, dentaire, audiologie hors 100 % Santé</td></tr>
<tr><td>Senior</td><td>Hospitalisation, dépassements d’honoraires, aides auditives</td></tr>
</tbody></table>
<p>Le meilleur outil : regarder vos <strong>dépenses de santé des 12 derniers mois</strong> et tester chaque contrat poste par poste.</p>` },
    { h2: 'Les pièges à éviter', html: `
<ul>
<li>Les <strong>délais de carence</strong> avant que certaines garanties s’appliquent.</li>
<li>Les <strong>plafonds annuels</strong> qui limitent les remboursements sur l’optique ou le dentaire.</li>
<li>L’<strong>évolution de la cotisation</strong> avec l’âge.</li>
<li>Les <strong>exclusions</strong> et les conditions de prise en charge de l’hospitalisation.</li>
</ul>
<div class="art-callout"><strong>La bonne méthode :</strong> commencer par vos besoins réels, ensuite comparer les contrats à niveau de garanties comparable, et seulement à la fin regarder le prix.</div>` }
  ],
  faq: [
    { q: 'La mutuelle est-elle obligatoire ?', a: 'Pour les salariés du secteur privé, l’employeur doit proposer une complémentaire santé collective, avec quelques cas de dispense. Pour les autres, c’est un choix.' },
    { q: 'Que signifie « contrat responsable » ?', a: 'C’est un contrat qui respecte un cahier des charges fixé par la loi (prise en charge du 100 % Santé, limites sur certains remboursements). Il donne accès à une fiscalité plus favorable.' },
    { q: 'Quel niveau de garanties pour des lunettes ?', a: 'Cela dépend de la monture et des verres. Le panier 100 % Santé est pris en charge sans reste à charge ; hors panier, le plafond de votre mutuelle détermine ce qui reste à payer.' }
  ],
  cta: { kind: 'call', project: 'Mutuelle', label: 'Faire étudier ma mutuelle', text: 'Une comparaison à partir de vos dépenses réelles de santé, pour choisir le juste niveau.' },
  sources: [
    { label: 'Ministère de l’Économie : tout savoir sur les complémentaires santé', url: 'https://www.economie.gouv.fr/particuliers/emprunter-et-sassurer/tout-savoir-sur-les-complementaires-sante-mutuelle' },
    { label: 'Ministère de l’Économie : complémentaire santé obligatoire en entreprise', url: 'https://www.economie.gouv.fr/entreprises/entreprises-vous-avez-lobligation-de-proposer-une-mutuelle-de-sante-vos-salaries' }
  ],
  related: ['mutuelle-changer-resiliation-infra-annuelle', 'prevoyance-independants-arret-de-travail']
},
{
  slug: 'mutuelle-changer-resiliation-infra-annuelle',
  service: 'mutuelle',
  published: true,
  title: 'Changer de mutuelle à tout moment : la résiliation infra-annuelle',
  seoTitle: 'Changer de mutuelle à tout moment : mode d’emploi',
  description: 'Depuis 2020, vous pouvez résilier votre mutuelle à tout moment après un an de contrat. Les conditions, les démarches et les erreurs à éviter.',
  readMinutes: 5,
  updated: '2026-09-25',
  intro: 'Longtemps, changer de mutuelle imposait d’attendre la date d’échéance et d’envoyer un courrier dans un délai précis. Ce n’est plus le cas : depuis fin 2020, la résiliation est possible à tout moment après un an de contrat. Voici comment faire, sans jamais rester sans couverture.',
  sections: [
    { h2: 'Ce qui a changé', html: `
<p>Depuis le 1er décembre 2020, pour les contrats individuels de complémentaire santé, vous pouvez <strong>résilier à tout moment, sans frais, une fois le contrat souscrit depuis au moins un an</strong>. La résiliation prend effet <strong>un mois après</strong> la réception de votre demande par l’assureur.</p>
<p>Vous n’avez donc plus besoin d’attendre la date anniversaire, ni d’envoyer votre courrier deux mois avant.</p>` },
    { h2: 'Les démarches, étape par étape', html: `
<ol>
<li><strong>Choisissez la nouvelle mutuelle</strong> avant de résilier l’ancienne.</li>
<li><strong>Vérifiez la date de début</strong> du nouveau contrat : elle doit suivre la fin de l’ancien, sans période sans couverture.</li>
<li><strong>Faites résilier l’ancien contrat.</strong> Le nouvel assureur peut se charger de la résiliation à votre place, ce qui simplifie les démarches.</li>
<li><strong>Conservez la confirmation</strong> de la résiliation et le nouveau certificat d’adhésion.</li>
</ol>
<div class="art-callout"><strong>Attention :</strong> ne résiliez jamais avant d’avoir la certitude que le nouveau contrat est bien en place. Être sans mutuelle, même quelques jours, peut coûter cher en cas de soin important.</div>` },
    { h2: 'Les cas où ce n’est pas possible', html: `
<ul>
<li>Le contrat est <strong>souscrit depuis moins d’un an</strong>.</li>
<li>Vous êtes couvert par une <strong>mutuelle d’entreprise obligatoire</strong> : ce régime collectif suit d’autres règles, et vous ne pouvez pas le quitter à votre guise sauf cas de dispense.</li>
</ul>
<p>Si vous quittez votre emploi, des règles de <strong>maintien de garanties</strong> (portabilité) peuvent s’appliquer pendant une durée limitée.</p>` },
    { h2: 'Pourquoi comparer régulièrement', html: `
<ul>
<li>Vos <strong>besoins évoluent</strong> : naissance, lunettes, soins dentaires, âge.</li>
<li>Les <strong>cotisations augmentent</strong> souvent avec les années.</li>
<li>De <strong>nouvelles offres</strong> apparaissent, parfois plus adaptées et moins chères à garanties comparables.</li>
</ul>
<p>Comparez à garanties équivalentes, poste par poste, et pas seulement sur le prix mensuel.</p>` }
  ],
  faq: [
    { q: 'Depuis quand peut-on changer de mutuelle à tout moment ?', a: 'Depuis le 1er décembre 2020, pour les contrats individuels, après un an de couverture.' },
    { q: 'Combien de temps faut-il pour que la résiliation prenne effet ?', a: 'Un mois après la réception de la demande par votre assureur.' },
    { q: 'Qui s’occupe de la résiliation ?', a: 'Le nouvel assureur peut la faire à votre place. Chez GP Finances, je m’occupe des démarches.' },
    { q: 'Puis-je quitter ma mutuelle d’entreprise ?', a: 'Seulement dans les cas de dispense prévus par la loi ou par l’accord de votre entreprise. Ce n’est pas une résiliation « à tout moment ».' }
  ],
  cta: { kind: 'call', project: 'Mutuelle', label: 'Comparer avant de changer', text: 'Je compare des mutuelles à garanties équivalentes et je m’occupe de la résiliation de l’ancienne.' },
  sources: [
    { label: 'Ministère de l’Économie : résiliation infra-annuelle des complémentaires santé (1er décembre 2020)', url: 'https://presse.economie.gouv.fr/407-ouverture-de-la-resiliation-infra-annuelle-des-contrats-de-complementaire-sante-sans-frais-ni-penalite-a-compter-du-1er-decembre-2020/' },
    { label: 'Ministère de l’Économie : comment résilier son contrat ?', url: 'https://www.economie.gouv.fr/particuliers/resiliation-assurance' }
  ],
  related: ['mutuelle-comment-choisir-niveau-de-garanties', 'changer-assurance-de-pret-loi-lemoine']
},
{
  slug: 'regroupement-de-credits-quand-est-ce-interessant',
  service: 'regroupement-credits',
  published: true,
  title: 'Regroupement de crédits : quand est-ce vraiment intéressant ?',
  seoTitle: 'Regroupement de crédits : quand est-ce intéressant ?',
  description: 'Regrouper ses crédits fait baisser la mensualité, mais pas toujours le coût total. Les situations où c’est utile, celles à éviter et les frais à connaître.',
  readMinutes: 6,
  updated: '2026-09-25',
  intro: 'Un seul crédit, une seule mensualité, un budget qui respire : le regroupement de crédits séduit. Mais il ne faut pas confondre une mensualité plus basse et une opération plus économique. Voici comment savoir si c’est une bonne idée dans votre cas.',
  sections: [
    { h2: 'Le principe', html: `
<p>Le regroupement consiste à <strong>rembourser plusieurs crédits en cours avec un nouveau prêt unique</strong>, souvent sur une durée plus longue. Vous n’avez alors plus qu’une mensualité à payer, généralement plus faible que la somme des anciennes.</p>` },
    { h2: 'Mensualité, durée, coût total : le piège', html: `
<p>Trois chiffres évoluent en même temps :</p>
<ul>
<li>la <strong>mensualité</strong> baisse ;</li>
<li>la <strong>durée</strong> s’allonge ;</li>
<li>le <strong>coût total</strong> peut augmenter, parce que vous payez des intérêts plus longtemps.</li>
</ul>
<p>Autrement dit, vous gagnez du souffle chaque mois, mais vous pouvez payer plus cher au total. C’est un choix de budget, pas toujours une économie.</p>` },
    { h2: 'Les frais à connaître', html: `
<ul>
<li>Les <strong>frais de dossier</strong> du nouveau prêt.</li>
<li>Les <strong>indemnités de remboursement anticipé</strong> des crédits soldés : pour un crédit à la consommation, elles sont plafonnées à 1 % du capital remboursé par anticipation si la durée restante dépasse un an (0,5 % sinon), et ne peuvent être réclamées que si les remboursements anticipés dépassent 10 000 € sur 12 mois ; pour un crédit immobilier à taux fixe, elles ne peuvent pas dépasser six mois d’intérêts, dans la limite de 3 % du capital restant dû.</li>
<li>Le <strong>coût de l’assurance</strong> et de la garantie éventuelle.</li>
</ul>` },
    { h2: 'Quand le regroupement est utile', html: `
<ul>
<li>Vous avez <strong>plusieurs crédits à taux élevé</strong> (dont des crédits renouvelables) et un nouveau taux nettement plus bas est possible.</li>
<li>Votre <strong>budget mensuel est tendu</strong> et vous préférez le retrouver, en acceptant une durée plus longue.</li>
<li>Vous voulez <strong>simplifier</strong> plusieurs échéances.</li>
</ul>` },
    { h2: 'Quand l’éviter', html: `
<ul>
<li>Vos crédits sont <strong>presque terminés</strong> : les allonger coûte cher pour peu de gain.</li>
<li>Vos anciens crédits ont un <strong>taux très bas</strong> que vous ne retrouverez pas.</li>
<li>L’opération sert à <strong>reprendre de la trésorerie</strong> sans en avoir mesuré les conséquences sur votre endettement.</li>
</ul>
<div class="art-callout"><strong>À retenir :</strong> avant de signer, comparez le coût total restant à payer avec et sans regroupement, frais compris. C’est le seul chiffre qui dit si l’opération est économique.</div>` }
  ],
  faq: [
    { q: 'Le regroupement de crédits fait-il toujours baisser le coût ?', a: 'Non. Il fait baisser la mensualité, mais en allongeant la durée il peut augmenter le coût total. Il faut comparer avec et sans regroupement.' },
    { q: 'Peut-on regrouper des crédits immobiliers et des crédits à la consommation ?', a: 'Oui, c’est possible, avec un montage adapté et des conditions spécifiques, notamment selon la part immobilière. L’étude doit être faite au cas par cas.' },
    { q: 'Quels frais faut-il prévoir ?', a: 'Des frais de dossier, des indemnités de remboursement anticipé sur les crédits soldés et le coût de l’assurance. Ils doivent être inclus dans la comparaison.' }
  ],
  cta: { kind: 'call', project: 'Regroupement de crédits', label: 'Faire étudier mes crédits', text: 'Une étude de vos crédits actuels pour savoir si un regroupement est vraiment utile.' },
  sources: [
    { label: 'Ministère de l’Économie : rembourser son crédit immobilier avant le terme', url: 'https://www.economie.gouv.fr/particuliers/rembourser-credit-immobilier-avant-terme-anticipation' },
    { label: 'Service-public.fr : crédit à la consommation, obligations de la banque', url: 'https://www.service-public.fr/particuliers/vosdroits/F2440' }
  ],
  related: ['regroupement-de-credits-calcul-avant-de-signer', 'capital-initial-ou-capital-restant-du']
},
{
  slug: 'regroupement-de-credits-calcul-avant-de-signer',
  service: 'regroupement-credits',
  published: true,
  title: 'Regroupement de crédits : le calcul à faire avant de signer (exemple chiffré)',
  seoTitle: 'Regroupement de crédits : le calcul avant de signer',
  description: 'Un exemple chiffré pour comprendre pourquoi une mensualité plus basse peut coûter plus cher, et la liste de contrôle avant de signer un regroupement.',
  readMinutes: 6,
  updated: '2026-09-25',
  intro: 'Le meilleur moyen de comprendre un regroupement de crédits est de le calculer. Voici un exemple simple, avec des chiffres, qui montre comment la même opération peut soulager votre budget… ou coûter plus cher que vos crédits actuels.',
  sections: [
    { h2: 'La situation de départ', html: `
<table class="local-table local-table-small"><thead><tr><th>Crédit</th><th>Mensualité</th><th>Mois restants</th><th>Reste à payer</th></tr></thead><tbody>
<tr><td>Crédit A</td><td>250 €</td><td>20</td><td>5 000 €</td></tr>
<tr><td>Crédit B</td><td>300 €</td><td>30</td><td>9 000 €</td></tr>
<tr><td>Crédit C</td><td>290 €</td><td>40</td><td>11 600 €</td></tr>
<tr><td><strong>Total</strong></td><td><strong>840 €</strong></td><td></td><td><strong>25 600 €</strong></td></tr>
</tbody></table>
<p>Le capital restant dû est de 22 000 €. Voyons deux façons de le regrouper.</p>` },
    { h2: 'Option 1 : regrouper sur 48 mois', html: `
<p>Nouveau prêt de 22 000 € à 5 % sur 48 mois : mensualité d’environ <strong>507 €</strong>, soit un coût total d’environ 24 320 €. Avec 520 € de frais (dossier et indemnités), on arrive à environ <strong>24 840 €</strong>.</p>
<p>Résultat : <strong>333 € de moins par mois</strong> et environ <strong>760 € d’économie</strong> sur l’ensemble.</p>` },
    { h2: 'Option 2 : regrouper sur 84 mois', html: `
<p>Même capital, même taux, mais sur 84 mois : mensualité d’environ <strong>311 €</strong>, soit un coût total d’environ 26 120 €. Avec les mêmes 520 € de frais : environ <strong>26 640 €</strong>.</p>
<p>Résultat : <strong>529 € de moins par mois</strong>, mais environ <strong>1 040 € de plus</strong> à payer au total.</p>
<table class="local-table local-table-small"><thead><tr><th></th><th>Sans regroupement</th><th>Sur 48 mois</th><th>Sur 84 mois</th></tr></thead><tbody>
<tr><td>Mensualité</td><td>840 €</td><td>507 €</td><td>311 €</td></tr>
<tr><td>Coût total restant, frais inclus</td><td>25 600 €</td><td>24 840 €</td><td>26 640 €</td></tr>
<tr><td>Écart</td><td>—</td><td>−760 €</td><td>+1 040 €</td></tr>
</tbody></table>
<p class="art-note">Exemple pédagogique : taux, frais et durées sont illustratifs. Chaque situation doit être calculée avec des chiffres réels.</p>` },
    { h2: 'Ce que montre cet exemple', html: `
<p>Le même regroupement peut être <strong>avantageux</strong> ou <strong>plus coûteux</strong> selon la durée choisie. Ce qui allège le plus votre budget mensuel (la durée la plus longue) est aussi ce qui coûte le plus cher au total.</p>
<p>La bonne question n’est donc pas « de combien ma mensualité baisse ? » mais « <strong>que vais-je payer au total, frais compris, par rapport à aujourd’hui ?</strong> » et « quelle mensualité mon budget peut-il vraiment absorber ? ».</p>` },
    { h2: 'La liste de contrôle avant de signer', html: `
<ul>
<li>Avez-vous les <strong>tableaux d’amortissement</strong> de tous vos crédits ?</li>
<li>Connaissez-vous le <strong>capital restant dû</strong> exact et les indemnités de remboursement anticipé ?</li>
<li>Avez-vous comparé le <strong>coût total</strong> avec et sans regroupement ?</li>
<li>Le <strong>TAEG</strong> et le coût de l’assurance sont-ils clairement indiqués ?</li>
<li>Avez-vous regardé les <strong>garanties demandées</strong> (caution, hypothèque) et leur coût ?</li>
<li>Connaissez-vous vos <strong>délais</strong> ? Un crédit à la consommation ouvre un droit de rétractation de 14 jours après la signature. Pour un crédit immobilier, il n’y a pas de rétractation après l’acceptation : vous disposez d’un délai de réflexion de 10 jours <em>avant</em> de pouvoir accepter l’offre.</li>
</ul>` }
  ],
  faq: [
    { q: 'Comment savoir si un regroupement est intéressant ?', a: 'En comparant le coût total restant à payer (frais et assurance inclus) avec et sans regroupement, et en vérifiant que la nouvelle mensualité est supportable.' },
    { q: 'Vaut-il mieux une durée courte ou longue ?', a: 'Une durée courte coûte moins cher au total mais impose une mensualité plus élevée. Une durée longue allège le budget mensuel mais augmente le coût total.' },
    { q: 'Puis-je changer d’avis après avoir signé ?', a: 'Pour un crédit à la consommation, oui : vous disposez de 14 jours pour vous rétracter. Pour un crédit immobilier, il n’y a pas de délai de rétractation après l’acceptation, mais un délai de réflexion obligatoire de 10 jours avant de pouvoir accepter l’offre.' }
  ],
  cta: { kind: 'call', project: 'Regroupement de crédits', label: 'Calculer mon cas', text: 'Je chiffre votre situation réelle, avec et sans regroupement, pour que vous décidiez en connaissance de cause.' },
  sources: [
    { label: 'Ministère de l’Économie : les délais de réflexion ou de rétractation', url: 'https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/les-delais-de-reflexion-ou-de-retractation' },
    { label: 'Ministère de l’Économie : crédit immobilier, comment ça marche ?', url: 'https://www.economie.gouv.fr/particuliers/gerer-mon-argent/emprunter-et-sassurer/credit-immobilier-comment-ca-marche' }
  ],
  related: ['regroupement-de-credits-quand-est-ce-interessant', 'capital-initial-ou-capital-restant-du']
}
];

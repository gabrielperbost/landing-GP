// Détection des noms mal importés (Monday) et proposition de correction.
// Rien n'est corrigé automatiquement : la page "Noms à corriger" affiche la
// proposition et c'est l'utilisateur qui valide.

// Prénoms français courants : sert uniquement à repérer un prénom rangé dans
// le champ Nom (ex. « Lopes Carlos »). Une liste, pas une vérité : en cas de
// doute, l'utilisateur tranche.
const PRENOMS_COURANTS = new Set(
  `aaron abdel abdelkader abdou abdoulaye abel abigail achille adam adel adele adeline adil adrian adrien agathe agnes ahmed aicha aida aimee alain alan alban albert alberto alda alex alexandra alexandre alexia alexis alfred ali alice alicia alida aline alix alois aloise amadou amaury amanda amandine amaury ambre amelia amelie amine amir amina anael anaelle anais anatole andre andrea andree andy ange angel angela angele angelina angelique anissa annabelle anne anne-laure anne-marie anne-sophie annette annick annie anouk anthony antoine antoinette antonin antonio apolline arielle arlette armand armelle arnaud arthur astrid audrey augustin aurelie aurelien aurore axel axelle aya aymeric aziz baptiste barbara basile bastien beatrice benedicte benjamin benoit berenice bernadette bernard bertrand blanche blandine boris brice brigitte bruno camille candice capucine carine carla carlos carmen carole caroline cassandre catherine cecile cedric celestin celia celine chantal charlene charles charlie charline charlotte charly chloe christel christelle christian christiane christine christophe claire clara clarisse claude claudia claudine clemence clement clementine cloe coline colette colin come constance coralie corentin corinne cyril cyrille damien daniel daniele danielle dany daphne david deborah delphine denis denise diane didier dimitri dominique dorian doriane dorothee dylan edgar edith edmond edouard eleonore elian eliane elias elie elisa elisabeth elise eliot ella elodie eloise elsa emeline emile emilie emilien emma emmanuel emmanuelle enzo eric erwan esteban estelle ethan etienne eugene eugenie eva evan eve evelyne fabien fabienne fabrice fanny farid fatima fatou felix ferdinand fernand fernande fiona flavie flavien florence florent florian francine francis franck francois francoise frederic frederique gabin gabriel gabrielle gael gaelle gaetan gaspard gauthier genevieve geoffrey georges geraldine gerard germain ghislaine gilbert gilles ginette gisele gregoire gregory guillaume guy gwenaelle gwendoline hamid hassan helene henri herve hugo hugues ibrahim ines irene isaac isabelle jacqueline jacques jade jamel jean jean-baptiste jean-charles jean-claude jean-francois jean-jacques jean-louis jean-luc jean-marc jean-marie jean-michel jean-paul jean-philippe jean-pierre jeanne jeannine jennifer jeremie jeremy jerome jessica joachim joel joelle johan johanna john jonathan jordan joseph josephine josette josiane jules julia julian julie julien juliette justin justine karen karim karima karine karl kenza kevin killian laetitia lamia lana laura laure laurence laurent lea leila lena leo leon leonard leonie lionel lisa lise loic lola lorenzo louane louis louisa louise luc luca lucas lucie lucien lucienne lucile ludivine ludovic luna lydie lyna madeleine maelle maeva magali malik manon manuel marc marcel marceline marco margaux margot marguerite maria marianne marie marie-christine marie-claire marie-france marie-laure marie-pierre marielle marina marine mario marion marius marjorie marlene marthe martin martine maryline mathias mathieu mathilde mathis matteo matthieu maud maurice max maxence maxime mehdi melanie melissa melodie michael michel michele micheline mickael mila milan mireille mohamed mohammed monique morgan morgane muriel myriam nadia nadine nadir naomi nathalie nathan nicolas nicole nina noah noe noel noemie nora norbert oceane odette odile olivia olivier oscar pascal pascale patrice patricia patrick paul paule paulette pauline perrine philippe pierre pierre-yves pierrette quentin rachel rachid rafael raphael raphaelle raymond rebecca regine regis remi renaud rene renee richard robert robin rodolphe roger roland romain romane romuald rose rosine sabine sabrina sacha salome samia samir samuel sandra sandrine sarah sebastien serge severine simon simone solene solenne sonia sophie stephane stephanie steve suzanne sylvain sylvie tatiana thais theo theodore therese thibaud thibault thierry thomas timothee tiphaine tom tony tristan valentin valentine valerie vanessa veronique victor victoire victoria vincent violette virginie vivien vivienne william xavier yannick yann yasmine yohan yves yvette yvonne zoe`.split(/\s+/)
);

const strip = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const firstToken = (s: string) => strip(s).split(/[\s]+/)[0] ?? "";
const isPrenom = (token: string) => PRENOMS_COURANTS.has(strip(token)) || PRENOMS_COURANTS.has(strip(token).split("-")[0]);

// Lettres, espaces, tirets, points et apostrophes (droite ou typographique).
const ALLOWED = /[^A-Za-zÀ-ÖØ-öø-ÿ'’ .-]/g;

const clean = (s: string) => s.replace(ALLOWED, " ").replace(/\s+/g, " ").trim();

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|[\s'’-])([a-zà-öø-ÿ])/g, (_, sep: string, c: string) => sep + c.toUpperCase());

export type NameIssue = {
  raisons: string[];
  suggestion: { prenom: string; nom: string };
};

// Découpe « Audra Lerouge » en prénom + nom : le prénom est le premier mot,
// sauf si seul le dernier mot est un prénom connu (« Lerouge Audra »).
function splitFullName(full: string): { prenom: string; nom: string } {
  const words = full.split(" ").filter(Boolean);
  if (words.length < 2) return { prenom: "", nom: full };
  const first = words[0];
  const last = words[words.length - 1];
  if (!isPrenom(first) && isPrenom(last)) return { prenom: last, nom: words.slice(0, -1).join(" ") };
  return { prenom: first, nom: words.slice(1).join(" ") };
}

export function analyseNom(prenom: string, nom: string): NameIssue | null {
  const raisons: string[] = [];
  if (/[^A-Za-zÀ-ÖØ-öø-ÿ'’ .-]/.test(prenom + nom)) raisons.push("Caractère parasite (?, chiffre…)");
  if (prenom !== prenom.trim() || nom !== nom.trim() || /\s{2,}/.test(prenom + " " + nom)) raisons.push("Espaces en trop");
  if (prenom.trim() && strip(prenom.trim()) === strip(nom.trim())) raisons.push("Prénom identique au nom");

  let p = clean(prenom);
  let n = clean(nom);

  // Un champ vide (souvent un « ? » importé) et le nom complet dans l'autre.
  if (!p && n.includes(" ")) {
    ({ prenom: p, nom: n } = splitFullName(n));
    raisons.push("Nom complet dans un seul champ");
  } else if (!n && p.includes(" ")) {
    ({ prenom: p, nom: n } = splitFullName(p));
    raisons.push("Nom complet dans un seul champ");
  } else if (!p || !n) {
    raisons.push("Prénom ou nom vide");
  } else if (isPrenom(firstToken(n)) && !isPrenom(firstToken(p))) {
    raisons.push("Prénom et nom probablement inversés");
    [p, n] = [n, p];
  }

  if (raisons.length === 0) return null;
  return { raisons: [...new Set(raisons)], suggestion: { prenom: titleCase(p), nom: n.toUpperCase() } };
}

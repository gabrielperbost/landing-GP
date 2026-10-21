// Détection des noms mal importés (Monday) et proposition de correction.
// Rien n'est corrigé automatiquement : la page "Noms à corriger" affiche la
// proposition et c'est l'utilisateur qui valide.

// Prénoms français courants : sert uniquement à repérer un prénom placé dans
// le champ Nom (ex. « Lopes Carlos »). Une liste, pas une vérité : en cas de
// doute, l'utilisateur tranche.
const PRENOMS_COURANTS = new Set(
  `adam adrien agnes aicha alain alexandre alexandra alexis alice aline amandine amelie anais andre andrea angelique anne annie anthony antoine antonio arnaud arthur audrey aurelie aurelien axel baptiste benjamin benoit bernard bertrand brigitte bruno camille carlos carole caroline catherine cecile celine charles charlotte chantal christelle christian christine christophe claire claude clement corinne cyril damien daniel david delphine denis didier dominique dorothee elise elodie emilie emma emmanuel eric estelle eva fabien fabienne fabrice fanny florence florian francis franck francois francoise frederic gabriel gael gaelle genevieve georges gerard gilles guillaume helene herve hugo isabelle jacques jean jeanne jeremy jerome jessica joel johanna jonathan jordan joseph julie julien juliette justine karim karine kevin laetitia laura laurence laurent lea leo lionel louis louise luc lucas lucie ludovic manon marc marie marine mathieu mathilde maud maxime melanie michel michele mickael mohamed monique morgane muriel myriam nadia nathalie nicolas noemie olivier oscar pascal pascale patrice patricia patrick paul pauline philippe pierre quentin raphael regis remi renaud richard robert romain sabrina samuel sandrine sarah sebastien serge severine simon sophie stephane stephanie sylvain sylvie theo thierry thomas valerie vanessa veronique victor vincent virginie xavier yann yannick yves`.split(/\s+/)
);

const strip = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const firstToken = (s: string) => strip(s).split(/[\s-]+/)[0] ?? "";

const clean = (s: string) =>
  s
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' .-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/(^|[\s'-])([a-zà-öø-ÿ])/g, (_, sep: string, c: string) => sep + c.toUpperCase());

export type NameIssue = {
  raisons: string[];
  suggestion: { prenom: string; nom: string };
};

export function analyseNom(prenom: string, nom: string): NameIssue | null {
  const raisons: string[] = [];
  if (/[^A-Za-zÀ-ÖØ-öø-ÿ' .-]/.test(prenom + nom)) raisons.push("Caractère parasite (?, chiffre…)");
  if (!prenom.trim() || !nom.trim()) raisons.push("Prénom ou nom vide");
  if (prenom !== prenom.trim() || nom !== nom.trim() || /\s{2,}/.test(prenom + " " + nom)) raisons.push("Espaces en trop");
  if (prenom.trim() && strip(prenom) === strip(nom)) raisons.push("Prénom identique au nom");

  let p = titleCase(clean(prenom));
  let n = clean(nom);

  const inverse = PRENOMS_COURANTS.has(firstToken(n)) && !PRENOMS_COURANTS.has(firstToken(p));
  if (inverse) {
    raisons.push("Prénom et nom probablement inversés");
    [p, n] = [titleCase(n), clean(prenom)];
  }

  if (raisons.length === 0) return null;
  return { raisons, suggestion: { prenom: p, nom: n.toUpperCase() } };
}

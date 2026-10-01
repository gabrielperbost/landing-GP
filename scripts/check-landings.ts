#!/usr/bin/env node
/**
 * Contrôles qualité des pages locales « assurance emprunteur » générées par
 * scripts/build-site.cjs (public/site/pages/villes/*.html), pour détecter les
 * pages satellites (contenu quasi identique ou trop pauvre en contenu propre
 * à la ville) avant toute indexation.
 *
 *   node scripts/check-landings.ts
 *
 * Vérifie, pour chaque paire de pages MIGRÉES (celles qui ont un fichier
 * src/content/villes/{slug}.ts) :
 *  1. Similarité du contenu principal (tout ce qui est entre <header> et
 *     <footer>, SAUF le simulateur d'assurance — un outil fonctionnel
 *     identique sur les 56 pages, traité comme le header/menu/footer et pas
 *     comme du contenu éditorial ; le reste, y compris les blocs génériques
 *     « pourquoi nous choisir », loi Lemoine, process…, est volontairement
 *     gardé dans la mesure car Google l'analyse comme du contenu de la page)
 *     — shingles de 5 mots, indice de Jaccard, seuil : < 40 % entre chaque paire.
 *  2. Part de contenu local : au moins 38 % des mots du contenu principal
 *     (hors simulateur) doivent être propres à la ville (texte balisé
 *     <!--LOCAL--> par build-site.cjs : angle éditorial, profil immobilier/
 *     emprunteurs, quartiers, accès au cabinet, cas concret chiffré et FAQ
 *     propres à la ville). ~1 000 mots de contenu principal (hors simulateur)
 *     par page est l'objectif, affiché à titre indicatif mais pas bloquant
 *     (c'est une cible, pas un seuil strict). Les pages pas encore migrées ne
 *     sont volontairement pas mesurées : leur similarité/pauvreté de contenu
 *     est un problème déjà identifié, pas quelque chose que ce contrôle doit
 *     re-signaler à chaque exécution tant qu'elles ne sont pas reprises.
 *
 * Vérifie aussi, sur TOUTES les pages :
 *  3. Unicité des <title>, meta description et H1.
 *  4. Présence de TODO_VERIFIER (chiffres non sourcés, à valider).
 *  5. Liens internes (villes voisines, hub) : toutes les cibles existent.
 *  6. Que le build Next.js (tsc --noEmit) passe sans erreur.
 *
 * Code de sortie non nul si un problème bloquant est détecté (titres dupliqués,
 * lien mort, paire migrée ≥ 50 % de similarité, page migrée sous le seuil de
 * contenu local). Les TODO_VERIFIER sont listés mais ne font pas échouer le
 * script (ce sont des chiffres à valider, pas une erreur).
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { VILLES as VILLES_DATA } from "../src/content/villes/index.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VILLES_DIR = path.join(ROOT, "public", "site", "pages", "villes");
const SIMILARITY_THRESHOLD = 0.4;
const SHINGLE_SIZE = 5;
const LOCAL_SHARE_MIN = 0.38;
const TOTAL_WORDS_TARGET = 1000; // indicatif, affiché mais pas bloquant
const MIGRATED_SLUGS = new Set(VILLES_DATA.map((v) => v.slug));

type PageInfo = {
  file: string;
  slug: string;
  title: string;
  description: string;
  h1: string;
  text: string;
  wordCount: number;
  localWordCount: number;
  localShare: number;
  shingles: Set<string>;
  links: string[];
};

const stripTags = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/\s+/g, " ")
    .trim();

const shingles = (text: string, size = SHINGLE_SIZE): Set<string> => {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) set.add(words.slice(i, i + size).join(" "));
  return set;
};

const jaccard = (a: Set<string>, b: Set<string>) => {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
};

const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

// Texte entre <!--LOCAL--> et <!--/LOCAL--> (posé par build-site.cjs sur l'angle éditorial, le
// profil immobilier/emprunteurs, les quartiers et la FAQ propre à la ville) : le seul contenu
// qu'on compte comme « propre à la ville » pour la part de contenu local.
const localText = (mainHtml: string) =>
  [...mainHtml.matchAll(/<!--LOCAL-->([\s\S]*?)<!--\/LOCAL-->/g)].map((m) => stripTags(m[1])).join(" ");

if (!fs.existsSync(VILLES_DIR)) {
  console.error(`Introuvable : ${VILLES_DIR}. Lancez d'abord \`node scripts/build-site.cjs\`.`);
  process.exit(1);
}

const files = fs
  .readdirSync(VILLES_DIR)
  .filter((f) => f.endsWith(".html") && f !== "hauts-de-seine.html")
  .sort();

if (files.length === 0) {
  console.error("Aucune page ville trouvée (hors hub hauts-de-seine.html).");
  process.exit(1);
}

const problems: string[] = [];
const todoVerifier: string[] = [];
const pages: PageInfo[] = [];

// Faits qualitatifs non sourcés (faitsSources, voir src/content/villes/types.ts) : pas dans le
// HTML généré (c'est une métadonnée de relecture), donc listés séparément du scan ci-dessous.
for (const v of VILLES_DATA) {
  for (const f of v.faitsSources ?? []) {
    if (f.source.startsWith("TODO_VERIFIER")) {
      todoVerifier.push(`${v.slug} (faitsSources) : « ${f.fait} » — ${f.source}`);
    }
  }
}

for (const file of files) {
  const slug = file.replace(/\.html$/, "");
  const html = fs.readFileSync(path.join(VILLES_DIR, file), "utf8");

  const title = (/<title>([^<]*)<\/title>/.exec(html) || [])[1] ?? "";
  const description = (/<meta name="description" content="([^"]*)"/.exec(html) || [])[1] ?? "";
  const h1 = stripTags((/<h1>([\s\S]*?)<\/h1>/.exec(html) || [])[1] ?? "");

  // Texte du contenu principal (tout ce qui est entre <header> et <footer>, donc le <main> —
  // header/menu/footer identiques sur toutes les pages, exclus pour ne pas gonfler artificiellement
  // la similarité), MOINS le simulateur d'assurance, le bandeau d'avis Google et la présentation
  // compacte de Gabriel : trois blocs de confiance/outil identiques sur les 56 pages (libellés de
  // formulaire, avis vérifiés, bio courtier déjà affichés ailleurs), traités comme le header/footer
  // plutôt que comme du contenu éditorial propre à la page. Les autres blocs génériques du gabarit
  // (méthode, témoignages…) restent dans la mesure.
  const mainHtmlRaw = (/<main[^>]*>([\s\S]*?)<\/main>/.exec(html) || [])[1] ?? html;
  const mainHtml = mainHtmlRaw
    .replace(/<section class="section insurance-simulator"[\s\S]*?<\/section>\s*(?=<section)/, '')
    .replace(/<section class="review-ticker"[\s\S]*?<\/section>/, '')
    .replace(/<section class="section advisor-section condensed"[\s\S]*?<\/section>/, '');
  const text = stripTags(mainHtml);
  const wc = wordCount(text);
  const localWc = wordCount(localText(mainHtml));

  if (html.includes("TODO_VERIFIER")) {
    const count = (html.match(/TODO_VERIFIER/g) || []).length;
    todoVerifier.push(`${file} : ${count} occurrence(s)`);
  }

  const links = [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]);

  pages.push({
    file,
    slug,
    title,
    description,
    h1,
    text,
    wordCount: wc,
    localWordCount: localWc,
    localShare: wc === 0 ? 0 : localWc / wc,
    shingles: shingles(text),
    links
  });
}

// 3. Unicité des title / description / H1
const byTitle = new Map<string, string[]>();
const byDescription = new Map<string, string[]>();
const byH1 = new Map<string, string[]>();
for (const p of pages) {
  for (const [map, value] of [
    [byTitle, p.title],
    [byDescription, p.description],
    [byH1, p.h1]
  ] as const) {
    if (!map.has(value)) map.set(value, []);
    map.get(value)!.push(p.file);
  }
}
for (const [label, map] of [
  ["title", byTitle],
  ["meta description", byDescription],
  ["H1", byH1]
] as const) {
  for (const [value, fileList] of map) {
    if (fileList.length > 1) problems.push(`${label} dupliqué sur ${fileList.length} pages (${fileList.join(", ")}) : « ${value.slice(0, 80)} »`);
  }
}

// 1. Similarité par paire, pages migrées uniquement (contenu principal)
const migratedPages = pages.filter((p) => MIGRATED_SLUGS.has(p.slug));
const similarPairs: { a: string; b: string; score: number }[] = [];
for (let i = 0; i < migratedPages.length; i++) {
  for (let j = i + 1; j < migratedPages.length; j++) {
    const score = jaccard(migratedPages[i].shingles, migratedPages[j].shingles);
    if (score > SIMILARITY_THRESHOLD) similarPairs.push({ a: migratedPages[i].file, b: migratedPages[j].file, score });
  }
}
for (const { a, b, score } of similarPairs) {
  problems.push(`Similarité ${(score * 100).toFixed(0)} % entre ${a} et ${b} (seuil : ${SIMILARITY_THRESHOLD * 100} %)`);
}

// 2. Part de contenu local (pages migrées uniquement)
for (const p of migratedPages) {
  if (p.localShare < LOCAL_SHARE_MIN) {
    problems.push(
      `${p.file} : part de contenu local ${(p.localShare * 100).toFixed(0)} % (seuil : ${LOCAL_SHARE_MIN * 100} %) — ${p.localWordCount} mots locaux sur ${p.wordCount}`
    );
  }
}

// 5. Liens internes : la cible doit exister (route connue ou fichier de ville)
const knownSlugs = new Set(pages.map((p) => p.slug));
let routes: Record<string, string> = {};
try {
  routes = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "site", "routes.json"), "utf8"));
} catch {
  // tant pis, on vérifie uniquement les liens /assurance-emprunteur/*
}
const knownRoutePaths = new Set(Object.values(routes));
const isKnownInternalLink = (href: string) => {
  const clean = href.split("?")[0];
  if (clean === "/assurance-emprunteur/hauts-de-seine") return true;
  const villeMatch = /^\/assurance-emprunteur\/([a-z0-9-]+)$/.exec(clean);
  if (villeMatch) return knownSlugs.has(villeMatch[1]);
  if (clean === "/" || clean === "") return true;
  if (knownRoutePaths.has(clean)) return true;
  if (clean.startsWith("/site/")) return true; // ressources statiques, vérifiées par build-site.cjs lui-même
  if (clean.startsWith("/conseils")) return true; // rubrique optionnelle, déjà contrôlée par build-site.cjs
  return false;
};
const brokenLinks = new Map<string, Set<string>>();
for (const p of pages) {
  for (const href of p.links) {
    if (!isKnownInternalLink(href)) {
      if (!brokenLinks.has(href)) brokenLinks.set(href, new Set());
      brokenLinks.get(href)!.add(p.file);
    }
  }
}
for (const [href, fileSet] of brokenLinks) {
  problems.push(`Lien interne vers une page inconnue « ${href} » (présent sur ${[...fileSet].join(", ")})`);
}

// 6. tsc --noEmit
let tscOk = true;
try {
  execFileSync("npx", ["tsc", "--noEmit"], { cwd: ROOT, stdio: "pipe" });
} catch (error) {
  tscOk = false;
  const output = error && typeof error === "object" && "stdout" in error ? String((error as { stdout: Buffer }).stdout) : String(error);
  problems.push(`tsc --noEmit a échoué :\n${output}`);
}

// ---- Rapport ----
console.log(`\nPages contrôlées : ${pages.length} (dont ${migratedPages.length} migrées, comparées entre elles)`);
console.log(`Similarité max autorisée entre pages migrées (contenu principal, hors simulateur) : ${SIMILARITY_THRESHOLD * 100} %`);
console.log(`Part de contenu local minimale : ${LOCAL_SHARE_MIN * 100} % · Cible indicative (non bloquante) : ~${TOTAL_WORDS_TARGET} mots`);
console.log(`tsc --noEmit : ${tscOk ? "OK" : "ÉCHEC"}`);

if (migratedPages.length) {
  console.log(`\nPages migrées — détail (contenu principal, hors simulateur) :`);
  for (const p of migratedPages) {
    const shareStr = `${(p.localShare * 100).toFixed(0)} %`.padStart(4);
    const targetFlag = Math.abs(p.wordCount - TOTAL_WORDS_TARGET) > 250 ? "  ⚠ loin de la cible" : "";
    console.log(`  - ${p.file.padEnd(28)} ${p.wordCount} mots au total, ${p.localWordCount} locaux (${shareStr})${targetFlag}`);
  }
}

if (todoVerifier.length) {
  console.log(`\nTODO_VERIFIER à valider (${todoVerifier.length}) :`);
  for (const line of todoVerifier) console.log(`  - ${line}`);
} else {
  console.log("\nAucun TODO_VERIFIER.");
}

if (problems.length) {
  console.error(`\n${problems.length} problème(s) détecté(s) :`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log("\nAucun problème détecté.");

import { issyLesMoulineaux } from "./issy-les-moulineaux.ts";
import { boulogneBillancourt } from "./boulogne-billancourt.ts";
import { paris15e } from "./paris-15e.ts";
import { paris1e } from "./paris-1er.ts";
import { paris2e } from "./paris-2e.ts";
import { paris3e } from "./paris-3e.ts";
import { paris4e } from "./paris-4e.ts";
import { paris5e } from "./paris-5e.ts";
import { paris6e } from "./paris-6e.ts";
import { paris7e } from "./paris-7e.ts";
import { paris8e } from "./paris-8e.ts";
import { paris9e } from "./paris-9e.ts";
import { paris10e } from "./paris-10e.ts";
import { antony } from "./antony.ts";
import { asnieresSurSeine } from "./asnieres-sur-seine.ts";
import { bagneux } from "./bagneux.ts";
import { boisColombes } from "./bois-colombes.ts";
import { bourgLaReine } from "./bourg-la-reine.ts";
import { chatenayMalabry } from "./chatenay-malabry.ts";
import { chatillon } from "./chatillon.ts";
import { chaville } from "./chaville.ts";
import { clamart } from "./clamart.ts";
import { clichy } from "./clichy.ts";
import { colombes } from "./colombes.ts";
import { courbevoie } from "./courbevoie.ts";
import { fontenayAuxRoses } from "./fontenay-aux-roses.ts";
import { garches } from "./garches.ts";
import { gennevilliers } from "./gennevilliers.ts";
import { laGarenneColombes } from "./la-garenne-colombes.ts";
import { lePlessisRobinson } from "./le-plessis-robinson.ts";
import { levalloisPerret } from "./levallois-perret.ts";
import { malakoff } from "./malakoff.ts";
import { marnesLaCoquette } from "./marnes-la-coquette.ts";
import { meudon } from "./meudon.ts";
import { montrouge } from "./montrouge.ts";
import { nanterre } from "./nanterre.ts";
import { neuillySurSeine } from "./neuilly-sur-seine.ts";
import { puteaux } from "./puteaux.ts";
import { rueilMalmaison } from "./rueil-malmaison.ts";
import { saintCloud } from "./saint-cloud.ts";
import { sceaux } from "./sceaux.ts";
import { sevres } from "./sevres.ts";
import { suresnes } from "./suresnes.ts";
import { vanves } from "./vanves.ts";
import { vaucresson } from "./vaucresson.ts";
import { villeDAvray } from "./ville-d-avray.ts";
import { villeneuveLaGarenne } from "./villeneuve-la-garenne.ts";
import type { VilleData } from "./types.ts";

// Une entrée par ville migrée/créée.
// Consommé par scripts/build-site.cjs (Node ESM natif, extensions .ts requises) —
// voir ce fichier pour comment une nouvelle ville doit être ajoutée.
export const VILLES: VilleData[] = [
  issyLesMoulineaux,
  boulogneBillancourt,
  paris15e,
  paris1e,
  paris2e,
  paris3e,
  paris4e,
  paris5e,
  paris6e,
  paris7e,
  paris8e,
  paris9e,
  paris10e,
  antony,
  asnieresSurSeine,
  bagneux,
  boisColombes,
  bourgLaReine,
  chatenayMalabry,
  chatillon,
  chaville,
  clamart,
  clichy,
  colombes,
  courbevoie,
  fontenayAuxRoses,
  garches,
  gennevilliers,
  laGarenneColombes,
  lePlessisRobinson,
  levalloisPerret,
  malakoff,
  marnesLaCoquette,
  meudon,
  montrouge,
  nanterre,
  neuillySurSeine,
  puteaux,
  rueilMalmaison,
  saintCloud,
  sceaux,
  sevres,
  suresnes,
  vanves,
  vaucresson,
  villeDAvray,
  villeneuveLaGarenne
];

export const getVilleBySlug = (slug: string): VilleData | undefined => VILLES.find((v) => v.slug === slug);

export type { VilleData } from "./types.ts";

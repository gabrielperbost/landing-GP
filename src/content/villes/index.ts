import { issyLesMoulineaux } from "./issy-les-moulineaux.ts";
import { boulogneBillancourt } from "./boulogne-billancourt.ts";
import { paris15e } from "./paris-15e.ts";
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
import type { VilleData } from "./types.ts";

// Une entrée par ville migrée/créée.
// Consommé par scripts/build-site.cjs (Node ESM natif, extensions .ts requises) —
// voir ce fichier pour comment une nouvelle ville doit être ajoutée.
export const VILLES: VilleData[] = [
  issyLesMoulineaux,
  boulogneBillancourt,
  paris15e,
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
  courbevoie
];

export const getVilleBySlug = (slug: string): VilleData | undefined => VILLES.find((v) => v.slug === slug);

export type { VilleData } from "./types.ts";

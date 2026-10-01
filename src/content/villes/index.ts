import { issyLesMoulineaux } from "./issy-les-moulineaux.ts";
import { boulogneBillancourt } from "./boulogne-billancourt.ts";
import { paris15e } from "./paris-15e.ts";
import type { VilleData } from "./types.ts";

// Une entrée par ville migrée/créée.
// Consommé par scripts/build-site.cjs (Node ESM natif, extensions .ts requises) —
// voir ce fichier pour comment une nouvelle ville doit être ajoutée.
export const VILLES: VilleData[] = [issyLesMoulineaux, boulogneBillancourt, paris15e];

export const getVilleBySlug = (slug: string): VilleData | undefined => VILLES.find((v) => v.slug === slug);

export type { VilleData } from "./types.ts";

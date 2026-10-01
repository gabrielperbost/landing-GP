import { issyLesMoulineaux } from "./issy-les-moulineaux.ts";
import type { VilleData } from "./types.ts";

// Une entrée par ville migrée/créée. Pilote : Issy-les-Moulineaux uniquement.
// Consommé par scripts/build-site.cjs (Node ESM natif, extensions .ts requises) —
// voir ce fichier pour comment une nouvelle ville doit être ajoutée.
export const VILLES: VilleData[] = [issyLesMoulineaux];

export const getVilleBySlug = (slug: string): VilleData | undefined => VILLES.find((v) => v.slug === slug);

export type { VilleData } from "./types.ts";

import { issyLesMoulineaux } from "./issy-les-moulineaux";
import type { VilleData } from "./types";

// Une entrée par ville migrée/créée. Pilote : Issy-les-Moulineaux uniquement.
export const VILLES: VilleData[] = [issyLesMoulineaux];

export const getVilleBySlug = (slug: string): VilleData | undefined => VILLES.find((v) => v.slug === slug);

export type { VilleData } from "./types";

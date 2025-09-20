import {
    CATEGORIES,
    DIFFICULTIES,
    TIP_TYPES,
    CUISINES,
    DIETS,
    TECHNIQUES,
    OCCASIONS,
    type CategorySlug,
    type DifficultySlug,
    type TipType,
    type CuisineSlug,
    type DietSlug,
    type TechniqueSlug,
    type OccasionSlug,
} from "@/constants/taxonomies";

function makeGuard<T extends string>(values: readonly { value: T; label: string }[]) {
    const set = new Set(values.map((v) => v.value));
    return (v: unknown): v is T => typeof v === "string" && set.has(v as T);
}

export const isCategorySlug = makeGuard<CategorySlug>(CATEGORIES);
export const isDifficultySlug = makeGuard<DifficultySlug>(DIFFICULTIES);
export const isTipType = makeGuard<TipType>(TIP_TYPES);
export const isCuisineSlug = makeGuard<CuisineSlug>(CUISINES);
export const isDietSlug = makeGuard<DietSlug>(DIETS);
export const isTechniqueSlug = makeGuard<TechniqueSlug>(TECHNIQUES);
export const isOccasionSlug = makeGuard<OccasionSlug>(OCCASIONS);
export type SiteOverride = "auto" | "forcar_exibir" | "forcar_ocultar";

export function isSiteOverride(v: unknown): v is SiteOverride {
    return v === "auto" || v === "forcar_exibir" || v === "forcar_ocultar";
}

/** Converts raw DB string into strict union (or null if invalid). */
export function normalizeSiteOverride(v: unknown): SiteOverride | null {
    return isSiteOverride(v) ? v : null;
}

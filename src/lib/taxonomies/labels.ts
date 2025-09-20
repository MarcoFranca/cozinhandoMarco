import {
    CATEGORY_LABELS,
    DIFFICULTY_LABELS,
    STATUS_LABELS,
    TIP_TYPE_LABELS,
    TIP_TYPE_ICONS,
    CUISINE_LABELS,
    DIET_LABELS,
    TECHNIQUE_LABELS,
    OCCASION_LABELS,
} from "@/constants/taxonomies";

export function labelForCategory(slug?: string | null): string {
    if (!slug) return "—";
    return (CATEGORY_LABELS as Record<string, string>)[slug] ?? slug;
}
export function labelForDifficulty(slug?: string | null): string {
    if (!slug) return "—";
    return (DIFFICULTY_LABELS as Record<string, string>)[slug] ?? slug;
}
export function labelForStatus(slug?: string | null): string {
    if (!slug) return "—";
    return (STATUS_LABELS as Record<string, string>)[slug] ?? slug;
}
export function labelForTipType(slug?: string | null): string {
    if (!slug) return "—";
    return (TIP_TYPE_LABELS as Record<string, string>)[slug] ?? slug;
}
export function iconForTipType(slug?: string | null): string {
    if (!slug) return "";
    return (TIP_TYPE_ICONS as Record<string, string>)[slug] ?? "";
}

export function labelForCuisine(slug?: string | null): string {
    if (!slug) return "—";
    return (CUISINE_LABELS as Record<string, string>)[slug] ?? slug;
}
export function labelForDiet(slug?: string | null): string {
    if (!slug) return "—";
    return (DIET_LABELS as Record<string, string>)[slug] ?? slug;
}
export function labelForTechnique(slug?: string | null): string {
    if (!slug) return "—";
    return (TECHNIQUE_LABELS as Record<string, string>)[slug] ?? slug;
}
export function labelForOccasion(slug?: string | null): string {
    if (!slug) return "—";
    return (OCCASION_LABELS as Record<string, string>)[slug] ?? slug;
}

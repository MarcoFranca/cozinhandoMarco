import type { DifficultySlug, CategorySlug } from "@/constants/taxonomies";
import { isCategorySlug } from "./guards";

const DIFFICULTY_ALIASES: Record<string, DifficultySlug> = {
    iniciante: "iniciante",
    beginner: "iniciante",
    facil: "iniciante",
    fácil: "iniciante",
    easy: "iniciante",

    intermediario: "intermediario",
    intermediário: "intermediario",
    medio: "intermediario",
    médio: "intermediario",
    medium: "intermediario",

    avancado: "avancado",
    avançado: "avancado",
    dificil: "avancado",
    difícil: "avancado",
    hard: "avancado",
};

export function normalizeDifficulty(value?: string | null): DifficultySlug | null {
    if (!value) return null;
    const key = String(value).trim().toLowerCase();
    return DIFFICULTY_ALIASES[key] ?? null;
}

/** naive, but keeps us safe */
export function normalizeCategory(value?: string | null): CategorySlug | null {
    if (!value) return null;
    const key = String(value).trim().toLowerCase().replace(/\s+/g, "-");
    return isCategorySlug(key) ? (key as CategorySlug) : null;
}

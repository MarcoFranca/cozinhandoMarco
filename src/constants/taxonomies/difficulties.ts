export type DifficultySlug = "iniciante" | "intermediario" | "avancado";

export const DIFFICULTY_LABELS: Record<DifficultySlug, string> = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado",
};

export const DIFFICULTIES: { value: DifficultySlug; label: string }[] =
    (Object.keys(DIFFICULTY_LABELS) as DifficultySlug[]).map((value) => ({
        value,
        label: DIFFICULTY_LABELS[value],
    }));

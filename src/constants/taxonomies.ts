// src/constants/taxonomies.ts

/** -------- Categorias (DB em EN, UI em PT) -------- */
export type CategoryValue =
    | "Pasta"
    | "Meat"
    | "Fish"
    | "Dessert"
    | "Sauce"
    | "Drink"
    | "Side"
    | "Soup"
    | "Preserve";

export const CATEGORY_LABEL: Record<CategoryValue, string> = {
    Pasta: "Massa",
    Meat: "Carne",
    Fish: "Peixe",
    Dessert: "Doce",
    Sauce: "Molho",
    Drink: "Bebida",
    Side: "Acompanhamento",
    Soup: "Sopa",
    Preserve: "Conserva",
};

export const CATEGORIES = (Object.keys(CATEGORY_LABEL) as CategoryValue[]).map(
    (value) => ({ value, label: CATEGORY_LABEL[value] })
);

export function categoryLabel(value?: string | null): string {
    if (!value) return "—";
    return (CATEGORY_LABEL as Record<string, string>)[value] ?? value;
}

/** -------- Status -------- */
export type RecipeStatus = "idea" | "tested" | "recorded" | "edited" | "published";

export const STATUS_LABEL: Record<RecipeStatus, string> = {
    idea: "Ideia",
    tested: "Testada",
    recorded: "Gravada",
    edited: "Editada",
    published: "Publicada",
};

export const STATUSES = (Object.keys(STATUS_LABEL) as RecipeStatus[]).map(
    (value) => ({ value, label: STATUS_LABEL[value] })
);

export function statusLabel(value?: string | null): string {
    if (!value) return "—";
    return (STATUS_LABEL as Record<string, string>)[value] ?? value;
}

/** -------- Dificuldade -------- */
export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
};

export const DIFFICULTIES = (Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map(
    (value) => ({ value, label: DIFFICULTY_LABEL[value] })
);

export function difficultyLabel(value?: string | null): string {
    if (!value) return "—";
    return (DIFFICULTY_LABEL as Record<string, string>)[value] ?? value;
}

// === Recordings ===
export const RECORDING_STATUSES = [
    { value: "planning",     label: "Planejamento" },
    { value: "checklist_ok", label: "Checklist OK" },
    { value: "ready",        label: "Pronta p/ gravar" },
    { value: "shot",         label: "Gravada" },
    { value: "discarded",    label: "Descartada" },
] as const;

export type RecordingStatus = typeof RECORDING_STATUSES[number]["value"];

export const RECORDING_STATUS_LABELS: Record<RecordingStatus, string> =
    Object.fromEntries(RECORDING_STATUSES.map(s => [s.value, s.label])) as Record<RecordingStatus, string>;

/** Type guard pra o TS saber que é um RecordingStatus válido */
export function isRecordingStatus(v: unknown): v is RecordingStatus {
    return RECORDING_STATUSES.some(s => s.value === v);
}

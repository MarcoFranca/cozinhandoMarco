export type RecipeStatus =
    | "idea"
    | "tested"
    | "recorded"
    | "edited"
    | "scheduled"
    | "published"
    | "archived";

export const STATUS_LABELS: Record<RecipeStatus, string> = {
    idea: "Ideia",
    tested: "Testada",
    recorded: "Gravada",
    edited: "Editada",
    scheduled: "Agendada",
    published: "Publicada",
    archived: "Arquivada",
};

export const STATUSES: { value: RecipeStatus; label: string }[] =
    (Object.keys(STATUS_LABELS) as RecipeStatus[]).map((value) => ({
        value,
        label: STATUS_LABELS[value],
    }));

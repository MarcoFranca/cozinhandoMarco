export type DietSlug =
    | "vegetariano"
    | "vegano"
    | "sem-gluten"
    | "sem-lactose"
    | "low-carb"
    | "high-protein"
    | "sem-acucar"
    | "cetogenica"
    | "paleo";

export const DIET_LABELS: Record<DietSlug, string> = {
    vegetariano: "Vegetariano",
    vegano: "Vegano",
    "sem-gluten": "Sem glúten",
    "sem-lactose": "Sem lactose",
    "low-carb": "Low carb",
    "high-protein": "Rica em proteína",
    "sem-acucar": "Sem açúcar",
    cetogenica: "Cetogênica",
    paleo: "Paleo",
};

export const DIETS: { value: DietSlug; label: string }[] =
    (Object.keys(DIET_LABELS) as DietSlug[]).map((value) => ({
        value,
        label: DIET_LABELS[value],
    }));

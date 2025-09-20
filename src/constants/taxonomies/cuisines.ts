export type CuisineSlug =
    | "brasileira"
    | "mineira"
    | "nordestina"
    | "italiana"
    | "francesa"
    | "portuguesa"
    | "mediterranea"
    | "japonesa"
    | "chinesa"
    | "thai"
    | "indiana"
    | "mexicana"
    | "arabe";

export const CUISINE_LABELS: Record<CuisineSlug, string> = {
    brasileira: "Brasileira",
    mineira: "Mineira",
    nordestina: "Nordestina",
    italiana: "Italiana",
    francesa: "Francesa",
    portuguesa: "Portuguesa",
    mediterranea: "Mediterrânea",
    japonesa: "Japonesa",
    chinesa: "Chinesa",
    thai: "Tailandesa",
    indiana: "Indiana",
    mexicana: "Mexicana",
    arabe: "Árabe",
};

export const CUISINES: { value: CuisineSlug; label: string }[] =
    (Object.keys(CUISINE_LABELS) as CuisineSlug[]).map((value) => ({
        value,
        label: CUISINE_LABELS[value],
    }));

export type TechniqueSlug =
    | "assar"
    | "grelhar"
    | "selar"
    | "brasear"
    | "saltear"
    | "cozer-vapor"
    | "fritar-imersao"
    | "forno-baixo-e-lento"
    | "sous-vide"
    | "confitar"
    | "emulsionar"
    | "fermentar"
    | "caramelizar";

export const TECHNIQUE_LABELS: Record<TechniqueSlug, string> = {
    assar: "Assar",
    grelhar: "Grelhar",
    selar: "Selar",
    brasear: "Brasear",
    saltear: "Saltear",
    "cozer-vapor": "Cozer no vapor",
    "fritar-imersao": "Fritura por imersão",
    "forno-baixo-e-lento": "Forno baixo e lento",
    "sous-vide": "Sous-vide",
    confitar: "Confitar",
    emulsionar: "Emulsionar",
    fermentar: "Fermentar",
    caramelizar: "Caramelizar",
};

export const TECHNIQUES: { value: TechniqueSlug; label: string }[] =
    (Object.keys(TECHNIQUE_LABELS) as TechniqueSlug[]).map((value) => ({
        value,
        label: TECHNIQUE_LABELS[value],
    }));

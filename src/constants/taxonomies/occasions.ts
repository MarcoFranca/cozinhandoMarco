export type OccasionSlug =
    | "almoco-rapido"
    | "jantar-de-semana"
    | "domingo-em-familia"
    | "brunch"
    | "churrasco"
    | "aniversario"
    | "dia-dos-namorados"
    | "natal"
    | "ano-novo";

export const OCCASION_LABELS: Record<OccasionSlug, string> = {
    "almoco-rapido": "Almoço rápido",
    "jantar-de-semana": "Jantar de semana",
    "domingo-em-familia": "Domingo em família",
    brunch: "Brunch",
    churrasco: "Churrasco",
    aniversario: "Aniversário",
    "dia-dos-namorados": "Dia dos Namorados",
    natal: "Natal",
    "ano-novo": "Ano Novo",
};

export const OCCASIONS: { value: OccasionSlug; label: string }[] =
    (Object.keys(OCCASION_LABELS) as OccasionSlug[]).map((value) => ({
        value,
        label: OCCASION_LABELS[value],
    }));

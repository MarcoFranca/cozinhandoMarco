export type CategorySlug =
    | "carnes"
    | "aves"
    | "peixes-frutos-do-mar"
    | "massas"
    | "risotos-e-graos"
    | "acompanhamentos"
    | "saladas"
    | "sopas-e-caldos"
    | "molhos"
    | "fundos-e-caldos"
    | "picles-e-conservas"
    | "pao-e-massas-basicas"
    | "sobremesas"
    | "bebidas"
    | "entradas-e-petiscos"
    | "sanduiches-e-tostas";

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
    carnes: "Carnes",
    aves: "Aves",
    "peixes-frutos-do-mar": "Peixes & Frutos do Mar",
    massas: "Massas",
    "risotos-e-graos": "Risotos & Grãos",
    acompanhamentos: "Acompanhamentos",
    saladas: "Saladas",
    "sopas-e-caldos": "Sopas & Caldos",
    molhos: "Molhos",
    "fundos-e-caldos": "Fundos & Caldos-base",
    "picles-e-conservas": "Picles & Conservas",
    "pao-e-massas-basicas": "Pães & Massas básicas",
    sobremesas: "Sobremesas",
    bebidas: "Bebidas",
    "entradas-e-petiscos": "Entradas & Petiscos",
    "sanduiches-e-tostas": "Sanduíches & Tostas",
};

export const CATEGORIES: { value: CategorySlug; label: string }[] =
    (Object.keys(CATEGORY_LABELS) as CategorySlug[]).map((value) => ({
        value,
        label: CATEGORY_LABELS[value],
    }));

/** #############################################
 *  Tipos de domínio – Cozinhando com Marco
 *  (centralize todos os tipos aqui)
 * ############################################# */
import {RecordingStatus} from "@/constants/taxonomies";

export type UUID = string;
export type ISODate = string; // ex.: "2025-03-30T12:34:56.000Z"

/* ============== ENUMS SUGERIDOS (ajuste se necessário) ============== */
// status da receita (tabela recipes.status)
export const RecipeStatuses = ["idea", "tested", "recorded", "edited", "published"] as const;
export type RecipeStatus = (typeof RecipeStatuses)[number];

// dificuldade da receita (recipes.difficulty)
export const Difficulties = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof Difficulties)[number];

// status da gravação (recordings.shoot_status)
// Ajuste se já tiver valores padronizados no BD.
export const ShootStatuses = ["planned", "recorded", "edited", "published"] as const;
export type ShootStatus = (typeof ShootStatuses)[number];

/* ===================== HELPERS DE TYPE GUARD ======================== */
export const isRecipeStatus = (v: string): v is RecipeStatus =>
    (RecipeStatuses as readonly string[]).includes(v);
export const isDifficulty = (v: string): v is Difficulty =>
    (Difficulties as readonly string[]).includes(v);
export const isShootStatus = (v: string): v is ShootStatus =>
    (ShootStatuses as readonly string[]).includes(v);

/* ========================= recipes ========================= */
export type RecipeRow = {
    id: UUID;
    user_id: UUID;
    name: string;
    category: string | null;         // ex.: "Pasta", "Meat", etc.
    instructions: string | null;     // texto rico/markdown
    status: RecipeStatus;            // "idea" | "tested" | ...
    prep_time_minutes: number | null;
    difficulty: Difficulty | null;   // "easy" | "medium" | "hard" | null
    youtube_url: string | null;
    cover_url: string | null;
    created_at: ISODate;
    updated_at: ISODate;
};

export type RecipeInsert = {
    user_id: UUID;
    name: string;
    category?: string | null;
    instructions?: string | null;
    status?: RecipeStatus;              // default: "idea"
    prep_time_minutes?: number | null;
    difficulty?: Difficulty | null;
    youtube_url?: string | null;
    cover_url?: string | null;
};

export type RecipeUpdate = Partial<
    Omit<RecipeRow, "id" | "user_id" | "created_at" | "updated_at">
>;

/* View usada na listagem (idêntica ao seu select na página) */
export type RecipeWithCountsRow = Pick<
    RecipeRow,
    "id" | "user_id" | "name" | "category" | "status" | "prep_time_minutes" | "difficulty" | "updated_at"
> & {
    ingredients_count: number; // vindo da view
};

/* ===================== recipe_ingredients ===================== */
export type RecipeIngredientRow = {
    id: UUID;
    user_id: UUID;
    recipe_id: UUID;
    name: string;                 // "farinha de trigo", "ovo", etc.
    amount: number | null;        // 200, 2, 1.5...
    unit: string | null;          // "g", "kg", "xíc", "un", etc.
    note: string | null;          // "fina", "orgânica", "amassar", etc.
    optional: boolean;            // ingrediente opcional?
    position: number;             // ordenação
    created_at: ISODate;
    updated_at: ISODate;
};

export type RecipeIngredientInsert = Omit<
    RecipeIngredientRow,
    "id" | "created_at" | "updated_at"
>;

export type RecipeIngredientUpdate = Partial<
    Omit<RecipeIngredientRow, "id" | "user_id" | "recipe_id" | "created_at" | "updated_at">
>;

/* ===================== recipe_instructions ===================== */
export type RecipeInstructionRow = {
    id: UUID;
    user_id: UUID;
    recipe_id: UUID;
    step: number;               // 1, 2, 3...
    text: string;               // texto do passo
    duration_minutes: number | null;
    created_at: ISODate;
    updated_at: ISODate;
};

export type RecipeInstructionInsert = Omit<
    RecipeInstructionRow,
    "id" | "created_at" | "updated_at"
>;

export type RecipeInstructionUpdate = Partial<
    Omit<RecipeInstructionRow, "id" | "user_id" | "recipe_id" | "created_at" | "updated_at">
>;

/* ===================== shopping_list_items ===================== */
export type ShoppingListItemRow = {
    id: UUID;
    user_id: UUID;
    recipe_id: UUID | null;     // pode existir item avulso
    ingredient_name: string;    // nome simples para exibir na lista
    quantity: number | null;    // número bruto
    note: string | null;        // observação
    in_pantry: boolean;         // já tenho?
    recipe_ingredient_id: UUID | null; // referência ao item de ingrediente (se houver)
    created_at: ISODate;
    updated_at: ISODate;
};

export type ShoppingListItemInsert = Omit<
    ShoppingListItemRow,
    "id" | "created_at" | "updated_at"
>;

export type ShoppingListItemUpdate = Partial<
    Omit<ShoppingListItemRow, "id" | "user_id" | "created_at" | "updated_at">
>;

/* ========================= recordings ========================= */
export type RecordingRow = {
    id: UUID;
    user_id: UUID;
    recipe_id: UUID | null;          // gravação pode estar ligada a uma receita
    shoot_date: string | null;       // ex.: "2025-04-12" (YYYY-MM-DD)
    shoot_status: RecordingStatus  | null;
    equipment_checklist: Record<string, unknown> | null; // JSONB – pode tipar melhor depois
    scene_notes: string | null;
    created_at: ISODate;
    updated_at: ISODate;
};

export type RecordingInsert = Omit<
    RecordingRow,
    "id" | "created_at" | "updated_at"
>;

export type RecordingUpdate = Partial<
    Omit<RecordingRow, "id" | "user_id" | "created_at" | "updated_at">
>;

/* =================== Helpers de “map” do DB → Domínio =================== */
/** Normaliza strings vindas do DB para os unions do domínio. */
export function normalizeRecipeRow(r: {
    status: string | null;
    difficulty: string | null;
} & Omit<RecipeRow, "status" | "difficulty">): RecipeRow {
    const status = isRecipeStatus(r.status ?? "") ? (r.status as RecipeStatus) : "idea";
    const difficulty = r.difficulty && isDifficulty(r.difficulty) ? (r.difficulty as Difficulty) : null;
    return { ...r, status, difficulty };
}

/** Normaliza a view de listagem */
export function normalizeRecipeWithCountsRow(r: {
    status: string | null;
    difficulty: string | null;
    ingredients_count: number;
} & Omit<RecipeWithCountsRow, "status" | "difficulty">): RecipeWithCountsRow {
    const status = isRecipeStatus(r.status ?? "") ? (r.status as RecipeStatus) : "idea";
    const difficulty = r.difficulty && isDifficulty(r.difficulty) ? (r.difficulty as Difficulty) : null;
    return { ...r, status, difficulty };
}

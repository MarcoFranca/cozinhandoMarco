export type RecipeStatus = "idea" | "tested" | "recorded" | "edited" | "published";
export type Difficulty   = "easy" | "medium" | "hard";

export type Recipe = {
    id: string;
    user_id: string;
    name: string;
    category: string | null;
    ingredients?: string | null;   // se estiver usando
    instructions?: string | null;  // se estiver usando
    status: RecipeStatus;
    prep_time_minutes: number | null;  // <— aqui
    difficulty: Difficulty | null;
    youtube_url?: string | null;
    cover_url?: string | null;
    created_at?: string;            // opcional
    updated_at: string;
};

export type RecipeIngredient = {
    id: string;
    user_id: string;
    recipe_id: string;
    name: string;
    amount: number | null;
    unit: string | null;
    note: string | null;
    optional: boolean;
    position: number;
    created_at: string;
    updated_at: string;
};

export type RecipeInstruction = {
    id: string;
    user_id: string;
    recipe_id: string;
    step: number;
    text: string;
    duration_minutes: number | null;
    created_at: string;
    updated_at: string;
};

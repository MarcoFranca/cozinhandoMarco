// src/lib/recipes/public-loaders.ts
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";

/** --- Tipos compartilhados --- */
export type Ingredient = {
    id?: string;
    name: string;
    amount: number | null;
    unit: string | null;
    optional: boolean | null;
    position: number | null;
};

export type Instruction = {
    id: string;
    step: number;
    text: string;
    duration_minutes: number | null;
    technique_id?: string | null;
};

export type TipType = "tip" | "swap" | "alert";

export type RecipeTip = {
    id: string;
    type: TipType;
    title: string | null;
    text: string;
    position: number | null;
    instruction_id: string | null;
    recipe_ingredient_id: string | null;
    created_at: string;
    updated_at: string;
};

export type TaxonomyItem = { slug: string; label: string };

export type DifficultySlug = "iniciante" | "intermediario" | "avancado";

export type DetailBase = {
    site_slug: string;
    name: string;
    short_description: string | null;
    description: string | null;
    cover_url: string | null;
    youtube_url: string | null;
    preferir_link_youtube: boolean;
    prep_time_minutes: number | null;
    difficulty_slug: DifficultySlug | null;
    publicado_at: string | null;
    ingredients: Ingredient[];
};

/** Linhas usadas nas consultas (tipos de transporte) */
type RpcDetailRow = {
    site_slug: string;
    name: string;
    short_description: string | null;
    description: string | null;
    cover_url: string | null;
    youtube_url: string | null;
    preferir_link_youtube: boolean | null;
    prep_time_minutes: number | null;
    difficulty_slug: DifficultySlug | null;
    publicado_at: string | null;
    ingredients?: Ingredient[]; // quando o RPC já retorna ingredientes
};

type FallbackRecipeRow = {
    site_slug: string;
    name: string;
    short_description: string | null;
    description: string | null;
    cover_url: string | null;
    youtube_url: string | null;
    preferir_link_youtube: boolean | null;
    prep_time_minutes: number | null;
    difficulty_slug: DifficultySlug | null;
    publicado_at: string | null;
};

type TechniqueRow = {
    id: string;
    slug: string;
    label_ptbr: string;
};

type RpcTaxonomies = Partial<{
    categories: TaxonomyItem[];
    cuisines: TaxonomyItem[];
    diet_labels: TaxonomyItem[];
    diet: TaxonomyItem[]; // fallback legacy
    techniques: TaxonomyItem[];
    occasions: TaxonomyItem[];
}>;

export async function fetchRecipeIdBySlug(slug: string): Promise<string | null> {
    const supabase = await createSupabaseRSCClient();
    const { data, error } = await supabase
        .from("recipes")
        .select("id")
        .eq("site_slug", slug)
        .maybeSingle();

    if (error) console.error("[fetchRecipeIdBySlug]", error);
    return data?.id ?? null;
}

/** Base detail com FALLBACK garantido para description e ingredients */
export async function fetchBaseDetail(slug: string): Promise<DetailBase | null> {
    const supabase = await createSupabaseRSCClient();

    // 1) RPC primeiro
    const { data: rpcData, error: rpcErr } = await supabase.rpc("get_public_recipe_detail", {
        p_slug: slug,
    });
    if (rpcErr) console.warn("[get_public_recipe_detail]", rpcErr);

    const fromRpc: Partial<RpcDetailRow> | undefined = Array.isArray(rpcData)
        ? (rpcData[0] as Partial<RpcDetailRow>)
        : undefined;

    // 2) Sempre garantimos description/ingredients via fallback se faltarem
    const recipeId = await fetchRecipeIdBySlug(slug);

    let fallbackRow: FallbackRecipeRow | null = null;
    if (!fromRpc?.description || !(fromRpc?.ingredients && fromRpc.ingredients.length > 0)) {
        const { data: row } = await supabase
            .from("recipes")
            .select(
                "site_slug,name,short_description,description,cover_url,youtube_url,preferir_link_youtube,prep_time_minutes,difficulty_slug,publicado_at",
            )
            .eq("site_slug", slug)
            .maybeSingle<FallbackRecipeRow>();
        fallbackRow = row ?? null;
    }

    let fallbackIngredients: Ingredient[] = [];
    if (!(fromRpc?.ingredients && fromRpc.ingredients.length > 0) && recipeId) {
        const { data: ings } = await supabase
            .from("recipe_ingredients")
            .select("id,name,amount,unit,optional,position")
            .eq("recipe_id", recipeId)
            .order("position", { ascending: true });
        fallbackIngredients = (ings ?? []) as Ingredient[];
    }

    if (!fromRpc && !fallbackRow) return null;

    const difficulty =
        (fromRpc?.difficulty_slug ?? fallbackRow?.difficulty_slug ?? null) as DifficultySlug | null;

    return {
        site_slug: fromRpc?.site_slug ?? (fallbackRow as FallbackRecipeRow).site_slug,
        name: fromRpc?.name ?? (fallbackRow as FallbackRecipeRow).name,
        short_description:
            fromRpc?.short_description ?? (fallbackRow ? fallbackRow.short_description : null),
        description: fromRpc?.description ?? (fallbackRow ? fallbackRow.description : null),
        cover_url: fromRpc?.cover_url ?? (fallbackRow ? fallbackRow.cover_url : null),
        youtube_url: fromRpc?.youtube_url ?? (fallbackRow ? fallbackRow.youtube_url : null),
        preferir_link_youtube:
            (fromRpc?.preferir_link_youtube ??
                (fallbackRow ? fallbackRow.preferir_link_youtube : null)) ?? false,
        prep_time_minutes:
            fromRpc?.prep_time_minutes ?? (fallbackRow ? fallbackRow.prep_time_minutes : null),
        difficulty_slug: difficulty,
        publicado_at: fromRpc?.publicado_at ?? (fallbackRow ? fallbackRow.publicado_at : null),
        ingredients:
            (fromRpc?.ingredients as Ingredient[] | undefined) && fromRpc!.ingredients!.length > 0
                ? (fromRpc!.ingredients as Ingredient[])
                : fallbackIngredients,
    };
}

export async function fetchInstructions(recipeId: string): Promise<Instruction[]> {
    const supabase = await createSupabaseRSCClient();
    const { data, error } = await supabase
        .from("recipe_instructions")
        .select("id, step, text, duration_minutes, technique_id")
        .eq("recipe_id", recipeId)
        .order("step", { ascending: true });

    if (error) console.error("[fetchInstructions]", error);
    return (data ?? []) as Instruction[];
}

export async function fetchTips(recipeId: string): Promise<RecipeTip[]> {
    const supabase = await createSupabaseRSCClient();
    const { data, error } = await supabase
        .from("recipe_tips")
        .select(
            "id, type, title, text, position, instruction_id, recipe_ingredient_id, created_at, updated_at",
        )
        .eq("recipe_id", recipeId)
        .order("position", { ascending: true });

    if (error) console.error("[fetchTips]", error);
    return (data ?? []) as RecipeTip[];
}

export type RecipeTaxonomies = {
    categories: TaxonomyItem[];
    cuisines: TaxonomyItem[];
    diet_labels: TaxonomyItem[];
    techniques: TaxonomyItem[];
    occasions: TaxonomyItem[];
};

export async function fetchTaxonomies(recipeId: string): Promise<RecipeTaxonomies> {
    const supabase = await createSupabaseRSCClient();
    const { data, error } = await supabase.rpc("get_recipe_taxonomies", { p_recipe_id: recipeId });

    if (error) console.error("[get_recipe_taxonomies]", error);

    const d: RpcTaxonomies = (data ?? {}) as RpcTaxonomies;

    return {
        categories: Array.isArray(d.categories) ? d.categories : [],
        cuisines: Array.isArray(d.cuisines) ? d.cuisines : [],
        diet_labels: Array.isArray(d.diet_labels)
            ? d.diet_labels
            : Array.isArray(d.diet)
                ? d.diet
                : [],
        techniques: Array.isArray(d.techniques) ? d.techniques : [],
        occasions: Array.isArray(d.occasions) ? d.occasions : [],
    };
}

export async function fetchTechniquesMap(): Promise<
    Record<string, { slug: string; label: string }>
> {
    const supabase = await createSupabaseRSCClient();
    const { data, error } = await supabase
        .from("techniques")
        .select("id, slug, label_ptbr");

    if (error) {
        console.error("[fetchTechniquesMap]", error);
        return {};
    }

    const rows = (data ?? []) as TechniqueRow[];
    const map: Record<string, { slug: string; label: string }> = {};

    rows.forEach((t) => {
        map[t.id] = { slug: t.slug, label: t.label_ptbr };
    });

    return map;
}

/** --- Agrupadores --- */
export function groupTipsByType(tips: RecipeTip[]) {
    return {
        tip: tips.filter((t) => t.type === "tip"),
        swap: tips.filter((t) => t.type === "swap"),
        alert: tips.filter((t) => t.type === "alert"),
    };
}

export function groupTipsByInstruction(tips: RecipeTip[]): Map<string, RecipeTip[]> {
    const map = new Map<string, RecipeTip[]>();

    for (const t of tips) {
        if (!t.instruction_id) continue;
        const arr = map.get(t.instruction_id) ?? [];
        arr.push(t);
        map.set(t.instruction_id, arr);
    }

    for (const [k, arr] of map) {
        arr.sort((a, b) => {
            const pa = a.position ?? Number.MAX_SAFE_INTEGER;
            const pb = b.position ?? Number.MAX_SAFE_INTEGER;
            if (pa !== pb) return pa - pb;
            return a.created_at.localeCompare(b.created_at);
        });
        map.set(k, arr);
    }

    return map;
}

export function groupTipsByIngredient(tips: RecipeTip[]): Record<string, RecipeTip[]> {
    const byIng: Record<string, RecipeTip[]> = {};

    for (const t of tips) {
        if (!t.recipe_ingredient_id) continue;
        const key = t.recipe_ingredient_id;
        (byIng[key] ??= []).push(t);
    }

    Object.values(byIng).forEach((arr) => {
        arr.sort((a, b) => {
            const pa = a.position ?? Number.MAX_SAFE_INTEGER;
            const pb = b.position ?? Number.MAX_SAFE_INTEGER;
            if (pa !== pb) return pa - pb;
            return a.created_at.localeCompare(b.created_at);
        });
    });

    return byIng;
}

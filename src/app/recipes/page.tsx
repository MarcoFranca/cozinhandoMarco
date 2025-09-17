// app/recipes/page.tsx
import { requireUser } from "@/lib/auth";
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import { RecipesHeader } from "@/components/recipes/RecipesHeader";
import { RecipesTable } from "@/components/recipes/RecipesTable";
import { NewRecipeDialog } from "@/components/recipes/NewRecipeDialog";

import {
    RecipeWithCountsRow,
    normalizeRecipeWithCountsRow,
} from "@/types/db";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
    const { user } = await requireUser();
    const supabase = await createSupabaseRSCClient();

    const { data } = await supabase
        .from("recipes_with_counts")
        .select(
            "id, user_id, name, category, status, prep_time_minutes, difficulty, updated_at, ingredients_count"
        )
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(200)
        .returns<
            Array<
                Omit<RecipeWithCountsRow, "status" | "difficulty"> & {
                status: string | null;
                difficulty: string | null;
            }
            >
        >();

    // normaliza para os unions do app
    const recipes: RecipeWithCountsRow[] = (data ?? []).map(
        normalizeRecipeWithCountsRow
    );

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-6">
            <RecipesHeader total={recipes.length} />
            <NewRecipeDialog />
            <RecipesTable initialData={recipes} />
        </div>
    );
}

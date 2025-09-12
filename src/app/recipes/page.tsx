import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import { Recipe } from "@/types/recipe";
import { RecipesHeader } from "@/components/recipes/RecipesHeader";
import { RecipesTable } from "@/components/recipes/RecipesTable";
import {NewRecipeDialog} from "@/components/recipes/NewRecipeDialog";

export const dynamic = "force-dynamic"; // garante fresh em dev sem cache agressivo

export default async function RecipesPage() {
    const supabase = await createSupabaseRSCClient();

    // Busca inicial (MVP: 100 itens; dá pra paginar depois)
    const { data } = await supabase
        .from("recipes")
        .select("id, user_id, name, category, status, prep_time_minutes, difficulty, updated_at") // <—
        .order("updated_at", { ascending: false })
        .limit(100);

    const recipes = (data ?? []) as Recipe[];

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-6">
            <RecipesHeader total={recipes.length} />
            <RecipesTable initialData={recipes} />
            {/* Dialog controlado por query ?new=1 */}
            <NewRecipeDialog />
        </div>
    );
}

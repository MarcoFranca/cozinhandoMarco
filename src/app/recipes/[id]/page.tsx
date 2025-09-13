import { notFound } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import {IngredientRow, Recipe} from "@/types/recipe";
import { RecipeGeneralForm } from "@/components/recipes/RecipeGeneralForm";
import { RecipeIngredientsTab } from "@/components/recipes/RecipeIngredientsTab";

type Props = { params: { id: string } };

export default async function RecipeDetailPage({ params }: Props) {
    const supabase = await createSupabaseRSCClient();

    const { data: rec } = await supabase
        .from("recipes")
        .select("id, user_id, name, category, status, prep_time_minutes, difficulty, ingredients, instructions, youtube_url, cover_url, updated_at")
        .eq("id", params.id)
        .single();

    if (!rec) notFound();

    const { data: ingredients } = await supabase
        .from("recipe_ingredients")
        .select("id, recipe_id, name, amount, unit, note, optional, position")
        .eq("recipe_id", params.id)
        .order("position", { ascending: true });

    const { data: shoppingLinks } = await supabase
        .from("shopping_list_items")
        .select("recipe_ingredient_id")
        .eq("recipe_id", params.id)
        .not("recipe_ingredient_id", "is", null);

    const inShoppingIds: string[] = (shoppingLinks ?? [])
        .map((r) => r.recipe_ingredient_id as string);

    const recipe = rec as Recipe;

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{recipe.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        Editar ficha • Atualizado: {new Date(recipe.updated_at).toLocaleString("pt-BR")}
                    </p>
                </div>
            </header>

            {/* Abas (MVP: Geral + Ingredientes) */}
            <section className="rounded-2xl border">
                <div className="border-b px-4 py-3 font-medium">Geral</div>
                <div className="p-4">
                    <RecipeGeneralForm recipe={recipe} />
                </div>
            </section>

            <section className="rounded-2xl border">
                <div className="border-b px-4 py-3 font-medium">Ingredientes</div>
                <div className="p-4">
                    <RecipeIngredientsTab
                        recipeId={recipe.id}
                        items={(ingredients ?? []) as IngredientRow[]}   // ✅ sem any
                        inShoppingIds={inShoppingIds}
                    />
                </div>
            </section>
        </div>
    );
}

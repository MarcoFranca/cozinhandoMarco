"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getClientAndUser, sanitizeStr } from "./common";

export async function createRecipeAction(formData: FormData) {
    const name = sanitizeStr(formData.get("name"));
    if (!name) throw new Error("Nome obrigatório.");
    const category = sanitizeStr(formData.get("category"));
    const status = (sanitizeStr(formData.get("status")) ?? "idea") as string;
    const difficulty = sanitizeStr(formData.get("difficulty"));
    const prepRaw = sanitizeStr(formData.get("prep_time_minutes"));
    const prep_time_minutes = prepRaw ? Math.max(0, Number(prepRaw)) : null;

    const { supabase, user } = await getClientAndUser();

    const { data: created, error } = await supabase
        .from("recipes")
        .insert([{
            user_id: user.id,
            name, category, status, difficulty, prep_time_minutes,
        }])
        .select("id")
        .single();

    if (error) throw error;

    revalidatePath("/recipes");
    redirect(`/recipes/${created!.id}`);
}

export async function duplicateRecipeAction(formData: FormData) {
    const recipeId = String(formData.get("id") ?? "");
    if (!recipeId) throw new Error("id ausente.");

    const { supabase, user } = await getClientAndUser();

    const { data: src } = await supabase
        .from("recipes")
        .select("id, name, category, status, difficulty, prep_time_minutes, instructions, youtube_url, cover_url")
        .eq("id", recipeId)
        .eq("user_id", user.id)
        .single();
    if (!src) throw new Error("Receita não encontrada.");

    const { data: created, error: e1 } = await supabase
        .from("recipes")
        .insert([{
            user_id: user.id,
            name: `${src.name} (cópia)`,
            category: src.category,
            status: "idea",
            difficulty: src.difficulty,
            prep_time_minutes: src.prep_time_minutes,
            instructions: src.instructions,
            youtube_url: src.youtube_url,
            cover_url: src.cover_url,
        }])
        .select("id")
        .single();
    if (e1) throw e1;

    const newId = created!.id as string;

    const { data: ing } = await supabase
        .from("recipe_ingredients")
        .select("name, amount, unit, note, optional, position")
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id)
        .order("position", { ascending: true });

    if (ing?.length) {
        const rows = ing.map((row) => ({ ...row, user_id: user.id, recipe_id: newId }));
        await supabase.from("recipe_ingredients").insert(rows);
    }

    revalidatePath("/recipes");
    redirect(`/recipes/${newId}`);
}

export async function deleteRecipeAction(formData: FormData) {
    const recipeId = String(formData.get("id") ?? "");
    if (!recipeId) throw new Error("id ausente.");

    const { supabase, user } = await getClientAndUser();

    await supabase.from("shopping_list_items").delete().eq("recipe_id", recipeId).eq("user_id", user.id);
    await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId).eq("user_id", user.id);
    await supabase.from("recipe_instructions").delete().eq("recipe_id", recipeId).eq("user_id", user.id);
    await supabase.from("recordings").delete().eq("recipe_id", recipeId).eq("user_id", user.id);
    await supabase.from("recipes").delete().eq("id", recipeId).eq("user_id", user.id);

    revalidatePath("/recipes");
}

export async function updateRecipeMetaAction(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("id ausente.");

    const name = sanitizeStr(formData.get("name"));
    const category = sanitizeStr(formData.get("category"));
    const status = sanitizeStr(formData.get("status")) ?? "idea";
    const difficulty = sanitizeStr(formData.get("difficulty"));
    const prepRaw = sanitizeStr(formData.get("prep_time_minutes"));
    const prep_time_minutes = prepRaw ? Math.max(0, Number(prepRaw)) : null;

    const { supabase, user } = await getClientAndUser();

    const patch: Record<string, unknown> = {};
    if (name !== null) patch.name = name;
    patch.category = category;
    patch.status = status;
    patch.difficulty = difficulty || null;
    patch.prep_time_minutes = prep_time_minutes;

    await supabase.from("recipes").update(patch).eq("id", id).eq("user_id", user.id);

    revalidatePath(`/recipes/${id}`);
    revalidatePath(`/recipes`);
}

// app/recipes/actions/shopping.ts
"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-actions";

/** Envia ingredientes da receita para a lista (evita duplicar; pode incluir opcionais) */
export async function pushIngredientsToShoppingAction(formData: FormData) {
    const recipe_id = String(formData.get("recipe_id") ?? "");
    const includeOptionals = String(formData.get("include_optionals") ?? "0") === "1";
    if (!recipe_id) throw new Error("recipe_id ausente.");

    const supabase = await createSupabaseServerActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado.");

    const { data: ingredients } = await supabase
        .from("recipe_ingredients")
        .select("id, name, amount, unit, note, optional")
        .eq("recipe_id", recipe_id)
        .eq("user_id", user.id)
        .order("position", { ascending: true });

    const { data: existing } = await supabase
        .from("shopping_list_items")
        .select("recipe_ingredient_id")
        .eq("recipe_id", recipe_id)
        .eq("user_id", user.id);

    const existingSet = new Set(
        (existing ?? []).map((e) => e.recipe_ingredient_id).filter(Boolean) as string[]
    );

    const base = (ingredients ?? []).filter((i) => includeOptionals ? true : !i.optional);

    const rows = base
        .filter((i) => !existingSet.has(i.id))
        .map((i) => ({
            user_id: user.id,
            recipe_id,
            ingredient_name: i.name,
            quantity: i.amount,
            note: i.unit ?? i.note ?? null,
            in_pantry: false,
            recipe_ingredient_id: i.id,
        }));

    if (rows.length) {
        await supabase.from("shopping_list_items").insert(rows);
    }

    revalidatePath(`/recipes/${recipe_id}`);
    revalidatePath(`/shopping`);
}

/** Alterna o checkbox (in_pantry) de 1 item */
export async function toggleShoppingItemAction(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    const inPantryRaw = String(formData.get("in_pantry") ?? "0");
    const in_pantry = inPantryRaw === "1";
    if (!id) return;

    const supabase = await createSupabaseServerActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado.");

    await supabase.from("shopping_list_items")
        .update({ in_pantry })
        .eq("id", id)
        .eq("user_id", user.id);

    revalidatePath("/shopping");
}

/** Exclui 1 item da lista */
export async function deleteShoppingItemAction(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    const supabase = await createSupabaseServerActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado.");

    await supabase.from("shopping_list_items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    revalidatePath("/shopping");
}

/** Remove todos os itens já marcados como “na despensa” */
export async function clearCheckedShoppingAction() {
    const supabase = await createSupabaseServerActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado.");

    await supabase.from("shopping_list_items")
        .delete()
        .eq("user_id", user.id)
        .eq("in_pantry", true);

    revalidatePath("/shopping");
}

/** Remove TODOS os itens de compras do usuário */
export async function clearAllShoppingAction() {
    "use server";
    const { revalidatePath } = await import("next/cache");
    const { createSupabaseServerActionClient } = await import("@/lib/supabase/server-actions");

    const supabase = await createSupabaseServerActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado.");

    await supabase.from("shopping_list_items").delete().eq("user_id", user.id);
    revalidatePath("/shopping");
}
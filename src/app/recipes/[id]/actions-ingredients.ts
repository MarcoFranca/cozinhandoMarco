"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-actions";

// Helpers
async function getUserId(supabase: Awaited<ReturnType<typeof createSupabaseServerActionClient>>) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Sessão inválida. Faça login.");
    return session.user.id;
}

export async function addIngredientAction(formData: FormData) {
    const supabase = await createSupabaseServerActionClient();
    const user_id = await getUserId(supabase);

    const recipe_id = String(formData.get("recipe_id") || "");
    const name = String(formData.get("name") || "").trim();
    const amount = formData.get("amount") ? Number(formData.get("amount")) : null;
    const unit = String(formData.get("unit") || "") || null;
    const note = String(formData.get("note") || "") || null;
    const optional = String(formData.get("optional") || "") === "on";

    if (!recipe_id || !name) throw new Error("Preencha o nome do ingrediente.");

    // posição: pega a maior e soma 10
    const { data: last } = await supabase
        .from("recipe_ingredients")
        .select("position")
        .eq("recipe_id", recipe_id)
        .order("position", { ascending: false })
        .limit(1);

    const position = (last?.[0]?.position ?? 0) + 10;

    const { error } = await supabase
        .from("recipe_ingredients")
        .insert([{ user_id, recipe_id, name, amount, unit, note, optional, position }]);

    if (error) throw error;

    revalidatePath(`/recipes/${recipe_id}`);
}

export async function updateIngredientAction(formData: FormData) {
    const supabase = await createSupabaseServerActionClient();
    await getUserId(supabase);

    const id = String(formData.get("id") || "");
    const recipe_id = String(formData.get("recipe_id") || "");
    const patch: any = {};

    if (formData.has("name")) patch.name = String(formData.get("name") || "").trim();
    if (formData.has("amount")) patch.amount = formData.get("amount") ? Number(formData.get("amount")) : null;
    if (formData.has("unit")) patch.unit = String(formData.get("unit") || "") || null;
    if (formData.has("note")) patch.note = String(formData.get("note") || "") || null;
    if (formData.has("optional")) {
        const v = String(formData.get("optional") || "");
        patch.optional = v === "on" || v === "true";
    }

    if (!id || !recipe_id) throw new Error("Dados inválidos.");

    const { error } = await supabase
        .from("recipe_ingredients")
        .update(patch)
        .eq("id", id);

    if (error) throw error;

    revalidatePath(`/recipes/${recipe_id}`);
}

export async function deleteIngredientAction(formData: FormData) {
    const supabase = await createSupabaseServerActionClient();
    await getUserId(supabase);

    const id = String(formData.get("id") || "");
    const recipe_id = String(formData.get("recipe_id") || "");
    if (!id || !recipe_id) throw new Error("Dados inválidos.");

    const { error } = await supabase.from("recipe_ingredients").delete().eq("id", id);
    if (error) throw error;

    // também remove da shopping list se havia vínculo
    await supabase.from("shopping_list_items").delete().eq("recipe_ingredient_id", id);

    revalidatePath(`/recipes/${recipe_id}`);
}

export async function moveIngredientAction(formData: FormData) {
    const supabase = await createSupabaseServerActionClient();
    await getUserId(supabase);

    const recipe_id = String(formData.get("recipe_id") || "");
    const id = String(formData.get("id") || "");
    const dir = String(formData.get("dir") || "up"); // "up" | "down"

    if (!recipe_id || !id) throw new Error("Dados inválidos.");

    // carrega todos para achar vizinho
    const { data: items, error } = await supabase
        .from("recipe_ingredients")
        .select("id, position")
        .eq("recipe_id", recipe_id)
        .order("position", { ascending: true });

    if (error) throw error;
    const idx = items!.findIndex((i) => i.id === id);
    if (idx === -1) return;

    const neighbor = dir === "up" ? items![idx - 1] : items![idx + 1];
    if (!neighbor) return;

    const cur = items![idx];

    // swap positions
    const { error: e1 } = await supabase
        .from("recipe_ingredients")
        .update({ position: neighbor.position })
        .eq("id", cur.id);
    if (e1) throw e1;

    const { error: e2 } = await supabase
        .from("recipe_ingredients")
        .update({ position: cur.position })
        .eq("id", neighbor.id);
    if (e2) throw e2;

    revalidatePath(`/recipes/${recipe_id}`);
}

// —— Shopping List

function buildQuantity(amount: number | null, unit: string | null) {
    if (amount && unit) return `${amount} ${unit}`;
    if (amount) return `${amount}`;
    if (unit) return unit;
    return null;
}

export async function addToShoppingAction(formData: FormData) {
    const supabase = await createSupabaseServerActionClient();
    const user_id = await getUserId(supabase);

    const recipe_id = String(formData.get("recipe_id") || "");
    const ids = String(formData.get("ids") || ""); // "id1,id2,..."
    if (!recipe_id || !ids) throw new Error("Seleção vazia.");

    const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);

    // carrega ingredientes
    const { data: ings, error } = await supabase
        .from("recipe_ingredients")
        .select("id, name, amount, unit, note")
        .in("id", idList);

    if (error) throw error;

    const rows = ings!.map((i) => ({
        user_id,
        recipe_id,
        recipe_ingredient_id: i.id,
        ingredient_name: i.name,
        quantity: buildQuantity(i.amount as any, i.unit as any),
        note: i.note ?? null,
        in_pantry: false,
    }));

    // upsert para não duplicar
    const { error: upErr } = await supabase
        .from("shopping_list_items")
        .upsert(rows, { onConflict: "user_id,recipe_ingredient_id" });

    if (upErr) throw upErr;

    revalidatePath(`/recipes/${recipe_id}`);
}

export async function removeFromShoppingAction(formData: FormData) {
    const supabase = await createSupabaseServerActionClient();
    await getUserId(supabase);

    const recipe_id = String(formData.get("recipe_id") || "");
    const ids = String(formData.get("ids") || "");
    if (!recipe_id || !ids) throw new Error("Seleção vazia.");

    const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);

    const { error } = await supabase
        .from("shopping_list_items")
        .delete()
        .in("recipe_ingredient_id", idList);

    if (error) throw error;

    revalidatePath(`/recipes/${recipe_id}`);
}

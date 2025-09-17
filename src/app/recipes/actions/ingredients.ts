"use server";

import { revalidatePath } from "next/cache";
import {
    getClientAndUser,
    getNextIngredientPosition,
    parseLine,
    ParsedIngredient,
    sanitizeStr,
} from "./common";

/** Add ingrediente (form detalhado) */
export async function addIngredientFormAction(formData: FormData) {
    const recipe_id = String(formData.get("recipe_id") ?? "");
    const name = sanitizeStr(formData.get("name"));
    const amountRaw = sanitizeStr(formData.get("amount"));
    const unitRaw = sanitizeStr(formData.get("unit"));
    const note = sanitizeStr(formData.get("note"));
    const optional = formData.get("optional") != null;

    if (!recipe_id || !name) return;

    const { supabase, user } = await getClientAndUser();
    const pos = await getNextIngredientPosition(recipe_id, user.id);

    const amount = amountRaw ? Number(amountRaw.replace(",", ".")) : null;
    const unit = unitRaw ?? null;

    await supabase.from("recipe_ingredients").insert([
        {
            user_id: user.id,
            recipe_id,
            name,
            amount,
            unit,
            note,
            optional,
            position: pos,
        },
    ]);

    revalidatePath(`/recipes/${recipe_id}`);
}

/** Quick add 1 linha */
export async function addIngredientQuickAction(formData: FormData) {
    const recipe_id = String(formData.get("recipe_id") ?? "");
    const line = String(formData.get("line") ?? "").trim();
    if (!recipe_id || !line) return;

    const { supabase, user } = await getClientAndUser();
    const pos = await getNextIngredientPosition(recipe_id, user.id);

    const p = parseLine(line);
    if (!p) return;

    await supabase.from("recipe_ingredients").insert([
        {
            user_id: user.id,
            recipe_id,
            name: p.name,
            amount: p.amount,
            unit: p.unit,
            note: null,
            optional: false,
            position: pos,
        },
    ]);

    revalidatePath(`/recipes/${recipe_id}`);
}

/** Bulk add (várias linhas) */
export async function addIngredientsBulkAction(formData: FormData) {
    const recipe_id = String(formData.get("recipe_id") ?? "");
    const lines = String(formData.get("lines") ?? "").trim();
    if (!recipe_id || !lines) return;

    const { supabase, user } = await getClientAndUser();
    const startPos = await getNextIngredientPosition(recipe_id, user.id);

    const parsed: ParsedIngredient[] = lines
        .split(/\r?\n/)
        .map((l: string) => parseLine(l))
        .filter((p): p is ParsedIngredient => p !== null);

    const rows = parsed.map((p, idx) => ({
        user_id: user.id,
        recipe_id,
        name: p.name,
        amount: p.amount,
        unit: p.unit,
        note: null,
        optional: false,
        position: startPos + (idx + 1) * 10,
    }));

    if (rows.length) await supabase.from("recipe_ingredients").insert(rows);

    revalidatePath(`/recipes/${recipe_id}`);
}

export async function updateIngredientAction(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("id ausente.");

    const name = sanitizeStr(formData.get("name"));
    const amountRaw = sanitizeStr(formData.get("amount"));
    const unit = sanitizeStr(formData.get("unit"));
    const note = sanitizeStr(formData.get("note"));
    const optional = formData.get("optional") != null;

    const amount = amountRaw ? Number(amountRaw) : null;

    const { supabase, user } = await getClientAndUser();

    const { data: row } = await supabase
        .from("recipe_ingredients")
        .select("recipe_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
    if (!row) return;

    await supabase
        .from("recipe_ingredients")
        .update({
            name: name ?? undefined,
            amount,
            unit: unit ?? null,
            note: note ?? null,
            optional,
        })
        .eq("id", id)
        .eq("user_id", user.id);

    revalidatePath(`/recipes/${row.recipe_id}`);
}

export async function deleteIngredientAction(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("id ausente.");

    const { supabase, user } = await getClientAndUser();

    const { data: row } = await supabase
        .from("recipe_ingredients")
        .select("recipe_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
    if (!row) return;

    await supabase.from("recipe_ingredients").delete().eq("id", id).eq("user_id", user.id);
    revalidatePath(`/recipes/${row.recipe_id}`);
}

export async function moveIngredientAction(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    const dir = String(formData.get("dir") ?? "");
    if (!id || !dir) return;

    const { supabase, user } = await getClientAndUser();

    const { data: cur } = await supabase
        .from("recipe_ingredients")
        .select("id, recipe_id, position")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
    if (!cur) return;

    const query =
        dir === "up"
            ? supabase
                .from("recipe_ingredients")
                .select("id, position")
                .eq("recipe_id", cur.recipe_id)
                .eq("user_id", user.id)
                .lt("position", cur.position)
                .order("position", { ascending: false })
                .limit(1)
                .single()
            : supabase
                .from("recipe_ingredients")
                .select("id, position")
                .eq("recipe_id", cur.recipe_id)
                .eq("user_id", user.id)
                .gt("position", cur.position)
                .order("position", { ascending: true })
                .limit(1)
                .single();

    const { data: neighbor } = await query;
    if (!neighbor) return;

    await Promise.all([
        supabase.from("recipe_ingredients").update({ position: neighbor.position }).eq("id", cur.id).eq("user_id", user.id),
        supabase.from("recipe_ingredients").update({ position: cur.position }).eq("id", neighbor.id).eq("user_id", user.id),
    ]);

    revalidatePath(`/recipes/${cur.recipe_id}`);
}

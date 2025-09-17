// app/recipes/actions/legacy.ts
"use server";

import { revalidatePath } from "next/cache";
import {
    getClientAndUser,
    getNextIngredientPosition, // 👈 trocado
    parseLine,
    ParsedIngredient,
} from "./common";

type MaybeParsed = ParsedIngredient | null;

export async function convertIngredientsFromTextAction(formData: FormData) {
    const recipe_id = String(formData.get("recipe_id") ?? "");
    if (!recipe_id) throw new Error("recipe_id ausente.");

    const { supabase, user } = await getClientAndUser();

    const { data: rec } = await supabase
        .from("recipes")
        .select("id, ingredients")
        .eq("id", recipe_id)
        .eq("user_id", user.id)
        .single();

    const text = (rec?.ingredients ?? "").trim();
    if (!text) return;

    // 👇 pega posição inicial correta para ingredientes
    const startPos = await getNextIngredientPosition(recipe_id, user.id);

    // 👇 tipa explicitamente o param "p" (sem any implícito)
    const parsed: ParsedIngredient[] = text
        .split(/\r?\n/)
        .map((l: string) => parseLine(l))
        .filter((p: MaybeParsed): p is ParsedIngredient => p !== null);

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

    if (rows.length) {
        await supabase.from("recipe_ingredients").insert(rows);
        await supabase
            .from("recipes")
            .update({ ingredients: null })
            .eq("id", recipe_id)
            .eq("user_id", user.id);
    }

    revalidatePath(`/recipes/${recipe_id}`);
}

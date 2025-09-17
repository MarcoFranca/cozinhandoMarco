"use server";

// app/recipes/actions/instructions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getClientAndUser, getNextInstructionStep, sanitizeStr } from "./common";

export async function addInstructionAction(formData: FormData) {
    const recipe_id = String(formData.get("recipe_id") ?? "");
    const text = sanitizeStr(formData.get("text"));
    const durRaw = sanitizeStr(formData.get("duration_minutes"));
    if (!recipe_id || !text) return;

    const { supabase, user } = await getClientAndUser();
    const step = await getNextInstructionStep(recipe_id, user.id);
    const duration = durRaw ? Math.max(0, Number(durRaw)) : null;

    await supabase.from("recipe_instructions").insert([
        { user_id: user.id, recipe_id, step, text, duration_minutes: duration },
    ]);

    revalidatePath(`/recipes/${recipe_id}`);
}


export async function updateInstructionAction(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("id ausente.");

    const text = sanitizeStr(formData.get("text"));
    const durRaw = sanitizeStr(formData.get("duration_minutes"));
    const duration = durRaw ? Math.max(0, Number(durRaw)) : null;

    const { supabase, user } = await getClientAndUser();

    const { data: row } = await supabase
        .from("recipe_instructions")
        .select("recipe_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
    if (!row) return;

    await supabase
        .from("recipe_instructions")
        .update({
            text: text ?? undefined,
            duration_minutes: duration,
        })
        .eq("id", id)
        .eq("user_id", user.id);

    revalidatePath(`/recipes/${row.recipe_id}`);
}

export async function deleteInstructionAction(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("id ausente.");

    const { supabase, user } = await getClientAndUser();

    const { data: row } = await supabase
        .from("recipe_instructions")
        .select("recipe_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
    if (!row) return;

    await supabase.from("recipe_instructions").delete().eq("id", id).eq("user_id", user.id);
    revalidatePath(`/recipes/${row.recipe_id}`);
}

export async function moveInstructionAction(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    const dir = String(formData.get("dir") ?? "");
    if (!id || !dir) return;

    const { supabase, user } = await getClientAndUser();

    const { data: cur } = await supabase
        .from("recipe_instructions")
        .select("id, recipe_id, step")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
    if (!cur) return;

    const query =
        dir === "up"
            ? supabase
                .from("recipe_instructions")
                .select("id, step")
                .eq("recipe_id", cur.recipe_id)
                .eq("user_id", user.id)
                .lt("step", cur.step)
                .order("step", { ascending: false })
                .limit(1)
                .single()
            : supabase
                .from("recipe_instructions")
                .select("id, step")
                .eq("recipe_id", cur.recipe_id)
                .eq("user_id", user.id)
                .gt("step", cur.step)
                .order("step", { ascending: true })
                .limit(1)
                .single();

    const { data: neighbor } = await query;
    if (!neighbor) return;

    await Promise.all([
        supabase.from("recipe_instructions").update({ step: neighbor.step }).eq("id", cur.id).eq("user_id", user.id),
        supabase.from("recipe_instructions").update({ step: cur.step }).eq("id", neighbor.id).eq("user_id", user.id),
    ]);

    revalidatePath(`/recipes/${cur.recipe_id}`);
}

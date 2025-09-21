// app/dashboard/recipes/actions/instructions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-actions";
import { requireUser } from "@/lib/auth";

function s(v: FormDataEntryValue | null) {
    const x = typeof v === "string" ? v.trim() : "";
    return x || null;
}
function n(v: FormDataEntryValue | null) {
    const x = typeof v === "string" ? v.trim() : "";
    if (!x) return null;
    const num = Number(x);
    return Number.isFinite(num) ? Math.trunc(num) : null;
}

/** Resolve uma technique_id a partir de um technique slug. */
async function resolveTechniqueId(supabase: any, slug: string | null) {
    if (!slug) return null;
    const { data, error } = await supabase
        .from("techniques")
        .select("id, slug")
        .eq("slug", slug)
        .maybeSingle();
    if (error) throw new Error("Falha ao resolver técnica.");
    return data?.id ?? null;
}

/* ============ INSTRUCTIONS ============ */

export async function addInstructionAction(fd: FormData) {
    const { user } = await requireUser();
    const supabase = await createSupabaseServerActionClient();

    const recipe_id = s(fd.get("recipe_id"));
    if (!recipe_id) throw new Error("recipe_id é obrigatório.");

    const text = s(fd.get("text"));
    const duration_minutes = n(fd.get("duration_minutes"));

    // novo: técnica opcional por slug
    const technique_slug = s(fd.get("technique_slug"));
    const technique_id = await resolveTechniqueId(supabase, technique_slug);

    // checa ownership
    const { data: recipe, error: recErr } = await supabase
        .from("recipes")
        .select("id, user_id, site_slug")
        .eq("id", recipe_id)
        .eq("user_id", user.id)
        .single();
    if (recErr || !recipe) throw new Error("Receita não encontrada ou sem permissão.");

    // calcular próximo step
    const { data: last, error: stepErr } = await supabase
        .from("recipe_instructions")
        .select("step")
        .eq("recipe_id", recipe_id)
        .eq("user_id", user.id)
        .order("step", { ascending: false })
        .limit(1)
        .maybeSingle();
    const nextStep = (last?.step ?? 0) + 1;

    const payload: any = {
        user_id: user.id,
        recipe_id,
        step: nextStep,
        text: text ?? "",
        duration_minutes,
    };
    if (technique_id) payload.technique_id = technique_id;

    const { error: insErr } = await supabase.from("recipe_instructions").insert(payload);
    if (insErr) throw new Error("Falha ao criar passo.");

    revalidatePath(`/dashboard/recipes/${recipe_id}?tab=instructions`);
    if (recipe.site_slug) revalidatePath(`/receitas/${recipe.site_slug}`);
    return { ok: true };
}

export async function updateInstructionAction(fd: FormData) {
    const { user } = await requireUser();
    const supabase = await createSupabaseServerActionClient();

    const id = s(fd.get("id"));
    if (!id) throw new Error("id é obrigatório.");

    const text = s(fd.get("text"));
    const duration_minutes = n(fd.get("duration_minutes"));
    const technique_slug = s(fd.get("technique_slug"));
    const technique_id = await resolveTechniqueId(supabase, technique_slug);

    // pega recipe_id para revalidate
    const { data: instr, error: getErr } = await supabase
        .from("recipe_instructions")
        .select("id, recipe_id, user_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
    if (getErr || !instr) throw new Error("Passo não encontrado.");

    const upd: any = {};
    if (text !== null) upd.text = text;
    if (duration_minutes !== null) upd.duration_minutes = duration_minutes;
    // permitir limpar técnica: technique_slug vazio => zera technique_id
    if (technique_slug !== null) upd.technique_id = technique_id;

    const { error: upErr } = await supabase
        .from("recipe_instructions")
        .update(upd)
        .eq("id", id)
        .eq("user_id", user.id);
    if (upErr) throw new Error("Falha ao atualizar passo.");

    // slug público se existir
    const { data: recipe } = await supabase
        .from("recipes")
        .select("site_slug")
        .eq("id", instr.recipe_id)
        .single();

    revalidatePath(`/dashboard/recipes/${instr.recipe_id}?tab=instructions`);
    if (recipe?.site_slug) revalidatePath(`/receitas/${recipe.site_slug}`);
    return { ok: true };
}

export async function moveInstructionAction(fd: FormData) {
    const { user } = await requireUser();
    const supabase = await createSupabaseServerActionClient();

    const id = s(fd.get("id"));
    const dir = s(fd.get("dir")); // "up" | "down"
    if (!id || !dir) throw new Error("Parâmetros inválidos.");

    const { data: cur, error: curErr } = await supabase
        .from("recipe_instructions")
        .select("id, step, recipe_id, user_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
    if (curErr || !cur) throw new Error("Passo não encontrado.");

    const neighborOrder = dir === "up" ? { ascending: false } : { ascending: true };
    const neighborOp = dir === "up" ? "<" : ">";
    const { data: neighbor } = await supabase
        .from("recipe_instructions")
        .select("id, step")
        .eq("recipe_id", cur.recipe_id)
        .eq("user_id", user.id)
        .filter("step", neighborOp as any, cur.step)
        .order("step", neighborOrder)
        .limit(1)
        .maybeSingle();

    if (!neighbor) return { ok: true };

    // swap steps
    await supabase
        .from("recipe_instructions")
        .update({ step: neighbor.step })
        .eq("id", cur.id)
        .eq("user_id", user.id);
    await supabase
        .from("recipe_instructions")
        .update({ step: cur.step })
        .eq("id", neighbor.id)
        .eq("user_id", user.id);

    const { data: recipe } = await supabase
        .from("recipes")
        .select("site_slug")
        .eq("id", cur.recipe_id)
        .single();

    revalidatePath(`/dashboard/recipes/${cur.recipe_id}?tab=instructions`);
    if (recipe?.site_slug) revalidatePath(`/receitas/${recipe.site_slug}`);
    return { ok: true };
}

export async function deleteInstructionAction(fd: FormData) {
    const { user } = await requireUser();
    const supabase = await createSupabaseServerActionClient();

    const id = s(fd.get("id"));
    if (!id) throw new Error("id é obrigatório.");

    // pega recipe_id
    const { data: instr } = await supabase
        .from("recipe_instructions")
        .select("id, recipe_id, user_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    const { error: delErr } = await supabase
        .from("recipe_instructions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (delErr) throw new Error("Não foi possível remover o passo.");

    const { data: recipe } = await supabase
        .from("recipes")
        .select("site_slug")
        .eq("id", instr?.recipe_id)
        .single();

    revalidatePath(`/dashboard/recipes/${instr?.recipe_id}?tab=instructions`);
    if (recipe?.site_slug) revalidatePath(`/receitas/${recipe.site_slug}`);
    return { ok: true };
}

/* ============ TIPS por passo ============ */

// --- substitua APENAS este bloco das tips ---

type TipType = "tip" | "swap" | "alert";

export async function addTipAction(fd: FormData) {
    const { user } = await requireUser();
    const supabase = await createSupabaseServerActionClient();

    const recipe_id = s(fd.get("recipe_id"));
    const instruction_id = s(fd.get("instruction_id")); // opcional
    const ingredient_id = s(fd.get("recipe_ingredient_id")); // opcional
    const type = s(fd.get("type")) as TipType | null;
    const title = s(fd.get("title"));
    const text = s(fd.get("text"));

    if (!recipe_id || !type || !text) {
        throw new Error("Parâmetros da dica inválidos.");
    }
    if (!instruction_id && !ingredient_id) {
        throw new Error("Informe instruction_id ou recipe_ingredient_id.");
    }

    // próxima posição por contexto (instruction OR ingredient)
    let nextPos = 10;
    if (instruction_id) {
        const { data: last } = await supabase
            .from("recipe_tips")
            .select("position")
            .eq("recipe_id", recipe_id)
            .eq("instruction_id", instruction_id)
            .order("position", { ascending: false })
            .limit(1)
            .maybeSingle();
        nextPos = (last?.position ?? 0) + 10;
    } else if (ingredient_id) {
        const { data: last } = await supabase
            .from("recipe_tips")
            .select("position")
            .eq("recipe_id", recipe_id)
            .eq("recipe_ingredient_id", ingredient_id)
            .order("position", { ascending: false })
            .limit(1)
            .maybeSingle();
        nextPos = (last?.position ?? 0) + 10;
    }

    const { error } = await supabase.from("recipe_tips").insert({
        user_id: user.id,
        recipe_id,
        instruction_id: instruction_id ?? null,
        recipe_ingredient_id: ingredient_id ?? null,
        type,
        title,
        text,
        position: nextPos,
    });
    if (error) throw new Error("Falha ao adicionar dica.");

    revalidatePath(`/dashboard/recipes/${recipe_id}?tab=ingredients`);
    revalidatePath(`/dashboard/recipes/${recipe_id}?tab=instructions`);
    return { ok: true };
}

export async function updateTipAction(fd: FormData) {
    const { user } = await requireUser();
    const supabase = await createSupabaseServerActionClient();

    const id = s(fd.get("id"));
    const title = s(fd.get("title"));
    const text = s(fd.get("text"));
    const type = s(fd.get("type")) as TipType | null;

    if (!id) throw new Error("id da dica é obrigatório.");

    const upd: any = {};
    if (title !== null) upd.title = title;
    if (text !== null) upd.text = text;
    if (type !== null) upd.type = type;

    const { error, data } = await supabase
        .from("recipe_tips")
        .update(upd)
        .eq("id", id)
        .eq("user_id", user.id)
        .select("recipe_id")
        .single();
    if (error) throw new Error("Falha ao atualizar dica.");

    revalidatePath(`/dashboard/recipes/${data.recipe_id}?tab=ingredients`);
    revalidatePath(`/dashboard/recipes/${data.recipe_id}?tab=instructions`);
    return { ok: true };
}

export async function deleteTipAction(fd: FormData) {
    const { user } = await requireUser();
    const supabase = await createSupabaseServerActionClient();

    const id = s(fd.get("id"));
    if (!id) throw new Error("id é obrigatório.");

    const { data, error } = await supabase
        .from("recipe_tips")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .select("recipe_id")
        .single();
    if (error) throw new Error("Falha ao remover dica.");

    revalidatePath(`/dashboard/recipes/${data.recipe_id}?tab=ingredients`);
    revalidatePath(`/dashboard/recipes/${data.recipe_id}?tab=instructions`);
    return { ok: true };
}

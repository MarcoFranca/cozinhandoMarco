// app/recipes/actions/common.ts

import { createSupabaseServerActionClient } from "@/lib/supabase/server-actions";

export type ParsedIngredient = {
    amount: number | null;
    unit: string | null;
    name: string;
};

export function sanitizeStr(v: FormDataEntryValue | null): string | null {
    const s = (v as string | null) ?? null;
    if (s == null) return null;
    const t = s.trim();
    return t === "" ? null : t;
}

/** Parse "200 g farinha", "3 ovos", "- 1 xíc leite" */
export function parseLine(line: string): ParsedIngredient | null {
    const raw = line.replace(/^[\-\*\•]\s*/, "").trim();
    if (!raw) return null;

    const m = raw.match(/^(\d+(?:[\,\.]\d+)?)\s*([a-zA-ZçÇãõáéíóúâêôüªº°\.]+)\s+(.+)$/);
    if (m) {
        const amount = Number(m[1].replace(",", "."));
        const unit = m[2].toLowerCase();
        const name = m[3].trim();
        return { amount, unit, name };
    }

    const m2 = raw.match(/^(\d+(?:[\,\.]\d+)?)\s+(.+)$/);
    if (m2) {
        const amount = Number(m2[1].replace(",", "."));
        const name = m2[2].trim();
        return { amount, unit: null, name };
    }

    return { amount: null, unit: null, name: raw };
}

export async function getClientAndUser() {
    const supabase = await createSupabaseServerActionClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado.");
    return { supabase, user };
}

/** Próxima posição para ingredientes (+10) */
export async function getNextIngredientPosition(
    recipeId: string,
    userId: string
): Promise<number> {
    const supabase = await createSupabaseServerActionClient();
    const { data: last } = await supabase
        .from("recipe_ingredients")
        .select("position")
        .eq("recipe_id", recipeId)
        .eq("user_id", userId)
        .order("position", { ascending: false })
        .limit(1)
        .single();

    const start = (last?.position as number | undefined) ?? 0;
    return start + 10;
}

/** Próximo step para instruções (+10) */
export async function getNextInstructionStep(
    recipeId: string,
    userId: string
): Promise<number> {
    const supabase = await createSupabaseServerActionClient();
    const { data: last } = await supabase
        .from("recipe_instructions")
        .select("step")
        .eq("recipe_id", recipeId)
        .eq("user_id", userId)
        .order("step", { ascending: false })
        .limit(1)
        .single();

    const start = (last?.step as number | undefined) ?? 0;
    return start + 10;
}

export function slugifyPtBr(v: string) {
    return v
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// app/dashboard/recipes/actions/updateRecipeExtraTaxonomiesAction.ts
"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-actions";
import { requireUser } from "@/lib/auth";

function normStr(v: FormDataEntryValue | null) {
    const s = (typeof v === "string" ? v : "").trim();
    return s || null;
}
function readSlugs(fd: FormData, field: string): string[] {
    const out: string[] = [];
    for (const [k, v] of fd.entries()) {
        if (k === field) {
            const s = normStr(v);
            if (s) out.push(s);
        }
    }
    return out;
}

export async function updateRecipeExtraTaxonomiesAction(fd: FormData) {
    const { user } = await requireUser();
    const supabase = await createSupabaseServerActionClient();

    const id = normStr(fd.get("id"));
    if (!id) throw new Error("ID da receita é obrigatório.");

    // Ownership guard
    const { data: recipe, error: fetchErr } = await supabase
        .from("recipes")
        .select("id, user_id, site_slug")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
    if (fetchErr || !recipe) throw new Error("Receita não encontrada ou sem permissão.");

    // Leia markers para saber quais grupos sincronizar
    const cuisinesPresent = !!fd.get("cuisines_present");
    const dietPresent = !!fd.get("diet_present");
    const techPresent = !!fd.get("tech_present");
    const occPresent = !!fd.get("occ_present");

    // ------------- CUISINES -------------
    if (cuisinesPresent) {
        const cuisineSlugs = readSlugs(fd, "cuisine_slugs[]");
        // DELETE all for recipe
        {
            const { error } = await supabase.from("recipe_cuisines").delete().eq("recipe_id", id);
            if (error) throw new Error("Falha ao limpar cozinhas da receita.");
        }
        if (cuisineSlugs.length > 0) {
            const { data: rows, error } = await supabase
                .from("cuisines")
                .select("id, slug")
                .in("slug", cuisineSlugs);
            if (error) throw new Error("Falha ao resolver cozinhas.");
            const slugToId = new Map((rows ?? []).map((r) => [r.slug, r.id]));
            const missing = cuisineSlugs.filter((s) => !slugToId.has(s));
            if (missing.length) {
                throw new Error(`Cuisines ausentes: ${missing.join(", ")}.`);
            }
            const inserts = cuisineSlugs
                .map((s) => ({ recipe_id: id, cuisine_id: slugToId.get(s)! }))
                .filter(Boolean);
            if (inserts.length) {
                const { error: insErr } = await supabase.from("recipe_cuisines").insert(inserts);
                if (insErr) throw new Error("Falha ao inserir cozinhas da receita.");
            }
        }
    }

    // ------------- DIET LABELS -------------
    if (dietPresent) {
        const dietSlugs = readSlugs(fd, "diet_slugs[]");
        {
            const { error } = await supabase.from("recipe_diet_labels").delete().eq("recipe_id", id);
            if (error) throw new Error("Falha ao limpar dietas da receita.");
        }
        if (dietSlugs.length > 0) {
            const { data: rows, error } = await supabase
                .from("diet_labels")
                .select("id, slug")
                .in("slug", dietSlugs);
            if (error) throw new Error("Falha ao resolver dietas.");
            const slugToId = new Map((rows ?? []).map((r) => [r.slug, r.id]));
            const missing = dietSlugs.filter((s) => !slugToId.has(s));
            if (missing.length) {
                throw new Error(`Diet labels ausentes: ${missing.join(", ")}.`);
            }
            const inserts = dietSlugs
                .map((s) => ({ recipe_id: id, diet_id: slugToId.get(s)! }))
                .filter(Boolean);
            if (inserts.length) {
                const { error: insErr } = await supabase.from("recipe_diet_labels").insert(inserts);
                if (insErr) throw new Error("Falha ao inserir dietas da receita.");
            }
        }
    }

    // ------------- TECHNIQUES -------------
    if (techPresent) {
        const techSlugs = readSlugs(fd, "technique_slugs[]");
        {
            const { error } = await supabase.from("recipe_techniques").delete().eq("recipe_id", id);
            if (error) throw new Error("Falha ao limpar técnicas da receita.");
        }
        if (techSlugs.length > 0) {
            const { data: rows, error } = await supabase
                .from("techniques")
                .select("id, slug")
                .in("slug", techSlugs);
            if (error) throw new Error("Falha ao resolver técnicas.");
            const slugToId = new Map((rows ?? []).map((r) => [r.slug, r.id]));
            const missing = techSlugs.filter((s) => !slugToId.has(s));
            if (missing.length) {
                throw new Error(`Techniques ausentes: ${missing.join(", ")}.`);
            }
            const inserts = techSlugs
                .map((s) => ({ recipe_id: id, technique_id: slugToId.get(s)! }))
                .filter(Boolean);
            if (inserts.length) {
                const { error: insErr } = await supabase.from("recipe_techniques").insert(inserts);
                if (insErr) throw new Error("Falha ao inserir técnicas da receita.");
            }
        }
    }

    // ------------- OCCASIONS -------------
    if (occPresent) {
        const occSlugs = readSlugs(fd, "occasion_slugs[]");
        {
            const { error } = await supabase.from("recipe_occasions").delete().eq("recipe_id", id);
            if (error) throw new Error("Falha ao limpar ocasiões da receita.");
        }
        if (occSlugs.length > 0) {
            const { data: rows, error } = await supabase
                .from("occasions")
                .select("id, slug")
                .in("slug", occSlugs);
            if (error) throw new Error("Falha ao resolver ocasiões.");
            const slugToId = new Map((rows ?? []).map((r) => [r.slug, r.id]));
            const missing = occSlugs.filter((s) => !slugToId.has(s));
            if (missing.length) {
                throw new Error(`Occasions ausentes: ${missing.join(", ")}.`);
            }
            const inserts = occSlugs
                .map((s) => ({ recipe_id: id, occasion_id: slugToId.get(s)! }))
                .filter(Boolean);
            if (inserts.length) {
                const { error: insErr } = await supabase.from("recipe_occasions").insert(inserts);
                if (insErr) throw new Error("Falha ao inserir ocasiões da receita.");
            }
        }
    }

    // Revalidate dashboard + public
    revalidatePath("/dashboard/recipes");
    if (recipe.site_slug) {
        revalidatePath(`/receitas/${recipe.site_slug}`);
    }

    return { ok: true };
}

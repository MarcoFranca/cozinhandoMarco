"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getClientAndUser, sanitizeStr, slugifyPtBr } from "./common";

export async function createRecipeAction(formData: FormData) {
    const name = sanitizeStr(formData.get("name"));
    if (!name) throw new Error("Nome obrigatório.");

    const category = sanitizeStr(formData.get("category"));
    const status = (sanitizeStr(formData.get("status")) ?? "idea") as string;
    const difficulty = sanitizeStr(formData.get("difficulty"));
    const prepRaw = sanitizeStr(formData.get("prep_time_minutes"));
    const prep_time_minutes = prepRaw ? Math.max(0, Number(prepRaw)) : null;

    // NOVOS CAMPOS (vindos do form)
    const site_override = (sanitizeStr(formData.get("site_override")) ?? "auto") as
        | "auto"
        | "forcar_exibir"
        | "forcar_ocultar";

    const preferir_link_youtube =
        (sanitizeStr(formData.get("preferir_link_youtube")) ?? "") === "on";

    const customSlug = sanitizeStr(formData.get("site_slug"));
    const site_slug = customSlug || slugifyPtBr(name);

    const site_order_raw = sanitizeStr(formData.get("site_order"));
    const site_order = site_order_raw ? Number(site_order_raw) : null;

    const short_description = sanitizeStr(formData.get("short_description"));

    const publicado_at_raw = sanitizeStr(formData.get("publicado_at"));
    const publicado_at = publicado_at_raw ? new Date(publicado_at_raw).toISOString() : null;

    // campos que você já tinha/usa
    const youtube_url = sanitizeStr(formData.get("youtube_url"));
    const cover_url = sanitizeStr(formData.get("cover_url"));

    const { supabase, user } = await getClientAndUser();

    const { data: created, error } = await supabase
        .from("recipes")
        .insert([
            {
                user_id: user.id,
                name,
                category,
                status,
                difficulty,
                prep_time_minutes,

                // NOVOS
                site_slug,
                site_override,
                preferir_link_youtube,
                site_order,
                short_description,
                publicado_at,

                // já existiam
                youtube_url,
                cover_url,
            },
        ])
        .select("id, site_slug")
        .single();

    if (error) throw error;

    // Revalida páginas públicas caso essa receita já seja publicável
    revalidatePath("/dashboard"); // home pública
    if (created?.site_slug) revalidatePath(`/dashboard/receitas/${created.site_slug}`);

    // Revalida lista interna
    revalidatePath("/dashboard/recipes");

    // Vai pra página interna da receita (por id). Se preferir, pode redirecionar para /recipes/<id>/edit
    redirect(`/dashboard/recipes/${created!.id}`);
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

    // NOVOS CAMPOS (opcionais no patch)
    const site_override = sanitizeStr(formData.get("site_override")) as
        | "auto"
        | "forcar_exibir"
        | "forcar_ocultar"
        | null;

    const preferir_link_youtube =
        (sanitizeStr(formData.get("preferir_link_youtube")) ?? "") === "on";

    const form_slug = sanitizeStr(formData.get("site_slug"));
    const site_order_raw = sanitizeStr(formData.get("site_order"));
    const site_order = site_order_raw ? Number(site_order_raw) : null;

    const short_description = sanitizeStr(formData.get("short_description"));

    const publicado_at_raw = sanitizeStr(formData.get("publicado_at"));
    const publicado_at = publicado_at_raw ? new Date(publicado_at_raw).toISOString() : null;

    const youtube_url = sanitizeStr(formData.get("youtube_url"));
    const cover_url = sanitizeStr(formData.get("cover_url"));

    const { supabase, user } = await getClientAndUser();

    // Monta patch
    const patch: Record<string, unknown> = {};
    if (name !== null) patch.name = name;
    patch.category = category;
    patch.status = status;
    patch.difficulty = difficulty || null;
    patch.prep_time_minutes = prep_time_minutes;

    // Novos (apenas se vieram do form / valor controlado)
    if (site_override) patch.site_override = site_override;
    patch.preferir_link_youtube = preferir_link_youtube;
    patch.site_order = site_order;
    patch.short_description = short_description;
    patch.publicado_at = publicado_at;
    patch.youtube_url = youtube_url;
    patch.cover_url = cover_url;

    // Slug: se veio do form, usar; se não veio e o nome mudou e não havia slug, gerar
    if (form_slug) {
        patch.site_slug = form_slug;
    } else if (name) {
        const { data: current } = await supabase
            .from("recipes")
            .select("site_slug")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

        if (!current?.site_slug) {
            patch.site_slug = slugifyPtBr(name);
        }
    }

    // Atualiza
    const { error: upErr } = await supabase
        .from("recipes")
        .update(patch)
        .eq("id", id)
        .eq("user_id", user.id);
    if (upErr) throw upErr;

    // Pega o slug final (já atualizado)
    const { data: after } = await supabase
        .from("recipes")
        .select("site_slug")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
    const slug = after?.site_slug as string | undefined;

    // Revalida páginas públicas
    revalidatePath("/dashboard");
    if (slug) revalidatePath(`/dashboard/receitas/${slug}`);

    // Revalida páginas internas
    revalidatePath(`/dashboard/recipes/${id}`);
    revalidatePath(`/dashboard/recipes`);
}

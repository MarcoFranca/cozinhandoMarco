// app/dashboard/recipes/actions/updateRecipeMetaAction.ts
"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-actions";
import { requireUser } from "@/lib/auth";

function normalizeString(v: FormDataEntryValue | null, max = 200): string | null {
    const s = (typeof v === "string" ? v : "").trim();
    if (!s) return null;
    return s.slice(0, max);
}
function normalizeInt(v: FormDataEntryValue | null): number | null {
    const s = (typeof v === "string" ? v : "").trim();
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
}
function normalizeSlug(v: FormDataEntryValue | null): string | null {
    const s = (typeof v === "string" ? v : "").trim();
    if (!s) return null;
    return s;
}

export async function updateRecipeMetaAction(fd: FormData) {
    const { user } = await requireUser();
    const supabase = await createSupabaseServerActionClient();

    const id = normalizeString(fd.get("id"), 64);
    if (!id) throw new Error("ID da receita é obrigatório.");

    // campos base
    const name = normalizeString(fd.get("name"), 140);
    const prep_time_minutes = normalizeInt(fd.get("prep_time_minutes"));
    const status = normalizeSlug(fd.get("status"));
    const difficulty_slug = normalizeSlug(fd.get("difficulty_slug"));
    type CategoryRow = { id: string; slug: string };

    // categorias (ordem) — pode vir vazio (quer dizer "limpar tudo")
    const categoriesPresent = fd.get("categories_present"); // hidden marker no form
    const categorySlugs: string[] = [];
    for (const [key, value] of fd.entries()) {
        if (key === "category_slugs[]") {
            const slug = normalizeSlug(value);
            if (slug) categorySlugs.push(slug);
        }
    }

    // checa ownership via recipes
    const { data: existing, error: fetchErr } = await supabase
        .from("recipes")
        .select("id, user_id, site_slug")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (fetchErr || !existing) {
        throw new Error("Receita não encontrada ou sem permissão.");
    }

    // update parcial em recipes
    const payload: Record<string, unknown> = {};
    if (name !== null) payload.name = name;
    if (prep_time_minutes !== null) payload.prep_time_minutes = prep_time_minutes;
    if (status !== null) payload.status = status;
    if (difficulty_slug !== null) payload.difficulty_slug = difficulty_slug;

    if (Object.keys(payload).length > 0) {
        const { error: upErr } = await supabase
            .from("recipes")
            .update(payload)
            .eq("id", id)
            .eq("user_id", user.id); // RLS adicional
        if (upErr) throw new Error("Falha ao atualizar a receita.");
    }

    // --- SINCRONISMO DE CATEGORIAS ---
    if (categoriesPresent) {
        // 0) Helpers locais
        const AUTO_SEED_MISSING = false; // ✅ mude para true se quiser auto-criar categorias ausentes
        async function seedMissingCategories(missingSlugs: string[]) {
            // Carrega labels do front para seed (somente se for sua escolha)
            const { CATEGORY_LABELS } = await import("@/constants/taxonomies");
            const rows = missingSlugs.map((slug) => ({
                slug,
                label_ptbr: (CATEGORY_LABELS as Record<string, string>)[slug] ?? slug,
            }));
            // upsert idempotente por slug
            const { error } = await supabase.from("categories").upsert(rows, { onConflict: "slug" });
            if (error) throw new Error("Falha ao seedar categorias ausentes.");
        }

        // 1) DELETE todas as ligações existentes da receita
        const { error: delErr } = await supabase
            .from("recipe_categories")
            .delete()
            .eq("recipe_id", id); // sem user_id; RLS deve validar ownership por FK
        if (delErr) {
            // console.error("DELETE recipe_categories error:", delErr);
            throw new Error("Falha ao limpar categorias da receita.");
        }

        // 2) Se houver seleção, resolve IDs (e semeia se necessário)
        if (categorySlugs.length > 0) {
            const { data: catRowsInitial, error: catErr } = await supabase
                .from("categories")
                .select("id, slug")
                .in("slug", categorySlugs);

            if (catErr) {
                throw new Error("Falha ao resolver categorias.");
            }

// usamos uma variável mutável, tipada, sem 'any'
            let categoryRows: CategoryRow[] = (catRowsInitial ?? []) as CategoryRow[];

            const foundSlugs = new Set(categoryRows.map((c) => c.slug));
            const missing = categorySlugs.filter((s) => !foundSlugs.has(s));

            if (missing.length > 0) {
                if (AUTO_SEED_MISSING) {
                    await seedMissingCategories(missing);
                    // refaz SELECT após seed
                    const { data: seededRows, error: seededErr } = await supabase
                        .from("categories")
                        .select("id, slug")
                        .in("slug", categorySlugs);

                    if (seededErr) throw new Error("Falha ao resolver categorias (após seed).");

                    // ✅ corrigido: usar 'seededRows' (sem 'seedingRows') e tipar
                    categoryRows = (seededRows ?? []) as CategoryRow[];
                } else {
                    throw new Error(
                        `Categorias ausentes na taxonomia: ${missing.join(
                            ", "
                        )}. Cadastre/seed antes de salvar a receita.`
                    );
                }
            }


            // 3) Monta vínculos na ordem (+10) e insere
            const slugToId = new Map(categoryRows.map((c) => [c.slug, c.id]));
            const rowsToInsert = categorySlugs
                .map((slug, idx) => {
                    const category_id = slugToId.get(slug);
                    if (!category_id) return null;
                    return {
                        recipe_id: id,
                        category_id,
                        position: (idx + 1) * 10,
                    };
                })
                .filter(Boolean) as { recipe_id: string; category_id: string; position: number }[];

            if (rowsToInsert.length > 0) {
                const { error: insErr } = await supabase.from("recipe_categories").insert(rowsToInsert);
                if (insErr) {
                    // console.error("INSERT recipe_categories error:", insErr);
                    throw new Error("Falha ao inserir categorias da receita.");
                }
            }
        }
    }
// --- FIM CATEGORIAS ---


    // revalidate dashboard + página pública (se houver)
    revalidatePath("/dashboard/recipes");
    if (existing.site_slug) {
        revalidatePath(`/receitas/${existing.site_slug}`);
    }

    return { ok: true };
}

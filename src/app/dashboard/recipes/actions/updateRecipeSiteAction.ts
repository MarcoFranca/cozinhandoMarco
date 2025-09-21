// src/app/dashboard/recipes/actions/updateRecipeSiteAction.ts
"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-actions";
import { requireUserServerAction } from "@/lib/auth";
import { normalizeSiteOverride, SiteOverride } from "@/lib/taxonomies/guards";

function parseBooleanFromForm(fd: FormData, name: string): boolean | null {
    // Convention: presence marker e.g., preferir_link_youtube_present = "1"
    const present = fd.get(`${name}_present`);
    if (!present) return null; // field not being updated
    return fd.get(name) != null; // checked checkbox comes as "on"
}

function normalizeSlugOrNull(v: FormDataEntryValue | null): string | null {
    const raw = (typeof v === "string" ? v : "").trim();
    if (!raw) return null;
    const kebab = raw
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
    return kebab || null;
}

function normalizeIntOrNull(v: FormDataEntryValue | null): number | null {
    const s = (typeof v === "string" ? v : "").trim();
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
}

function normalizeStringOrNull(v: FormDataEntryValue | null, max = 500): string | null {
    const s = (typeof v === "string" ? v : "").trim();
    if (!s) return null;
    return s.slice(0, max);
}

function normalizeISODateOrNull(v: FormDataEntryValue | null): string | null {
    const s = (typeof v === "string" ? v : "").trim();
    if (!s) return null;
    // Accepts "YYYY-MM-DDTHH:mm" and converts to ISO
    const asDate = new Date(s);
    if (isNaN(asDate.getTime())) return null;
    return asDate.toISOString();
}

export async function updateRecipeSiteAction(fd: FormData) {
    const { user } = await requireUserServerAction();
    const supabase = await createSupabaseServerActionClient();

    const id = normalizeStringOrNull(fd.get("id"), 64);
    if (!id) {
        throw new Error("ID da receita é obrigatório.");
    }

    // Build update payload partially
    const payload: {
        site_slug?: string | null;
        site_override?: SiteOverride | null;
        preferir_link_youtube?: boolean | null;
        site_order?: number | null;
        short_description?: string | null;
        description?: string | null; // ★ novo — descrição longa
        publicado_at?: string | null;
        youtube_url?: string | null;
        cover_url?: string | null;
        updated_at?: string;
    } = {};

    // slug
    if (fd.has("site_slug")) {
        payload.site_slug = normalizeSlugOrNull(fd.get("site_slug"));
    }

    // site_override (strict union)
    if (fd.has("site_override")) {
        const raw = normalizeStringOrNull(fd.get("site_override"), 64);
        payload.site_override = normalizeSiteOverride(raw);
    }

    // preferir_link_youtube (boolean with *_present marker)
    const prefer = parseBooleanFromForm(fd, "preferir_link_youtube");
    if (prefer !== null) payload.preferir_link_youtube = prefer;

    // site_order
    if (fd.has("site_order")) {
        payload.site_order = normalizeIntOrNull(fd.get("site_order"));
    }

    // ★ short_description (SEO) — respeita present flag
    if (fd.get("short_description_present") === "1") {
        // se vier string vazia, normalizeStringOrNull retorna null ⇒ limpa a coluna
        payload.short_description = normalizeStringOrNull(fd.get("short_description"), 160);
    }

    // ★ description (longa) — respeita present flag
    if (fd.get("description_present") === "1") {
        payload.description = normalizeStringOrNull(fd.get("description"), 3000);
    }

    // publicado_at (permite vazio para despublicar)
    if (fd.has("publicado_at")) {
        const iso = normalizeISODateOrNull(fd.get("publicado_at"));
        payload.publicado_at = iso; // vazio/invalid ⇒ null (unpublish)
    }

    // youtube_url / cover_url
    if (fd.has("youtube_url")) {
        payload.youtube_url = normalizeStringOrNull(fd.get("youtube_url"), 500);
    }
    if (fd.has("cover_url")) {
        payload.cover_url = normalizeStringOrNull(fd.get("cover_url"), 1000);
    }

    // Authorization: ensure user owns the recipe
    const { data: existing, error: fetchErr } = await supabase
        .from("recipes")
        .select("id, user_id, site_slug")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (fetchErr || !existing) {
        throw new Error("Receita não encontrada ou você não tem permissão.");
    }

    const oldSlug = existing.site_slug ?? null;

    const { error: upErr } = await supabase
        .from("recipes")
        .update(payload)
        .eq("id", id)
        .eq("user_id", user.id);

    if (upErr) {
        throw new Error("Falha ao salvar metadados do site.");
    }

    // Revalidate dashboard list
    revalidatePath("/dashboard/recipes");

    // Revalidate public page(s)
    const newSlug = payload.site_slug ?? oldSlug;
    if (newSlug) {
        revalidatePath(`/receitas/${newSlug}`);
    }
    if (oldSlug && oldSlug !== newSlug) {
        revalidatePath(`/receitas/${oldSlug}`);
    }

    // (Opcional) home/listas públicas
    revalidatePath("/");

    return { ok: true };
}

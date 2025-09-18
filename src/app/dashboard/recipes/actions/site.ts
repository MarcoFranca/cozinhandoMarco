"use server";

import { revalidatePath } from "next/cache";
import { getClientAndUser, sanitizeStr } from "./common";

/** Lê do FormData, mas só retorna valor quando a key veio no form.
 *  Isso evita sobrescrever com vazio se o campo não foi enviado.
 */
function getOpt(formData: FormData, key: string) {
    const raw = formData.get(key);
    if (raw === null) return undefined; // não mexe neste campo
    const s = sanitizeStr(raw);
    return s === "" ? undefined : s;     // string vazia também não mexe
}

export async function updateRecipeSiteAction(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("id ausente.");

    const { supabase, user } = await getClientAndUser();

    const patch: Record<string, unknown> = {};

    // Campos text/num — só aplica se vierem
    const site_slug = getOpt(formData, "site_slug");
    if (site_slug !== undefined) patch.site_slug = site_slug;

    const site_override = getOpt(formData, "site_override");
    if (site_override !== undefined) {
        // valida opcionalmente contra valores esperados
        patch.site_override = site_override;
    }

    const site_order_raw = getOpt(formData, "site_order");
    if (site_order_raw !== undefined) {
        const n = Number(site_order_raw);
        patch.site_order = Number.isFinite(n) ? n : null;
    }

    const short_description = getOpt(formData, "short_description");
    if (short_description !== undefined) patch.short_description = short_description;

    const publicado_at_raw = getOpt(formData, "publicado_at");
    if (publicado_at_raw !== undefined) {
        patch.publicado_at = publicado_at_raw ? new Date(publicado_at_raw).toISOString() : null;
    }

    const youtube_url = getOpt(formData, "youtube_url");
    if (youtube_url !== undefined) patch.youtube_url = youtube_url;

    const cover_url = getOpt(formData, "cover_url");
    if (cover_url !== undefined) patch.cover_url = cover_url;

    // Boolean: usamos marcador de presença no form (preferir_link_youtube_present)
    const hasPreferir = formData.has("preferir_link_youtube_present");
    if (hasPreferir) {
        const isOn = (sanitizeStr(formData.get("preferir_link_youtube")) ?? "") === "on";
        patch.preferir_link_youtube = isOn;
    }

    if (Object.keys(patch).length === 0) {
        // nada a atualizar; evita update vazio
        return;
    }

    const { error } = await supabase
        .from("recipes")
        .update(patch)
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;

    // pega slug final para revalidar página pública
    const { data: after } = await supabase
        .from("recipes")
        .select("site_slug")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    const slug = after?.site_slug as string | undefined;

    // Revalida site público
    revalidatePath("/");                     // Home pública
    if (slug) revalidatePath(`/receitas/${slug}`);

    // Revalida telas internas (ajuste os caminhos conforme seu app)
    revalidatePath(`/recipes/${id}`);
    revalidatePath(`/recipes`);
}

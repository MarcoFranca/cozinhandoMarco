"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-actions";

export async function updateRecipeAction(formData: FormData) {
    const supabase = await createSupabaseServerActionClient();

    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const category = (String(formData.get("category") || "") || null) as string | null;
    const status = String(formData.get("status") || "idea") as
        | "idea" | "tested" | "recorded" | "edited" | "published";
    const difficultyRaw = String(formData.get("difficulty") || "");
    const difficulty = (difficultyRaw ? difficultyRaw : null) as "easy" | "medium" | "hard" | null;
    const prep = String(formData.get("prep_time_minutes") || "");
    const prep_time_minutes = prep ? parseInt(prep, 10) : null;

    const ingredients = (String(formData.get("ingredients") || "") || null) as string | null;
    const instructions = (String(formData.get("instructions") || "") || null) as string | null;
    const youtube_url = (String(formData.get("youtube_url") || "") || null) as string | null;
    const cover_url = (String(formData.get("cover_url") || "") || null) as string | null;

    if (!id || !name) {
        throw new Error("ID e nome são obrigatórios.");
    }

    const { error } = await supabase
        .from("recipes")
        .update({
            name,
            category,
            status,
            difficulty,
            prep_time_minutes,
            ingredients,
            instructions,
            youtube_url,
            cover_url,
        })
        .eq("id", id)
        .select("id")
        .single();

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    revalidatePath(`/recipes/${id}`);
    // Fica na mesma página, sem redirect (UX suave). Se preferir, use redirect(`/recipes/${id}`)
}

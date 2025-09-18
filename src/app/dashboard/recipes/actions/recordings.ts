"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-actions";
import { isRecordingStatus, type RecordingStatus } from "@/constants/taxonomies";

export async function createRecordingAction(formData: FormData) {
    const recipe_id = String(formData.get("recipe_id") ?? "");
    const shoot_date = (formData.get("shoot_date") as string | null) ?? null;
    const shoot_status = (formData.get("shoot_status") as string | null) ?? null;
    const scene_notes = (formData.get("scene_notes") as string | null) ?? null;

    if (!recipe_id || !shoot_date) throw new Error("Dados incompletos.");

    const supabase = await createSupabaseServerActionClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado.");

    const normalizedStatus: RecordingStatus | null =
        shoot_status && isRecordingStatus(shoot_status) ? shoot_status : null;

    await supabase.from("recordings").insert([
        {
            user_id: user.id,
            recipe_id,
            shoot_date,
            shoot_status: normalizedStatus,
            equipment_checklist: null,
            scene_notes,
        },
    ]);

    revalidatePath(`/recipes/${recipe_id}`);
}

type RecordingPatch = Partial<{
    shoot_date: string;
    shoot_status: RecordingStatus | null;
    scene_notes: string | null;
}>;

export async function updateRecordingAction(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("id ausente.");

    const shoot_date = (formData.get("shoot_date") as string | null) ?? null;
    const shoot_status = (formData.get("shoot_status") as string | null) ?? null;
    const scene_notes = (formData.get("scene_notes") as string | null) ?? null;

    const patch: RecordingPatch = {};
    if (shoot_date !== null) patch.shoot_date = shoot_date;
    if (shoot_status !== null)
        patch.shoot_status = isRecordingStatus(shoot_status) ? shoot_status : null;
    if (scene_notes !== null) patch.scene_notes = scene_notes;

    const supabase = await createSupabaseServerActionClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado.");

    // descobrir recipe_id para revalidate
    const { data: rec } = await supabase
        .from("recordings")
        .select("recipe_id")
        .eq("id", id)
        .single();
    if (!rec) return;

    await supabase
        .from("recordings")
        .update(patch)
        .eq("id", id)
        .eq("user_id", user.id);

    revalidatePath(`/recipes/${rec.recipe_id}`);
}

export async function deleteRecordingAction(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("id ausente.");

    const supabase = await createSupabaseServerActionClient();
    const { data: rec } = await supabase
        .from("recordings")
        .select("recipe_id")
        .eq("id", id)
        .single();
    if (!rec) return;

    await supabase.from("recordings").delete().eq("id", id);
    revalidatePath(`/recipes/${rec.recipe_id}`);
}

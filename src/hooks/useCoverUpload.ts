"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useCoverUpload(initialUrl?: string | null) {
    const [uploading, setUploading] = useState(false);
    const [coverUrl, setCoverUrl] = useState<string>(initialUrl ?? "");
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function uploadCover(recipeId: string) {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            toast("Escolha um arquivo antes de enviar.");
            return;
        }

        setUploading(true);
        try {
            const supabase = createSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado.");

            const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
            const path = `${user.id}/recipes/${recipeId}/cover-${Date.now()}.${ext}`;

            // Bucket correto
            const { error: upErr } = await supabase.storage
                .from("recipe-assets")
                .upload(path, file, { upsert: false, cacheControl: "3600" });
            if (upErr) throw upErr;

            const { data: pub } = await supabase.storage
                .from("recipe-assets")
                .getPublicUrl(path);

            if (!pub?.publicUrl) throw new Error("URL pública não disponível.");

            setCoverUrl(pub.publicUrl);
            toast("Upload concluído!");
            return pub.publicUrl;
        } catch (e: any) {
            console.error(e);
            toast.error(e?.message ?? "Falha ao enviar imagem.");
        } finally {
            setUploading(false);
        }
    }

    return { fileInputRef, uploading, coverUrl, setCoverUrl, uploadCover };
}

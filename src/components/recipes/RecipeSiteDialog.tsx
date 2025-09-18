"use client";

import * as React from "react";
import { useTransition } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { useCoverUpload } from "@/hooks/useCoverUpload";

const SITE_OVERRIDES = [
    { value: "auto", label: "Automático (publica ao marcar Postado)" },
    { value: "forcar_exibir", label: "Forçar exibir (mesmo sem Postado)" },
    { value: "forcar_ocultar", label: "Forçar ocultar (mesmo Postado)" },
] as const;

type RecipeSiteFields = {
    id: string;
    site_slug: string | null;
    site_override: "auto" | "forcar_exibir" | "forcar_ocultar" | null;
    preferir_link_youtube: boolean | null;
    site_order: number | null;
    short_description: string | null;
    publicado_at: string | null;
    youtube_url?: string | null;
    cover_url?: string | null;
};

export function RecipeSiteDialog({ recipe }: { recipe: RecipeSiteFields }) {
    const [open, setOpen] = React.useState(false);
    const [isPending, startTransition] = useTransition();
    const { fileInputRef, uploading, coverUrl, setCoverUrl, uploadCover } =
        useCoverUpload(recipe.cover_url ?? "");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar (site)
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Publicação no site</DialogTitle>
                    <DialogDescription>Controle o que aparece no site público e como a receita é exibida.</DialogDescription>
                </DialogHeader>

                <form
                    action={(fd) => {
                        startTransition(async () => {
                            fd.set("id", recipe.id);
                            // marcador para boolean (edição parcial)
                            fd.set("preferir_link_youtube_present", "1");

                            const { updateRecipeSiteAction } = await import("@/app/dashboard/recipes/actions");
                            await updateRecipeSiteAction(fd);
                            toast("Salvo e site atualizado!");
                            setOpen(false);
                        });
                    }}
                    className="space-y-3"
                >
                    {/* Visibilidade */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Visibilidade no site</label>
                        <select
                            name="site_override"
                            defaultValue={recipe.site_override ?? "auto"}
                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                        >
                            {SITE_OVERRIDES.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Preferir YouTube */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Preferir link para YouTube</label>
                        {/* marcador de presença para boolean */}
                        <input type="hidden" name="preferir_link_youtube_present" value="1" />
                        <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-2 text-sm">
                            <input
                                id="preferir_link_youtube"
                                type="checkbox"
                                name="preferir_link_youtube"
                                defaultChecked={!!recipe.preferir_link_youtube}
                            />
                            <label htmlFor="preferir_link_youtube" className="cursor-pointer">
                                Direcionar o tráfego ao YouTube (não embeda por padrão)
                            </label>
                        </div>
                    </div>

                    {/* Slug + Ordem */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Slug público</label>
                            <Input name="site_slug" defaultValue={recipe.site_slug ?? ""} placeholder="ex.: costela-outback-caseira" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Ordem na Home</label>
                            <Input type="number" name="site_order" defaultValue={recipe.site_order ?? ""} placeholder="ex.: 10" />
                        </div>
                    </div>

                    {/* SEO + Data */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Descrição curta (SEO)</label>
                        <Input name="short_description" defaultValue={recipe.short_description ?? ""} placeholder="Resumo curto da receita..." />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Publicado em</label>
                        <Input
                            type="datetime-local"
                            name="publicado_at"
                            defaultValue={recipe.publicado_at ? toDateTimeLocal(recipe.publicado_at) : ""}
                        />
                    </div>

                    {/* URLs */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">URL do YouTube</label>
                            <Input name="youtube_url" defaultValue={recipe.youtube_url ?? ""} placeholder="https://www.youtube.com/watch?v=..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">URL da capa</label>
                            <Input name="cover_url" defaultValue={recipe.cover_url ?? ""} placeholder="https://..." />
                        </div>
                    </div>

                    {/* Upload da capa */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Capa da receita</label>
                        <input id="cover-input" type="file" accept="image/*" ref={fileInputRef} className="hidden" />

                        <div className="flex gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl">
                                Escolher arquivo
                            </Button>

                            <Button
                                type="button"
                                onClick={async () => {
                                    const url = await uploadCover(recipe.id);
                                    if (url) {
                                        setCoverUrl(url);
                                        // salva a capa imediatamente (opcional)
                                        const fd = new FormData();
                                        fd.set("id", recipe.id);
                                        fd.set("cover_url", url);
                                        const { updateRecipeSiteAction } = await import("@/app/dashboard/recipes/actions");
                                        await updateRecipeSiteAction(fd);
                                        toast("Capa atualizada!");
                                    }
                                }}
                                disabled={uploading}
                                className="rounded-xl"
                            >
                                {uploading ? "Enviando..." : "Enviar imagem"}
                            </Button>

                            {coverUrl && (
                                <a href={coverUrl} target="_blank" className="text-sm underline">
                                    Ver atual
                                </a>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {fileInputRef.current?.files?.[0]?.name ?? "Nenhum arquivo selecionado."}
                        </p>

                        {/* mantém sincronizado para o submit principal */}
                        <input type="hidden" name="cover_url" value={coverUrl} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancelar</Button>
                        <Button type="submit" disabled={isPending} className="rounded-xl">
                            {isPending ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function toDateTimeLocal(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

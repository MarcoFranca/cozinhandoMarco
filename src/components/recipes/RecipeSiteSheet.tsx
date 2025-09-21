// src/components/recipes/RecipeSiteSheet.tsx
"use client";

import * as React from "react";
import { useTransition, useMemo } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Globe2 } from "lucide-react";
import { useCoverUpload } from "@/hooks/useCoverUpload";
import { SiteOverride } from "@/lib/taxonomies/guards";

const SITE_OVERRIDES = [
    { value: "auto", label: "Automático (publica ao marcar Postado)" },
    { value: "forcar_exibir", label: "Forçar exibir (mesmo sem Postado)" },
    { value: "forcar_ocultar", label: "Forçar ocultar (mesmo Postado)" },
] as const;

export type RecipeSiteFields = {
    id: string;
    site_slug: string | null;
    site_override: SiteOverride | null;
    preferir_link_youtube: boolean | null;
    site_order: number | null;
    short_description: string | null;
    description?: string | null; // <-- NOVO: descrição longa
    publicado_at: string | null;
    youtube_url?: string | null;
    cover_url?: string | null;
};

export function RecipeSiteSheet({ recipe }: { recipe: RecipeSiteFields }) {
    const [open, setOpen] = React.useState(false);
    const [isPending, startTransition] = useTransition();
    const [publishNow, setPublishNow] = React.useState(false);
    const [unpublish, setUnpublish] = React.useState(false);

    const [longDesc, setLongDesc] = React.useState<string>(recipe.description ?? "");
    const [shortDesc, setShortDesc] = React.useState<string>(recipe.short_description ?? "");
    const shortCount = shortDesc.length;
    const shortMax = 160;
    const longMax = 3000;


    const { fileInputRef, uploading, coverUrl, setCoverUrl, uploadCover } =
        useCoverUpload(recipe.cover_url ?? "");

    const toDateTimeLocal = (iso: string) => {
        const d = new Date(iso);
        const p = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(
            d.getMinutes()
        )}`;
    };

    const canPublish = useMemo(() => {
        // Regras simples de publicação:
        // - Slug é obrigatório para publicar
        return !!recipe.site_slug;
    }, [recipe.site_slug]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="rounded-xl cursor-pointer">
                    <Globe2 className="mr-2 h-4 w-4" />
                    Configurar publicação
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl p-0 max-h-screen">
                {/* HEADER */}
                <SheetHeader className="px-4 pt-4">
                    <SheetTitle>Publicação e metadados do site</SheetTitle>
                    <SheetDescription>Visibilidade, SEO, mídias e programação de publicação.</SheetDescription>
                </SheetHeader>

                {/* FORM em layout com área rolável */}
                <form
                    action={(fd) => {
                        startTransition(async () => {
                            fd.set("id", recipe.id);
                            // markers (present flags) — ADICIONE estas duas linhas:
                            fd.set("short_description_present", "1");
                            fd.set("description_present", "1");
                            // booleans: marker
                            fd.set("preferir_link_youtube_present", "1");

                            // valores (limite opcional; use seu slice atual se preferir)
                            const shortMax = 160;
                            const longMax = 3000;
                            const sanitize = (s: string, max: number) => (s ?? "").trim().slice(0, max);

// garanta que SEMPRE envia valor, mesmo vazio:
                            fd.set("short_description", sanitize(shortDesc, shortMax));
                            fd.set("description", sanitize(longDesc, longMax));

                            // publicar agora vs despublicar
                            if (publishNow) {
                                if (!canPublish) {
                                    toast.error("Defina um slug público antes de publicar.");
                                    return;
                                }
                                fd.set("publicado_at", new Date().toISOString());
                                if (!fd.get("site_override")) fd.set("site_override", "auto");
                            }
                            if (unpublish) {
                                fd.set("publicado_at", ""); // backend normaliza para null
                                // opcional: forçar ocultar
                                // fd.set("site_override", "forcar_ocultar");
                            }

                            const { updateRecipeSiteAction } = await import("@/app/dashboard/recipes/actions");
                            await updateRecipeSiteAction(fd);
                            toast.success("Salvo e site atualizado!");
                            setOpen(false);
                            setPublishNow(false);
                            setUnpublish(false);
                        });
                    }}
                    className="mt-2 flex h-[calc(100vh-3.5rem)] flex-col"
                >
                    {/* CONTEÚDO ROLÁVEL */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-6">
                        {/* Visibilidade & Publicação */}
                        <section className="grid gap-4 lg:grid-cols-2 rounded-2xl border p-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Visibilidade no site</label>
                                <select
                                    name="site_override"
                                    defaultValue={recipe.site_override ?? "auto"}
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm cursor-pointer"
                                >
                                    {SITE_OVERRIDES.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    “Automático” publica ao definir uma data de publicação.
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium cursor-pointer">Publicado em</label>
                                <Input
                                    type="datetime-local"
                                    name="publicado_at"
                                    defaultValue={recipe.publicado_at ? toDateTimeLocal(recipe.publicado_at) : ""}
                                />
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={publishNow}
                                            onChange={(e) => setPublishNow(e.target.checked)}
                                            className="cursor-pointer"
                                        />
                                        Publicar agora
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={unpublish}
                                            onChange={(e) => setUnpublish(e.target.checked)}
                                            className="cursor-pointer"
                                        />
                                        Despublicar
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Preferir link para YouTube</label>
                                <input type="hidden" name="preferir_link_youtube_present" value="1"  />
                                <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-2 text-sm">
                                    <input
                                        id="preferir_link_youtube"
                                        type="checkbox"
                                        name="preferir_link_youtube"
                                        className="cursor-pointer"
                                        defaultChecked={!!recipe.preferir_link_youtube}
                                    />
                                    <label htmlFor="preferir_link_youtube" className="cursor-pointer">
                                        Direcionar o tráfego ao YouTube (não embeda por padrão)
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* Slug & SEO */}
                        <section className="grid gap-4 lg:grid-cols-2 rounded-2xl border p-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Slug público</label>
                                <Input
                                    name="site_slug"
                                    defaultValue={recipe.site_slug ?? ""}
                                    placeholder="ex.: costela-outback-caseira"
                                />
                                <p className="text-xs text-muted-foreground">
                                    URL final: <code className="text-xs">/receitas/&lt;slug&gt;</code>
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Ordem na Home</label>
                                <Input type="number" name="site_order" defaultValue={recipe.site_order ?? ""} placeholder="ex.: 10" />
                            </div>

                            <div className="lg:col-span-2 space-y-1">
                                <label className="text-sm font-medium">Descrição curta (SEO)</label>
                                <Input
                                    name="short_description"
                                    value={shortDesc}
                                    onChange={(e) => setShortDesc(e.target.value)}
                                    placeholder="Resumo curto da receita..."
                                />
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Máx. {shortMax} caracteres.</span>
                                    <span className={shortCount > shortMax ? "text-red-500" : "text-muted-foreground"}>
                    {shortCount}/{shortMax}
                  </span>
                                </div>
                            </div>

                            {/* NOVO: Descrição longa */}
                            <div className="lg:col-span-2 space-y-1">
                                <label className="text-sm font-medium">Descrição longa</label>
                                <textarea
                                    name="description"
                                    className="min-h-[120px] w-full rounded-md border bg-background p-2 text-sm"
                                    value={longDesc}
                                    onChange={(e) => setLongDesc(e.target.value)}
                                    placeholder="Conte a história, técnicas e variações da receita..."
                                />
                                <div className="flex items-center justify-end text-xs text-muted-foreground">
                                    {longDesc.length}/{longMax}
                                </div>
                            </div>
                        </section>

                        {/* Mídia */}
                        <section className="grid gap-4 lg:grid-cols-2 rounded-2xl border p-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">URL do YouTube</label>
                                <Input
                                    name="youtube_url"
                                    defaultValue={recipe.youtube_url ?? ""}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">URL da capa</label>
                                <Input name="cover_url" defaultValue={recipe.cover_url ?? ""} placeholder="https://..." />
                            </div>

                            <div className="lg:col-span-2 space-y-1">
                                <label className="text-sm font-medium">Capa da receita</label>
                                <input id="cover-input" type="file" accept="image/*" ref={fileInputRef} className="hidden" />

                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="rounded-xl cursor-pointer"
                                    >
                                        Escolher arquivo
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={async () => {
                                            const url = await uploadCover(recipe.id);
                                            if (url) {
                                                setCoverUrl(url);
                                                const fd = new FormData();
                                                fd.set("id", recipe.id);
                                                fd.set("cover_url", url);
                                                const { updateRecipeSiteAction } = await import("@/app/dashboard/recipes/actions");
                                                await updateRecipeSiteAction(fd);
                                                toast.success("Capa atualizada!");
                                            }
                                        }}
                                        disabled={uploading}
                                        className="rounded-xl cursor-pointer"
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

                                <input type="hidden" name="cover_url" value={coverUrl} />
                            </div>
                        </section>
                    </div>

                    {/* FOOTER fixo */}
                    <SheetFooter className="sticky bottom-0 mt-0 border-t bg-background px-4 py-3">
                        <div className="flex w-full flex-wrap justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="rounded-xl cursor-pointer"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="rounded-xl cursor-pointer"
                                onClick={() => {
                                    setPublishNow(false);
                                    setUnpublish(false);
                                }}
                            >
                                {isPending ? "Salvando..." : "Salvar"}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="rounded-xl cursor-pointer"
                                onClick={() => {
                                    setPublishNow(true);
                                    setUnpublish(false);
                                }}
                            >
                                {isPending ? "Salvando..." : "Salvar e Publicar"}
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isPending}
                                className="rounded-xl cursor-pointer"
                                onClick={() => {
                                    setPublishNow(false);
                                    setUnpublish(true);
                                }}
                            >
                                {isPending ? "Salvando..." : "Despublicar"}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

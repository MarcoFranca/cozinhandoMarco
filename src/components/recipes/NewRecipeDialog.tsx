"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Difficulty, RecipeStatus } from "@/types/db";
import {
    CATEGORIES as CATEGORY_OPTIONS,
    STATUSES,
    DIFFICULTIES,
    SITE_OVERRIDES,
} from "@/constants/taxonomies";

export function NewRecipeDialog() {
    const router = useRouter();
    const params = useSearchParams();
    const open = params.get("new") === "1";

    const [name, setName] = React.useState("");
    const [category, setCategory] = React.useState<string>("");
    const [categoryOther, setCategoryOther] = React.useState("");
    const [status, setStatus] = React.useState<RecipeStatus>("idea");
    const [difficulty, setDifficulty] = React.useState<Difficulty | "">("");
    const [prepTime, setPrepTime] = React.useState<string>("");

    // NEW FIELDS (site)
    const [siteOverride, setSiteOverride] = React.useState<string>("auto");
    const [preferirLinkYoutube, setPreferirLinkYoutube] = React.useState<boolean>(true);
    const [siteSlug, setSiteSlug] = React.useState<string>("");
    const [siteOrder, setSiteOrder] = React.useState<string>("");
    const [shortDescription, setShortDescription] = React.useState<string>("");
    const [publicadoAt, setPublicadoAt] = React.useState<string>("");

    // Optional existing fields (if you want already at creation)
    const [youtubeUrl, setYoutubeUrl] = React.useState<string>("");
    const [coverUrl, setCoverUrl] = React.useState<string>("");

    React.useEffect(() => {
        if (open) {
            setName("");
            setCategory("");
            setCategoryOther("");
            setStatus("idea");
            setDifficulty("");
            setPrepTime("");

            setSiteOverride("auto");
            setPreferirLinkYoutube(true);
            setSiteSlug("");
            setSiteOrder("");
            setShortDescription("");
            setPublicadoAt("");

            setYoutubeUrl("");
            setCoverUrl("");
        }
    }, [open]);

    function setOpen(next: boolean) {
        const usp = new URLSearchParams(Array.from(params.entries()));
        if (next) usp.set("new", "1");
        else usp.delete("new");
        router.replace(`/dashboard/recipes${usp.toString() ? `?${usp.toString()}` : ""}`, { scroll: false });
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const finalCategory =
            category === "__OTHER__" ? (categoryOther.trim() || null) : (category || null);

        const fd = new FormData();
        fd.set("name", name.trim());
        fd.set("category", finalCategory ?? "");
        fd.set("status", status);
        fd.set("difficulty", difficulty || "");
        fd.set("prep_time_minutes", prepTime || "");

        // NEW
        fd.set("site_override", siteOverride);
        if (preferirLinkYoutube) fd.set("preferir_link_youtube", "on");
        fd.set("site_slug", siteSlug.trim());
        fd.set("site_order", siteOrder);
        fd.set("short_description", shortDescription.trim());
        fd.set("publicado_at", publicadoAt); // YYYY-MM-DDTHH:mm (ou só date)

        // Optional existing
        fd.set("youtube_url", youtubeUrl.trim());
        fd.set("cover_url", coverUrl.trim());

        const { createRecipeAction } = await import("../../app/dashboard/recipes/actions");
        await createRecipeAction(fd);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nova receita</DialogTitle>
                    <DialogDescription>Cadastre uma nova receita para o seu banco.</DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-3">
                    {/* Nome */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Nome *</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex.: Costela ao molho..."
                            required
                        />
                    </div>

                    {/* Categoria */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Categoria</label>
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                name="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                            >
                                <option value="">Categoria</option>
                                {CATEGORY_OPTIONS.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                                <option value="__OTHER__">Outra…</option>
                            </select>

                            {category === "__OTHER__" && (
                                <input
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                    placeholder="Digite a categoria"
                                    value={categoryOther}
                                    onChange={(e) => setCategoryOther(e.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Status e Dificuldade */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Status</label>
                            <select
                                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as RecipeStatus)}
                            >
                                {STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Dificuldade</label>
                            <select
                                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                            >
                                <option value="">—</option>
                                {DIFFICULTIES.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tempo de preparo */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Tempo de preparo (min)</label>
                        <Input
                            type="number"
                            min={0}
                            value={prepTime}
                            onChange={(e) => setPrepTime(e.target.value)}
                            placeholder="Ex.: 45"
                        />
                    </div>

                    {/* --- NOVOS CAMPOS (Site) --- */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Visibilidade no site</label>
                            <select
                                value={siteOverride}
                                onChange={(e) => setSiteOverride(e.target.value)}
                                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                            >
                                {SITE_OVERRIDES.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Preferir link para YouTube</label>
                            <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-2 text-sm">
                                <input
                                    id="preferir_link_youtube"
                                    type="checkbox"
                                    checked={preferirLinkYoutube}
                                    onChange={(e) => setPreferirLinkYoutube(e.target.checked)}
                                />
                                <label htmlFor="preferir_link_youtube" className="cursor-pointer">
                                    Direcionar o tráfego pro YouTube
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Slug do site (opcional)</label>
                            <Input
                                value={siteSlug}
                                onChange={(e) => setSiteSlug(e.target.value)}
                                placeholder="ex.: costela-outback-caseira"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Ordem na Home (opcional)</label>
                            <Input
                                type="number"
                                min={0}
                                value={siteOrder}
                                onChange={(e) => setSiteOrder(e.target.value)}
                                placeholder="ex.: 10 (quanto menor, mais no topo)"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Descrição curta (SEO)</label>
                        <Input
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value)}
                            placeholder="Resumo curto da receita..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Publicado em (opcional)</label>
                        <Input
                            type="datetime-local"
                            value={publicadoAt}
                            onChange={(e) => setPublicadoAt(e.target.value)}
                        />
                    </div>

                    {/* (opcionais) URL do YouTube e capa */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">URL do YouTube</label>
                            <Input
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">URL da capa</label>
                            <Input
                                value={coverUrl}
                                onChange={(e) => setCoverUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                            Cancelar
                        </Button>
                        <Button type="submit" className="rounded-xl">Salvar</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// src/components/recipes/NewRecipeDialog.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ▼ novos imports (Rota B)
import { STATUSES } from "@/constants/taxonomies/statuses";
import { DIFFICULTIES, type DifficultySlug } from "@/constants/taxonomies/difficulties";
import { CATEGORIES, type CategorySlug } from "@/constants/taxonomies/categories";
import { SITE_OVERRIDES } from "@/constants/taxonomies"; // se mantiver aqui

export function NewRecipeDialog() {
    const router = useRouter();
    const params = useSearchParams();
    const open = params.get("new") === "1";

    const [name, setName] = React.useState("");
    const [status, setStatus] = React.useState<string>("idea");
    const [difficulty, setDifficulty] = React.useState<DifficultySlug | "">("");
    const [prepTime, setPrepTime] = React.useState<string>("");

    // MULTI categorias (slugs)
    const [categories, setCategories] = React.useState<CategorySlug[]>([]);

    // Campos do site
    const [siteOverride, setSiteOverride] = React.useState<string>("auto");
    const [preferirLinkYoutube, setPreferirLinkYoutube] = React.useState<boolean>(true);
    const [siteSlug, setSiteSlug] = React.useState<string>("");
    const [siteOrder, setSiteOrder] = React.useState<string>("");
    const [shortDescription, setShortDescription] = React.useState<string>("");
    const [publicadoAt, setPublicadoAt] = React.useState<string>("");

    // Opcionais
    const [youtubeUrl, setYoutubeUrl] = React.useState<string>("");
    const [coverUrl, setCoverUrl] = React.useState<string>("");

    React.useEffect(() => {
        if (open) {
            setName(""); setStatus("idea"); setDifficulty(""); setPrepTime("");
            setCategories([]);
            setSiteOverride("auto"); setPreferirLinkYoutube(true); setSiteSlug(""); setSiteOrder("");
            setShortDescription(""); setPublicadoAt(""); setYoutubeUrl(""); setCoverUrl("");
        }
    }, [open]);

    function setOpen(next: boolean) {
        const usp = new URLSearchParams(Array.from(params.entries()));
        if (next) usp.set("new", "1"); else usp.delete("new");
        router.replace(`/dashboard/recipes${usp.toString() ? `?${usp.toString()}` : ""}`, { scroll: false });
    }

    function toggleCategory(slug: CategorySlug) {
        setCategories((prev) => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const fd = new FormData();
        fd.set("name", name.trim());
        fd.set("status", status);
        fd.set("difficulty_slug", difficulty || "");
        fd.set("prep_time_minutes", prepTime || "");

        // categorias (array)
        categories.forEach((slug) => fd.append("categories[]", slug));

        // site
        fd.set("site_override", siteOverride);
        if (preferirLinkYoutube) fd.set("preferir_link_youtube", "on");
        fd.set("site_slug", siteSlug.trim());
        fd.set("site_order", siteOrder);
        fd.set("short_description", shortDescription.trim());
        fd.set("publicado_at", publicadoAt);

        // opcionais
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
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Costela ao molho..." required />
                    </div>

                    {/* Categorias (múltiplas) */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Categorias</label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto rounded-md border p-2">
                            {CATEGORIES.map((c) => (
                                <label key={c.value} className="inline-flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={categories.includes(c.value)}
                                        onChange={() => toggleCategory(c.value)}
                                    />
                                    {c.label}
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Selecione 1–3 categorias que melhor descrevem a receita.</p>
                    </div>

                    {/* Status e Dificuldade */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Status</label>
                            <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Dificuldade</label>
                            <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value as DifficultySlug)}>
                                <option value="">—</option>
                                {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Tempo de preparo */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Tempo de preparo (min)</label>
                        <Input type="number" min={0} value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="Ex.: 45" />
                    </div>

                    {/* Site */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Visibilidade no site</label>
                            <select value={siteOverride} onChange={(e) => setSiteOverride(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                                {SITE_OVERRIDES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Preferir link para YouTube</label>
                            <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-2 text-sm">
                                <input id="preferir_link_youtube" type="checkbox" checked={preferirLinkYoutube} onChange={(e) => setPreferirLinkYoutube(e.target.checked)} />
                                <label htmlFor="preferir_link_youtube" className="cursor-pointer">Direcionar o tráfego pro YouTube</label>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Slug do site (opcional)</label>
                            <Input value={siteSlug} onChange={(e) => setSiteSlug(e.target.value)} placeholder="ex.: costela-outback-caseira" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Ordem na Home (opcional)</label>
                            <Input type="number" min={0} value={siteOrder} onChange={(e) => setSiteOrder(e.target.value)} placeholder="ex.: 10" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Descrição curta (SEO)</label>
                        <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Resumo curto da receita..." />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Publicado em (opcional)</label>
                        <Input type="datetime-local" value={publicadoAt} onChange={(e) => setPublicadoAt(e.target.value)} />
                    </div>

                    {/* (opcionais) */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">URL do YouTube</label>
                            <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">URL da capa</label>
                            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancelar</Button>
                        <Button type="submit" className="rounded-xl">Salvar</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

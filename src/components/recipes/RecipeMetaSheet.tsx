// src/components/recipes/RecipeMetaSheet.tsx
"use client";

import * as React from "react";
import { useTransition } from "react";
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
import {
    CATEGORY_LABELS,
    DIFFICULTY_LABELS,
    STATUS_LABELS,
} from "@/constants/taxonomies";
import { labelForCategory } from "@/lib/taxonomies";
import { Settings } from "lucide-react";

type Option = { slug: string; label: string };
const mapLabelsToOptions = (map: Record<string, string>): Option[] =>
    Object.entries(map).map(([slug, label]) => ({ slug, label }));

const CATEGORY_OPTIONS = mapLabelsToOptions(CATEGORY_LABELS as Record<string, string>);
const DIFFICULTY_OPTIONS = mapLabelsToOptions(DIFFICULTY_LABELS as Record<string, string>);
const STATUS_OPTIONS = mapLabelsToOptions(STATUS_LABELS as Record<string, string>);

export type RecipeMetaFields = {
    id: string;
    name: string;
    prep_time_minutes: number | null;
    status: string | null;
    difficulty_slug: string | null;
    category_slugs: string[];
};

export function RecipeMetaSheet({ recipe }: { recipe: RecipeMetaFields }) {
    const [open, setOpen] = React.useState(false);
    const [isPending, startTransition] = useTransition();

    const [name, setName] = React.useState(recipe.name);
    const [prepTime, setPrepTime] = React.useState<string>(recipe.prep_time_minutes?.toString() ?? "");
    const [status, setStatus] = React.useState<string>(recipe.status ?? "");
    const [difficulty, setDifficulty] = React.useState<string>(recipe.difficulty_slug ?? "");
    const [selectedCats, setSelectedCats] = React.useState<string[]>(recipe.category_slugs ?? []);

    function toggleCategory(slug: string) {
        setSelectedCats((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
    }
    function moveCategory(slug: string, dir: "up" | "down") {
        setSelectedCats((prev) => {
            const idx = prev.indexOf(slug);
            if (idx === -1) return prev;
            const swapWith = dir === "up" ? idx - 1 : idx + 1;
            if (swapWith < 0 || swapWith >= prev.length) return prev;
            const newArr = [...prev];
            [newArr[idx], newArr[swapWith]] = [newArr[swapWith], newArr[idx]];
            return newArr;
        });
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="rounded-xl">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar metadados
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl p-0 max-h-screen">
                <SheetHeader className="px-4 pt-4">
                    <SheetTitle>Metadados da receita</SheetTitle>
                    <SheetDescription>Nome, categorias (com ordem), tempo, status e dificuldade.</SheetDescription>
                </SheetHeader>

                <form
                    action={(fd) => {
                        startTransition(async () => {
                            fd.set("id", recipe.id);
                            fd.set("name", name);
                            fd.set("prep_time_minutes", prepTime);
                            fd.set("status", status);
                            fd.set("difficulty_slug", difficulty);
                            // marker para sincronismo de categorias (permite limpar tudo)
                            fd.set("categories_present", "1");
                            for (const slug of selectedCats) {
                                fd.append("category_slugs[]", slug);
                            }

                            const { updateRecipeMetaAction } = await import("@/app/dashboard/recipes/actions/updateRecipeMetaAction");
                            await updateRecipeMetaAction(fd);
                            toast.success("Metadados salvos!");
                            setOpen(false);
                        });
                    }}
                    className="mt-2 flex h-[calc(100vh-3.5rem)] flex-col"
                >
                    {/* ÁREA ROLÁVEL */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-6">
                        {/* Básico */}
                        <section className="grid gap-4 lg:grid-cols-2 rounded-2xl border p-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Nome</label>
                                <Input
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex.: Costela Outback Caseira"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Tempo (min)</label>
                                <Input
                                    type="number"
                                    name="prep_time_minutes"
                                    value={prepTime}
                                    onChange={(e) => setPrepTime(e.target.value)}
                                    placeholder="Ex.: 45"
                                />
                            </div>
                        </section>

                        {/* Status & Dificuldade */}
                        <section className="grid gap-4 lg:grid-cols-2 rounded-2xl border p-3">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Status</label>
                                <select
                                    name="status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="">—</option>
                                    {STATUS_OPTIONS.map((o) => (
                                        <option key={o.slug} value={o.slug}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Dificuldade</label>
                                <select
                                    name="difficulty_slug"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                >
                                    <option value="">—</option>
                                    {DIFFICULTY_OPTIONS.map((o) => (
                                        <option key={o.slug} value={o.slug}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </section>

                        {/* Categorias */}
                        <section className="grid gap-3 rounded-2xl border p-3">
                            <div className="text-sm font-medium">Categorias (ordem define a primária)</div>

                            {/* Seleção */}
                            <div className="grid gap-1 sm:grid-cols-2">
                                {CATEGORY_OPTIONS.map((o) => (
                                    <label key={o.slug} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted/60">
                                        <input
                                            type="checkbox"
                                            className="accent-foreground"
                                            checked={selectedCats.includes(o.slug)}
                                            onChange={() => toggleCategory(o.slug)}
                                        />
                                        <span>{o.label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Ordenação */}
                            {selectedCats.length > 0 && (
                                <div className="mt-2">
                                    <div className="mb-1 text-xs text-muted-foreground">Ordem atual (1ª = primária):</div>
                                    <ul className="grid gap-1">
                                        {selectedCats.map((slug, idx) => (
                                            <li key={slug} className="flex items-center justify-between rounded-md border px-2 py-1 text-sm">
                        <span>
                          {idx + 1}. {labelForCategory(slug)}
                        </span>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-7 rounded-xl px-2"
                                                        onClick={() => moveCategory(slug, "up")}
                                                        disabled={idx === 0}
                                                    >
                                                        ↑
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-7 rounded-xl px-2"
                                                        onClick={() => moveCategory(slug, "down")}
                                                        disabled={idx === selectedCats.length - 1}
                                                    >
                                                        ↓
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* FOOTER fixo */}
                    <SheetFooter className="sticky bottom-0 mt-0 border-t bg-background px-4 py-3">
                        <div className="flex w-full justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending} className="rounded-xl">
                                {isPending ? "Salvando..." : "Salvar metadados"}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

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
} from "@/constants/taxonomies";

export function NewRecipeDialog() {
    const router = useRouter();
    const params = useSearchParams();

    const open = params.get("new") === "1";

    const [name, setName] = React.useState("");
    const [category, setCategory] = React.useState<string>("");         // controlado
    const [categoryOther, setCategoryOther] = React.useState("");
    const [status, setStatus] = React.useState<RecipeStatus>("idea");
    const [difficulty, setDifficulty] = React.useState<Difficulty | "">("");
    const [prepTime, setPrepTime] = React.useState<string>("");

    React.useEffect(() => {
        if (open) {
            setName("");
            setCategory("");
            setCategoryOther("");
            setStatus("idea");
            setDifficulty("");
            setPrepTime("");
        }
    }, [open]);

    function setOpen(next: boolean) {
        const usp = new URLSearchParams(Array.from(params.entries()));
        if (next) usp.set("new", "1");
        else usp.delete("new");
        router.replace(`/recipes${usp.toString() ? `?${usp.toString()}` : ""}`, { scroll: false });
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const finalCategory =
            category === "__OTHER__"
                ? (categoryOther.trim() || null)
                : (category || null);

        const fd = new FormData();
        fd.set("name", name.trim());
        fd.set("category", finalCategory ?? "");
        fd.set("status", status);
        fd.set("difficulty", difficulty || "");
        fd.set("prep_time_minutes", prepTime || "");

        const { createRecipeAction } = await import("@/app/recipes/actions");
        await createRecipeAction(fd);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova receita</DialogTitle>
                    <DialogDescription>Cadastre uma nova receita para o seu banco.</DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-3">
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
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
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
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
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
                                    <option key={d.value} value={d.value}>
                                        {d.label}
                                    </option>
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

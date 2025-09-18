"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CATEGORIES, STATUSES, DIFFICULTIES } from "@/constants/taxonomies";

export function RecipesHeader({ total }: { total: number }) {
    const router = useRouter();
    const params = useSearchParams();

    const [q, setQ] = useState(params.get("q") ?? "");
    const [status, setStatus] = useState(params.get("status") ?? "");
    const [category, setCategory] = useState(params.get("category") ?? "");
    const [difficulty, setDifficulty] = useState(params.get("difficulty") ?? "");

    useEffect(() => {
        const usp = new URLSearchParams();
        if (q) usp.set("q", q);
        if (status) usp.set("status", status);
        if (category) usp.set("category", category);
        if (difficulty) usp.set("difficulty", difficulty);
        const query = usp.toString();
        router.replace(`/dashboard/recipes${query ? `?${query}` : ""}`, { scroll: false });
    }, [q, status, category, difficulty, router]);

    function openNew() {
        const usp = new URLSearchParams(Array.from(params.entries()));
        usp.set("new", "1");
        router.replace(`/dashboard/recipes?${usp.toString()}`, { scroll: false });
    }

    function clearFilters() {
        setQ("");
        setStatus("");
        setCategory("");
        setDifficulty("");
    }

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 className="text-2xl font-semibold">Receitas</h1>
                <p className="text-sm text-muted-foreground">{total} itens</p>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Input
                    placeholder="Buscar receitas..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="md:w-[320px]"
                />

                {/* Status */}
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                    <option value="">Status</option>
                    {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>

                {/* Categoria */}
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                    <option value="">Categoria</option>
                    {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                            {c.label}
                        </option>
                    ))}
                </select>

                {/* Dificuldade */}
                <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                    <option value="">Dificuldade</option>
                    {DIFFICULTIES.map((d) => (
                        <option key={d.value} value={d.value}>
                            {d.label}
                        </option>
                    ))}
                </select>

                <Button onClick={openNew} className="rounded-2xl">
                    <Plus className="mr-2 h-4 w-4" /> Nova receita
                </Button>

                {(q || status || category || difficulty) && (
                    <Button variant="outline" onClick={clearFilters} className="rounded-2xl">
                        Limpar
                    </Button>
                )}
            </div>
        </div>
    );
}

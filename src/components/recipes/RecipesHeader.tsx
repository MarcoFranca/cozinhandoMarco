"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

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
        router.replace(`/recipes${query ? `?${query}` : ""}`, { scroll: false });
    }, [q, status, category, difficulty, router]);

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

                {/* STATUS (valor em EN, label em PT) */}
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                    <option value="">Status</option>
                    <option value="idea">Ideia</option>
                    <option value="tested">Testada</option>
                    <option value="recorded">Gravada</option>
                    <option value="edited">Editada</option>
                    <option value="published">Publicada</option>
                </select>

                {/* CATEGORIA */}
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                    <option value="">Categoria</option>
                    <option value="Pasta">Massa</option>
                    <option value="Meat">Carne</option>
                    <option value="Fish">Peixe</option>
                    <option value="Dessert">Doce</option>
                    <option value="Sauce">Molho</option>
                    <option value="Drink">Bebida</option>
                    <option value="Side">Acompanhamento</option>
                    <option value="Soup">Sopa</option>
                </select>

                {/* DIFICULDADE */}
                <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                    <option value="">Dificuldade</option>
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                </select>

                <Button onClick={() => router.push("/recipes?new=1")} className="rounded-2xl">
                    <Plus className="mr-2 h-4 w-4" /> Nova receita
                </Button>
            </div>
        </div>
    );
}

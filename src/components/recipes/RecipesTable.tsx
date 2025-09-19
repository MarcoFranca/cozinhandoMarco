"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Copy, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecipeWithCountsRow, RecipeStatus } from "@/types/db";
import { categoryLabel, statusLabel, difficultyLabel } from "@/constants/taxonomies";

type SortKey = keyof Pick<
    RecipeWithCountsRow,
    | "name"
    | "category"
    | "status"
    | "prep_time_minutes"
    | "difficulty"
    | "updated_at"
    | "ingredients_count"
>;
type SortState = { key: SortKey; dir: "asc" | "desc" };

export function RecipesTable({ initialData }: { initialData: RecipeWithCountsRow[] }) {
    const [sort, setSort] = useState<SortState>({ key: "updated_at", dir: "desc" });

    const params = useSearchParams();
    const q = (params.get("q") ?? "").toLowerCase();
    const status = params.get("status") ?? "";
    const category = params.get("category") ?? "";
    const difficulty = params.get("difficulty") ?? "";

    const data = useMemo(() => {
        let rows = [...initialData];

        // filtros
        rows = rows.filter((r) => {
            const matchesQ = q
                ? r.name.toLowerCase().includes(q) || (r.category ?? "").toLowerCase().includes(q)
                : true;
            const matchesStatus = status ? r.status === (status as RecipeStatus) : true;
            const matchesCategory = category ? (r.category ?? "") === category : true;
            const matchesDifficulty = difficulty ? (r.difficulty ?? "") === difficulty : true;
            return matchesQ && matchesStatus && matchesCategory && matchesDifficulty;
        });

        // ordenação
        rows.sort((a, b) => {
            const dir = sort.dir === "asc" ? 1 : -1;
            switch (sort.key) {
                case "prep_time_minutes":
                    return ((a.prep_time_minutes ?? 0) - (b.prep_time_minutes ?? 0)) * dir;
                case "ingredients_count":
                    return (a.ingredients_count - b.ingredients_count) * dir;
                case "updated_at":
                    return (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) * dir;
                case "name":
                    return a.name.localeCompare(b.name) * dir;
                case "category":
                    return ((a.category ?? "").localeCompare(b.category ?? "")) * dir;
                case "status":
                    return a.status.localeCompare(b.status) * dir;
                case "difficulty":
                    return ((a.difficulty ?? "").localeCompare(b.difficulty ?? "")) * dir;
            }
        });

        return rows;
    }, [initialData, q, status, category, difficulty, sort]);

    function toggleSort(key: SortKey) {
        setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
    }

    if (data.length === 0) {
        const usp = new URLSearchParams(Array.from(params.entries()));
        usp.set("new", "1");
        return (
            <div className="rounded-2xl border p-10 text-center text-sm text-muted-foreground">
                Nenhuma receita encontrada.
                <Link className="ml-1 underline" href={`/dashboard/recipes?${usp.toString()}`}>
                    Criar agora?
                </Link>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border">
            <table className="w-full table-auto">
                <thead className="bg-muted/50 text-sm">
                <tr>
                    <Th label="Nome" onClick={() => toggleSort("name")} />
                    <Th label="Categoria" onClick={() => toggleSort("category")} />
                    <Th label="Status" onClick={() => toggleSort("status")} />
                    <Th label="Tempo" onClick={() => toggleSort("prep_time_minutes")} className="text-right" />
                    <Th label="Dificuldade" onClick={() => toggleSort("difficulty")} />
                    <Th label="Itens" onClick={() => toggleSort("ingredients_count")} className="text-right" />
                    <Th label="Atualizado" onClick={() => toggleSort("updated_at")} />
                    <th className="px-4 py-3 text-right">Ações</th>
                </tr>
                </thead>
                <tbody className="divide-y">
                {data.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm">
                            <Link href={`/dashboard/recipes/${r.id}`} className="font-medium hover:underline">
                                {r.name}
                            </Link>
                        </td>
                        <td className="px-4 py-3 text-sm">{categoryLabel(r.category)}</td>
                        <td className="px-4 py-3 text-sm">
                            <Badge variant="secondary">{statusLabel(r.status)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{r.prep_time_minutes ?? "—"}</td>
                        <td className="px-4 py-3 text-sm">{difficultyLabel(r.difficulty)}</td>
                        <td className="px-4 py-3 text-sm text-right">{r.ingredients_count}</td>
                        <td className="px-4 py-3 text-sm">
                            {new Date(r.updated_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="secondary" asChild className="rounded-xl">
                                    <Link href={`/dashboard/recipes/${r.id}`}>Abrir</Link>
                                </Button>

                                {/* Duplicar */}
                                <form
                                    action={async (fd) => {
                                        fd.set("id", r.id);
                                        const { duplicateRecipeAction } = await import("../../app/dashboard/recipes/actions");
                                        await duplicateRecipeAction(fd);
                                    }}
                                >
                                    <Button size="sm" variant="outline" className="rounded-xl" title="Duplicar">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </form>

                                {/* Excluir */}
                                <form
                                    action={async (fd) => {
                                        if (!confirm("Excluir receita? Isso remove também os ingredientes e itens de compras.")) return;
                                        fd.set("id", r.id);
                                        const { deleteRecipeAction } = await import("../../app/dashboard/recipes/actions");
                                        await deleteRecipeAction(fd);
                                    }}
                                >
                                    <Button size="sm" variant="destructive" className="rounded-xl" title="Excluir">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

function Th({
                label,
                onClick,
                className = "",
            }: {
    label: string;
    onClick: () => void;
    className?: string;
}) {
    return (
        <th className={`px-4 py-3 text-left ${className}`}>
            <button className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-80" onClick={onClick}>
                {label}
                <ArrowUpDown className="h-4 w-4 opacity-50" />
            </button>
        </th>
    );
}

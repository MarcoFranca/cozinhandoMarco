"use client";

import { useMemo, useState } from "react";
import { Recipe } from "@/types/recipe";
import { NameCell, StatusBadge, CategoryBadge, DifficultyText } from "./columns";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Copy, Trash2 } from "lucide-react";
import Link from "next/link";

type Props = { initialData: Recipe[] };

type SortKey = keyof Pick<
    Recipe,
    "name" | "category" | "status" | "prep_time_minutes" | "difficulty" | "updated_at"
>;

type SortState = { key: SortKey; dir: "asc" | "desc" };

export function RecipesTable({ initialData }: Props) {
    const [sort, setSort] = useState<SortState>({ key: "updated_at", dir: "desc" });

    // lê filtros da URL (setados no header)
    const params =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const q = params?.get("q")?.toLowerCase() ?? "";
    const status = params?.get("status") ?? "";
    const category = params?.get("category") ?? "";
    const difficulty = params?.get("difficulty") ?? "";

    const data = useMemo(() => {
        let rows = [...initialData];

        // filtro
        rows = rows.filter((r) => {
            const matchesQ = q ? r.name.toLowerCase().includes(q) : true;
            const matchesStatus = status ? r.status === status : true;
            const matchesCategory = category ? (r.category ?? "") === category : true;
            const matchesDifficulty = difficulty ? (r.difficulty ?? "") === difficulty : true;
            return matchesQ && matchesStatus && matchesCategory && matchesDifficulty;
        });

        // ordenação
        rows.sort((a, b) => {
            const { key, dir } = sort;
            let res = 0;

            if (key === "prep_time_minutes") {
                const na = a.prep_time_minutes ?? 0;
                const nb = b.prep_time_minutes ?? 0;
                res = na - nb;
            } else if (key === "updated_at") {
                res = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
            } else {
                const sa = String(a[key] ?? "");
                const sb = String(b[key] ?? "");
                res = sa.localeCompare(sb);
            }
            return dir === "asc" ? res : -res;
        });

        return rows;
    }, [initialData, q, status, category, difficulty, sort]);

    function toggleSort(key: SortKey) {
        setSort((prev) =>
            prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border">
            <table className="w-full table-auto">
                <thead className="bg-muted/50 text-sm">
                <tr>
                    <Th label="Name" onClick={() => toggleSort("name")} />
                    <Th label="Category" onClick={() => toggleSort("category")} />
                    <Th label="Status" onClick={() => toggleSort("status")} />
                    <Th label="Prep (min)" onClick={() => toggleSort("prep_time_minutes")} className="text-right" />
                    <Th label="Difficulty" onClick={() => toggleSort("difficulty")} />
                    <Th label="Updated" onClick={() => toggleSort("updated_at")} />
                    <th className="px-4 py-3 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y">
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                            No recipes found.{" "}
                            <Link className="underline" href="/recipes?new=1">Create one?</Link>
                        </td>
                    </tr>
                ) : (
                    data.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm">
                                <NameCell id={r.id} name={r.name} />
                            </td>
                            <td className="px-4 py-3 text-sm">
                                <CategoryBadge value={r.category} />
                            </td>
                            <td className="px-4 py-3 text-sm">
                                <StatusBadge value={r.status} />
                            </td>
                            <td className="px-4 py-3 text-sm text-right">{r.prep_time_minutes ?? "—"}</td>
                            <td className="px-4 py-3 text-sm">
                                <DifficultyText value={r.difficulty} />
                            </td>
                            <td className="px-4 py-3 text-sm">
                                {new Date(r.updated_at).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="px-4 py-3 text-sm">
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="secondary" asChild className="rounded-xl">
                                        <a href={`/recipes/${r.id}`}>Open</a>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl"
                                        onClick={() => duplicateRecipe(r.id)}
                                        title="Duplicate"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="rounded-xl"
                                        onClick={() => deleteRecipe(r.id)}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
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
            <button
                className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-80"
                onClick={onClick}
            >
                {label}
                <ArrowUpDown className="h-4 w-4 opacity-50" />
            </button>
        </th>
    );
}

// TODOs (trocar por chamadas a /app/api quando quiser)
async function duplicateRecipe(id: string) {
    console.log("duplicate", id);
}
async function deleteRecipe(id: string) {
    console.log("delete", id);
}

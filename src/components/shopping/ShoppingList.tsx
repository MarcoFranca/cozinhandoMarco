"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type Item = {
    id: string;
    recipe_id: string | null;
    ingredient_name: string;
    quantity: number | null;
    note: string | null;
    unit?: string | null;
    optional?: boolean;
    in_pantry: boolean;
    created_at: string;
};
type Group = { recipe_id: string | null; recipe_name: string; items: Item[] };

export function ShoppingList({ groups }: { groups: Group[] }) {
    const [data, setData] = useState(groups);
    const [isPending, startTransition] = useTransition();

    function updateItem(id: string, patch: Partial<Item>) {
        setData((prev) =>
            prev.map((g) => ({ ...g, items: g.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }))
        );
    }
    function removeItem(id: string) {
        setData((prev) =>
            prev.map((g) => ({ ...g, items: g.items.filter((it) => it.id !== id) })).filter((g) => g.items.length > 0)
        );
    }

    async function toggle(id: string, next: boolean) {
        updateItem(id, { in_pantry: next });
        startTransition(async () => {
            const { toggleShoppingItemAction } = await import("@/app/recipes/actions");
            const fd = new FormData();
            fd.set("id", id);
            fd.set("in_pantry", next ? "1" : "0");
            await toggleShoppingItemAction(fd);
        });
    }

    async function del(id: string) {
        removeItem(id);
        const { deleteShoppingItemAction } = await import("@/app/recipes/actions");
        const fd = new FormData();
        fd.set("id", id);
        await deleteShoppingItemAction(fd);
    }

    if (data.length === 0) return <p className="text-sm text-muted-foreground">Sem itens por enquanto.</p>;

    return (
        <div className="space-y-6">
            {data.map((g) => (
                <div key={g.recipe_id ?? "loose"} className="rounded-2xl border">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div className="text-sm font-medium">
                            {g.recipe_name}
                            {g.recipe_id && (
                                <a href={`/recipes/${g.recipe_id}`} className="ml-2 text-xs text-muted-foreground underline">
                                    abrir receita
                                </a>
                            )}
                        </div>
                    </div>

                    <ul className="divide-y">
                        {g.items.map((i) => (
                            <li key={i.id} className="flex items-center justify-between px-4 py-2">
                                <div className="flex items-center gap-3">
                                    <Checkbox checked={i.in_pantry} onCheckedChange={(v) => toggle(i.id, Boolean(v))} disabled={isPending}/>
                                    <div className="text-sm">
                                        <div className={`${i.in_pantry ? "line-through opacity-60" : ""}`}>
                                            {i.ingredient_name}
                                            {i.optional && <span className="ml-2 text-xs rounded bg-muted px-2 py-0.5">Opcional</span>}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {i.quantity ?? "—"} {i.unit ?? i.note ?? ""}
                                        </div>
                                    </div>
                                </div>

                                <Button size="icon" variant="ghost" onClick={() => del(i.id)} title="Excluir">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

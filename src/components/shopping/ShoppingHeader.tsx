"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Rec = { id: string; name: string };

export function ShoppingHeader({
                                   total,
                                   show,
                                   hideOptionals,
                                   unified,
                                   recipes,
                                   selected,
                               }: {
    total: number;
    show: "all" | "pending";
    hideOptionals: boolean;
    unified: boolean;
    recipes: Rec[];
    selected: string[];
}) {
    const router = useRouter();
    const params = useSearchParams();

    function setParam(k: string, v?: string) {
        const usp = new URLSearchParams(Array.from(params.entries()));
        if (!v) usp.delete(k);
        else usp.set(k, v);
        router.replace(`/shopping${usp.toString() ? `?${usp.toString()}` : ""}`, { scroll: false });
    }

    function toggleChip(id: string) {
        const cur = new Set(selected);
        if (cur.has(id)) cur.delete(id);
        else cur.add(id);
        const next = Array.from(cur);
        setParam("selected", next.length ? next.join(",") : undefined);
    }

    async function clearChecked() {
        const { clearCheckedShoppingAction } = await import("@/app/recipes/actions");
        await clearCheckedShoppingAction();
    }
    async function clearAll() {
        if (!confirm("Remover TODOS os itens da lista?")) return;
        const { clearAllShoppingAction } = await import("@/app/recipes/actions");
        await clearAllShoppingAction();
    }

    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
                <h1 className="text-2xl font-semibold">Compras</h1>
                <p className="text-sm text-muted-foreground">{total} itens</p>
                {recipes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground mt-1">Selecionar receitas:</span>
                        {recipes.map((r) => {
                            const active = selected.includes(r.id);
                            return (
                                <button
                                    key={r.id}
                                    onClick={() => toggleChip(r.id)}
                                    className={`rounded-full px-3 py-1 text-xs border transition ${
                                        active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                                    }`}
                                    title={r.name}
                                >
                                    {r.name}
                                </button>
                            );
                        })}
                        {selected.length > 0 && (
                            <button
                                onClick={() => setParam("selected", undefined)}
                                className="rounded-full px-2 py-1 text-xs border hover:bg-muted"
                                title="Limpar seleção"
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant={show === "pending" ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => setParam("show", "pending")}
                >
                    Pendentes
                </Button>
                <Button
                    variant={show === "all" ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => setParam("show", "all")}
                >
                    Todos
                </Button>

                <Button
                    variant={hideOptionals ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => setParam("hide_optional", hideOptionals ? undefined : "1")}
                >
                    {hideOptionals ? "Opcional: oculto" : "Ocultar opcionais"}
                </Button>

                <Button
                    variant={unified ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => setParam("unified", unified ? undefined : "1")}
                >
                    {unified ? "Unificada" : "Unificar"}
                </Button>

                <Button variant="secondary" className="rounded-xl" onClick={clearChecked}>
                    Limpar marcados
                </Button>
                <Button variant="destructive" className="rounded-xl" onClick={clearAll}>
                    Limpar tudo
                </Button>
            </div>
        </div>
    );
}

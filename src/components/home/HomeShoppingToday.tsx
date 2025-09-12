"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

type Item = { name: string; qty: string; inPantry: boolean };

export function HomeShoppingToday({ items }: { items: Item[] }) {
    const [data, setData] = useState(items);

    function toggle(name: string) {
        setData((prev) =>
            prev.map((i) => (i.name === name ? { ...i, inPantry: !i.inPantry } : i))
        );
        // TODO: persistir no Supabase (shopping_list_items.in_pantry)
    }

    return (
        <Card className="rounded-2xl">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Lista de Compras de Hoje</CardTitle>
                <div className="flex items-center gap-3">
                    <a href="/shopping?mode=market" className="text-sm hover:underline">
                        Modo Mercado
                    </a>
                    <a href="/shopping?print=1" className="text-sm hover:underline">
                        Imprimir
                    </a>
                </div>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem itens por enquanto.</p>
                ) : (
                    <ul className="divide-y">
                        {data.map((i) => (
                            <li key={i.name} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <Checkbox checked={i.inPantry} onCheckedChange={() => toggle(i.name)} />
                                    <span className={`text-sm ${i.inPantry ? "line-through opacity-60" : ""}`}>
                    {i.name}
                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground">{i.qty}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

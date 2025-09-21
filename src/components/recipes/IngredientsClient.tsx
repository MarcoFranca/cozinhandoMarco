"use client";

import * as React from "react";
import TipBadge from "./TipBadge";

type Ingredient = {
    id?: string;            // precisa existir para mapear tips
    name: string;
    amount: number | null;
    unit: string | null;
    optional: boolean | null;
    position: number | null;
};

type RecipeTip = {
    id: string;
    type: "tip" | "swap" | "alert";
    title: string | null;
    text: string;
};

type Props = {
    ingredients: Ingredient[];
    tipsByIngredient?: Record<string, RecipeTip[]>; // <-- objeto plano
};

function formatQty(amount: number | null, unit: string | null) {
    if (amount == null && !unit) return null;
    if (amount == null) return unit;
    if (!unit) return String(amount);
    return `${amount} ${unit}`;
}

export function IngredientsClient({ ingredients, tipsByIngredient = {} }: Props) {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold">Ingredientes</h2>

            {ingredients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum ingrediente informado.</p>
            ) : (
                <ul className="space-y-3">
                    {ingredients.map((ing, idx) => {
                        const qty = formatQty(ing.amount, ing.unit);

                        // pega as dicas vinculadas a ESTE ingrediente
                        const allTipsForIng: RecipeTip[] =
                            ing.id && tipsByIngredient[ing.id] ? tipsByIngredient[ing.id]! : [];

                        // mostra só substituições/variações
                        const swapTips = allTipsForIng.filter((t) => t.type === "swap");

                        return (
                            <li key={ing.id ?? `idx-${idx}`} className="rounded-xl border p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm leading-relaxed">
                                            <span className="font-medium">{ing.name}</span>
                                            {qty ? <span className="text-muted-foreground"> — {qty}</span> : null}
                                            {ing.optional ? (
                                                <span className="ml-2 inline-block rounded-full border px-2 py-0.5 text-xs">
                          opcional
                        </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                {/* Trocas específicas deste ingrediente */}
                                {swapTips.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {swapTips.map((t) => (
                                            <TipBadge key={t.id} type={t.type} text={t.text} />
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function LegacyIngredientsBanner({ recipeId, hasLegacy }: { recipeId: string; hasLegacy: boolean }) {
    const [pending, start] = useTransition();
    if (!hasLegacy) return null;

    return (
        <div className="mb-4 rounded-xl border bg-amber-50 px-4 py-3 text-sm dark:bg-amber-900/20">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p>
                    Detectamos ingredientes no campo de texto legado. Quer converter para a tabela de ingredientes?
                </p>
                <form action={async (fd) => {
                    fd.set("recipe_id", recipeId);
                    const { convertIngredientsFromTextAction } = await import("../../app/dashboard/recipes/actions");
                    await convertIngredientsFromTextAction(fd);
                }}>
                    <Button type="submit" className="rounded-xl" disabled={pending}>
                        {pending ? "Convertendo..." : "Converter agora"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

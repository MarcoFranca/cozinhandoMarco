"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { categoryLabel, statusLabel, difficultyLabel } from "@/constants/taxonomies";
import { RecipeMetaDialog } from "./RecipeMetaDialog";

export function RecipeOverview({
                                   recipe,
                                   ingredientsCount,
                                   instructionsCount,
                                   totalDuration,
                               }: {
    recipe: {
        id: string;
        name: string;
        category: string | null;
        status: string;
        difficulty: string | null;
        prep_time_minutes: number | null;
    };
    ingredientsCount: number;
    instructionsCount: number;
    totalDuration: number;
}) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Progresso */}
            <Card className="rounded-2xl h-full">
                <CardHeader>
                    <CardTitle>Progresso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <KV label="Nome" value={recipe.name} />
                    <div className="grid grid-cols-2 gap-3">
                        <KV label="Categoria" value={categoryLabel(recipe.category)} />
                        <KV label="Tempo (min)" value={recipe.prep_time_minutes ?? "—"} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <KV label="Status" value={statusLabel(recipe.status)} />
                        <KV label="Dificuldade" value={difficultyLabel(recipe.difficulty)} />
                    </div>

                    <div className="pt-2">
                        <div className="pt-2">
                            <RecipeMetaDialog recipe={recipe}/>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Resumo */}
            <Card className="rounded-2xl h-full">
                <CardHeader>
                    <CardTitle>Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Bubble label="Ingredientes" value={ingredientsCount} href={`/recipes/${recipe.id}?tab=ingredients`} />
                        <Bubble label="Instruções" value={instructionsCount} href={`/recipes/${recipe.id}?tab=instructions`} />
                    </div>
                    <KV label="Duração total" value={`${totalDuration} min`} />

                    <form
                        action={async (fd) => {
                            fd.set("recipe_id", recipe.id);
                            fd.set("include_optionals", "1");
                            const { pushIngredientsToShoppingAction } = await import("@/app/recipes/actions");
                            await pushIngredientsToShoppingAction(fd);
                        }}
                    >
                        <Button type="submit" className="rounded-xl">Enviar p/ Compras</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm">{value}</span>
        </div>
    );
}

function Bubble({ label, value, href }: { label: string; value: number | string; href: string }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/60 transition-colors"
        >
            <div className="text-sm">{label}</div>
            <div className="text-xl font-semibold">{value}</div>
        </Link>
    );
}

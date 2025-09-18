"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { categoryLabel, statusLabel, difficultyLabel } from "@/constants/taxonomies";
import { RecipeMetaDialog } from "./RecipeMetaDialog";
import {toast} from "sonner";
import {RecipeForOverview} from "@/types/db";
import {RecipeSiteDialog} from "@/components/recipes/RecipeSiteDialog";

export function RecipeOverview({
                                   recipe,
                                   ingredientsCount,
                                   instructionsCount,
                                   totalDuration,
                               }: {
    recipe: RecipeForOverview;
    ingredientsCount: number;
    instructionsCount: number;
    totalDuration: number;
}) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Progresso */}
            <Card className="rounded-2xl h-full">
                <CardHeader>
                    <CardTitle>Receita</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <KV label="Nome" value={recipe.name}/>
                    <div className="grid grid-cols-2 gap-3">
                        <KV label="Categoria" value={categoryLabel(recipe.category)}/>
                        <KV label="Tempo (min)" value={recipe.prep_time_minutes ?? "—"}/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <KV label="Status" value={statusLabel(recipe.status)}/>
                        <KV label="Dificuldade" value={difficultyLabel(recipe.difficulty)}/>
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
                        <Bubble label="Ingredientes" value={ingredientsCount}
                                href={`/recipes/${recipe.id}?tab=ingredients`}/>
                        <Bubble label="Instruções" value={instructionsCount}
                                href={`/recipes/${recipe.id}?tab=instructions`}/>
                    </div>
                    <KV label="Duração total" value={`${totalDuration} min`}/>

                    <form
                        action={async (fd) => {
                            fd.set("recipe_id", recipe.id);
                            fd.set("include_optionals", "1");
                            const {pushIngredientsToShoppingAction} = await import("../../app/dashboard/recipes/actions");
                            await pushIngredientsToShoppingAction(fd);
                            toast("Enviado para lista.")
                        }}
                    >
                        <Button type="submit" className="rounded-xl cursor-pointer">Enviar p/ Compras</Button>
                    </form>

                </CardContent>
            </Card>
            <div className="mt-4 rounded-xl border p-3">
                <div className="mb-2 text-sm font-medium">Site (publicação)</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <KV label="Slug público" value={recipe.site_slug ?? "—"}/>
                    <KV label="Visibilidade" value={recipe.site_override ?? "—"}/>
                    <KV label="Preferir YouTube?" value={recipe.preferir_link_youtube ? "Sim" : "Não"}/>
                    <KV label="Ordem na Home" value={recipe.site_order ?? "—"}/>
                    <KV label="Publicado em"
                        value={recipe.publicado_at ? new Date(recipe.publicado_at).toLocaleString("pt-BR") : "—"}/>
                    <KV label="Descrição curta (SEO)" value={recipe.short_description ?? "—"}/>
                </div>

                {/* Link para a página pública, se já houver slug */}
                {recipe.site_slug && (
                    <div className="pt-3">
                        <a
                            href={`/receitas/${recipe.site_slug}`}
                            target="_blank"
                            className="text-sm underline"
                        >
                            Abrir página pública
                        </a>
                    </div>
                )}

                {/* Botão para editar (abre modal RecipeMetaDialog) */}
                <div className="pt-3">
                    <RecipeSiteDialog
                        recipe={{
                            id: recipe.id,
                            site_slug: recipe.site_slug,
                            site_override: recipe.site_override,
                            preferir_link_youtube: recipe.preferir_link_youtube,
                            site_order: recipe.site_order,
                            short_description: recipe.short_description,
                            publicado_at: recipe.publicado_at,
                            youtube_url: recipe.youtube_url,
                            cover_url: recipe.cover_url,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function KV({label, value}: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm">{value}</span>
        </div>
    );
}

function Bubble({label, value, href}: { label: string; value: number | string; href: string }) {
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

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { labelForCategory, labelForStatus, labelForDifficulty } from "@/lib/taxonomies";
import { RecipeSiteSheet } from "@/components/recipes/RecipeSiteSheet";
import { RecipeMetaSheet } from "@/components/recipes/RecipeMetaSheet";
import {RecipeAdvancedTaxonomiesSheet} from "@/components/recipes/RecipeAdvancedTaxonomiesSheet";

type RecipeOverviewRecipe = {
    id: string;
    name: string;
    status: string | null;
    prep_time_minutes: number | null;
    difficulty_slug: string | null;
    site_slug: string | null;
    site_override: import("@/lib/taxonomies/guards").SiteOverride | null;
    preferir_link_youtube: boolean | null;
    site_order: number | null;
    short_description: string | null;
    publicado_at: string | null;
    youtube_url: string | null;
    cover_url: string | null;
};

export function RecipeOverview({
                                   recipe,
                                   ingredientsCount,
                                   instructionsCount,
                                   totalDuration,
                                   primaryCategorySlug,
                                   allCategorySlugs,
                                   cuisineSlugs,
                                   dietSlugs,
                                   techniqueSlugs,
                                   occasionSlugs,
                               }: {
    recipe: RecipeOverviewRecipe;
    ingredientsCount: number;
    instructionsCount: number;
    totalDuration: number;
    primaryCategorySlug?: string | null;
    allCategorySlugs?: string[];
    cuisineSlugs?: string[];
    dietSlugs?: string[];
    techniqueSlugs?: string[];
    occasionSlugs?: string[];
}) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Painel principal */}
            <Card className="rounded-2xl h-full">
                <CardHeader>
                    <CardTitle>Receita</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <KV label="Nome" value={recipe.name} />
                    <div className="grid grid-cols-2 gap-3">
                        <KV label="Categoria" value={labelForCategory(primaryCategorySlug)} />
                        <KV label="Tempo (min)" value={recipe.prep_time_minutes ?? "—"} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <KV label="Status" value={labelForStatus(recipe.status)} />
                        <KV label="Dificuldade" value={labelForDifficulty(recipe.difficulty_slug)} />
                    </div>

                    {/* Botão abre o Sheet */}
                    <div className="pt-2 flex flex-wrap gap-2">
                        <RecipeMetaSheet
                            recipe={{
                                id: recipe.id,
                                name: recipe.name,
                                prep_time_minutes: recipe.prep_time_minutes,
                                status: recipe.status,
                                difficulty_slug: recipe.difficulty_slug,
                                // passe TODAS as categorias ordenadas (inclua a primária)
                                category_slugs: allCategorySlugs ?? (primaryCategorySlug ? [primaryCategorySlug] : []),
                            }}
                        />
                        <RecipeSiteSheet
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
                        <RecipeAdvancedTaxonomiesSheet
                            recipe={{
                                id: recipe.id,
                                cuisine_slugs: cuisineSlugs ?? [],
                                diet_slugs: dietSlugs ?? [],
                                technique_slugs: techniqueSlugs ?? [],
                                occasion_slugs: occasionSlugs ?? [],
                            }}
                        />
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
                        <Bubble
                            label="Ingredientes"
                            value={ingredientsCount}
                            href={`/dashboard/recipes/${recipe.id}?tab=ingredients`}
                        />
                        <Bubble
                            label="Instruções"
                            value={instructionsCount}
                            href={`/dashboard/recipes/${recipe.id}?tab=instructions`}
                        />
                    </div>
                    <KV label="Duração total" value={`${totalDuration} min`} />
                </CardContent>
            </Card>

            {/* Site/publicação (leitura) */}
            <div className="mt-4 rounded-xl border p-3">
                <div className="mb-2 text-sm font-medium">Site (publicação)</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <KV label="Slug público" value={recipe.site_slug ?? "—"} />
                    <KV label="Visibilidade" value={recipe.site_override ?? "—"} />
                    <KV label="Preferir YouTube?" value={recipe.preferir_link_youtube ? "Sim" : "Não"} />
                    <KV label="Ordem na Home" value={recipe.site_order ?? "—"} />
                    <KV
                        label="Publicado em"
                        value={recipe.publicado_at ? new Date(recipe.publicado_at).toLocaleString("pt-BR") : "—"}
                    />
                    <KV label="Descrição curta (SEO)" value={recipe.short_description ?? "—"} />
                </div>

                {recipe.site_slug && (
                    <div className="pt-3">
                        <a href={`/receitas/${recipe.site_slug}`} target="_blank" className="text-sm underline">
                            Abrir página pública
                        </a>
                    </div>
                )}
            </div>
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

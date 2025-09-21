// app/dashboard/recipes/[id]/page.tsx
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    RecipeIngredientRow,
    RecipeInstructionRow,
    RecordingRow,
} from "@/types/db";

import { RecipeOverview } from "@/components/recipes/RecipeOverview";
import { RecipeIngredients } from "@/components/recipes/RecipeIngredients";
import { RecipeInstructions } from "@/components/recipes/RecipeInstructions";
import { RecipeRecordings } from "@/components/recipes/RecipeRecordings";
import { normalizeSiteOverride } from "@/lib/taxonomies/guards";

// Labels/helpers PT-BR
import {
    labelForCategory,
    labelForStatus,
    labelForDifficulty,
    labelForCuisine,
    labelForDiet,
    labelForTechnique,
    labelForOccasion,
} from "@/lib/taxonomies";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
};

// Types for RPC get_recipe_taxonomies
type TaxonomyItem = { slug: string };
type CategoryItem = TaxonomyItem & { position: number };

type RecipeTaxonomies = {
    categories: CategoryItem[];
    cuisines: TaxonomyItem[];
    diet_labels: TaxonomyItem[];
    techniques: TaxonomyItem[];
    occasions: TaxonomyItem[];
};

// Shape EXATO do SELECT desta página
type RecipeForPage = {
    id: string;
    user_id: string;
    name: string;
    status: string | null;
    prep_time_minutes: number | null;
    difficulty_slug: string | null;
    youtube_url: string | null;
    cover_url: string | null;
    updated_at: string;
    site_slug: string | null;
    site_override: string | null;
    preferir_link_youtube: boolean | null;
    site_order: number | null;
    short_description: string | null;
    publicado_at: string | null;
};

export default async function RecipePage({ params, searchParams }: Props) {
    const { id } = await params;
    const { tab: tabRaw } = await searchParams;

    const { user } = await requireUser();
    const supabase = await createSupabaseRSCClient();
    const recipeId = id;
    const tab = (tabRaw ?? "overview") as
        | "overview"
        | "ingredients"
        | "instructions"
        | "recording";

    // 1) Load recipe (SEM genérico no select; o genérico aqui é para colunas)
    const { data: recipe } = await supabase
        .from("recipes")
        .select(
            [
                "id",
                "user_id",
                "name",
                "status",
                "prep_time_minutes",
                "difficulty_slug",
                "youtube_url",
                "cover_url",
                "updated_at",
                "site_slug",
                "site_override",
                "preferir_link_youtube",
                "site_order",
                "short_description",
                "publicado_at",
            ].join(", ")
        )
        .eq("id", recipeId)
        .eq("user_id", user.id)
        .single();

    if (!recipe) notFound();

    // ✅ tipagem local estável
    const r = recipe as unknown as RecipeForPage;

    // 2) Related lists
    const [{ data: ingredients }, { data: instructions }, { data: recordings }] =

        await Promise.all([
            supabase
                .from("recipe_ingredients")
                .select("id, name, amount, unit, note, optional, position")
                .eq("user_id", user.id)
                .eq("recipe_id", recipeId)
                .order("position", { ascending: true }),
            supabase
                .from("recipe_instructions")
                .select("id, step, text, duration_minutes, technique_id")
                .eq("user_id", user.id)
                .eq("recipe_id", recipeId)
                .order("step", { ascending: true }),
            supabase
                .from("recordings")
                .select("id, recipe_id, shoot_date, shoot_status, scene_notes")
                .eq("user_id", user.id)
                .eq("recipe_id", recipeId)
                .order("shoot_date", { ascending: true }),
        ]);

    const ing = (ingredients ?? []) as unknown as RecipeIngredientRow[];
    const inst = (instructions ?? []) as unknown as RecipeInstructionRow[];
    const recs = (recordings ?? []) as unknown as RecordingRow[];
// 1) Carregar tips (via RPC get_recipe_tips) e techniques (para mapear labels)
    // ⚠️ troque o RPC por um select direto (garante recipe_ingredient_id)
    const { data: tipsData } = await supabase
        .from("recipe_tips")
        .select("id, instruction_id, recipe_ingredient_id, type, title, text, position")
        .eq("recipe_id", recipeId)
        .eq("user_id", user.id)
        .order("position", { ascending: true });

    // carrega técnicas para mapear label por id
    const { data: techData } = await supabase
        .from("techniques")
        .select("id, slug, label_ptbr");

// group by INGREDIENT
    type TipForUI = {
        id: string;
        recipe_ingredient_id: string | null;
        instruction_id: string | null;
        type: "tip" | "swap" | "alert";
        title: string | null;
        text: string;
        position: number | null;
    };
    const tipsByIngredient: Record<string, TipForUI[]> = {};
    (tipsData ?? []).forEach((t) => {
        if (!t.recipe_ingredient_id) return;
        tipsByIngredient[t.recipe_ingredient_id] ??= [];
        tipsByIngredient[t.recipe_ingredient_id].push(t as TipForUI);
    });

    const tipsByInstruction: Record<string, TipForUI[]> = {};
    (tipsData ?? []).forEach((t) => {
        if (!t.instruction_id) return;
        tipsByInstruction[t.instruction_id] ??= [];
        tipsByInstruction[t.instruction_id].push({
            id: t.id,
            instruction_id: t.instruction_id,
            recipe_ingredient_id: null,       // <<< faltava isto
            type: t.type,
            title: t.title,
            text: t.text,
            position: t.position ?? null,
        });
    });

// 3) Mapear technique_id -> label
    const techniqueById: Record<string, { slug: string; label: string }> = {};
    (techData ?? []).forEach((t: any) => {
        techniqueById[t.id] = { slug: t.slug, label: t.label_ptbr };
    });

    const ingredientsCount = ing.length;
    const instructionsCount = inst.length;
    const totalDuration = inst.reduce(
        (sum, i) => sum + (i.duration_minutes ?? 0),
        0
    );

    // 3) Taxonomias via RPC
    const { data: taxData } = await supabase.rpc("get_recipe_taxonomies", {
        p_recipe_id: recipeId,
    });

    const tax = (taxData ?? {
        categories: [],
        cuisines: [],
        diet_labels: [],
        techniques: [],
        occasions: [],
    }) as RecipeTaxonomies;

    const orderedCategories = [...(tax.categories || [])].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
    );
    const cuisineSlugs = (tax.cuisines ?? []).map((x) => x.slug);
    const dietSlugs = (tax.diet_labels ?? []).map((x) => x.slug);
    const techniqueSlugs = (tax.techniques ?? []).map((x) => x.slug);
    const occasionSlugs = (tax.occasions ?? []).map((x) => x.slug);

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">{r.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {/* Categoria primária */}
                        {orderedCategories.length > 0 ? (
                            <Badge variant="secondary">
                                {labelForCategory(orderedCategories[0].slug)}
                            </Badge>
                        ) : null}

                        <span>
              Status:{" "}
                            <Badge variant="outline">{labelForStatus(r.status)}</Badge>
            </span>

                        <span>Dificuldade: {labelForDifficulty(r.difficulty_slug)}</span>

                        <span>Tempo: {r.prep_time_minutes ?? "—"} min</span>

                        <span className="opacity-70">
              Atualizado: {new Date(r.updated_at).toLocaleDateString("pt-BR")}
            </span>
                    </div>

                    {/* Tags secundárias */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {orderedCategories.slice(1).map((c) => (
                            <Badge key={`cat-${c.slug}`} variant="outline" className="rounded-xl">
                                {labelForCategory(c.slug)}
                            </Badge>
                        ))}

                        {(tax.cuisines ?? []).map((c) => (
                            <Badge key={`cuisine-${c.slug}`} variant="outline" className="rounded-xl">
                                {labelForCuisine(c.slug)}
                            </Badge>
                        ))}

                        {(tax.diet_labels ?? []).map((d) => (
                            <Badge key={`diet-${d.slug}`} variant="outline" className="rounded-xl">
                                {labelForDiet(d.slug)}
                            </Badge>
                        ))}

                        {(tax.techniques ?? []).map((t) => (
                            <Badge key={`tech-${t.slug}`} variant="outline" className="rounded-xl">
                                {labelForTechnique(t.slug)}
                            </Badge>
                        ))}

                        {(tax.occasions ?? []).map((o) => (
                            <Badge key={`occ-${o.slug}`} variant="outline" className="rounded-xl">
                                {labelForOccasion(o.slug)}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="secondary" asChild className="rounded-xl">
                        <Link href="/dashboard/recipes">Voltar</Link>
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <nav className="flex gap-4 text-sm">
                    <TabLink id={recipeId} tab="overview" label="Panorama" active={tab === "overview"} />
                    <TabLink id={recipeId} tab="ingredients" label={`Ingredientes (${ingredientsCount})`} active={tab === "ingredients"} />
                    <TabLink id={recipeId} tab="instructions" label={`Instruções (${instructionsCount})`} active={tab === "instructions"} />
                    <TabLink id={recipeId} tab="recording" label="Gravações" active={tab === "recording"} />
                </nav>
            </div>

            {/* Conteúdo */}
            {tab === "overview" && (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
                    <div className="xl:col-span-2">
                        <RecipeOverview
                            recipe={{ ...r, site_override: normalizeSiteOverride(r.site_override) }}
                            ingredientsCount={ingredientsCount}
                            instructionsCount={instructionsCount}
                            totalDuration={totalDuration}
                            primaryCategorySlug={orderedCategories[0]?.slug}
                            allCategorySlugs={orderedCategories.map((c) => c.slug)}
                            cuisineSlugs={cuisineSlugs}
                            dietSlugs={dietSlugs}
                            techniqueSlugs={techniqueSlugs}
                            occasionSlugs={occasionSlugs}
                        />
                    </div>
                </div>
            )}

            {tab === "ingredients" && (
                <RecipeIngredients
                    recipeId={recipeId}
                    items={ing}
                    tipsByIngredient={tipsByIngredient}
                />
            )}
            {tab === "instructions" && (
                <RecipeInstructions
                    recipeId={recipeId}
                    items={inst as any}
                    tipsByInstruction={tipsByInstruction}
                    techniqueById={techniqueById}
                />
            )}            {tab === "recording" && <RecipeRecordings recipeId={recipeId} items={recs} />}
        </div>
    );
}

function TabLink({
                     id,
                     tab,
                     label,
                     active,
                 }: {
    id: string;
    tab: string;
    label: string;
    active: boolean;
}) {
    return (
        <Link
            href={`/dashboard/recipes/${id}?tab=${tab}`}
            className={`border-b-2 px-1.5 py-2 transition-colors hover:text-foreground ${
                active ? "border-foreground" : "border-transparent text-muted-foreground"
            }`}
        >
            {label}
        </Link>
    );
}

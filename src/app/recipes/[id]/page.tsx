// app/recipes/[id]/page.tsx
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    RecipeRow,
    RecipeIngredientRow,
    RecipeInstructionRow,
    RecordingRow,
} from "@/types/db";

import { RecipeOverview } from "@/components/recipes/RecipeOverview";
import { RecipeIngredients } from "@/components/recipes/RecipeIngredients";
import { RecipeInstructions } from "@/components/recipes/RecipeInstructions";
import { RecipeRecordings } from "@/components/recipes/RecipeRecordings";

// 👇 labels PT a partir dos constants
import {
    categoryLabel,
    statusLabel,
    difficultyLabel,
} from "@/constants/taxonomies";

// 👇 form com selects (novo componente abaixo)
export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
};

export default async function RecipePage({ params, searchParams }: Props) {
    const { id } = await params;
    const { tab: tabRaw } = await searchParams;

    const { user } = await requireUser();
    const supabase = await createSupabaseRSCClient();
    const recipeId = id;
    const tab = (tabRaw ?? "overview") as "overview" | "ingredients" | "instructions" | "recording";

    const { data: recipe } = await supabase
        .from("recipes")
        .select("id, user_id, name, category, status, prep_time_minutes, difficulty, youtube_url, cover_url, updated_at")
        .eq("id", recipeId)
        .eq("user_id", user.id)
        .single();

    if (!recipe) notFound();

    const [{ data: ingredients }, { data: instructions }, { data: recordings }] = await Promise.all([
        supabase
            .from("recipe_ingredients")
            .select("id, name, amount, unit, note, optional, position")
            .eq("user_id", user.id)
            .eq("recipe_id", recipeId)
            .order("position", { ascending: true }),
        supabase
            .from("recipe_instructions")
            .select("id, step, text, duration_minutes")
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

    const ingredientsCount = ing.length;
    const instructionsCount = inst.length;
    const totalDuration = inst.reduce((sum, i) => sum + (i.duration_minutes ?? 0), 0);

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">{recipe.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {recipe.category ? (
                            <Badge variant="secondary">{categoryLabel(recipe.category)}</Badge>
                        ) : null}
                        <span>
              Status: <Badge variant="outline">{statusLabel(recipe.status)}</Badge>
            </span>
                        <span>Dificuldade: {difficultyLabel(recipe.difficulty)}</span>
                        <span>Tempo: {recipe.prep_time_minutes ?? "—"} min</span>
                        <span className="opacity-70">
              Atualizado: {new Date(recipe.updated_at).toLocaleDateString("pt-BR")}
            </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" asChild className="rounded-xl">
                        <Link href="/recipes">Voltar</Link>
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
                    {/* Esquerda: Overview ocupa 2 colunas no XL */}
                    <div className="xl:col-span-2">
                        <RecipeOverview
                            recipe={recipe as RecipeRow}
                            ingredientsCount={ingredientsCount}
                            instructionsCount={instructionsCount}
                            totalDuration={totalDuration}
                        />
                    </div>
                </div>
            )}

            {tab === "ingredients" && <RecipeIngredients recipeId={recipeId} items={ing} />}
            {tab === "instructions" && <RecipeInstructions recipeId={recipeId} items={inst} />}
            {tab === "recording" && <RecipeRecordings recipeId={recipeId} items={recs} />}
        </div>
    );
}

function TabLink({ id, tab, label, active }:{ id: string; tab: string; label: string; active: boolean }) {
    return (
        <Link
            href={`/recipes/${id}?tab=${tab}`}
            className={`border-b-2 px-1.5 py-2 transition-colors hover:text-foreground ${active ? "border-foreground" : "border-transparent text-muted-foreground"}`}
        >
            {label}
        </Link>
    );
}

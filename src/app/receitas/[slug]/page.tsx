// src/app/(public)/receitas/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { IngredientsClient } from "@/components/recipes/IngredientsClient";
import TipBadge from "@/components/recipes/TipBadge";
import { extractYouTubeId, buildYouTubeEmbedUrl, buildYouTubeThumb } from "@/lib/youtube";
import { labelForDifficulty, labelForCategory } from "@/lib/taxonomies/labels";
import {
    fetchBaseDetail,
    fetchRecipeIdBySlug,
    fetchInstructions,
    fetchTips,
    fetchTaxonomies,
    fetchTechniquesMap,
    groupTipsByType,
    groupTipsByInstruction,
    groupTipsByIngredient,
} from "@/lib/recipes/public-loaders";

export const revalidate = 300;

// Helper to normalize Map | Record into a plain Record<string, T[]>
function normalizeTipsByIngredient<T>(value: Map<string, T[]> | Record<string, T[]>): Record<string, T[]> {
    if (value instanceof Map) {
        return Object.fromEntries(value.entries());
    }
    return value;
}

export default async function Page({ params }: { params: { slug: string } }) {
    const detail = await fetchBaseDetail(params.slug);
    if (!detail) {
        return (
            <main className="mx-auto max-w-4xl px-4 py-12">
                <h1 className="text-2xl font-bold">Receita não encontrada</h1>
                <p className="text-muted-foreground">Talvez ela tenha sido removida do site.</p>
            </main>
        );
    }

    const recipeId = await fetchRecipeIdBySlug(params.slug);
    const [instructions, tips, tax, techMap] = await Promise.all([
        recipeId ? fetchInstructions(recipeId) : Promise.resolve([]),
        recipeId ? fetchTips(recipeId) : Promise.resolve([]),
        recipeId
            ? fetchTaxonomies(recipeId)
            : Promise.resolve({ categories: [], cuisines: [], diet_labels: [], techniques: [], occasions: [] }),
        fetchTechniquesMap(),
    ]);

    const tipsByType = groupTipsByType(tips);
    const tipsByInstruction = groupTipsByInstruction(tips);
    const tipsByIngredientMap = groupTipsByIngredient(tips);

    const tipsByIngredientObj =
        tipsByIngredientMap instanceof Map
            ? Object.fromEntries(tipsByIngredientMap)
            : tipsByIngredientMap; // se o helper já devolver objeto, mantemos

    const {
        name,
        cover_url,
        youtube_url,
        preferir_link_youtube,
        prep_time_minutes,
        difficulty_slug,
        description,
        short_description, // <-- make sure loader returns this
        ingredients,
    } = detail;

    const longDescription = description ?? short_description ?? null;

    const primaryCategory = tax.categories[0]?.slug ?? null;

    const videoId = youtube_url ? extractYouTubeId(youtube_url) : null;
    const embedUrl = videoId ? buildYouTubeEmbedUrl(videoId) : null;
    const thumbUrl = videoId ? buildYouTubeThumb(videoId) : null;
    const poster = cover_url || thumbUrl || null;
    const tipsByIngredientRecord = tipsByIngredientMap instanceof Map
        ? Object.fromEntries(tipsByIngredientMap.entries())
        : tipsByIngredientMap;
    // Normalize to Record<string, RecipeTip[]>
    // const tipsByIngredientRecord = normalizeTipsByIngredient(tipsByIngredient);
    async function fetchIngredientsWithIds(recipeId: string) {
        const supabase = await (await import("@/lib/supabase/server-rsc")).createSupabaseRSCClient();
        const { data } = await supabase
            .from("recipe_ingredients")
            .select("id, name, amount, unit, optional, position")
            .eq("recipe_id", recipeId)
            .order("position", { ascending: true });
        return data ?? [];
    }
// preferimos ingredientes com id (se o RPC não trouxe id)
    const ingredientsWithIds =
        recipeId && !(detail.ingredients?.[0]?.id)
            ? await fetchIngredientsWithIds(recipeId)
            : detail.ingredients;

    return (
        <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
            {/* Header */}
            <header className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {prep_time_minutes != null && <span>⏱ {prep_time_minutes} min</span>}
                    {difficulty_slug && <span>• ⭐ {labelForDifficulty(difficulty_slug)}</span>}
                    {primaryCategory && <span>• {labelForCategory(primaryCategory)}</span>}
                </div>
                <div className="flex gap-2">
                    {youtube_url && (
                        <a
                            href={youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                        >
                            Abrir no YouTube
                        </a>
                    )}
                    {!preferir_link_youtube && embedUrl && (
                        <a
                            href="#video"
                            className="inline-flex items-center rounded-full border px-4 py-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                        >
                            Ver aqui mesmo
                        </a>
                    )}
                </div>
            </header>

            {/* Capa */}
            {poster && (
                <div className="relative aspect-video overflow-hidden rounded-2xl border bg-muted">
                    <Image
                        src={poster}
                        alt={`Capa da receita ${name}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 768px"
                    />
                </div>
            )}

            {/* Long description (preserving line breaks) */}
            {longDescription && (
                <section className="space-y-2">
                    <h2 className="text-xl font-semibold">Descrição</h2>
                    <p className="leading-relaxed text-muted-foreground whitespace-pre-line">
                        {longDescription}
                    </p>
                </section>
            )}

            {/* Ingredients + per-ingredient tips */}
            <IngredientsClient
                ingredients={ingredientsWithIds}
                tipsByIngredient={tipsByIngredientRecord}
            />

            {/* Instructions + technique + inline tips */}
            {instructions.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Modo de preparo</h2>
                    <ol className="list-decimal space-y-4 pl-5">
                        {instructions.map((st) => {
                            const inline = tipsByInstruction.get(st.id) ?? [];
                            const techLabel = st.technique_id && techMap[st.technique_id]?.label;

                            return (
                                <li key={st.id} className="space-y-2 leading-relaxed">
                                    <p>
                                        {st.text}{" "}
                                        {techLabel ? (
                                            <span className="ml-2 inline-block rounded-full border px-2 py-0.5 text-xs align-middle">
                        {techLabel}
                      </span>
                                        ) : null}
                                    </p>
                                    {st.duration_minutes != null && (
                                        <p className="text-xs text-muted-foreground">~ {st.duration_minutes} min</p>
                                    )}
                                    {inline.length > 0 && (
                                        <div className="flex flex-col gap-2" aria-live="polite">
                                            {inline.map((t) => (
                                                <TipBadge key={t.id} type={t.type} text={t.text} />
                                            ))}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </section>
            )}

            {/* Tip blocks by type */}
            {(tipsByType.tip.length + tipsByType.swap.length + tipsByType.alert.length) > 0 && (
                <section className="space-y-6">
                    {tipsByType.tip.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-xl font-semibold">💡 Pulos do Gato</h2>
                            <div className="grid gap-2">
                                {tipsByType.tip.map((t) => (
                                    <TipBadge key={t.id} type={t.type} text={t.text} />
                                ))}
                            </div>
                        </div>
                    )}
                    {tipsByType.swap.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-xl font-semibold">🔁 Substituições & Variações</h2>
                            <div className="grid gap-2">
                                {tipsByType.swap.map((t) => (
                                    <TipBadge key={t.id} type={t.type} text={t.text} />
                                ))}
                            </div>
                        </div>
                    )}
                    {tipsByType.alert.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-xl font-semibold">⚠️ Atenções & Segurança</h2>
                            <div className="grid gap-2">
                                {tipsByType.alert.map((t) => (
                                    <TipBadge key={t.id} type={t.type} text={t.text} />
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Video */}
            {!preferir_link_youtube && embedUrl && (
                <section id="video" className="space-y-4">
                    <h2 className="text-xl font-semibold">Vídeo</h2>
                    <div className="aspect-video w-full overflow-hidden rounded-2xl border bg-muted">
                        <iframe
                            className="h-full w-full"
                            src={embedUrl}
                            title={name}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>
                </section>
            )}

            {/* Tags */}
            {(tax.categories.length +
                tax.diet_labels.length +
                tax.techniques.length +
                tax.cuisines.length +
                tax.occasions.length) > 0 && (
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                        {tax.categories.map((c) => (
                            <span key={`cat-${c.slug}`} className="rounded-full border px-3 py-1 text-sm">
                {c.label}
              </span>
                        ))}
                        {tax.cuisines.map((c) => (
                            <span key={`cui-${c.slug}`} className="rounded-full border px-3 py-1 text-sm">
                {c.label}
              </span>
                        ))}
                        {tax.techniques.map((t) => (
                            <span key={`tec-${t.slug}`} className="rounded-full border px-3 py-1 text-sm">
                {t.label}
              </span>
                        ))}
                        {tax.diet_labels.map((d) => (
                            <span key={`diet-${d.slug}`} className="rounded-full border px-3 py-1 text-sm">
                {d.label}
              </span>
                        ))}
                        {tax.occasions.map((o) => (
                            <span key={`occ-${o.slug}`} className="rounded-full border px-3 py-1 text-sm">
                {o.label}
              </span>
                        ))}
                    </div>
                </section>
            )}

            <footer className="pt-6">
                <Link href="/" className="text-sm underline">
                    ← Voltar para receitas
                </Link>
            </footer>
        </main>
    );
}

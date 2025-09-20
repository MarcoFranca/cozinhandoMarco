import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import Image from "next/image";
import Link from "next/link";
import { IngredientsClient } from "@/components/recipes/IngredientsClient";
import TipBadge from "@/components/recipes/TipBadge";
import { extractYouTubeId, buildYouTubeEmbedUrl, buildYouTubeThumb } from "@/lib/youtube";
import { labelForDifficulty, labelForCategory } from "@/lib/taxonomies/labels";

export const revalidate = 300; // ISR

// ===== Types =====
type Ingredient = {
    name: string;
    amount: number | null;
    unit: string | null;
    optional: boolean | null;
    position: number | null;
};

type Instruction = {
    id: string;
    step: number;
    text: string;
    duration_minutes: number | null;
};

type RecipeTip = {
    id: string;
    type: "tip" | "swap" | "alert";
    title: string | null;
    text: string;
    position: number | null;
    instruction_id: string | null;
    created_at: string;
    updated_at: string;
};

type TaxonomyItem = { slug: string; label: string };

type DetailBase = {
    site_slug: string;
    name: string;
    short_description: string | null;
    description: string | null;
    cover_url: string | null;
    youtube_url: string | null;
    preferir_link_youtube: boolean;
    prep_time_minutes: number | null;
    difficulty_slug: "iniciante" | "intermediario" | "avancado" | null;
    publicado_at: string | null;
    // legacy fields (ignored here): category, difficulty, instructions...
    ingredients: Ingredient[];
};

// ===== Data loaders =====
async function fetchBaseDetail(slug: string): Promise<DetailBase | null> {
    const supabase = await createSupabaseRSCClient();
    const { data, error } = await supabase.rpc("get_public_recipe_detail", { p_slug: slug });
    if (error) {
        console.error(error);
        return null;
    }
    return (data && data[0]) ?? null;
}

async function fetchRecipeIdBySlug(slug: string): Promise<string | null> {
    const supabase = await createSupabaseRSCClient();
    const { data, error } = await supabase
        .from("recipes")
        .select("id")
        .eq("site_slug", slug)
        .maybeSingle();
    if (error) {
        console.error(error);
        return null;
    }
    return data?.id ?? null;
}

async function fetchInstructions(recipeId: string): Promise<Instruction[]> {
    const supabase = await createSupabaseRSCClient();
    const { data, error } = await supabase
        .from("recipe_instructions")
        .select("id, step, text, duration_minutes")
        .eq("recipe_id", recipeId)
        .order("step", { ascending: true });
    if (error) {
        console.error(error);
        return [];
    }
    return (data ?? []) as Instruction[];
}

async function fetchTips(recipeId: string): Promise<RecipeTip[]> {
    const supabase = await createSupabaseRSCClient();
    const { data, error } = await supabase.rpc("get_recipe_tips", { p_recipe_id: recipeId });
    if (error) {
        console.error(error);
        return [];
    }
    // NOTE: get_recipe_tips may return quoted column names; normalize here.
    return (data ?? []) as RecipeTip[];
}

type RecipeTaxonomies = {
    categories: TaxonomyItem[];
    cuisines: TaxonomyItem[];
    diet: TaxonomyItem[];
    techniques: TaxonomyItem[];
    occasions: TaxonomyItem[];
};

async function fetchTaxonomies(recipeId: string): Promise<RecipeTaxonomies> {
    const supabase = await createSupabaseRSCClient();
    const { data, error } = await supabase.rpc("get_recipe_taxonomies", { p_recipe_id: recipeId });
    if (error) {
        console.error(error);
        return { categories: [], cuisines: [], diet: [], techniques: [], occasions: [] };
    }
    return (data ?? {
        categories: [],
        cuisines: [],
        diet: [],
        techniques: [],
        occasions: [],
    }) as RecipeTaxonomies;
}

// ===== Helpers =====
function groupTipsByType(tips: RecipeTip[]) {
    return {
        tip: tips.filter((t) => t.type === "tip"),
        swap: tips.filter((t) => t.type === "swap"),
        alert: tips.filter((t) => t.type === "alert"),
    };
}

function groupTipsByInstruction(tips: RecipeTip[]): Map<string, RecipeTip[]> {
    const map = new Map<string, RecipeTip[]>();
    for (const t of tips) {
        if (!t.instruction_id) continue;
        const arr = map.get(t.instruction_id) ?? [];
        arr.push(t);
        map.set(t.instruction_id, arr);
    }
    // order each array by position then created_at
    for (const [k, arr] of map) {
        arr.sort((a, b) => {
            const pa = a.position ?? Number.MAX_SAFE_INTEGER;
            const pb = b.position ?? Number.MAX_SAFE_INTEGER;
            if (pa !== pb) return pa - pb;
            return a.created_at.localeCompare(b.created_at);
        });
        map.set(k, arr);
    }
    return map;
}

// ===== Page (RSC) =====
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
    const instructions = recipeId ? await fetchInstructions(recipeId) : [];
    const allTips = recipeId ? await fetchTips(recipeId) : [];
    const tax = recipeId ? await fetchTaxonomies(recipeId) : { categories: [], cuisines: [], diet: [], techniques: [], occasions: [] };

    const tipsByType = groupTipsByType(allTips);
    const tipsByInstruction = groupTipsByInstruction(allTips);

    const {
        name, cover_url, youtube_url, preferir_link_youtube,
        prep_time_minutes, difficulty_slug, description, ingredients,
    } = detail;

    const primaryCategory = tax.categories[0]?.slug ?? null;

    const videoId = youtube_url ? extractYouTubeId(youtube_url) : null;
    const embedUrl = videoId ? buildYouTubeEmbedUrl(videoId) : null;
    const thumbUrl = videoId ? buildYouTubeThumb(videoId) : null;
    const poster = cover_url || thumbUrl || null;

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

                {/* Ações */}
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

            {/* Capa/Thumb */}
            {poster && (
                <div className="relative aspect-video overflow-hidden rounded-2xl border bg-muted">
                    <Image src={poster} alt={`Capa da receita ${name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
                </div>
            )}

            {/* Descrição */}
            {description && (
                <section className="space-y-2">
                    <h2 className="text-xl font-semibold">Descrição</h2>
                    <p className="leading-relaxed text-muted-foreground">{description}</p>
                </section>
            )}

            {/* Ingredientes */}
            <IngredientsClient ingredients={ingredients} />

            {/* Modo de preparo + Inline Tips */}
            {instructions.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Modo de preparo</h2>
                    <ol className="space-y-4 list-decimal pl-5">
                        {instructions.map((st) => {
                            const tips = tipsByInstruction.get(st.id) ?? [];
                            return (
                                <li key={st.id} className="space-y-2 leading-relaxed">
                                    <p>{st.text}</p>
                                    {st.duration_minutes != null && (
                                        <p className="text-xs text-muted-foreground">~ {st.duration_minutes} min</p>
                                    )}
                                    {tips.length > 0 && (
                                        <div className="flex flex-col gap-2" aria-live="polite">
                                            {tips.map((t) => (
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

            {/* Blocos por tipo */}
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

            {/* Vídeo (embed/card) */}
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

            {preferir_link_youtube && youtube_url && poster && (
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Assista no YouTube</h2>
                    <Link
                        href={youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block aspect-video overflow-hidden rounded-2xl border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                        aria-label={`Abrir vídeo da receita ${name} no YouTube`}
                        title={`Abrir vídeo da receita ${name} no YouTube`}
                    >
                        <Image src={poster} alt={`Thumbnail do vídeo: ${name}`} fill className="object-cover transition-transform group-hover:scale-[1.02]" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
                        </div>
                    </Link>
                </section>
            )}

            {/* Chips de categorias/diet/técnicas (opcional, bonito para SEO/descoberta) */}
            {(tax.categories.length + tax.diet.length + tax.techniques.length + tax.cuisines.length + tax.occasions.length) > 0 && (
                <section className="space-y-3">
                    <h2 className="text-xl font-semibold">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                        {tax.categories.map((c) => (
                            <span key={`cat-${c.slug}`} className="rounded-full border px-3 py-1 text-sm">{c.label}</span>
                        ))}
                        {tax.cuisines.map((c) => (
                            <span key={`cui-${c.slug}`} className="rounded-full border px-3 py-1 text-sm">{c.label}</span>
                        ))}
                        {tax.techniques.map((t) => (
                            <span key={`tec-${t.slug}`} className="rounded-full border px-3 py-1 text-sm">{t.label}</span>
                        ))}
                        {tax.diet.map((d) => (
                            <span key={`diet-${d.slug}`} className="rounded-full border px-3 py-1 text-sm">{d.label}</span>
                        ))}
                        {tax.occasions.map((o) => (
                            <span key={`occ-${o.slug}`} className="rounded-full border px-3 py-1 text-sm">{o.label}</span>
                        ))}
                    </div>
                </section>
            )}

            {/* Rodapé */}
            <footer className="pt-6">
                <Link href="/" className="text-sm underline">← Voltar para receitas</Link>
            </footer>
        </main>
    );
}

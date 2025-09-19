// app/receitas/[slug]/page.tsx
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import Image from "next/image";
import Link from "next/link";
import { IngredientsClient } from "@/components/recipes/IngredientsClient";
import { extractYouTubeId, buildYouTubeEmbedUrl, buildYouTubeThumb } from "@/lib/youtube";

export const revalidate = 300; // ISR

type Ingredient = {
    name: string;
    amount: number | null;
    unit: string | null;
    optional: boolean | null;
    position: number | null;
};
type Instruction = {
    step: number | null;
    text: string | null;
    duration_minutes: number | null;
};
type Detail = {
    site_slug: string;
    name: string;
    short_description: string | null;
    cover_url: string | null;
    youtube_url: string | null;
    preferir_link_youtube: boolean;
    prep_time_minutes: number | null;
    difficulty: string | null;
    category: string | null;
    publicado_at: string | null;
    ingredients: Ingredient[];
    instructions: Instruction[];
};

async function fetchDetail(slug: string): Promise<Detail | null> {
    const supabase = await createSupabaseRSCClient();
    const { data, error } = await supabase.rpc("get_public_recipe_detail", { p_slug: slug });
    if (error) {
        console.error(error);
        return null;
    }
    return (data && data[0]) ?? null;
}

export default async function Page({ params }: { params: { slug: string } }) {
    const detail = await fetchDetail(params.slug);
    if (!detail) {
        return (
            <main className="mx-auto max-w-4xl px-4 py-12">
                <h1 className="text-2xl font-bold">Receita não encontrada</h1>
                <p className="text-muted-foreground">Talvez ela tenha sido removida do site.</p>
            </main>
        );
    }

    const {
        name, cover_url, youtube_url, preferir_link_youtube,
        prep_time_minutes, difficulty, category, ingredients, instructions,
    } = detail;

    const videoId = extractYouTubeId(youtube_url || undefined);
    const embedUrl = videoId ? buildYouTubeEmbedUrl(videoId) : null;
    const thumbUrl = videoId ? buildYouTubeThumb(videoId) : null;

    // Poster para o "card de vídeo": prioriza cover_url; senão, thumbnail do YouTube
    const poster = cover_url || thumbUrl || null;

    return (
        <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
            <header className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {prep_time_minutes != null && <span className="inline-flex items-center">⏱ {prep_time_minutes} min</span>}
                    {difficulty && <span className="inline-flex items-center">• ⭐ {difficulty}</span>}
                    {category && <span className="inline-flex items-center">• {category}</span>}
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
                            href={`#video`}
                            className="inline-flex items-center rounded-full border px-4 py-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                        >
                            Ver aqui mesmo
                        </a>
                    )}
                </div>
            </header>

            {/* Capa/Thumb principal (sempre mostra algo visual da receita no topo) */}
            {poster && (
                <div className="relative aspect-video overflow-hidden rounded-2xl border bg-muted">
                    <Image src={poster} alt={`Capa da receita ${name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
                </div>
            )}

            {/* Ingredientes */}
            <IngredientsClient ingredients={ingredients} />

            {/* Passo a passo */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Modo de preparo</h2>
                <ol className="space-y-3 list-decimal pl-5">
                    {instructions.map((st, idx) => (
                        <li key={idx} className="leading-relaxed">
                            <p>{st.text}</p>
                            {st.duration_minutes != null && (
                                <p className="text-xs text-muted-foreground">~ {st.duration_minutes} min</p>
                            )}
                        </li>
                    ))}
                </ol>
            </section>

            {/* Se não for para embutir, oferece um card compacto com thumb + play + link */}
            {youtube_url && preferir_link_youtube && poster && (
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
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                        {/* Botão Play */}
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

            {/* Player embutido (sob demanda) */}
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

            <footer className="pt-6">
                <Link href="/" className="text-sm underline">← Voltar para receitas</Link>
            </footer>
        </main>
    );
}

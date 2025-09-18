// app/receitas/[slug]/page.tsx
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import Image from "next/image";
import Link from "next/link";
import { IngredientsClient } from "@/components/recipes/IngredientsClient";

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

    return (
        <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
            <header className="space-y-3">
                <h1 className="text-3xl font-bold">{name}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {prep_time_minutes != null && <span>⏱ {prep_time_minutes} min</span>}
                    {difficulty && <span>• ⭐ {difficulty}</span>}
                    {category && <span>• {category}</span>}
                </div>

                <div className="flex gap-2">
                    {youtube_url && (
                        <a
                            href={youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
                        >
                            Abrir no YouTube
                        </a>
                    )}
                    {!preferir_link_youtube && youtube_url && (
                        <a
                            href={`#video`}
                            className="inline-flex items-center rounded-full border px-4 py-2 hover:bg-accent"
                        >
                            Ver aqui mesmo
                        </a>
                    )}
                </div>
            </header>

            {cover_url && (
                <div className="relative aspect-video overflow-hidden rounded-2xl border">
                    <Image src={cover_url} alt={name} fill className="object-cover" />
                </div>
            )}

            {/* Ingredientes */}
            <IngredientsClient ingredients={ingredients} />


            {/* Passo a passo */}
            <section className="space-y-3">
                <h2 className="text-xl font-semibold">Modo de preparo</h2>
                <ol className="space-y-3 list-decimal pl-5">
                    {instructions.map((st, idx) => (
                        <li key={idx}>
                            <p>{st.text}</p>
                            {st.duration_minutes != null && (
                                <p className="text-xs text-muted-foreground">~ {st.duration_minutes} min</p>
                            )}
                        </li>
                    ))}
                </ol>
            </section>

            {/* Player sob demanda */}
            {!preferir_link_youtube && youtube_url && (
                <section id="video" className="space-y-3">
                    <h2 className="text-xl font-semibold">Vídeo</h2>
                    <div className="aspect-video w-full overflow-hidden rounded-2xl border">
                        <iframe
                            className="w-full h-full"
                            src={youtube_url.replace("watch?v=", "embed/")}
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

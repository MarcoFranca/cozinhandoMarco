// app/page.tsx
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 300; // ISR: 5 min (MVP)

type PublicRecipeCard = {
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
  site_order: number | null;
};

async function fetchRecipes(): Promise<PublicRecipeCard[]> {
  const supabase = await createSupabaseRSCClient();
  const { data, error } = await supabase.rpc("get_public_recipes", {
    p_search: null,
    p_category: null,
    p_difficulty: null,
    p_max_prep_minutes: null,
    p_limit: 12,
    p_offset: 0,
  });
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

export default async function Page() {
  const recipes = await fetchRecipes();

  return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Cozinhando com Marco</h1>
          <p className="text-muted-foreground">
            Receitas acessíveis com toque de chef — escolha uma e bora cozinhar! 👨🏻‍🍳
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => {
            const thumb = r.cover_url || getYoutubeThumb(r.youtube_url);

            return (
                <article key={r.site_slug} className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                  <div className="relative aspect-video">
                    {thumb ? (
                        <Image src={thumb} alt={r.name} fill className="object-cover" />
                    ) : (
                        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                          Sem imagem
                        </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <h2 className="text-lg font-semibold">{r.name}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {r.short_description}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {r.prep_time_minutes != null && <span>⏱ {r.prep_time_minutes} min</span>}
                      {r.difficulty && <span>• ⭐ {r.difficulty}</span>}
                      {r.category && <span>• {r.category}</span>}
                    </div>

                    <div className="flex gap-2 pt-1">
                      {r.youtube_url && (
                          <a
                              className="inline-flex items-center rounded-full border px-3 py-1 text-sm hover:bg-accent"
                              href={r.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                          >
                            Assistir no YouTube
                          </a>
                      )}

                      <Link
                          className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground hover:opacity-90"
                          href={`/receitas/${r.site_slug}`}
                      >
                        Ver receita
                      </Link>
                    </div>
                  </div>
                </article>
            );
          })}
        </section>
      </main>
  );
}

export function getYoutubeThumb(url?: string | null) {
  if (!url) return null;
  const m = url.match(/[?&]v=([^&#]+)/) || url.match(/youtu\.be\/([^?&#]+)/);
  const id = m?.[1];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

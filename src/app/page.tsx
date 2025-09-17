import { requireUser } from "@/lib/auth";

import { HomeQuickActions } from "@/components/home/HomeQuickActions";
import { HomePipelineStatus } from "@/components/home/HomePipelineStatus";
import { HomeUpcomingRecordings } from "@/components/home/HomeUpcomingRecordings";
import { HomeShoppingToday } from "@/components/home/HomeShoppingToday";
import { HomeRecentDrafts } from "@/components/home/HomeRecentDrafts";
import { isRecipeStatus, RecipeStatus } from "@/types/db";

export const dynamic = "force-dynamic";

type PipelineCounts = Record<RecipeStatus, number>;

export default async function Home() {
  const { supabase, user } = await requireUser(); // 👈 já redireciona se não logado

  // === pipeline por status ===
  const { data: recipeStatuses } = await supabase
      .from("recipes")
      .select("status")
      .eq("user_id", user.id);

  const pipelineCounts: PipelineCounts = {
    idea: 0, tested: 0, recorded: 0, edited: 0, published: 0,
  };
  (recipeStatuses ?? []).forEach((r) => {
    const s = String(r.status ?? "");
    if (isRecipeStatus(s)) pipelineCounts[s] += 1;
  });

  // === próximas gravações (7 dias) ===
  const today = new Date();
  const end = new Date(); end.setDate(today.getDate() + 7);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  const { data: recs } = await supabase
      .from("recordings")
      .select("id, recipe_id, shoot_date, shoot_status")
      .eq("user_id", user.id)
      .gte("shoot_date", ymd(today))
      .lte("shoot_date", ymd(end))
      .order("shoot_date", { ascending: true })
      .limit(5);

  const recipeIds = Array.from(new Set((recs ?? []).map(r => r.recipe_id).filter(Boolean) as string[]));
  const nameById = new Map<string,string>();
  if (recipeIds.length) {
    const { data: recipeNames } = await supabase
        .from("recipes")
        .select("id, name")
        .in("id", recipeIds);
    (recipeNames ?? []).forEach(r => nameById.set(r.id, r.name));
  }
  const upcomingRecordings = (recs ?? []).map((r) => ({
    id: r.id as string,
    recipeId: (r.recipe_id ?? "") as string,
    date: r.shoot_date as string,
    recipeName: nameById.get(r.recipe_id ?? "") ?? "—",
    status: r.shoot_status ?? "—",
  }));

  // === compras de hoje (in_pantry = false) ===
  const { data: shopping } = await supabase
      .from("shopping_list_items")
      .select("ingredient_name, quantity, in_pantry")
      .eq("user_id", user.id)
      .eq("in_pantry", false)
      .order("created_at", { ascending: false })
      .limit(12);

  const shoppingToday = (shopping ?? []).map(i => ({
    name: i.ingredient_name,
    qty: i.quantity === null ? "—" : String(i.quantity),
    inPantry: Boolean(i.in_pantry),
  }));

  // === rascunhos recentes (status != published) ===
  const { data: drafts } = await supabase
      .from("recipes")
      .select("id, name, category, updated_at")
      .eq("user_id", user.id)
      .neq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(5);

  const recentDrafts = (drafts ?? []).map(d => ({
    id: d.id,
    name: d.name,
    category: d.category ?? "—",
    updatedAt: timeAgoBR(new Date(d.updated_at)),
  }));

  return (
      <div className="min-h-screen w-full">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Olá{user.user_metadata?.name ? `, ${user.user_metadata.name}` : ""} 👋</h1>
              <p className="text-sm text-muted-foreground">
                Seu painel do Cozinhando com Marco — foco no que importa hoje.
              </p>
            </div>
            <HomeQuickActions />
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <HomeUpcomingRecordings items={upcomingRecordings} />
              <HomeShoppingToday items={shoppingToday} />
            </div>
            <div className="space-y-6">
              <HomePipelineStatus counts={pipelineCounts} />
              <HomeRecentDrafts items={recentDrafts} />
            </div>
          </div>
        </div>
      </div>
  );
}

function timeAgoBR(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  if (hr < 24) return `há ${hr} h`;
  if (day === 1) return "ontem";
  return `há ${day} dias`;
}

import { HomeQuickActions } from "@/components/home/HomeQuickActions";
import { HomePipelineStatus } from "@/components/home/HomePipelineStatus";
import { HomeUpcomingRecordings } from "@/components/home/HomeUpcomingRecordings";
import { HomeShoppingToday } from "@/components/home/HomeShoppingToday";
import { HomeRecentDrafts } from "@/components/home/HomeRecentDrafts";

// TIPOS (pode mover para /types se preferir)
export type RecipeStatus = "idea" | "tested" | "recorded" | "edited" | "published";

export default async function Home() {
  // TODO: trocar mocks por consultas Supabase (server components):
  // const supabase = createServerClient();
  // const { data: recordings } = await supabase.from("recordings").select(...).range(...)

  // MOCKS
  const pipelineCounts = {
    idea: 4,
    tested: 7,
    recorded: 2,
    edited: 1,
    published: 12,
  };

  const upcomingRecordings = [
    { id: "r1", date: "2025-09-12", recipeName: "Molho gorgonzola", status: "roteirizar" },
    { id: "r2", date: "2025-09-13", recipeName: "Nhoque de batata", status: "checklist ok" },
  ];

  const shoppingToday = [
    { name: "Batata", qty: "1 kg", inPantry: false },
    { name: "Gorgonzola", qty: "200 g", inPantry: true },
    { name: "Creme de leite", qty: "2 cx", inPantry: false },
  ];

  const recentDrafts = [
    { id: "d1", name: "Sopa de frango com macarrão", category: "Sopa", updatedAt: "há 2h" },
    { id: "d2", name: "Maple fake (rapadura)", category: "Doce", updatedAt: "ontem" },
    { id: "d3", name: "Lemon Curd", category: "Doce", updatedAt: "há 3 dias" },
  ];

  return (
      <div className="min-h-screen w-full">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Olá, Marco 👋</h1>
              <p className="text-sm text-muted-foreground">
                Seu painel do Cozinhando com Marco — foco no que importa hoje.
              </p>
            </div>
            <HomeQuickActions />
          </header>

          {/* GRID PRINCIPAL */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Coluna 1 */}
            <div className="md:col-span-2 space-y-6">
              <HomeUpcomingRecordings items={upcomingRecordings} />
              <HomeShoppingToday items={shoppingToday} />
            </div>

            {/* Coluna 2 */}
            <div className="space-y-6">
              <HomePipelineStatus counts={pipelineCounts} />
              <HomeRecentDrafts items={recentDrafts} />
            </div>
          </div>
        </div>
      </div>
  );
}

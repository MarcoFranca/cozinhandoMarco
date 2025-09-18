import { requireUser } from "@/lib/auth";
import { createSupabaseRSCClient } from "@/lib/supabase/server-rsc";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { BackLink } from "@/components/nav/BackLink";
import { CalendarMonth } from "@/components/calendar/CalendarMonth";
import { RECORDING_STATUS_LABELS, isRecordingStatus } from "@/constants/taxonomies";

export const dynamic = "force-dynamic";

type Props = {
    searchParams: Promise<{ m?: string }>; // m = "YYYY-MM"
};

export default async function CalendarPage({ searchParams }: Props) {
    const { user } = await requireUser();
    const supabase = await createSupabaseRSCClient();

    // ====== mês alvo (YYYY-MM) ======
    const { m } = await searchParams;
    const now = new Date();
    const ym = (m && /^\d{4}-\d{2}$/.test(m)) ? m : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, month] = ym.split("-").map(Number);

    // range do mês (YYYY-MM-DD)
    const start = `${ym}-01`;
    const end = `${year}-${String(month === 12 ? 12 : month).padStart(2, "0")}-${String(lastDayOfMonth(year, month)).padStart(2, "0")}`;

    // ====== gravações do mês ======
    const { data: recsRaw } = await supabase
        .from("recordings")
        .select("id, recipe_id, shoot_date, shoot_status, scene_notes")
        .eq("user_id", user.id)
        .gte("shoot_date", start)
        .lte("shoot_date", end)
        .order("shoot_date", { ascending: true });

    const recs = recsRaw ?? [];

    // nomes das receitas
    const recipeIds = Array.from(
        new Set(
            recs.map(r => r.recipe_id).filter((v): v is string => typeof v === "string" && v.length > 0)
        )
    );
    const recipeNames = new Map<string, string>();
    if (recipeIds.length) {
        const { data: recipes } = await supabase.from("recipes").select("id, name").in("id", recipeIds);
        (recipes ?? []).forEach(r => recipeNames.set(r.id, r.name));
    }

    // Eventos normalizados para o calendário
    const events = recs.map(r => ({
        id: r.id as string,
        date: r.shoot_date as string, // YYYY-MM-DD
        recipe_id: r.recipe_id as string,
        recipe_name: r.recipe_id ? (recipeNames.get(r.recipe_id) ?? "Receita") : "Receita",
        status: isRecordingStatus(r.shoot_status) ? r.shoot_status : null,
        status_label: isRecordingStatus(r.shoot_status) ? RECORDING_STATUS_LABELS[r.shoot_status] : "—",
    }));

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-4">
            <div className="flex items-center justify-between">
                <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/calendar", label: "Calendário" }]} />
                <BackLink fallback="/" />
            </div>

            <div className="space-y-1">
                <h1 className="text-2xl font-semibold">Calendário</h1>
                <p className="text-sm text-muted-foreground">Veja e navegue pelas gravações do mês.</p>
            </div>

            <CalendarMonth
                year={year}
                month={month}
                events={events}
            />
        </div>
    );
}

// util: último dia do mês
function lastDayOfMonth(year: number, month1to12: number) {
    // JS usa mês 0..11
    return new Date(year, month1to12, 0).getDate();
}
